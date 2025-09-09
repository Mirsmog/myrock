#!/usr/bin/env node
import mri from 'mri';
import process from 'process';
import path from 'path';
import { startTunnel } from './index';

function printUsage(): void {
  console.log(`
Usage:
  cfrok http <port> --prefix <name> [options]
  cfrok <port> --prefix <name> [options]

Options:
  --prefix, -p        Subdomain prefix (required)
  --domain, -d        Base domain (default: dreamteamit.xyz)
  --tunnel            Named tunnel ID (default: my-tunnel)
  --cred              Credentials file path (~/.cloudflared/xxx.json)
  --configDir         Config directory (default: ~/.cloudflared)
  --bin               cloudflared binary (default: cloudflared)
  --dns-wait          Seconds to wait after DNS route (default: 2)
  --json              Print machine-readable JSON output
  --quiet             Suppress cloudflared logs (still runs)

Examples:
  cfrok http 3000 --prefix api
  cfrok 5173 -p ui --domain dreamteamit.xyz
`);
}

(async () => {
  const argv = mri(process.argv.slice(2), {
    string: ['prefix', 'domain', 'tunnel', 'cred', 'bin', 'configDir', 'dns-wait'],
    boolean: ['json', 'quiet'],
    alias: { p: 'prefix', d: 'domain' },
    default: {
      domain: 'dreamteamit.xyz',
      tunnel: 'my-tunnel',
      json: false,
      quiet: false,
      'dns-wait': '2'
    }
  });

  const args = argv._;
  let portStr: string | undefined;
  let protocol: 'http' | 'tcp' = 'http';
  if (args.length >= 2 && (args[0] === 'http' || args[0] === 'tcp')) {
    protocol = args[0] as 'http' | 'tcp';
    portStr = String(args[1]);
  } else if (args.length >= 1) {
    portStr = String(args[0]);
  }

  if (!portStr) {
    printUsage();
    process.exit(1);
  }

  const port = Number(portStr);
  if (!Number.isFinite(port)) {
    console.error('Invalid port');
    process.exit(1);
  }

  let prefix: string | undefined = argv.prefix || argv.p;
  if (!prefix) {
    // positional fallback: cfrok 3000 api OR cfrok http 3000 api
    if (args.length >= 3 && (args[0] === 'http' || args[0] === 'tcp')) {
      prefix = String(args[2]);
    } else if (args.length >= 2) {
      prefix = String(args[1]);
    }
  }

  if (!prefix) {
    console.error('Missing required prefix. Pass --prefix or as positional argument.');
    printUsage();
    process.exit(1);
  }

  try {
    const started = await startTunnel({
      port,
      subdomainPrefix: String(prefix),
      domain: String(argv.domain),
      tunnelId: String(argv.tunnel),
      credentialsFile: argv.cred ? String(argv.cred) : undefined,
      configDir: argv.configDir ? String(argv.configDir) : undefined,
      dnsWaitSeconds: Number(argv['dns-wait']),
      cloudflaredBin: argv.bin ? String(argv.bin) : 'cloudflared',
      protocol
    });

    if (argv.json) {
      console.log(JSON.stringify({
        url: started.url,
        subdomain: started.subdomain,
        configFile: started.configFile,
        pid: started.process.pid
      }));
    } else {
      console.log(`URL: ${started.url}`);
      console.log(`Config: ${started.configFile}`);
      console.log('Press Ctrl+C to stop...');
    }

    if (!argv.quiet) {
      started.process.stdout.on('data', (d: Buffer) => process.stdout.write(d));
      started.process.stderr.on('data', (d: Buffer) => process.stderr.write(d));
    }

    const stop = async () => {
      await started.stop();
      process.exit(0);
    };

    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  } catch (err: any) {
    console.error(err?.message || String(err));
    process.exit(1);
  }
})();
