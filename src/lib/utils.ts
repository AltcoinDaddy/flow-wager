/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTime = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

export const getFlowscanUrl = (address: string): string => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet';
  const baseUrl = network === 'mainnet' 
    ? 'https://flowscan.org' 
    : 'https://testnet.flowscan.org';
  return `${baseUrl}/account/${address}`;
};

export const getAvatarFallback = (address: string): string => {
  return address.slice(2, 4).toUpperCase();
};