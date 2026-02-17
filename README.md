# @ais-stack/logger

> 🚀 A high-performance, structured logger for Node.js with first-class TypeScript support

[![npm version](https://img.shields.io/npm/v/@ais-stack/logger.svg)](https://www.npmjs.com/package/@ais-stack/logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

-   🎯 **Simple API** - Intuitive interface similar to console, but better
-   ⚡ **High Performance** - Lazy serialization, minimal overhead
-   📊 **Structured Logging** - JSON output for easy parsing and analysis
-   🔒 **Security** - Automatic redaction of sensitive data
-   🎨 **4 Visual Modes** - Pretty, Compact, Minimal, JSON
-   🚨 **Error Emphasis** - Automatic visual highlighting for errors
-   🔄 **Flow Tracking** - Visualize request flows across services
-   🌳 **Hierarchical Context** - Child loggers inherit parent context
-   📝 **TypeScript-First** - Fully typed API with excellent IDE support
-   🔌 **Extensible** - Custom transports and formatters
-   📦 **Zero Dependencies** - Lightweight and tree-shakable
-   🏭 **Production Ready** - Battle-tested for microservices and cloud-native apps

## 📦 Installation

```bash
npm install @ais-stack/logger
```

```bash
yarn add @ais-stack/logger
```

```bash
pnpm add @ais-stack/logger
```

## 🚀 Quick Start

```typescript
import { csl } from "@ais-stack/logger";

// Basic usage - just like console, but structured
csl.info("Application started");
csl.debug("User data loaded", { userId: 42, role: "admin" });
csl.warn("Cache miss detected", { key: "user:123" });
csl.error("Database connection failed", new Error("Connection timeout"));
```

**Output (JSON mode):**

```json
{"timestamp":"2026-02-15T12:00:00.000Z","level":"info","message":"Application started"}
{"timestamp":"2026-02-15T12:00:01.000Z","level":"debug","message":"User data loaded","userId":42,"role":"admin"}
{"timestamp":"2026-02-15T12:00:02.000Z","level":"warn","message":"Cache miss detected","key":"user:123"}
{"timestamp":"2026-02-15T12:00:03.000Z","level":"error","message":"Database connection failed","error":{"name":"Error","message":"Connection timeout","stack":"..."}}
```

## 📖 Usage

### Visual Modes

The logger now supports **4 visual modes** optimized for different use cases:

#### 1. PRETTY Mode - For Development

```typescript
import { configure } from "@ais-stack/logger";

configure({
    mode: "pretty",
    emphasisErrors: true,
    alignContext: true,
    showSeparators: true,
});

csl.info("User login", { userId: 42, ip: "192.168.1.10", duration: 12 });
```

**Output:**

```
12:42:31.456  INFO     auth-service     req-abc123
──────────────────────────────────────────────────
User login
  userId       : 42
  ip           : 192.168.1.10
  duration     : 12ms
```

#### 2. COMPACT Mode - For High Volume

```typescript
configure({ mode: "compact" });

csl.info("User login", { userId: 42, duration: 12 });
```

**Output:**

```
12:42:31 INFO auth-service req-abc123 → User login { userId:42, duration:12ms }
```

#### 3. MINIMAL Mode - For CI/CD

```typescript
configure({ mode: "minimal" });

csl.info("Build successful");
csl.warn("Deprecated API used");
csl.error("Deploy failed");
```

**Output:**

```
12:42:31  build-service   ✓ Build successful
12:42:32  api-service     ⚠ Deprecated API used
12:42:33  deploy-service  ✖ Deploy failed
```

#### 4. Error Emphasis - Automatic

Errors are automatically highlighted with special formatting:

```typescript
const error = new Error("Connection timeout");
csl.error("Database failed", error, { host: "localhost", retry: true });
```

**Output:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12:42:33.789  ERROR    db-service     req-xyz789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✖ Database failed

Context
  host         : localhost
  retry        : true

Stack
  at connect (db.ts:45:12)
  at initialize (db.ts:23:5)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**See full visual formatting guide:** `VISUAL_FORMATTING.md`

### Basic Logging

```typescript
import { csl } from "@ais-stack/logger";

// All standard log levels
csl.trace("Very detailed debugging info");
csl.debug("Debugging information");
csl.log("General log message");
csl.info("Informational message");
csl.warn("Warning message");
csl.error("Error message", new Error("Something went wrong"));
csl.fatal("Critical error, application stopping");
```

### Context Management

```typescript
// Create a logger with base context
const logger = csl.withContext({
    service: "auth-service",
    version: "1.2.0",
    environment: "production",
});

logger.info("User login", { userId: 123 });
// → { service: 'auth-service', version: '1.2.0', environment: 'production',
//     level: 'info', message: 'User login', userId: 123 }

// Create child logger (inherits parent context)
const requestLogger = logger.child({ requestId: "req-abc123" });

requestLogger.debug("Processing request", { path: "/api/users" });
// → All parent context + requestId + path
```

### Custom Logger Configuration

```typescript
import {
    createLogger,
    ConsoleTransport,
    FileTransport,
    createAdvancedFormatter,
} from "@ais-stack/logger";

// Shared advanced formatter (pretty mode with visual helpers)
const prettyFormatter = createAdvancedFormatter({
    mode: "pretty",
    emphasisErrors: true,
    alignContext: true,
    showSeparators: true,
    colors: true,
    timestamp: true,
});

const logger = createLogger({
    level: "info",
    context: {
        service: "api",
        version: "1.0.0",
    },
    redact: ["password", "token", "creditCard"],
    formatter: prettyFormatter,
    transports: [
        new ConsoleTransport({ formatter: prettyFormatter }),
        new FileTransport({
            path: "./logs/app.log",
            maxSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
    ],
});

logger.info("Server started", { port: 3000 });
```

### Environment-Based Configuration

```typescript
import { presets, configure } from "@ais-stack/logger";

// Quick presets
const devLogger = presets.development(); // Pretty mode, debug level
const prodLogger = presets.production(); // JSON mode, info level
const compactLogger = presets.compact(); // Compact mode, high volume
const minimalLogger = presets.minimal(); // Minimal mode, ultra clean

// Or configure globally
const env = process.env.NODE_ENV;

configure({
    mode: env === "production" ? "compact" : "pretty",
    emphasisErrors: true,
    alignContext: env !== "production",
    colors: env !== "production",
    flowTracking: env === "development",
});
```

### Global Configuration with `logger.config.ts`

For larger applications, you can centralise all logger settings in a config file.
This file is **auto-chargé** au démarrage grâce au mécanisme d'autoload :

```typescript
// logger.config.ts (ou .js / .mjs / .cjs)
import { defineConfig } from "@ais-stack/logger";

export default defineConfig({
    level: "info",
    mode: "pretty",
    emphasisErrors: true,
    alignContext: true,
    redact: ["password", "token"],

    // Overrides par niveau
    levels: {
        trace: { mode: "minimal" },
        debug: { mode: "minimal" },
        info: { mode: "compact" },
        warn: { mode: "pretty" },
        error: { mode: "pretty", emphasisErrors: true },
        fatal: { mode: "pretty", emphasisErrors: true },
    },

    // Overrides par environnement (NODE_ENV)
    env: {
        production: { mode: "json", level: "warn", colors: false },
        development: { mode: "pretty", level: "debug", colors: true },
        test: { mode: "minimal", level: "error", colors: false },
    },
});
```

Place `logger.config.*` à la racine du projet (ou dans `src/` ou `config/`), puis :

```typescript
// main.ts (point d'entrée)
import "./logger.config"; // une seule fois
import { csl } from "@ais-stack/logger";

csl.info("Server started"); // déjà configuré

// Dans le reste du code
import { csl } from "@ais-stack/logger";
csl.debug("Something happened"); // réutilise la même config globale
```

### Flow Tracking

Visualize request flows across services:

```typescript
configure({
    mode: "pretty",
    flowTracking: true,
});

const requestId = "req-abc123";

csl.info("Request received", { requestId });
csl.info("Auth validated", { requestId });
csl.info("Data fetched", { requestId });
csl.info("Response sent", { requestId });
```

**Output:**

```
12:42:31 INFO   api-gateway   req-abc123
│
├─ Request received
│
├─ Auth validated
│
├─ Data fetched
│
└─ Response sent
```

### Sensitive Data Redaction

```typescript
import { createLogger } from "@ais-stack/logger";

const logger = createLogger({
    redact: ["password", "token", "apiKey", "creditCard", "*.ssn"],
});

logger.info("User registered", {
    username: "john",
    email: "john@example.com",
    password: "secret123", // Will be redacted
    profile: {
        name: "John Doe",
        ssn: "123-45-6789", // Will be redacted (matches *.ssn)
    },
});

// Output:
// {
//   "username": "john",
//   "email": "john@example.com",
//   "password": "[REDACTED]",
//   "profile": {
//     "name": "John Doe",
//     "ssn": "[REDACTED]"
//   }
// }
```

### Error Logging

```typescript
try {
    throw new Error("Database connection failed");
} catch (error) {
    // Error as second parameter
    csl.error("Failed to fetch user", error);

    // Or with additional context
    csl.error("Failed to fetch user", error, { userId: 123, retries: 3 });

    // Or error in context
    csl.error("Failed to fetch user", {
        error,
        userId: 123,
        retries: 3,
    });
}
```

### Express.js Integration

```typescript
import express from "express";
import { csl } from "@ais-stack/logger";
import { randomUUID } from "crypto";

const app = express();

// Request logging middleware
app.use((req, res, next) => {
    const requestId = randomUUID();

    // Create request-scoped logger
    req.logger = csl.child({
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
    });

    req.logger.info("Request started");

    // Log response
    res.on("finish", () => {
        req.logger.info("Request completed", {
            statusCode: res.statusCode,
            duration: Date.now() - req.startTime,
        });
    });

    next();
});

// Use in routes
app.get("/users/:id", async (req, res) => {
    req.logger.debug("Fetching user", { userId: req.params.id });

    try {
        const user = await getUser(req.params.id);
        req.logger.info("User fetched successfully");
        res.json(user);
    } catch (error) {
        req.logger.error("Failed to fetch user", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
```

### Custom Transports

```typescript
import { Transport, LogEntry } from "@ais-stack/logger";

class HttpTransport implements Transport {
    name = "http";
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    async write(entry: LogEntry): Promise<void> {
        await fetch(this.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
        });
    }
}

// Use custom transport
const logger = createLogger({
    transports: [
        new ConsoleTransport(),
        new HttpTransport("https://logs.example.com/ingest"),
    ],
});
```

### Custom Formatters

```typescript
import { Formatter, LogEntry, createLogger } from "@ais-stack/logger";

class CustomFormatter implements Formatter {
    format(entry: LogEntry): string {
        const { timestamp, level, message, ...context } = entry;
        return `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(
            context
        )}`;
    }
}

const logger = createLogger({
    formatter: new CustomFormatter(),
});
```

## 🎯 API Reference

### `csl` - Global Logger

The default logger instance, ready to use out of the box.

```typescript
import { csl } from '@ais-stack/logger';

csl.trace(message, context?, options?);
csl.debug(message, context?, options?);
csl.log(message, context?, options?);
csl.info(message, context?, options?);
csl.warn(message, context?, options?);
csl.error(message, errorOrContext?, context?, options?);
csl.fatal(message, errorOrContext?, context?, options?);
```

### `createLogger(config)` - Create Custom Logger

```typescript
interface LoggerConfig {
    level?: "trace" | "debug" | "log" | "info" | "warn" | "error" | "fatal";
    context?: Record<string, unknown>;
    transports?: Transport[];
    formatter?: Formatter;
    pretty?: boolean;
    redact?: string[];
    maxDepth?: number;
    maxStringLength?: number;
    timestamp?: boolean | "iso" | "epoch";
    errorSerializer?: (error: Error) => Record<string, unknown>;
    async?: boolean;
}
```

### Logger Methods

```typescript
// Logging
logger.trace(
  message: string,
  context?: Record<string, unknown>,
  options?: LogCallOptions,
): void;
logger.debug(
  message: string,
  context?: Record<string, unknown>,
  options?: LogCallOptions,
): void;
logger.log(
  message: string,
  context?: Record<string, unknown>,
  options?: LogCallOptions,
): void;
logger.info(
  message: string,
  context?: Record<string, unknown>,
  options?: LogCallOptions,
): void;
logger.warn(
  message: string,
  context?: Record<string, unknown>,
  options?: LogCallOptions,
): void;
logger.error(
  message: string,
  errorOrContext?: Error | Record<string, unknown>,
  context?: Record<string, unknown>,
  options?: LogCallOptions,
): void;
logger.fatal(
  message: string,
  errorOrContext?: Error | Record<string, unknown>,
  context?: Record<string, unknown>,
  options?: LogCallOptions,
): void;

// Context management
logger.child(context: Record<string, unknown>): Logger;
logger.withContext(context: Record<string, unknown>): Logger;
logger.with(options: LogCallOptions): Logger;

// Configuration
logger.setLevel(level: LogLevelName): void;
logger.getLevel(): LogLevelName;
logger.isLevelEnabled(level: LogLevelName): boolean;

// Lifecycle
logger.flush(): Promise<void>;
logger.close(): Promise<void>;
```

## 🏆 Comparison with Alternatives

| Feature              | @ais-stack/logger | Pino     | Winston |
| -------------------- | ----------------- | -------- | ------- |
| Performance          | ⚡⚡⚡            | ⚡⚡⚡   | ⚡⚡    |
| TypeScript-first     | ✅                | ⚠️       | ⚠️      |
| Zero dependencies    | ✅                | ❌       | ❌      |
| Hierarchical context | ✅                | ✅       | ⚠️      |
| Lazy serialization   | ✅                | ✅       | ❌      |
| Tree-shakable        | ✅                | ⚠️       | ❌      |
| Bundle size          | ~35KB              | ~8KB     | ~50KB   |
| API simplicity       | ⭐⭐⭐⭐⭐        | ⭐⭐⭐⭐ | ⭐⭐⭐  |

## 🔧 Advanced Configuration

### Performance Tuning

```typescript
const logger = createLogger({
    // Async mode - non-blocking writes
    async: true,

    // Limit serialization depth
    maxDepth: 5,

    // Truncate long strings
    maxStringLength: 1000,

    // Disable debug in production
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
});
```

### Elasticsearch Integration

```typescript
const logger = createLogger({
    context: {
        "@timestamp": () => new Date().toISOString(),
        "service.name": "my-service",
        "service.version": "1.0.0",
        "host.name": os.hostname(),
    },
});
```

## 📄 License

MIT © AIS Forge

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📞 Support

-   📧 Email: support@ais-stack.com
-   🐛 Issues: [GitHub Issues](https://github.com/ais-stack/logger/issues)
-   💬 Discussions: [GitHub Discussions](https://github.com/ais-stack/logger/discussions)
