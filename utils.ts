import { createHash, randomUUID } from 'node:crypto';
import type { JsonValue, ReviewSeverity } from './types.js';

export function createId(prefix = 'id'): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}

export function getPathValue(input: unknown, path: string): JsonValue | undefined {
  return path.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, input) as JsonValue | undefined;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortJson((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function computeFingerprint(input: unknown): string {
  return hashString(stableStringify(input));
}

export function nowIso(date = new Date()): string {
  return date.toISOString();
}

export function addMilliseconds(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

export function maxSeverity(a: ReviewSeverity, b: ReviewSeverity): ReviewSeverity {
  const ranking: Record<ReviewSeverity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  return ranking[a] >= ranking[b] ? a : b;
}

export function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
