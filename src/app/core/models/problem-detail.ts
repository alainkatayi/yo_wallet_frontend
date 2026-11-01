export interface FieldViolation {
  readonly field: string;
  readonly message: string;
}

export interface ProblemDetail {
  readonly status?: number;
  readonly detail?: string;
  readonly code?: string;
  readonly errors?: readonly FieldViolation[];
}
