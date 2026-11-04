export interface WalletResponse {
  readonly walletId: string;
  readonly balance: string;
  readonly currency: string;
  readonly status: string;
  readonly createdAt: string;
  readonly accountNumber: string;
}

export interface InitiateLinkResponse {
  readonly linkId: string;
  readonly expiresIn: number;
}
