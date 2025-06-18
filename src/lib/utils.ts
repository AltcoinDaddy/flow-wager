import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatFlowAmount = (amount: string): string => {
  return parseFloat(amount).toFixed(8);
};

export const parseFlowAmount = (amount: string): number => {
  return parseFloat(amount);
};

export const validateFlowAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{16}$/.test(address);
};

// Error handling for Flow transactions
export interface FlowError {
  message: string;
  code?: number;
  details?: any;
}

export const handleFlowError = (error: any): FlowError => {
  if (error.message) {
    return {
      message: error.message,
      code: error.code,
      details: error
    };
  }
  
  return {
    message: "Unknown Flow error occurred",
    details: error
  };
}