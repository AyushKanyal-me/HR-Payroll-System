import { z } from 'zod';
import {
  createManualAttendanceSchema,
  updateAttendanceSchema,
  attendanceQuerySchema
} from './attendance.schema.js';

export interface PunchSession {
  check_in: string;
  check_out: string | null;
  duration_minutes: number;
  duration_hours: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  worked_hours: number | null;
  overtime_hours: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'OVERTIME' | 'MISSING_CHECKOUT';
  is_manual_edit: boolean;
  correction_note: string | null;
  sessions?: PunchSession[];
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
  } | null;
}

export interface AttendanceQuickStatus {
  employee_id: string;
  attendance_date: string;
  is_checked_in: boolean;
  is_checked_out: boolean;
  check_in: string | null;
  check_out: string | null;
  elapsed_minutes: number;
  worked_hours: number;
  status: string;
  sessions?: PunchSession[];
}

export type CreateManualAttendanceDto = z.infer<typeof createManualAttendanceSchema>;
export type UpdateAttendanceDto = z.infer<typeof updateAttendanceSchema>;
export type AttendanceQueryDto = z.infer<typeof attendanceQuerySchema>;
