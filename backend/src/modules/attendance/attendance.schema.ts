import { z } from 'zod';

export const attendanceStatusEnum = z.enum([
  'PRESENT',
  'ABSENT',
  'LATE',
  'OVERTIME',
  'MISSING_CHECKOUT'
]);

const datetimeSanitizer = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  return val;
}, z.string().datetime().nullable().optional());

export const createManualAttendanceSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID'),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'attendance_date must be YYYY-MM-DD'),
  check_in: datetimeSanitizer,
  check_out: datetimeSanitizer,
  worked_hours: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().min(0).max(24).optional()),
  overtime_hours: z.preprocess((v) => (v === '' || v === null || v === undefined ? 0 : Number(v)), z.number().min(0).max(24).default(0)),
  status: attendanceStatusEnum.default('PRESENT'),
  is_manual_edit: z.boolean().default(true),
  correction_note: z.string().min(1, 'Correction note is required for manual edits')
});

export const updateAttendanceSchema = z.object({
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  check_in: datetimeSanitizer,
  check_out: datetimeSanitizer,
  worked_hours: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().min(0).max(24).optional()),
  overtime_hours: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().min(0).max(24).optional()),
  status: attendanceStatusEnum.optional(),
  is_manual_edit: z.boolean().default(true),
  correction_note: z.string().min(1).optional()
});

export const attendanceIdParamSchema = z.object({
  id: z.string().uuid('Invalid attendance ID format')
});

export const attendanceQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: attendanceStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
