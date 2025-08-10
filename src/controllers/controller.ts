import { Request, Response, NextFunction } from 'express';
import DBPersistence from '../lib/dbPersistence';
const db = new DBPersistence();
import { type Flag, type FlagType} from '../types/flagTypes';
import { FlagResolution, type EvaluationContext, type EvaluationRule, type Operator} from '../types/evaluationTypes';
import { getEvaluationFunction } from '../utils/operators';
import { distributeHashToBuckets } from '../utils/hashingAlg';

/**
 * Checks whether the result of performing a comparison operation on the 
 * value of an attribute for the current evaluation context and a rule value produces a match 
 * @param contextValue the value of the attribute for the current evaluation context
 * @param operator the operation to perform on the values
 * @param ruleValue the value of the attribute for the current rule
 * @returns 
 */
const matchesRule = (contextValue: unknown, operator: Operator, ruleValue: unknown) => {
  const evaluate = getEvaluationFunction(operator)
  return evaluate(contextValue, ruleValue)
}


//TODO: account for multi-contexts
/**
 * Evaluates the the variant that a flag should resolve to for a specified evaluation context
 * @param evaluationContext the Context for which the flag is to be evaluated
 * @param flag the flag to evaluate
 * @returns the matching variant, falling back to default variant if no rule applies
 */
export const evaluateFlag = async (evaluationContext: EvaluationContext, flag: Flag): Promise<FlagResolution> => {
  const evaluationRules = await db.getMatchingRules(flag.flagKey);
  
  for (const rule of evaluationRules) {
    const values = await db.getRuleValues(rule.rule_name);
    const attributeName = rule.attribute;
    
    const contextValue = evaluationContext.user && attributeName in evaluationContext.user 
      ? evaluationContext.user[attributeName as keyof typeof evaluationContext.user] 
      : undefined;

    // percentage rollout for everyone
    if (attributeName === 'Everyone') {
      const userKey = evaluationContext.targetingKey;
      
      if (userKey === '') continue;
      
      const bucket = distributeHashToBuckets(userKey, 100);
      if (bucket < rule.percentage) {
        return {
          value: flag.variants[rule.variant],
          variant: rule.variant,
          reason: 'PERCENTAGE_ROLLOUT_EVERYONE',
        };
      }
    // percentage rollout for targeted users
    } else {
      if (!values.length) continue;
      
      for (const valObj of values) {
        const value = valObj.val;
        if (matchesRule(contextValue, rule.operator, value)) {
          const userKey = evaluationContext.targetingKey;
          if (userKey === '') continue;
          
          const bucket = distributeHashToBuckets(userKey, 100);
          if (bucket < rule.percentage) {
            return {
              value: flag.variants[rule.variant],
              variant: rule.variant,
              reason: 'TARGETING_AND_PERCENTAGE_ROLLOUT',
            };
          }
        }
      }
    }
  }

  return {
    value: flag.variants[flag.defaultVariant],
    variant: flag.defaultVariant,
    reason: 'DEFAULT',
  };
};

//TODO: find cleaner way to handle this
const disabledFlagValues = {
  'boolean': false,
  'string': '',
  'number': 0, // TODO: see if there is a better alternative to 0 for number fallback (user setting?)
  'object': null,
}
/**
 * Evaluates the value of a flag given its key and context
 * @param req 
 * @param res 
 * @param next 
 */
export const getFlagEvaluation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const context = req.body.context;
    const flagKey = req.body.flagKey;

    const flag = await db.getFlagByKey(flagKey) as Flag;
    if (flag === null) {
      res.status(404).json({}) // TODO: send evaluation reason (see OpenFeature docs)
      return;
    } else {
    let flagResolution: FlagResolution;
    
    if (!flag.isEnabled) {
      flagResolution = {
        value: disabledFlagValues[flag.flagType] as FlagType,
        reason: 'DISABLED',
      }
    } else {
      flagResolution = await evaluateFlag(context, flag as Flag) //TODO; replace 'as' with zod parse
    }
    
    res.status(200).json(flagResolution)
  }
  } catch (err) {
    next(err)
  }

}

export const getFlagEvaluationConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flagEvaluations: Record<string, FlagResolution>  = {}
    const context = req.body.context;
    const flags = await db.getAllFlags();
    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i] as Flag;
      let flagResolution: FlagResolution;
    
      if (!flag.isEnabled) {
        flagResolution = {
          value: disabledFlagValues[flag.flagType] as FlagType,
          reason: 'DISABLED',
        }
      } else {
        flagResolution = await evaluateFlag(context, flag as Flag)
      }
      flagEvaluations[flag.flagKey] = flagResolution
    }
    res.status(200).json(flagEvaluations)
  }
  catch (err) {
    next(err)
  }
}
