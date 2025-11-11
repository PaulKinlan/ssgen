# Quick Start Guide

Get up and running with ssgen in 5 minutes!

## Step 1: Prerequisites

Install Deno:
```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex
```

Get a Google AI API Key:
1. Visit [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Create a new API key
4. Copy your API key

## Step 2: Setup

```bash
# Clone the repository
git clone https://github.com/PaulKinlan/ssgen.git
cd ssgen

# Create .env file with your API key
echo "GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here" > .env
```

## Step 3: Start the Server

```bash
deno task dev
```

You should see:
```
Server starting on port 8000...
Local: http://localhost:8000
```

## Step 4: Test It!

Open another terminal and try:

```bash
# Test the health endpoint
curl http://localhost:8000/health

# Generate content with default markdown
curl http://localhost:8000/

# Generate content with custom markdown
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# My First Page\n\nHello from ssgen!",
    "prompt": "Create a beautiful HTML page from this markdown"
  }'
```

## Step 5: Try the Examples

```bash
# Use the provided test script
./test-requests.sh
```

## What's Next?

- Read [USAGE.md](./USAGE.md) for detailed examples
- Check [README.md](./README.md) for full documentation
- Customize prompts and content for your use case
- Deploy to Deno Deploy (see README.md)

## Common Issues

### "API key not valid"
Make sure your `.env` file has the correct API key:
```bash
cat .env
# Should show: GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key
```

### "Command not found: deno"
Add Deno to your PATH:
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/.deno/bin:$PATH"
```

### Port already in use
Change the port in `.env`:
```bash
echo "PORT=3000" >> .env
```

## Need Help?

- Check the [README](./README.md) for detailed documentation
- Review [USAGE.md](./USAGE.md) for more examples
- Open an issue on GitHub

Happy generating! 🚀
