import { SupabaseClient } from '@supabase/supabase-js';
import { attendanceRepository, AttendanceRepository } from './attendance.repository.js';
import {
  AttendanceRecord,
  AttendanceQuickStatus,
  CreateManualAttendanceDto,
  UpdateAttendanceDto,
  AttendanceQueryDto,
  PunchSession
} from './attendance.types.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';

function parseSessions(record: { check_in: string | null; check_out: string | null; worked_hours: number | null; correction_note: string | null }): { sessions: PunchSession[]; noteText: string } {
  if (!record.check_in) return { sessions: [], noteText: record.correction_note || '' };

  if (record.correction_note) {
    try {
      const parsed = JSON.parse(record.correction_note);
      if (parsed && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        return {
          sessions: parsed.sessions,
          noteText: parsed.note || ''
        };
      }
    } catch {
      // not JSON formatted note
    }
  }

  const start = new Date(record.check_in).getTime();
  const end = record.check_out ? new Date(record.check_out).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((end - start) / (1000 * 60)));
  const hrs = Number(record.worked_hours || (mins / 60).toFixed(2));

  return {
    sessions: [
      {
        check_in: record.check_in,
        check_out: record.check_out,
        duration_minutes: mins,
        duration_hours: hrs
      }
    ],
    noteText: record.correction_note || ''
  };
}

export class AttendanceService {
  constructor(private readonly repo: AttendanceRepository = attendanceRepository) {}

  async getAttendanceRecords(query: AttendanceQueryDto, client?: SupabaseClient) {
    const res = await this.repo.findAll(query, client);
    return {
      ...res,
      data: res.data.map((r) => ({
        ...r,
        sessions: parseSessions(r).sessions
      }))
    };
  }

  async getAttendanceById(id: string, client?: SupabaseClient): Promise<AttendanceRecord> {
    const record = await this.repo.findById(id, client);
    if (!record) {
      throw new NotFoundError(`Attendance record with ID '${id}' not found`);
    }
    return {
      ...record,
      sessions: parseSessions(record).sessions
    };
  }

  async getQuickStatus(employeeId: string, client?: SupabaseClient): Promise<AttendanceQuickStatus> {
    const today = new Date().toISOString().split('T')[0]!;
    const record = await this.repo.findByEmployeeAndDate(employeeId, today, client);

    if (!record || !record.check_in) {
      return {
        employee_id: employeeId,
        attendance_date: today,
        is_checked_in: false,
        is_checked_out: false,
        check_in: null,
        check_out: null,
        elapsed_minutes: 0,
        worked_hours: 0,
        status: 'ABSENT',
        sessions: []
      };
    }

    const { sessions } = parseSessions(record);
    const checkInTime = new Date(record.check_in).getTime();
    const endTime = record.check_out ? new Date(record.check_out).getTime() : Date.now();
    const currentSessionMins = Math.max(0, Math.floor((endTime - checkInTime) / (1000 * 60)));

    return {
      employee_id: employeeId,
      attendance_date: today,
      is_checked_in: true,
      is_checked_out: !!record.check_out,
      check_in: record.check_in,
      check_out: record.check_out,
      elapsed_minutes: currentSessionMins,
      worked_hours: Number(record.worked_hours || (currentSessionMins / 60).toFixed(2)),
      status: record.status,
      sessions
    };
  }

