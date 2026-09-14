export class WorkingDaysCalculator {
  /**
   * Parses YYYY-MM-DD string into a pure UTC date.
   */
  private static parseUtcDate(dateStr: string): Date {
    const parts = dateStr.split('T')[0]!.split('-').map(Number);
    return new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!));
  }

  /**
   * Calculates total scheduled working days in a period based on schedule days pattern.
   * If schedule days are configured (e.g. MONDAY-FRIDAY), counts matching weekdays.
   * Defaults to 5 days/week (Monday to Friday) if no explicit schedule days provided.
   * All calculations operate in pure UTC to avoid local timezone offset drift.
   */
  calculate(
    periodStart: string,
    periodEnd: string,
    scheduledDayNames?: string[]
  ): { totalPeriodDays: number; workingDays: number } {
    const start = WorkingDaysCalculator.parseUtcDate(periodStart);
    const end = WorkingDaysCalculator.parseUtcDate(periodEnd);
    const dayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    const activeScheduleDays = (scheduledDayNames && scheduledDayNames.length > 0)
      ? scheduledDayNames.map((d) => d.toUpperCase())
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    let workingDays = 0;
    let totalPeriodDays = 0;

    const current = new Date(start.getTime());
    while (current.getTime() <= end.getTime()) {
      totalPeriodDays++;
      const dayName = dayMap[current.getUTCDay()]!;
      if (activeScheduleDays.includes(dayName)) {
        workingDays++;
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return {
      totalPeriodDays,
      workingDays: Math.max(1, workingDays)
    };
  }
}

