import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../../config/supabase.js';
import { Contract } from '../../contracts/contracts.types.js';

export class ContractResolver {
  /**
   * Resolves the active contract for an employee overlapping the payroll period.
   * A contract is valid if:
   *   contract.start_date <= periodEnd
   *   AND (contract.end_date IS NULL OR contract.end_date >= periodStart)
   */
  async resolve(
    employeeId: string,
    periodStart: string,
    periodEnd: string,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<Contract | null> {
    const { data, error } = await client
      .from('contracts')
      .select(`
        *,
        salary_structure:salary_structures (*),
        schedule:working_schedules (
          *,
          days:schedule_days (*)
        )
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'ACTIVE')
      .lte('start_date', periodEnd)
      .or(`end_date.is.null,end_date.gte.${periodStart}`)
      .order('start_date', { ascending: false })
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Contract;
  }
}

