# Qera TypeScript Backend Framework

A high-performance TypeScript backend framework built on uWebSockets.js, designed to match Go's performance while providing full TypeScript support.

## Features

- ⚡ **Ultra-fast performance** - Built on uWebSockets.js
- 🛡️ **Type-safe** - Full TypeScript support
- 🔌 **Plugin system** - Modular architecture
- 🚀 **Zero dependencies** - Except uWebSockets.js
- 🔒 **Security built-in** - CORS, Helmet, Rate limiting
- 📝 **Validation** - Built-in Zod-like validation
- 🔐 **JWT support** - Authentication made easy
- 📊 **Logging** - Structured logging system
- 🔄 **Hot reload** - Development mode auto-restart
- 📁 **File upload** - Multipart form support
- 🗜️ **Compression** - Gzip/Deflate support

## Installation

```bash
npm install qera
```

## Quick Start

```typescript
import { createApp, CorsPlugin, HelmetPlugin } from 'qera';

const app = createApp();

// Add plugins
app.plugin(new CorsPlugin());
app.plugin(new HelmetPlugin());

// Define routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Plugins

### CORS
```typescript
app.plugin(new CorsPlugin({
  origin: ['http://localhost:3000'],
  credentials: true
}));
```

### Helmet (Security)
```typescript
app.plugin(new HelmetPlugin({
  contentSecurityPolicy: "default-src 'self'",
  hsts: { maxAge: 31536000 }
}));
```

### JWT Authentication
```typescript
app.plugin(new JwtPlugin('your-secret-key'));

// Sign token
const token = app.jwt.sign({ userId: 1 }, { expiresIn: '1h' });

// Verify token
const payload = app.jwt.verify(token);
```

### Validation
```typescript
app.plugin(new ValidatorPlugin());

const schema = {
  name: { type: 'string', required: true, min: 2 },
  email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
};

app.post('/users', (req, res) => {
  try {
    app.validate(req.body, schema);
    // Process valid data
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Rate Limiting
```typescript
app.plugin(new RateLimiterPlugin({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100
}));
```

## Advanced Features

### File Upload
```typescript
app.post('/upload', (req, res) => {
  const files = req.body.files;
  // Handle uploaded files
});
```

### Environment Variables
```typescript
const port = app.env.get('PORT', '3000');
```

### Custom Middleware
```typescript
app.use(async (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

## Performance

This framework is designed to deliver exceptional performance:
- Built on uWebSockets.js (fastest WebSocket implementation)
- Zero-copy where possible
- Minimal memory allocations
- Optimized request/response handling

## License

MIT