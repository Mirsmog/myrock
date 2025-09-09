# cfrok

Tiny ngrok-like CLI and Node.js library powered by cloudflared.

## Quick start

1) Install deps and build

```bash
bun install
bun run build
```

2) Run a tunnel to local port 3000

```bash
node dist/cli.js http 3000 --prefix api \
  --domain dreamteamit.xyz \
  --tunnel my-tunnel \
  --cred ~/.cloudflared/your-tunnel-credentials.json
```

It will create a subdomain like `api-1234.dreamteamit.xyz` and start cloudflared.

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

## Notes
- Requires `cloudflared` installed and a named tunnel already set up.
- The tool writes a per-run config into `~/.cloudflared/config_<prefix>_<port>.yml`.
- DNS is routed via `cloudflared tunnel route dns <tunnelId> <subdomain>` and we wait a couple seconds for propagation.
