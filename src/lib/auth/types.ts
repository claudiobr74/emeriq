export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type LoginFailureCode =
  | "invalid_credentials"
  | "network_error"
  | "rate_limited"
  | "unknown_error";

export type LoginStatus =
  | "idle"
  | "submitting"
  | "success"
  | LoginFailureCode;
