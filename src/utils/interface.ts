/**
 * Keyword entity representing a skill to scan for in CVs
 */
export interface Keyword {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Scanned CV entity with matched keywords
 */
export interface ScannedCV {
  email: string;
  extractedName: string;
  matchedKeywords: string[];
  fullText: string;
  scannedAt: string;
  updatedAt: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  items: T[];
  total?: number;
}

/**
 * Response format for single CV scan
 */
export interface ScanResponse {
  email: string;
  extractedName: string;
  matchedKeywords: string[];
  scannedAt: string;
  updatedAt: string;
}

/**
 * Single result in batch scan operation
 */
export interface BatchScanResult {
  file: string;
  email: string;
  extractedName: string;
  matchedKeywords: string[];
  scannedAt: string;
}

/**
 * Error entry in batch scan operation
 */
export interface BatchScanError {
  file: string;
  error: string;
}

/**
 * Response format for batch CV scan
 */
export interface BatchScanResponse {
  success: boolean;
  processed: number;
  failed: number;
  results: BatchScanResult[];
  errors: BatchScanError[];
}

/**
 * Extracted data from PDF parsing
 */
export interface ExtractedData {
  text: string;
  name: string;
}

/**
 * Paginated keyword list response
 */
export interface KeywordListResponse {
  page?: number;
  limit?: number;
  items: Keyword[];
  total?: number;
}

/**
 * CV list response
 */
export interface CVListResponse {
  items: ScannedCV[];
  total?: number;
}
