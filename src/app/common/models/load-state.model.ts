export type LoadStatus = 'loading' | 'empty' | 'error' | 'success';

export interface LoadState<T> {
  status: LoadStatus;
  data: T;
  error: string | null;
}

export interface GraphqlResponse<T> {
  data?: T | null;
  errors?: Array<{
    message: string;
  }>;
}