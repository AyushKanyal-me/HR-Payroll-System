import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../../config/supabase.js';
import { WorkingDaysCalculator } from './WorkingDaysCalculator.js';

export class LeaveCalculator {
  private workingDaysCalc = new WorkingDaysCalculator();

  async calculate(
    employeeId: string,
    periodStart: string,
    periodEnd: string,
    scheduleDays?: string[],
    client: SupabaseClient = supabaseAdminClient
  ): Promise<{ approvedPaidLeaveDays: number; approvedUnpaidLeaveDays: number }> {
    // Overlapping condition: start_date <= periodEnd AND end_date >= periodStart
    const { data, error } = await client
      .from('time_off_requests')
      .select(`
        id,
        start_date,
        end_date,
        duration,
        time_off_type:time_off_types (
          id,
          name,
          code,
          unit,
          requires_allocation,
          payroll_integration
        )
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'APPROVED')
      .lte('start_date', periodEnd)
      .gte('end_date', periodStart);

    if (error || !data || data.length === 0) {
      return { approvedPaidLeaveDays: 0, approvedUnpaidLeaveDays: 0 };
    }

    let approvedPaidLeaveDays = 0;
    let approvedUnpaidLeaveDays = 0;

    for (const req of data as any[]) {
      // Determine if leave type is unpaid according to actual database schema
      const timeOffType = req.time_off_type;
      const code = (timeOffType?.code || '').toUpperCase();
      const name = (timeOffType?.name || '').toUpperCase();
      const requiresAllocation = timeOffType?.requires_allocation ?? true;

      const isUnpaid = code === 'UNPAID' || code.includes('LOP') || !requiresAllocation || name.includes('UNPAID');

      // Calculate the overlapping days inside [periodStart, periodEnd]
      const effectiveLeaveStart = req.start_date > periodStart ? req.start_date : periodStart;
      const effectiveLeaveEnd = req.end_date < periodEnd ? req.end_date : periodEnd;

      const { workingDays: overlappingDays } = this.workingDaysCalc.calculate(
        effectiveLeaveStart,
        effectiveLeaveEnd,
        scheduleDays
      );

      if (isUnpaid) {
        approvedUnpaidLeaveDays += overlappingDays;
      } else {
        approvedPaidLeaveDays += overlappingDays;
      }
    }

    return {
      approvedPaidLeaveDays,
      approvedUnpaidLeaveDays
    };
  }
}

