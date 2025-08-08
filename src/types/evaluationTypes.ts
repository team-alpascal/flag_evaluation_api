import { type FlagType, type FlagValue } from "./flagTypes";
import { ErrorCode, FlagMetadata } from "@openfeature/server-sdk";

// export interface EvaluationContext {
//   targetingKey: string, // unique identifier for subject (ie UUID or hash of username)
//   kind: string
//   [attributes: string]: unknown
// }

// export interface UserEvaluationContext extends EvaluationContext {
//   kind: "user"
//   name?: string
//   email?: string
//   location?: string
//   [attributes: string]: unknown
// }

export interface EvaluationContext {
  targetingKey: string; // unique identifier for subject (ie UUID or hash of username)
  kind: string;
  user?: {
    id?: string;
    role?: string;
    group?: string;
  };
}

export type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=';

export type EvaluationRule =
  | {
      name: string;
      contextKind: "user";
      attribute: "Everyone";
      flagKey: string;
      variant: string;
    }
  | {
      name: string;
      contextKind: "user";
      attribute: "id" | "role" | "group";
      operator: Operator;
      values: string[];
      flagKey: string;
      variant: string;
    };

export interface FlagResolution {
  value: FlagValue
  variant?: string
  reason?: string
  errorCode?: ErrorCode
  errorMessage?: string
  flagMetadata?: FlagMetadata
}

