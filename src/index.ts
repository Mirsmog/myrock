import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import readline from 'readline';
import { buildConfigContent, ensureDirectoryExists, expandTilde, generateRandomDigits, sanitizeSubdomainPrefix, sleep, spawnOnce } from './utils';

export interface StartTunnelOptions {
  port: number;
  subdomainPrefix: string;
  domain?: string;
  tunnelId?: string;
  credentialsFile?: string;
  randomDigits?: number;
  configDir?: string;
  dnsWaitSeconds?: number;
  cloudflaredBin?: string;
  protocol?: 'http' | 'tcp';
}

export interface StartedTunnel {
  url: string;
  subdomain: string;
  configFile: string;
  process: ChildProcessWithoutNullStreams;
  stop: () => Promise<void>;
}

function getDefaultCredentialsFile(): string {
  const home = os.homedir();
  return path.join(home, '.cloudflared', 'c656547d-1502-4922-995f-3bac3bc58b07.json');
}

export async function startTunnel(options: StartTunnelOptions): Promise<StartedTunnel> {
  const {
    port,
    subdomainPrefix,
    domain = 'dreamteamit.xyz',
    tunnelId = 'my-tunnel',
    credentialsFile = getDefaultCredentialsFile(),
    randomDigits = 4,
    configDir = path.join(os.homedir(), '.cloudflared'),
    dnsWaitSeconds = 2,
    cloudflaredBin = 'cloudflared',
    protocol = 'http'
  } = options;

  if (!port || !Number.isFinite(port)) {
    throw new Error('Invalid port');
  }
  if (!subdomainPrefix) {
    throw new Error('subdomainPrefix is required');
  }

  const safePrefix = sanitizeSubdomainPrefix(subdomainPrefix);
  const suffix = generateRandomDigits(randomDigits);
  const subdomain = `${safePrefix}-${suffix}.${domain}`;
  const expandedCred = expandTilde(credentialsFile)!;
  const expandedConfigDir = expandTilde(configDir)!;

  await ensureDirectoryExists(expandedConfigDir);

  const configFile = path.join(expandedConfigDir, `config_${safePrefix}_${port}.yml`);
  const configContent = buildConfigContent({
    tunnelId,
    credentialsFile: expandedCred,
    subdomain,
    port,
    protocol
  });
  await fs.writeFile(configFile, configContent, { encoding: 'utf8' });

  const routeResult = await spawnOnce(cloudflaredBin, ['tunnel', 'route', 'dns', tunnelId, subdomain]);
  if (routeResult.code !== 0) {
    const output = `${routeResult.stderr}\n${routeResult.stdout}`;
    if (!/already exists|already.*CNAME/i.test(output)) {
      const msg = `cloudflared route dns failed (code ${routeResult.code}): ${routeResult.stderr || routeResult.stdout}`;
      throw new Error(msg);
    }
  }

  if (dnsWaitSeconds > 0) {
    await sleep(dnsWaitSeconds * 1000);
  }

  const runArgs = ['tunnel', '--config', configFile, 'run', tunnelId];
  const child = spawn(cloudflaredBin, runArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

  const ready = new Promise<void>((resolve) => {
    const rl = readline.createInterface({ input: child.stdout });
    const timeout = setTimeout(() => {
      rl.close();
      resolve();
    }, 10000);
    rl.on('line', (line: string) => {
      if (line.includes('Registered tunnel connection')) {
        clearTimeout(timeout);
        rl.close();
        resolve();
      }
    });
    child.on('close', () => {
      clearTimeout(timeout);
      rl.close();
      resolve();
    });
  });

  await ready;

  const url = `https://${subdomain}`;

  const stop = async (): Promise<void> => {
    if (!child.killed) {
      child.kill('SIGINT');
    }
    await new Promise<void>((res) => child.on('close', () => res()));
  };

  return { url, subdomain, configFile, process: child, stop };
}

export default { startTunnel };
