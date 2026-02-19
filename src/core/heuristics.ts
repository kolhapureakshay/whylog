import { rules, unknownRule, Rule } from './rules';

export interface InsightCard {
  type: string;
  title: string;
  why: string;
  fix: string[];
}

export class HeuristicMapper {
  static getInsight(error: any, eventType?: string): InsightCard {
    // Sort rules by priority (descending)
    const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Find first matching rule
    const match = sortedRules.find(rule => rule.pattern(error, eventType));
    const rule = match || unknownRule;

    // Resolve dynamic fields
    const title = rule.title || error.name || 'Error';
    const category = rule.category || 'Error';
    const why = typeof rule.explanation === 'function' ? rule.explanation(error) : rule.explanation;
    const fix = typeof rule.fix === 'function' ? rule.fix(error) : rule.fix;

    return {
      type: category,
      title: title,
      why: why,
      fix: Array.isArray(fix) ? fix : []
    };
  }
}
