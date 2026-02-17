# @ais-forge/logger - Architecture & Design

## 🎯 Vue d'ensemble

Un logger performant, structuré et extensible pour Node.js, optimisé pour les microservices et les environnements cloud-native.

## 📐 Architecture

```
@ais-forge/logger/
├── src/
│   ├── core/
│   │   ├── logger.ts          # Classe Logger principale
│   │   ├── levels.ts          # Définition des niveaux
│   │   └── formatter.ts       # Formatage des logs
│   ├── transports/
│   │   ├── console.ts         # Transport console
│   │   ├── file.ts            # Transport fichier
│   │   └── http.ts            # Transport HTTP
│   ├── utils/
│   │   ├── serializer.ts      # Sérialisation optimisée
│   │   ├── redactor.ts        # Masquage données sensibles
│   │   └── performance.ts     # Utilitaires performance
│   ├── types.ts               # Types TypeScript
│   └── index.ts               # Point d'entrée
├── package.json
├── tsconfig.json
└── README.md
```

## 🔑 Concepts clés

### 1. Logger hiérarchique

```typescript
// Logger parent
const rootLogger = createLogger({ service: 'api' });

// Logger enfant hérite du contexte parent
const requestLogger = rootLogger.child({ requestId: 'abc123' });

// Contexte fusionné automatiquement
requestLogger.info('Request processed');
// → { service: 'api', requestId: 'abc123', message: '...' }
```

### 2. Lazy Serialization

Les objets ne sont sérialisés que si le niveau de log est actif :

```typescript
// Si debug est désactivé, l'objet complexe n'est jamais sérialisé
logger.debug('Heavy data', expensiveObject);
```

### 3. Transports modulaires

Plusieurs destinations simultanées :

```typescript
const logger = createLogger({
  transports: [
    new ConsoleTransport({ pretty: true }),
    new FileTransport({ path: './logs/app.log' }),
    new HttpTransport({ url: 'https://logs.example.com' })
  ]
});
```

### 4. Typage fort

```typescript
// Le contexte est typé
interface UserContext {
  userId: number;
  role: string;
}

const logger = createLogger<UserContext>();
logger.info('Action', { userId: 123, role: 'admin' }); // ✅
logger.info('Action', { foo: 'bar' }); // ❌ Type error
```

## 🏗️ Design Patterns utilisés

### Builder Pattern
Pour la configuration flexible du logger

### Chain of Responsibility
Pour les transports (chaque transport traite le log)

### Strategy Pattern
Pour les formatters (JSON, Pretty, Custom)

### Singleton Pattern (optionnel)
Pour le logger global par défaut

## ⚡ Optimisations de performance

1. **Niveau de log check précoce** : Évite toute opération si le niveau n'est pas actif
2. **Object pooling** : Réutilisation d'objets pour réduire la GC
3. **Async transports** : Les écritures ne bloquent pas le thread principal
4. **Batch writing** : Regroupement des logs pour réduire les I/O
5. **Fast JSON serialization** : Utilisation de fast-json-stringify si nécessaire

## 🔒 Sécurité

### Redaction automatique

```typescript
const logger = createLogger({
  redact: ['password', 'token', 'creditCard', '*.ssn']
});

logger.info('User data', {
  username: 'john',
  password: 'secret123' // → sera masqué
});
// Output: { username: 'john', password: '[REDACTED]' }
```

### Sanitization

- Suppression des références circulaires
- Limitation de la profondeur de sérialisation
- Troncature des chaînes trop longues

## 🌍 Support multi-environnement

```typescript
const logger = createLogger({
  env: process.env.NODE_ENV,
  levels: {
    development: 'debug',
    staging: 'info',
    production: 'warn'
  }
});
```

## 📊 Intégrations

### Elasticsearch / OpenSearch
```json
{
  "@timestamp": "2026-02-15T12:00:00.000Z",
  "level": "info",
  "message": "User login",
  "service.name": "auth-service",
  "trace.id": "abc123"
}
```

### Datadog
```json
{
  "timestamp": 1708002000000,
  "status": "info",
  "message": "User login",
  "service": "auth-service",
  "ddtags": "env:prod,version:1.2.0"
}
```

### Grafana Loki
```json
{
  "streams": [{
    "stream": { "service": "auth-service", "level": "info" },
    "values": [["1708002000000000000", "User login"]]
  }]
}
```

## 🧪 Comparaison avec l'existant

| Feature | @ais-forge/logger | Pino | Winston |
|---------|------------------|------|---------|
| Performance | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ |
| TypeScript-first | ✅ | ⚠️ | ⚠️ |
| Contexte hiérarchique | ✅ | ✅ | ⚠️ |
| Lazy serialization | ✅ | ✅ | ❌ |
| Tree-shakable | ✅ | ⚠️ | ❌ |
| Taille bundle | ~5KB | ~8KB | ~50KB |
| Dépendances | 0-2 | ~5 | ~15 |
| API moderne | ✅ | ⚠️ | ❌ |

### Avantages vs Pino
- API plus intuitive (`csl` vs `pino()`)
- Meilleur support TypeScript
- Plus flexible pour les transports custom
- Contexte plus ergonomique

### Avantages vs Winston
- Beaucoup plus léger et rapide
- API moderne (pas de callbacks)
- Meilleure performance
- Zero config par défaut

## 🎨 Philosophie de design

1. **Zero config** : Fonctionne out-of-the-box
2. **Progressive enhancement** : Fonctionnalités avancées opt-in
3. **Developer experience** : API claire et prévisible
4. **Production ready** : Performance et fiabilité
5. **Extensible** : Facile d'ajouter des transports/formatters custom

## 📦 Distribution

- ESM et CommonJS
- Types TypeScript inclus
- Tree-shakable (side-effects: false)
- Builds séparés pour chaque niveau
- Source maps disponibles