  async checkIn(employeeId: string, client?: SupabaseClient): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0]!;
    const existing = await this.repo.findByEmployeeAndDate(employeeId, today, client);

    const now = new Date().toISOString();

    if (existing) {
      if (existing.check_in && !existing.check_out) {
        throw new BadRequestError('You are already checked in for today');
      }
      if (existing.check_out) {
        // Multi-punch re-entry: resume workday with new session
        const { sessions, noteText } = parseSessions(existing);
        sessions.push({
          check_in: now,
          check_out: null,
          duration_minutes: 0,
          duration_hours: 0
        });

        const updated = await this.repo.update(existing.id, {
          check_in: now,
          check_out: null,
          status: 'PRESENT',
          is_manual_edit: false,
          correction_note: JSON.stringify({ sessions, note: noteText || 'Multi-punch shift re-entry' })
        }, client);
        if (!updated) {
          throw new NotFoundError('Failed to record check in');
        }
        await auditLogsService.log({
          action: 'ATTENDANCE_CHECK_IN',
          entityType: 'attendance',
          entityId: updated.id,
          newValues: { check_in: now, status: 'PRESENT', employee_id: employeeId }
        }, client);
        return {
          ...updated,
          sessions
        };
      }
    }

    const initialSession: PunchSession = {
      check_in: now,
      check_out: null,
      duration_minutes: 0,
      duration_hours: 0
    };

    const created = await this.repo.create({
      employee_id: employeeId,
      attendance_date: today,
      check_in: now,
      overtime_hours: 0,
      status: 'PRESENT',
      is_manual_edit: false,
      correction_note: JSON.stringify({ sessions: [initialSession], note: 'Automated quick check-in' })
    }, client);

    await auditLogsService.log({
      action: 'ATTENDANCE_CHECK_IN',
      entityType: 'attendance',
      entityId: created.id,
      newValues: { check_in: now, status: 'PRESENT', employee_id: employeeId }
    }, client);

    return {
      ...created,
      sessions: [initialSession]
    };
  }

  async checkOut(employeeId: string, client?: SupabaseClient): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0]!;
    const existing = await this.repo.findByEmployeeAndDate(employeeId, today, client);

    if (!existing || !existing.check_in) {
      throw new BadRequestError('No active check-in found for today. Please check in first.');
    }

    if (existing.check_out) {
      throw new BadRequestError('You have already checked out for today.');
    }

    const checkOutTime = new Date();
    const { sessions, noteText } = parseSessions(existing);

    // Conclude last session
    const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
    const sessionStartTime = lastSession ? new Date(lastSession.check_in).getTime() : new Date(existing.check_in).getTime();
    const sessionMins = Math.max(0, Math.floor((checkOutTime.getTime() - sessionStartTime) / (1000 * 60)));
    const sessionHours = Number((sessionMins / 60).toFixed(2));

    if (lastSession) {
      lastSession.check_out = checkOutTime.toISOString();
      lastSession.duration_minutes = sessionMins;
      lastSession.duration_hours = sessionHours;
    } else {
      sessions.push({
        check_in: existing.check_in,
        check_out: checkOutTime.toISOString(),
        duration_minutes: sessionMins,
        duration_hours: sessionHours
      });
    }

    const totalMins = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const workedHours = Number((totalMins / 60).toFixed(2));
    const overtimeHours = workedHours > 8 ? Number((workedHours - 8).toFixed(2)) : 0;
    const status = overtimeHours > 0 ? 'OVERTIME' : 'PRESENT';

    const updated = await this.repo.update(existing.id, {
      check_out: checkOutTime.toISOString(),
      worked_hours: workedHours,
      overtime_hours: overtimeHours,
      status,
      is_manual_edit: false,
      correction_note: JSON.stringify({ sessions, note: noteText || 'Automated quick check-out' })
    }, client);

    if (!updated) {
      throw new NotFoundError('Failed to record check out');
    }

    await auditLogsService.log({
      action: 'ATTENDANCE_CHECK_OUT',
      entityType: 'attendance',
      entityId: updated.id,
      newValues: { check_out: checkOutTime.toISOString(), worked_hours: workedHours, overtime_hours: overtimeHours, status }
    }, client);

    return {
      ...updated,
      sessions
    };
  }

  async createManualAttendance(dto: CreateManualAttendanceDto, client?: SupabaseClient): Promise<AttendanceRecord> {
    if (dto.status === 'ABSENT') {
      dto.worked_hours = 0;
      dto.overtime_hours = 0;
      dto.check_in = dto.check_in || null;
      dto.check_out = dto.check_out || null;
    } else if (dto.check_in && dto.check_out) {
      const start = new Date(dto.check_in).getTime();
      const end = new Date(dto.check_out).getTime();
      if (end < start) {
        throw new BadRequestError('check_out must be after check_in time');
      }
      if (!dto.worked_hours) {
        dto.worked_hours = Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
      }
    }
    const created = await this.repo.create(dto, client);
    await auditLogsService.log({
      action: 'ATTENDANCE_CREATED_MANUAL',
      entityType: 'attendance',
      entityId: created.id,
      newValues: dto
    }, client);
    return created;
  }

  async updateAttendance(id: string, dto: UpdateAttendanceDto, client?: SupabaseClient): Promise<AttendanceRecord> {
    const existing = await this.getAttendanceById(id, client);
    if (dto.status === 'ABSENT') {
      dto.worked_hours = 0;
      dto.overtime_hours = 0;
      dto.check_in = null;
      dto.check_out = null;
    } else if (dto.check_in && dto.check_out) {
      const start = new Date(dto.check_in).getTime();
      const end = new Date(dto.check_out).getTime();
      if (end < start) {
        throw new BadRequestError('check_out must be after check_in time');
      }
      if (!dto.worked_hours) {
        dto.worked_hours = Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
      }
    }

    const record = await this.repo.update(id, dto, client);
    if (!record) {
      throw new NotFoundError(`Attendance record with ID '${id}' not found to update`);
    }

    await auditLogsService.log({
      action: 'ATTENDANCE_UPDATED',
      entityType: 'attendance',
      entityId: record.id,
      oldValues: { check_in: existing.check_in, check_out: existing.check_out, status: existing.status, worked_hours: existing.worked_hours },
      newValues: dto
    }, client);

    return record;
  }

  async deleteAttendance(id: string, client?: SupabaseClient): Promise<boolean> {
    const existing = await this.getAttendanceById(id, client);
    const result = await this.repo.delete(id, client);
    await auditLogsService.log({
      action: 'ATTENDANCE_DELETED',
      entityType: 'attendance',
      entityId: id,
      oldValues: { employee_id: existing.employee_id, attendance_date: existing.attendance_date }
    }, client);
    return result;
  }
}

export const attendanceService = new AttendanceService();
