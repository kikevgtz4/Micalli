// src/utils/caseConversion.ts

/**
 * Converts snake_case keys to camelCase
 */
export function snakeToCamel<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel) as T;
  }

  return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = snakeToCamel((obj as Record<string, unknown>)[key]);
    return acc;
  }, {} as Record<string, unknown>) as T;
}

/**
 * Converts camelCase keys to snake_case
 */
export function camelToSnake<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake) as T;
  }

  return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = camelToSnake((obj as Record<string, unknown>)[key]);
    return acc;
  }, {} as Record<string, unknown>) as T;
}