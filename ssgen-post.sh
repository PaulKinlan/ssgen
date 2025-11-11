#!/usr/bin/env bash

# ssgen-post.sh - A helper script to make POST requests to the ssgen service easier
#
# Usage:
#   ./ssgen-post.sh [OPTIONS]
#
# Options:
#   -c, --content <text>         Markdown content (or use -f to read from file)
#   -f, --file <path>            Read content from a file (e.g., examples/sample-content.md)
#   -p, --prompt <text>          User prompt for the LLM
#   -s, --system-prompt <text>   System prompt to configure LLM behavior
#   -m, --model <name>           Model to use (default: gemini-2.5-flash)
#   -u, --url <url>              Server URL (default: http://localhost:8000/)
#   -o, --output <file>          Save output to file instead of stdout
#   -h, --help                   Show this help message
#
# Examples:
#   # Use content from a file
#   ./ssgen-post.sh -f examples/sample-content.md
#
#   # Provide inline content
#   ./ssgen-post.sh -c "# Hello World\n\nThis is my content."
#
#   # Custom prompt
#   ./ssgen-post.sh -f examples/blog-post.md -p "Create a modern blog layout"
#
#   # Full customization
#   ./ssgen-post.sh -f examples/sample-content.md \
#     -s "You are a web design expert" \
#     -p "Create a portfolio page with Tailwind CSS"
#
#   # Use a different model
#   ./ssgen-post.sh -f examples/sample-content.md -m "gemini-2.5-pro"
#
#   # Save output to file
#   ./ssgen-post.sh -f examples/sample-content.md -o output.html

set -e

# Default values
URL="http://localhost:8000/"
CONTENT=""
FILE=""
PROMPT=""
SYSTEM_PROMPT=""
MODEL=""
OUTPUT=""

# Function to display help
show_help() {
    grep '^#' "$0" | grep -v '#!/usr/bin/env bash' | sed 's/^# //' | sed 's/^#//'
}

# Function to read file content
read_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        echo "Error: File '$file' not found" >&2
        exit 1
    fi
    cat "$file"
}

# Function to escape JSON string
escape_json() {
    local string="$1"
    # Use jq to properly escape the string
    echo -n "$string" | jq -Rs .
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--content)
            CONTENT="$2"
            shift 2
            ;;
        -f|--file)
            FILE="$2"
            shift 2
            ;;
        -p|--prompt)
            PROMPT="$2"
            shift 2
            ;;
        -s|--system-prompt)
            SYSTEM_PROMPT="$2"
            shift 2
            ;;
        -m|--model)
            MODEL="$2"
            shift 2
            ;;
        -u|--url)
            URL="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Error: Unknown option '$1'" >&2
            echo "Use -h or --help for usage information" >&2
            exit 1
            ;;
    esac
done

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed." >&2
    echo "Please install jq: https://stedolan.github.io/jq/" >&2
    exit 1
fi

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed." >&2
    exit 1
fi

# Read content from file if specified
if [ -n "$FILE" ]; then
    if [ -n "$CONTENT" ]; then
        echo "Error: Cannot specify both -c/--content and -f/--file" >&2
        exit 1
    fi
    CONTENT=$(read_file "$FILE")
fi

# Check if content is provided
if [ -z "$CONTENT" ]; then
    echo "Error: Content is required. Use -c or -f option." >&2
    echo "Use -h or --help for usage information" >&2
    exit 1
fi

# Build JSON payload
JSON_PAYLOAD="{"
JSON_PAYLOAD+="\"content\": $(escape_json "$CONTENT")"

if [ -n "$PROMPT" ]; then
    JSON_PAYLOAD+=", \"prompt\": $(escape_json "$PROMPT")"
fi

if [ -n "$SYSTEM_PROMPT" ]; then
    JSON_PAYLOAD+=", \"systemPrompt\": $(escape_json "$SYSTEM_PROMPT")"
fi

if [ -n "$MODEL" ]; then
    JSON_PAYLOAD+=", \"model\": $(escape_json "$MODEL")"
fi

JSON_PAYLOAD+="}"

# Make the POST request
if [ -n "$OUTPUT" ]; then
    # Save to file
    echo "Sending request to $URL..." >&2
    echo "Saving output to $OUTPUT..." >&2
    curl -X POST "$URL" \
        -H "Content-Type: application/json" \
        -d "$JSON_PAYLOAD" \
        -o "$OUTPUT" \
        -w "\nHTTP Status: %{http_code}\n" >&2
    echo "Done! Output saved to $OUTPUT" >&2
else
    # Output to stdout
    curl -N -X POST "$URL" \
        -H "Content-Type: application/json" \
        -d "$JSON_PAYLOAD"
fi
