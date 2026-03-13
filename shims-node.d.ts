declare module 'node:crypto' {
  export function randomUUID(): string;
  export function createHash(algorithm: string): {
    update(data: string): { digest(encoding: 'hex'): string };
    digest(encoding: 'hex'): string;
  };
  export function createHmac(algorithm: string, key: string): {
    update(data: string): { digest(encoding: 'hex' | 'base64url'): string };
    digest(encoding: 'hex' | 'base64url'): string;
  };
  export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}

declare module 'node:fs/promises' {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, encoding: 'utf8'): Promise<string>;
  export function rename(oldPath: string, newPath: string): Promise<void>;
  export function writeFile(path: string, data: string, encoding: 'utf8'): Promise<void>;
}

declare module 'node:path' {
  export function dirname(path: string): string;
}

declare class Buffer extends Uint8Array {
  static from(data: string, encoding?: string): Buffer;
  static from(data: ArrayLike<number>): Buffer;
  toString(encoding?: string): string;
}

declare namespace NodeJS {
  interface ErrnoException extends Error {
    code?: string;
  }
}
