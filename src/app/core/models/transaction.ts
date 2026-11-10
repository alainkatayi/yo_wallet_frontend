export type TransactionType = 'TOPUP' | 'WITHDRAW' | 'TRANSFER';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export type TransferDirection = 'IN' | 'OUT';

export interface TransactionResponse {
  readonly reference: string;
  readonly type: string;
  readonly direction: TransferDirection | null;
  readonly amount: string;
  readonly fee: string;
  readonly status: string;
  readonly failureReason: string | null;
  readonly bankAccount: string | null;
  readonly counterpartyPhone: string | null;
  readonly counterpartyName: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TransferPreview {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly amount: string;
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
