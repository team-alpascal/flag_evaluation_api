import { type FlagType, type FlagValue } from "./flagTypes";
import { ErrorCode, FlagMetadata } from "@openfeature/server-sdk";

export interface EvaluationContext {
  targetingKey: string, // unique identifier for subject (ie UUID or hash of username)
  kind: string
  [attributes: string]: unknown
}

export interface UserEvaluationContext extends EvaluationContext {
  kind: "user"
  name?: string
  email?: string
  location?: string
  [attributes: string]: unknown
}

export type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=';

export interface EvaluationRule {
  name: string
  contextKind: string
  attribute: string 
  operator: Operator
  values: Array<string>
  flagKey: string
  variant: string 
}

export interface FlagResolution {
  value: FlagValue
  variant?: string
  reason?: string
  errorCode?: ErrorCode
  errorMessage?: string
  flagMetadata?: FlagMetadata
}

