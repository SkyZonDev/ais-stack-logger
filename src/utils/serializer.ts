// src/utils/serializer.ts

import type { SerializationOptions } from '../types';

const DEFAULT_OPTIONS: Required<SerializationOptions> = {
    maxDepth: 10,
    maxStringLength: 10000,
    maxArrayLength: 1000,
    circularRef: '[Circular]',
    bigIntMode: 'string',
};

/**
 * Fast, safe JSON serializer with circular reference detection
 */
export class Serializer {
    private options: Required<SerializationOptions>;
    private seen: WeakSet<object>;

    constructor(options: SerializationOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.seen = new WeakSet();
    }

    /**
     * Serialize a value to JSON-compatible format
     */
    serialize(value: unknown, depth = 0): unknown {
        // Handle primitives
        if (value === null || value === undefined) {
            return value;
        }

        if (typeof value === 'string') {
            return this.truncateString(value);
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'bigint') {
            return this.options.bigIntMode === 'string'
                ? value.toString()
                : Number(value);
        }

        if (typeof value === 'symbol') {
            return value.toString();
        }

        if (typeof value === 'function') {
            return `[Function: ${value.name || 'anonymous'}]`;
        }

        // Check depth limit
        if (depth >= this.options.maxDepth) {
            return '[Max Depth Reached]';
        }

        // Handle objects and arrays
        if (typeof value === 'object') {
            // Circular reference detection
            if (this.seen.has(value)) {
                return this.options.circularRef;
            }
            this.seen.add(value);

            try {
                // Special handling for errors
                if (value instanceof Error) {
                    return this.serializeError(value);
                }

                // Special handling for dates
                if (value instanceof Date) {
                    return value.toISOString();
                }

                // Special handling for RegExp
                if (value instanceof RegExp) {
                    return value.toString();
                }

                // Arrays
                if (Array.isArray(value)) {
                    return this.serializeArray(value, depth);
                }

                // Plain objects
                return this.serializeObject(value, depth);
            } finally {
                this.seen.delete(value);
            }
        }

        return String(value);
    }

    private serializeArray(arr: unknown[], depth: number): unknown[] {
        const length = Math.min(arr.length, this.options.maxArrayLength);
        const result: unknown[] = new Array(length);

        for (let i = 0; i < length; i++) {
            result[i] = this.serialize(arr[i], depth + 1);
        }

        if (arr.length > this.options.maxArrayLength) {
            result.push(
                `... ${arr.length - this.options.maxArrayLength} more items`
            );
        }

        return result;
    }

    private serializeObject(
        obj: object,
        depth: number
    ): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        const keys = Object.keys(obj);

        for (const key of keys) {
            try {
                const value = (obj as Record<string, unknown>)[key];
                result[key] = this.serialize(value, depth + 1);
            } catch (error) {
                result[key] = `[Error serializing: ${error}]`;
            }
        }

        return result;
    }

    private serializeError(error: Error): Record<string, unknown> {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...Object.getOwnPropertyNames(error).reduce(
                (acc, key) => {
                    if (!['name', 'message', 'stack'].includes(key)) {
                        acc[key] = (
                            error as unknown as Record<string, unknown>
                        )[key];
                    }
                    return acc;
                },
                {} as Record<string, unknown>
            ),
        };
    }

    private truncateString(str: string): string {
        if (str.length <= this.options.maxStringLength) {
            return str;
        }
        return str.slice(0, this.options.maxStringLength) + '... (truncated)';
    }

    /**
     * Reset circular reference tracking (useful for reuse)
     */
    reset(): void {
        this.seen = new WeakSet();
    }
}

/**
 * Quick serialize for simple objects (no circular refs expected)
 */
export function fastSerialize(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    const type = typeof value;

    if (type === 'string' || type === 'number' || type === 'boolean') {
        return value;
    }

    if (type === 'bigint') {
        return value.toString();
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
        };
    }

    if (Array.isArray(value)) {
        return value.map(fastSerialize);
    }

    if (type === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value as object)) {
            result[key] = fastSerialize(val);
        }
        return result;
    }

    return String(value);
}

/**
 * Merge contexts deeply
 */
export function mergeContext(
    base: Record<string, unknown>,
    ...contexts: Record<string, unknown>[]
): Record<string, unknown> {
    const result = { ...base };

    for (const context of contexts) {
        if (!context) continue;

        for (const [key, value] of Object.entries(context)) {
            if (value !== undefined) {
                result[key] = value;
            }
        }
    }

    return result;
}
