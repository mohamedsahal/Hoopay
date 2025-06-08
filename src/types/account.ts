export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'closed';

export type AccountType = {
  id: number;
  name: string;
  description: string;
  account_category: string;
  currency: string;
  prefix: string;
  logo: string;
  is_active: boolean;
};

export type Account = {
  id: number;
  account_number: string;
  account_type: string;
  currency: string;
  balance: number;
  status: AccountStatus;
  is_active: boolean;
  created_at: string;
};

export type AccountCategory = string;

export type CreateAccountData = {
  account_type: string;
  currency: string;
  deposit_address?: string;
  network?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
}; 