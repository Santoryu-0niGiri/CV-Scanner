/**
 * File upload size limits
 */
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Pagination defaults and limits
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * JWT token configuration
 */
export const JWT_CONFIG = {
  EXPIRES_IN: '24h',
} as const;
