import { SafeFormulaEvaluator } from '../../salary/salary.evaluator.js';
import { SalaryRule } from '../../salary/salary.types.js';

export interface EvaluatedRuleResult {
  rule: SalaryRule;
  sequence: number;
  amount: number;
  calculationSnapshot: Record<string, unknown>;
}

export class SalaryRuleEvaluator {
  evaluateSequence(
    rules: { rule: SalaryRule; sequence: number }[],
    baseContext: Record<string, number>
  ): { evaluatedRules: EvaluatedRuleResult[]; finalContext: Record<string, number>; gross: number; deductions: number; net: number } {
    const context: Record<string, number> = { ...baseContext };
    const evaluatedRules: EvaluatedRuleResult[] = [];

    let totalGross = 0;
    let totalDeductions = 0;

    // Sort rules strictly in ascending sequence
    const sortedRules = [...rules].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    for (const { rule, sequence } of sortedRules) {
      let amount = 0;
      let snapshotDetail: Record<string, unknown> = {};

      switch (rule.calculation_type) {
        case 'FIXED':
          amount = Number(rule.fixed_amount || 0);
          snapshotDetail = { type: 'FIXED', value: amount };
          break;

        case 'PERCENTAGE': {
          const pct = Number(rule.percentage || 0);
          let base = 0;
          let baseSource = '';

          if (rule.formula && rule.formula.trim()) {
            const trimmedFormula = rule.formula.trim();
            // If formula contains operators, evaluate formula directly
            if (/[+\-*/()]/.test(trimmedFormula)) {
              amount = SafeFormulaEvaluator.evaluate(trimmedFormula, context);
              snapshotDetail = { type: 'PERCENTAGE_FORMULA', formula: trimmedFormula, result: amount };
              break;
            } else {
              // Formula specifies base variable name (e.g. 'BASIC', 'GROSS', 'WAGE', etc.)
              const baseVar = trimmedFormula.toUpperCase();
              base = context[baseVar] ?? 0;
              baseSource = baseVar;
            }
          } else {
            // Flexible base resolution according to category and available context
            if (rule.category === 'DEDUCTION') {
              if (context['BASIC'] !== undefined && rule.code === 'PF') {
                base = context['BASIC'];
                baseSource = 'BASIC';
              } else if (context['GROSS'] !== undefined) {
                base = context['GROSS'];
                baseSource = 'GROSS';
              } else if (context['BASIC'] !== undefined) {
                base = context['BASIC'];
                baseSource = 'BASIC';
              } else {
                base = context['WAGE'] ?? 0;
                baseSource = 'WAGE';
              }
            } else if (rule.category === 'ALLOWANCE') {
              if (context['BASIC'] !== undefined) {
                base = context['BASIC'];
                baseSource = 'BASIC';
              } else {
                base = context['WAGE'] ?? 0;
                baseSource = 'WAGE';
              }
            } else if (rule.category === 'BASIC') {
              base = context['WAGE'] ?? 0;
              baseSource = 'WAGE';
            } else {
              base = context['BASIC'] ?? context['GROSS'] ?? context['WAGE'] ?? 0;
              baseSource = 'DEFAULT';
            }
          }

          amount = Number(((base * pct) / 100).toFixed(2));
          snapshotDetail = { type: 'PERCENTAGE', base, baseSource, percentage: pct, calculated: amount };
          break;
        }

        case 'FORMULA': {
          if (rule.formula) {
            amount = SafeFormulaEvaluator.evaluate(rule.formula, context);
            snapshotDetail = { type: 'FORMULA', formula: rule.formula, result: amount };
          }
          break;
        }
      }

      // Add to context with rule code and uppercase rule code
      context[rule.code] = amount;
      context[rule.code.toUpperCase()] = amount;

      if (rule.category === 'BASIC' || rule.category === 'ALLOWANCE') {
        totalGross += amount;
      } else if (rule.category === 'GROSS') {
        // If an explicit GROSS rule was evaluated, respect its calculated amount
        totalGross = amount;
      } else if (rule.category === 'DEDUCTION') {
        totalDeductions += amount;
      }

      evaluatedRules.push({
        rule,
        sequence,
        amount,
        calculationSnapshot: snapshotDetail
      });
    }

    // Determine gross, deductions and net
    const gross = context['GROSS'] !== undefined ? context['GROSS'] : Number(totalGross.toFixed(2));
    let deductions = context['DEDUCTIONS'] !== undefined ? context['DEDUCTIONS'] : Number(totalDeductions.toFixed(2));
    let net = context['NET'] !== undefined ? context['NET'] : Number((gross - deductions).toFixed(2));

    return {
      evaluatedRules,
      finalContext: context,
      gross,
      deductions,
      net
    };
  }
}

