// src/utils/redactor.ts

import type { RedactionOptions } from '../types';

const DEFAULT_SENSITIVE_FIELDS = [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'privateKey',
    'private_key',
    'creditCard',
    'credit_card',
    'cardNumber',
    'card_number',
    'cvv',
    'ssn',
    'authorization',
];

/**
 * Redactor class for masking sensitive data in logs
 */
export class Redactor {
    private paths: Set<string>;
    private censor: string;
    private remove: boolean;
    private wildcards: string[];

    constructor(options: Partial<RedactionOptions> = {}) {
        const paths = options.paths || DEFAULT_SENSITIVE_FIELDS;
        this.paths = new Set(paths.filter((p) => !p.includes('*')));
        this.wildcards = paths.filter((p) => p.includes('*'));
        this.censor = options.censor || '[REDACTED]';
        this.remove = options.remove || false;
    }

    /**
     * Redact sensitive fields from an object
     */
    redact(obj: Record<string, unknown>): Record<string, unknown> {
        return this.redactRecursive(obj, '') as Record<string, unknown>;
    }

    private redactRecursive(value: unknown, path: string): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        // Check if current path should be redacted
        if (this.shouldRedact(path)) {
            return this.remove ? undefined : this.censor;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            return value.map((item, index) =>
                this.redactRecursive(item, `${path}[${index}]`)
            );
        }

        // Handle objects
        if (typeof value === 'object') {
            const result: Record<string, unknown> = {};

            for (const [key, val] of Object.entries(value)) {
                const newPath = path ? `${path}.${key}` : key;

                if (this.shouldRedact(newPath) || this.shouldRedact(key)) {
                    if (!this.remove) {
                        result[key] = this.censor;
                    }
                    // If remove is true, skip adding this key
                } else {
                    result[key] = this.redactRecursive(val, newPath);
                }
            }

            return result;
        }

        return value;
    }

    private shouldRedact(path: string): boolean {
        // Check exact match
        if (this.paths.has(path)) {
            return true;
        }

        // Check if any key in the path matches
        const keys = path.split('.').filter(Boolean);
        for (const key of keys) {
            if (this.paths.has(key)) {
                return true;
            }
        }

        // Check wildcards
        for (const wildcard of this.wildcards) {
            if (this.matchWildcard(path, wildcard)) {
                return true;
            }
        }

        return false;
    }

    private matchWildcard(path: string, pattern: string): boolean {
        // Simple wildcard matching (* matches any segment)
        const pathParts = path.split('.');
        const patternParts = pattern.split('.');

        if (patternParts.length !== pathParts.length) {
            return false;
        }

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i] === '*') {
                continue;
            }
            if (patternParts[i] !== pathParts[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Add additional paths to redact
     */
    addPaths(...paths: string[]): void {
        for (const path of paths) {
            if (path.includes('*')) {
                this.wildcards.push(path);
            } else {
                this.paths.add(path);
            }
        }
    }

    /**
     * Remove paths from redaction list
     */
    removePaths(...paths: string[]): void {
        for (const path of paths) {
            this.paths.delete(path);
            const index = this.wildcards.indexOf(path);
            if (index > -1) {
                this.wildcards.splice(index, 1);
            }
        }
    }
}

/**
 * Quick redact for common sensitive fields
 */
export function quickRedact(
    obj: Record<string, unknown>
): Record<string, unknown> {
    const redactor = new Redactor();
    return redactor.redact(obj);
}

/**
 * Redact credit card numbers (keep last 4 digits)
 */
export function redactCreditCard(value: string): string {
    if (typeof value !== 'string') return value;

    // Match common credit card patterns
    const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

    return value.replace(ccPattern, (match) => {
        const digits = match.replace(/[\s-]/g, '');
        return `****-****-****-${digits.slice(-4)}`;
    });
}

/**
 * Redact email addresses (keep domain)
 */
export function redactEmail(value: string): string {
    if (typeof value !== 'string') return value;

    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

    return value.replace(emailPattern, (match) => {
        const [, domain] = match.split('@');
        return `***@${domain}`;
    });
}

/**
 * Redact phone numbers
 */
export function redactPhone(value: string): string {
    if (typeof value !== 'string') return value;

    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

    return value.replace(phonePattern, '***-***-****');
}
