import { Request, Response, NextFunction } from 'express';
import DBPersistence from '../lib/dbPersistence';
const db = new DBPersistence();
import { type Flag, type FlagType, type Variant } from '../types/flagTypes';
import { FlagResolution, type EvaluationContext, type EvaluationRule, type Operator } from '../types/evaluationTypes';
import { getEvaluationFunction } from '../utils/operators';
import { distributeHashToBuckets } from '../utils/hashingAlg';
import { EVERYONE, Reason } from '../conventions/conventions';
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

//TODO: investigate why variants type in flag type is a single Variant instead of arr or obj with multiple
const resolveFlagRollout = (targetingKey: string, rule: EvaluationRule, flag: Flag): FlagResolution | null => {
  const NUMBER_OF_BUCKETS = 100;
  const bucket = distributeHashToBuckets(targetingKey, NUMBER_OF_BUCKETS);
  const {variant, percentage, userAttribute} = rule;
  const reason = userAttribute === EVERYONE
    ? Reason.PERCENTAGE_ROLLOUT_EVERYONE
    : Reason.TARGETING_AND_PERCENTAGE_ROLLOUT;

  if (bucket < percentage) {
    return {
      value: flag.variants[variant],
      variant: variant,
      reason: reason,
    };
  } 
  return null;
}

/**
 * Evaluates the the variant that a flag should resolve to for a specified evaluation context
 * @param evaluationContext the Context for which the flag is to be evaluated
 * @param flag the flag to evaluate
 * @returns the matching variant, falling back to default variant if no rule applies
 */
export const evaluateFlag = async (evaluationContext: EvaluationContext, flag: Flag): Promise<FlagResolution> => {
  const { flagKey, variants, defaultVariant } = flag;
  const { user, targetingKey } = evaluationContext;

  const evaluationRules: Array<EvaluationRule> = await db.getMatchingRules(flagKey);

  const fallbackResolution = {
    value: variants[defaultVariant],
    variant: defaultVariant,
    reason: Reason.DEFAULT,
  };
  if (!user) return fallbackResolution;

  for (const rule of evaluationRules) {
    const { ruleName, userAttribute } = rule;
    if (targetingKey === '') continue; //TODO: check why this is here

    const values: Array<string> = await db.getRuleValues(ruleName);
    const contextValue = user[userAttribute as keyof typeof user];

    if (userAttribute === EVERYONE) {
      let flagResolution = resolveFlagRollout(targetingKey, rule, flag);
      if (flagResolution !== null) return flagResolution;
    } else if (values.length) {
      for (const value of values) {
        if (matchesRule(contextValue, rule.operator, value)) {
          let flagResolution = resolveFlagRollout(targetingKey, rule, flag);
          if (flagResolution !== null) return flagResolution; //TODO: make sure we want to go with first match
        }
      }
    }
  }
  return fallbackResolution;
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
          reason: Reason.DISABLED,
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
    const flagEvaluations: Record<string, FlagResolution> = {}
    const context = req.body.context;
    const flags = await db.getAllFlags();
    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i] as Flag;
      let flagResolution: FlagResolution;

      if (!flag.isEnabled) {
        flagResolution = {
          value: disabledFlagValues[flag.flagType] as FlagType,
          reason: Reason.DISABLED,
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
