export type TransactionType = 'TOPUP' | 'WITHDRAW';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface TransactionResponse {
  readonly reference: string;
  readonly type: string;
  readonly amount: string;
  readonly fee: string;
  readonly status: string;
  readonly failureReason: string | null;
  readonly bankAccount: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TransactionPage {
  readonly items: readonly TransactionResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
}

export interface SubmittedTransaction {
  readonly httpStatus: number;
  readonly transaction: TransactionResponse;
}
