// src/transports/file.ts

import * as fs from 'fs';
import * as path from 'path';
import { JsonFormatter } from '../core/formatter';
import type { Formatter, LogEntry, Transport } from '../types';

export interface FileTransportOptions {
    path: string;
    formatter?: Formatter;
    maxSize?: number; // Max file size in bytes before rotation
    maxFiles?: number; // Max number of rotated files to keep
    compress?: boolean; // Compress rotated files (future)
    flags?: string; // File open flags (default: 'a' for append)
}

/**
 * File transport - writes logs to a file with rotation support
 */
export class FileTransport implements Transport {
    name = 'file';
    private formatter: Formatter;
    private filePath: string;
    private maxSize: number;
    private maxFiles: number;
    private stream: fs.WriteStream | null = null;
    private currentSize = 0;

    constructor(options: FileTransportOptions) {
        this.filePath = options.path;
        this.formatter = options.formatter || new JsonFormatter();
        this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
        this.maxFiles = options.maxFiles || 5;

        this.ensureDirectory();
        this.openStream();
        this.getCurrentSize();
    }

    write(entry: LogEntry): void {
        const formatted = this.formatter.format(entry) + '\n';
        const size = Buffer.byteLength(formatted, 'utf8');

        // Check if rotation is needed
        if (this.currentSize + size > this.maxSize) {
            this.rotate();
        }

        if (this.stream) {
            this.stream.write(formatted);
            this.currentSize += size;
        }
    }

    async flush(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.stream) {
                resolve();
                return;
            }

            this.stream.once('finish', resolve);
            this.stream.once('error', reject);
            // Note: we don't call end() here, just drain
        });
    }

    async close(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.stream) {
                resolve();
                return;
            }

            this.stream.end(() => {
                this.stream = null;
                resolve();
            });
        });
    }

    private ensureDirectory(): void {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private openStream(): void {
        this.stream = fs.createWriteStream(this.filePath, {
            flags: 'a',
            encoding: 'utf8',
        });

        this.stream.on('error', (error) => {
            console.error('File transport error:', error);
        });
    }

    private getCurrentSize(): void {
        try {
            const stats = fs.statSync(this.filePath);
            this.currentSize = stats.size;
        } catch {
            this.currentSize = 0;
        }
    }

    private rotate(): void {
        // Close current stream
        if (this.stream) {
            this.stream.end();
            this.stream = null;
        }

        // Rotate existing files
        const dir = path.dirname(this.filePath);
        const ext = path.extname(this.filePath);
        const base = path.basename(this.filePath, ext);

        // Remove oldest file if we've hit the limit
        const oldestFile = path.join(dir, `${base}.${this.maxFiles}${ext}`);
        if (fs.existsSync(oldestFile)) {
            fs.unlinkSync(oldestFile);
        }

        // Shift all files up by 1
        for (let i = this.maxFiles - 1; i >= 1; i--) {
            const oldPath = path.join(dir, `${base}.${i}${ext}`);
            const newPath = path.join(dir, `${base}.${i + 1}${ext}`);

            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
            }
        }

        // Rename current file to .1
        const firstRotated = path.join(dir, `${base}.1${ext}`);
        if (fs.existsSync(this.filePath)) {
            fs.renameSync(this.filePath, firstRotated);
        }

        // Open new stream
        this.currentSize = 0;
        this.openStream();
    }
}
