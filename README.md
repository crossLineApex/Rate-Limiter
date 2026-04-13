# Rate-Limiter

A **fixed window rate-limiting middleware** for Express.js that protects API endpoints from excessive requests using an in-memory store. This implementation tracks requests per IP address and path, resetting the counter at fixed time intervals.

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

- ✅ **Fixed Window Rate Limiting** — Resets request counts at fixed time intervals
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

The rate limiter uses a **fixed window algorithm** with the following logic:

1. **Client Identification** — Extracts the client's IP address from `req.ip`
2. **Unique Key Generation** — Creates a unique key combining IP and path: `${ip}:${path}`
3. **Window Calculation** — Determines the current time window:
   ```
   WINDOW = floor(currentTime / WINDOW_SIZE_IN_SECONDS)
   ```
4. **Request Tracking** — Stores request count and window in the in-memory `store` object
5. **Window Reset** — When the window changes, resets the counter to 1
6. **Verification** — If requests exceed `MAX_REQUEST`, returns `429` status; otherwise, allows request

### Example Timeline

With `WINDOW_SIZE_IN_SECONDS: 10` and `MAX_REQUEST: 5`:

```
Time (seconds) | Window | IP 127.0.0.1:/ Count | Action
0-2            | 0      | 1, 2, 3             | ✅ Allowed
3-5            | 0      | 4, 5                | ✅ Allowed
6              | 0      | 6                   | ❌ Rejected (too many)
10             | 1      | 1                   | ✅ Allowed (window reset)
```

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

⚠️ **Boundary Burst Problem** — User can do 100 requests at 12:00:59
+ 100 requests at 12:01:00, 200 requests in ~1 second

⚠️ **In-Memory Storage** — Request data is stored in memory and will be lost on server restart. Not suitable for distributed systems.

⚠️ **Single Server Only** — Designed for single-instance deployments. For distributed systems, consider using external stores (Redis).

⚠️ **Same IP Tracking** — Behind proxies/load balancers, use `req.headers['x-forwarded-for']` instead of `req.ip` for accurate client tracking.

## Future Enhancements

- [ ] Redis integration for distributed rate limiting
- [ ] Sliding window algorithm option
- [ ] Per-user limits in addition to IP-based
- [ ] Customizable rate limit headers in responses
- [ ] Whitelist/blacklist functionality
- [ ] Rate limit analytics and monitoring

## License

ISC

---

**Author:** aaryal  
**Repository:** [crossLineApex/Rate-Limiter](https://github.com/crossLineApex/Rate-Limiter)
