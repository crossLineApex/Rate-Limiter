# Rate-Limiter

A **sliding window rate-limiting middleware** for Express.js that protects API endpoints from excessive requests using an in-memory store. This implementation tracks request timestamps per IP address and path, dynamically adjusting limits based on a rolling time window.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Running the Server](#running-the-server)
- [License](#license)

## Features

- ✅ **Sliding Window Rate Limiting** — Tracks requests within a rolling time window for precise rate limiting
- ✅ **Burst Protection** — Prevents simultaneous request bursts across window boundaries
- ✅ **IP-based Tracking** — Identifies clients using their IP address
- ✅ **Path-aware Limiting** — Different limits can be applied per endpoint
- ✅ **In-memory Storage** — Fast, lightweight request tracking without external dependencies
- ✅ **Configurable Limits** — Easy to adjust window size and max requests
- ✅ **Standard HTTP Status** — Returns `429 Too Many Requests` when limit exceeded
- ✅ **Error Handling** — Graceful error handling with descriptive messages

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/crossLineApex/Rate-Limiter.git
   cd Rate-Limiter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Rate limiting settings are managed in [`config/rateLimiterConfig.js`](config/rateLimiterConfig.js):

```javascript
module.exports = {
    WINDOW_SIZE_IN_SECONDS: 10,  // Time window in seconds
    MAX_REQUEST: 5               // Maximum requests per window
}
```

**Example:** With the default configuration, each IP can make a maximum of **5 requests every 10 seconds** per endpoint.

## Usage

### Applying Rate Limiter to Routes

Import the middleware and apply it to your routes in [`routes/apiRoutes.js`](routes/apiRoutes.js):

```javascript
const express = require('express');
const router = express.Router();
const rateLimiter = require('../middlewares/rateLimiter.js');

// Apply rate limiter to specific route
router.get('/data', rateLimiter, (req, res) => {
    res.json({
        success: true,
        message: 'Request successful'
    });
});

module.exports = router;
```

### Applying Rate Limiter to All Routes

To apply the middleware globally in [`index.js`](index.js):

```javascript
const rateLimiter = require('./middlewares/rateLimiter.js');

app.use(rateLimiter);  // Apply to all routes
app.use('/api', apiRoutes);
```

## API Endpoints

### GET `/api/data`

Retrieves data with rate limiting protection.

**Request:**
```bash
curl http://localhost:4040/api/data
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Request successful"
}
```

**Rate Limited Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

**Server Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Rate limiter error"
}
```

## How It Works

The rate limiter uses a **sliding window algorithm** that maintains a history of request timestamps. Here's the process:

1. **Client Identification** — Extracts the client's IP address from `req.ip`
2. **Unique Key Generation** — Creates a unique key combining IP and path: `${ip}:${path}`
3. **Timestamp Filtering** — Removes timestamps older than the window from the request history:
   ```javascript
   store[key].timestamp = store[key].timestamp.filter(t => currentTime - t < WINDOW_SIZE_IN_SECONDS)
   ```
4. **Capacity Check** — Evaluates if the current request count within the window has reached `MAX_REQUEST`
5. **Request Decision** — If within limit, adds current timestamp and allows the request; otherwise, rejects with `429`

### Example Timeline

With `WINDOW_SIZE_IN_SECONDS: 10` and `MAX_REQUEST: 5`:

```
Time (s) | Client IP  | Action                          | Timestamps in Window (10s)
0        | 127.0.0.1  | Request 1 allowed              | [0]
2        | 127.0.0.1  | Request 2 allowed              | [0, 2]
4        | 127.0.0.1  | Request 3 allowed              | [0, 2, 4]
6        | 127.0.0.1  | Request 4 allowed              | [0, 2, 4, 6]
8        | 127.0.0.1  | Request 5 allowed              | [0, 2, 4, 6, 8]
9        | 127.0.0.1  | Request 6 REJECTED (at limit)  | [0, 2, 4, 6, 8]
11       | 127.0.0.1  | Request 7 allowed (0 older)    | [2, 4, 6, 8, 11]
12       | 127.0.0.1  | Request 8 allowed (2 older)    | [4, 6, 8, 11, 12]
```

### Key Advantages Over Fixed Window

- **No Burst at Boundaries** — Prevents 2× request spikes at window edges (e.g., requests at 9:59.9s and 10:00.1s)
- **Precise Limiting** — Enforces limits based on actual rolling time, not artificial boundaries
- **Fair Resource Distribution** — Distributes requests evenly across the time window

## Project Structure

```
Rate-Limiter/
├── index.js                          # Express server entry point
├── package.json                      # Project dependencies & metadata
├── config/
│   └── rateLimiterConfig.js          # Rate limiter configuration
├── middlewares/
│   └── rateLimiter.js                # Rate limiting middleware logic
├── routes/
│   └── apiRoutes.js                  # API route definitions
└── utils/
    └── timeUtils.js                  # Utility functions (time helpers)
```

### File Descriptions

| File | Purpose |
|------|---------|
| [`index.js`](index.js) | Initializes Express server and mounts routes |
| [`config/rateLimiterConfig.js`](config/rateLimiterConfig.js) | Centralized configuration for rate limiting parameters |
| [`middlewares/rateLimiter.js`](middlewares/rateLimiter.js) | Core rate limiting logic and middleware implementation |
| [`routes/apiRoutes.js`](routes/apiRoutes.js) | API endpoint definitions with middleware integration |
| [`utils/timeUtils.js`](utils/timeUtils.js) | Helper functions for time-related operations |

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on the configured port (default: `4040`) and automatically restart when files change.

### Production Mode

```bash
node index.js
```

### Environment Variables

- `PORT` — Server port (default: `4040`)

**Example:**
```bash
PORT=3000 node index.js
```

### Testing Rate Limiting

Make multiple rapid requests to test the rate limiter:

```bash
# Linux/Mac
for i in {1..10}; do curl http://localhost:4040/api/data; done

# Windows PowerShell
1..10 | ForEach-Object { curl http://localhost:4040/api/data }
```

You should see responses allowed up to `MAX_REQUEST`, then `429` responses until the window resets.

## Limitations & Considerations

⚠️ **In-Memory Storage** — Request data is stored in memory and will be lost on server restart. Not suitable for distributed systems.

⚠️ **Single Server Only** — Designed for single-instance deployments. For distributed systems, consider using external stores (Redis).

⚠️ **Memory Growth** — Timestamp arrays grow proportionally with request volume. High-traffic endpoints may accumulate memory over time.

⚠️ **Same IP Tracking** — Behind proxies/load balancers, use `req.headers['x-forwarded-for']` instead of `req.ip` for accurate client tracking.

## Future Enhancements

- [ ] Redis integration for distributed rate limiting
- [ ] Per-user limits in addition to IP-based
- [ ] Customizable rate limit headers in responses
- [ ] Whitelist/blacklist functionality
- [ ] Rate limit analytics and monitoring
- [ ] Memory optimization for high-traffic scenarios
- [ ] Leaky bucket algorithm option

## License

ISC

---

**Author:** aaryal  
**Repository:** [crossLineApex/Rate-Limiter](https://github.com/crossLineApex/Rate-Limiter)
