# cfrok

Tiny ngrok-like CLI and Node.js library powered by cloudflared.

## Global Installation

Install globally from GitHub:

```bash
npm install -g https://github.com/yourusername/cfrok.git
```

After installation, use anywhere:

```bash
cfrok 3000 api
cfrok http 5173 ui --domain yourdomain.com
```

## Local Development

1) Clone and install:

```bash
git clone https://github.com/yourusername/cfrok.git
cd cfrok
bun install
bun run build
```

2) Test locally:

```bash
node dist/cli.js 3000 api
```

## Usage Examples

```bash
# Simple usage (positional arguments)
cfrok 3000 api                    # http://api-1234.dreamteamit.xyz
cfrok http 5173 ui               # http://ui-5678.dreamteamit.xyz
cfrok tcp 22 ssh                 # tcp://ssh-9012.dreamteamit.xyz

# Static subdomain (no random suffix)
cfrok 3000 api --static          # http://api.dreamteamit.xyz
cfrok http 8080 webapp --static  # http://webapp.dreamteamit.xyz

# With options
cfrok 3000 --prefix api --domain mydomain.com
cfrok http 8080 --prefix webapp --tunnel my-tunnel --cred ~/.cloudflared/creds.json

# Quiet mode (no logs)
cfrok 3000 api --quiet

# JSON output (for scripts)
cfrok 3000 api --json
```

## Programmatic API

```ts
import { startTunnel } from 'cfrok';

const { url, stop } = await startTunnel({
  port: 3000,
  subdomainPrefix: 'api',
  domain: 'dreamteamit.xyz',
  tunnelId: 'my-tunnel',
  credentialsFile: '~/.cloudflared/your-tunnel-credentials.json'
});

console.log(url);
// await stop(); // when done
```

## Requirements
- `cloudflared` installed and available in PATH
- A named tunnel already set up with Cloudflare
- Credentials file for the tunnel

## Features
- 🎨 Beautiful colored output
- 🔇 Smart log filtering (hides cloudflared noise)
- 📦 Global installation support
- 🚀 Fast startup with connection detection
- 🔧 Both CLI and programmatic API
- 📱 Supports both HTTP and TCP tunnels
