export interface Keyword {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScannedCV {
  email: string;
  extractedName: string;
  matchedKeywords: string[];
  fullText: string;
  scannedAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  items: T[];
  total?: number;
}

export interface ScanResponse {
  email: string;
  extractedName: string;
  matchedKeywords: string[];
  scannedAt: string;
  updatedAt: string;
}

export interface BatchScanResult {
  file: string;
  email: string;
  extractedName: string;
  matchedKeywords: string[];
  scannedAt: string;
}

export interface BatchScanError {
  file: string;
  error: string;
}

export interface BatchScanResponse {
  success: boolean;
  processed: number;
  failed: number;
  results: BatchScanResult[];
  errors: BatchScanError[];
}

export interface ExtractedData {
  text: string;
  name: string;
}

export interface KeywordListResponse {
  page?: number;
  limit?: number;
  items: Keyword[];
  total?: number;
}

export interface CVListResponse {
  items: ScannedCV[];
  total?: number;
}
