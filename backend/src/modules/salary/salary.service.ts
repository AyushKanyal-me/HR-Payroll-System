import { SupabaseClient } from '@supabase/supabase-js';
import { salaryRepository, SalaryRepository } from './salary.repository.js';
import {
  SalaryStructure,
  SalaryRule,
  CreateSalaryStructureDto,
  UpdateSalaryStructureDto,
  CreateSalaryRuleDto,
  UpdateSalaryRuleDto,
  SalaryStructureQueryDto,
  SalaryRuleQueryDto
} from './salary.types.js';
import { SafeFormulaEvaluator } from './salary.evaluator.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class SalaryService {
  constructor(private readonly repo: SalaryRepository = salaryRepository) {}

  // Structures
  async getStructures(query: SalaryStructureQueryDto, client?: SupabaseClient): Promise<SalaryStructure[]> {
    return this.repo.findAllStructures(query, client);
  }

  async getStructureById(id: string, client?: SupabaseClient): Promise<SalaryStructure> {
    const structure = await this.repo.findStructureById(id, client);
    if (!structure) {
      throw new NotFoundError(`Salary structure with ID '${id}' not found`);
    }
    return structure;
  }

  async createStructure(dto: CreateSalaryStructureDto, client?: SupabaseClient): Promise<SalaryStructure> {
    return this.repo.createStructure(dto, client);
  }

  async updateStructure(id: string, dto: UpdateSalaryStructureDto, client?: SupabaseClient): Promise<SalaryStructure> {
    const structure = await this.repo.updateStructure(id, dto, client);
    if (!structure) {
      throw new NotFoundError(`Salary structure with ID '${id}' not found to update`);
    }
    return structure;
  }

  // Rules
  async getRules(query: SalaryRuleQueryDto, client?: SupabaseClient): Promise<SalaryRule[]> {
    return this.repo.findAllRules(query, client);
  }

  async getRuleById(id: string, client?: SupabaseClient): Promise<SalaryRule> {
    const rule = await this.repo.findRuleById(id, client);
    if (!rule) {
      throw new NotFoundError(`Salary rule with ID '${id}' not found`);
    }
    return rule;
  }

  async createRule(dto: CreateSalaryRuleDto, client?: SupabaseClient): Promise<SalaryRule> {
    if (dto.calculation_type === 'FORMULA' && dto.formula) {
      SafeFormulaEvaluator.validateFormulaSyntax(dto.formula);
    }
    return this.repo.createRule(dto, client);
  }

  async updateRule(id: string, dto: UpdateSalaryRuleDto, client?: SupabaseClient): Promise<SalaryRule> {
    if (dto.calculation_type === 'FORMULA' && dto.formula) {
      SafeFormulaEvaluator.validateFormulaSyntax(dto.formula);
    }
    const rule = await this.repo.updateRule(id, dto, client);
    if (!rule) {
      throw new NotFoundError(`Salary rule with ID '${id}' not found to update`);
    }
    return rule;
  }

  // Sequential Rule Calculation Helper for Testing & Verification
  evaluateRule(
    rule: SalaryRule,
    context: Record<string, number>,
    baseWage = 0
  ): number {
    switch (rule.calculation_type) {
      case 'FIXED':
        return Number(rule.fixed_amount || 0);

      case 'PERCENTAGE': {
        const base = context['BASIC'] ?? context['GROSS'] ?? context['WAGE'] ?? baseWage;
        const pct = Number(rule.percentage || 0);
        return Number(((base * pct) / 100).toFixed(2));
      }

      case 'FORMULA': {
        if (!rule.formula) {
          throw new BadRequestError(`Formula calculation specified but formula string is empty for rule '${rule.code}'`);
        }
        return SafeFormulaEvaluator.evaluate(rule.formula, context);
      }

      default:
        return 0;
    }
  }
}

export const salaryService = new SalaryService();
