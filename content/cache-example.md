---
title: "Cache Configuration Example"
description: "Demonstrates per-content cache configuration"
cache:
  enabled: true
  ttl: 7200  # Cache for 2 hours
---

# Cache Configuration Example

This page demonstrates how to configure caching using YAML front matter.

## Configuration

This page is configured with:
- **Cache Enabled**: Yes
- **Cache TTL**: 7200 seconds (2 hours)

## How It Works

The YAML front matter at the top of this file includes:

```yaml
cache:
  enabled: true
  ttl: 7200
```

This means:
- Content will be cached for 2 hours after first generation
- Subsequent requests within 2 hours will be served from cache
- Response includes `Cache-Control: public, max-age=7200` header
- After 2 hours, content will be regenerated on next request

## Testing

Check the cache headers:

```bash
curl -I http://localhost:8000/cache-example
```

You should see:
- `X-Cache: HIT` or `X-Cache: MISS`
- `Cache-Control: public, max-age=7200`
