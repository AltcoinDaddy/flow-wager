// src/types/index.ts
// Central export file for all types

// Market types
export * from './market';

// User types  
export * from './user';

// Wallet types
export * from './wallet';


// Common utility types
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  category?: string;
  status?: string;
  dateFrom?: number;
  dateTo?: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

// Common error types
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

// Component prop helpers
export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'destructive';
export type ComponentColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';