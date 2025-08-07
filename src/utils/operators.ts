import { type Operator } from "../types/evaluationTypes";

/**
 * Returns a function that takes in two values and compares them 
 * according to the specified operator
 * @param operator the name of the operator
 * @returns an evaluation function for the specified operator
 */
export const getEvaluationFunction = (operator: Operator) => {
  switch (operator) {
    case '=':
      return (a: unknown, b: unknown) => String(a) === String(b);
    
    case '!=':
      return (a: unknown, b: unknown) => String(a) !== String(b);
    
    case '>':
      return (a: unknown, b: unknown) => {
        const numA = Number(a);
        const numB = Number(b);
        return !isNaN(numA) && !isNaN(numB) && numA > numB;
      };
    
    case '<':
      return (a: unknown, b: unknown) => {
        const numA = Number(a);
        const numB = Number(b);
        return !isNaN(numA) && !isNaN(numB) && numA < numB;
      };
    
    case '>=':
      return (a: unknown, b: unknown) => {
        const numA = Number(a);
        const numB = Number(b);
        return !isNaN(numA) && !isNaN(numB) && numA >= numB;
      };
    
    case '<=':
      return (a: unknown, b: unknown) => {
        const numA = Number(a);
        const numB = Number(b);
        return !isNaN(numA) && !isNaN(numB) && numA <= numB;
      };

    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
};
