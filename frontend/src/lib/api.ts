import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LedgerEntry {
  transaction_id: string;
  date: string;
  amount: number;
  category: string;
  gst_rate: number;
  gst_amount: number;
  source: 'receipt' | 'voice';
  confidence: number;
  explanation: string;
  vendor_name?: string;
  vendor_gstin?: string;
  receipt_url?: string;
  audio_url?: string;
  raw_text?: string;
  created_at: string;
}

export interface UploadResponse {
  success: boolean;
  ledger_entry?: LedgerEntry;
  needs_confirmation: boolean;
  confirmation_reason?: string;
  error?: string;
}

export interface DailySummary {
  date: string;
  total_amount: number;
  total_gst: number;
  entry_count: number;
  by_category: Record<string, number>;
  gst_by_category: Record<string, number>;
}

export interface Category {
  key: string;
  display_name: string;
  gst_rate: number;
}

// Receipt APIs
export const uploadReceipt = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/receipts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const confirmReceipt = async (
  transactionId: string,
  amount?: number,
  category?: string
): Promise<UploadResponse> => {
  const response = await api.post('/receipts/confirm', {
    transaction_id: transactionId,
    confirmed_amount: amount,
    confirmed_category: category,
  });
  return response.data;
};

// Voice APIs

/**
 * Upload audio file to backend for Whisper transcription.
 * Use this when you want server-side transcription with local Whisper.
 */
export const uploadVoice = async (audioBlob: Blob): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  const response = await api.post('/voice/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Send already-transcribed text to backend for processing.
 * Use this when using browser's Web Speech API for transcription.
 */
export const uploadVoiceText = async (text: string): Promise<UploadResponse> => {
  const response = await api.post('/voice/upload-text', { text });
  return response.data;
};

export const confirmVoice = async (
  transactionId: string,
  amount?: number,
  category?: string
): Promise<UploadResponse> => {
  const response = await api.post('/voice/confirm', {
    transaction_id: transactionId,
    confirmed_amount: amount,
    confirmed_category: category,
  });
  return response.data;
};

// Ledger APIs
export const getEntries = async (date?: string, limit = 20): Promise<LedgerEntry[]> => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  params.append('limit', limit.toString());
  const response = await api.get(`/ledger/entries?${params}`);
  return response.data;
};

export const getEntry = async (transactionId: string): Promise<LedgerEntry> => {
  const response = await api.get(`/ledger/entries/${transactionId}`);
  return response.data;
};

export const deleteEntry = async (transactionId: string): Promise<void> => {
  await api.delete(`/ledger/entries/${transactionId}`);
};

export const getDailySummary = async (date?: string): Promise<DailySummary> => {
  const params = date ? `?date=${date}` : '';
  const response = await api.get(`/ledger/summary${params}`);
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/ledger/categories');
  return response.data;
};

export default api;
