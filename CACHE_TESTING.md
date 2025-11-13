# Cache Testing Guide

This document explains how to test and verify the caching functionality in ssgen.

## Prerequisites

- Server must be running (`deno task dev` or `deno task start`)
- Cache must be enabled (default: `CACHE_ENABLED=true`)

## Quick Verification

### 1. Check Cache Headers

Make multiple requests to the same endpoint and observe cache-related headers:

```bash
# First request - should be a MISS (generates new content)
curl -I http://localhost:8000/about

# Second request - should be a HIT (returns cached content)
curl -I http://localhost:8000/about
```

Look for these headers in the response:
- `X-Cache: MISS` - Content was freshly generated
- `X-Cache: HIT` - Content was served from cache
- `Cache-Control: public, max-age=3600` - Browser/CDN caching directive with TTL in seconds

### 2. Monitor Cache Statistics

Check cache performance via the health endpoint:

```bash
curl http://localhost:8000/health?stats
```

Example response:
```json
{
  "hits": 25,
  "misses": 5,
  "size": 4,
  "hitRate": "83.33%"
}
```

**Metrics explained:**
- `hits`: Number of requests served from cache
- `misses`: Number of requests that required generation
- `size`: Current number of cached entries
- `hitRate`: Percentage of requests served from cache

### 3. Full Request Test

Make complete requests and observe the response time difference:

```bash
# First request (MISS - slower, calls AI)
time curl http://localhost:8000/about > /dev/null

# Second request (HIT - faster, from cache)
time curl http://localhost:8000/about > /dev/null
```

The second request should be significantly faster.

## Testing Cache Configuration

### Test with Cache Disabled

```bash
# Set environment variable to disable cache
export CACHE_ENABLED=false

# Restart server
deno task dev
```

All requests should show `X-Cache: MISS` and statistics should show 0 hits.

### Test with Custom TTL

```bash
# Set cache TTL to 10 seconds
export CACHE_TTL=10

# Restart server
deno task dev

# Make a request
curl http://localhost:8000/about

# Make another request within 10 seconds (should be cached)
curl -I http://localhost:8000/about

# Wait 11 seconds, then make another request (cache should expire)
sleep 11
curl -I http://localhost:8000/about
```

## Testing YAML-Based Cache Configuration

You can configure caching per content file using YAML front matter:

### Test with Disabled Cache

Create a test file `content/no-cache-test.md`:

```markdown
---
title: "No Cache Test"
cache:
  enabled: false
---

# This page should not be cached
Current time will vary on each request.
```

Test it:

```bash
# Multiple requests should all be cache MISS
curl -I http://localhost:8000/no-cache-test
curl -I http://localhost:8000/no-cache-test

# Check Cache-Control header - should be "no-cache, no-store, must-revalidate"
```

### Test with Custom TTL

Create a test file `content/short-cache-test.md`:

```markdown
---
title: "Short Cache Test"
cache:
  ttl: 30  # 30 seconds
---

# This page caches for only 30 seconds
```

Test it:

```bash
# First request - MISS
curl -I http://localhost:8000/short-cache-test

# Second request within 30 seconds - HIT
curl -I http://localhost:8000/short-cache-test

# Check Cache-Control header - should be "public, max-age=30"

# Wait 31 seconds, then request again - MISS
sleep 31
curl -I http://localhost:8000/short-cache-test
```

## Testing Different Cache Keys

The cache creates unique keys based on:
- Pathname
- Content
- User prompt
- System prompt
- Model name
- Style configuration

Test that different parameters create different cache entries:

```bash
# Request 1: Default model
curl http://localhost:8000/about

# Request 2: Different model (should be a MISS)
curl "http://localhost:8000/about?model=gemini-2.5-pro"

# Request 3: With custom prompt (should be a MISS)
curl "http://localhost:8000/about?prompt=Make+it+colorful"

# Check cache stats to see multiple entries
curl http://localhost:8000/health?stats
```

## Automated Testing

Run the Deno tests to verify cache functionality:

```bash
deno test --allow-read --allow-write --allow-env src/utils/cache_test.ts
```

## Monitoring in Production

### Check Cache Performance

Periodically query the stats endpoint to monitor cache effectiveness:

```bash
# Check stats every minute
watch -n 60 'curl -s http://localhost:8000/health?stats'
```

### Expected Results

For typical usage patterns:
- **Hit rate**: Should be > 70% for stable content
- **Size**: Should stabilize based on TTL and request patterns
- **Misses**: Should increase gradually with new content/parameters

### Troubleshooting

**Low hit rate (< 30%)**
- Content is changing frequently
- Many unique parameter combinations
- TTL may be too short
- Consider increasing `CACHE_TTL`

**Growing cache size**
- Many unique requests
- TTL is very long
- Cleanup may not be running frequently enough
- Consider reducing `CACHE_TTL`

**No cache hits (0%)**
- Cache may be disabled (`CACHE_ENABLED=false`)
- Server restarts frequently (cache is in-memory)
- Every request has unique parameters
- Check logs for cache key patterns

## Performance Benchmarks

Expected performance improvements with caching:

| Metric | Without Cache | With Cache | Improvement |
|--------|---------------|------------|-------------|
| Response Time | 1-3 seconds | < 50ms | 20-60x faster |
| API Calls | Every request | Once per TTL | Reduced by hit rate |
| Cost | Full for each | Minimal | Significant savings |

## Notes

- Cache is **in-memory** and will reset on server restart
- Cache cleanup runs automatically every 5 minutes
- Expired entries are removed during cleanup or on access
- Cache key includes all parameters that affect output
- Streaming is disabled for cached responses (returns complete HTML)
