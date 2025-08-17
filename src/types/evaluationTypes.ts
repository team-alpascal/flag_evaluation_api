import { type FlagType, type FlagValue } from "./flagTypes";
import { ErrorCode, FlagMetadata } from "@openfeature/server-sdk";
import { EVERYONE, Reason } from "../conventions/conventions";

export interface UserTargetingDetails {
    id?: string;
    role?: string;
    group?: string;
}
export interface EvaluationContext {
  targetingKey: string; // unique identifier for subject (ie UUID or hash of username)
  kind: string;
  user?: UserTargetingDetails
}

export type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=';

export interface UntargetedEvaluationRule {
  ruleName: string;
  contextKind: "user";
  userAttribute: typeof EVERYONE;
  flagKey: string;
  variant: string;
  percentage: number;
}
export interface TargetedEvaluationRule {
  ruleName: string;
  contextKind: "user";
  userAttribute: "id" | "role" | "group";
  operator: Operator;
  values: string[];
  flagKey: string;
  variant: string;
  percentage: number;
}


export type EvaluationRule = UntargetedEvaluationRule | TargetedEvaluationRule;

export interface FlagResolution {
  value: FlagValue
  variant?: string
  reason: Reason
  errorCode?: ErrorCode
  errorMessage?: string
  flagMetadata?: FlagMetadata
}


