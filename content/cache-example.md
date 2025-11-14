---
title: "Cache Configuration Example"
description: "Demonstrates Cache-Control header configuration"
cache:
  enabled: true
  ttl: 7200  # Cache for 2 hours
---

# Cache Configuration Example

This page demonstrates how to configure Cache-Control headers using YAML front matter.

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

This means responses will include the header:
```
Cache-Control: public, max-age=7200
```

This allows browsers and CDNs to cache this page for 2 hours.

## Testing

Check the cache headers:

```bash
curl -I http://localhost:8000/cache-example
```

You should see:
- `Cache-Control: public, max-age=7200`

## Use Cases

- **Static content**: Set long TTL (e.g., 86400 for 24 hours)
- **Frequently updated**: Set short TTL (e.g., 300 for 5 minutes)
- **Dynamic/real-time**: Set `enabled: false`
