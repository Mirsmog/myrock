import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export function expandTilde(inputPath: string | undefined): string | undefined {
  if (!inputPath) return undefined;
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  return inputPath;
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export function generateRandomDigits(length: number): string {
  const max = 10 ** length;
  const num = Math.floor(Math.random() * max);
  return num.toString().padStart(length, '0');
}

export function sanitizeSubdomainPrefix(prefix: string): string {
  return prefix.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
}

export function buildConfigContent(params: {
  tunnelId: string;
  credentialsFile: string;
  subdomain: string;
  port: number;
  protocol?: 'http' | 'tcp';
}): string {
  const { tunnelId, credentialsFile, subdomain, port, protocol = 'http' } = params;
  const service = protocol === 'tcp' ? `tcp://127.0.0.1:${port}` : `http://127.0.0.1:${port}`;
  return [
    `tunnel: ${tunnelId}`,
    `credentials-file: ${credentialsFile}`,
    '',
    'ingress:',
    `  - hostname: ${subdomain}`,
    `    service: ${service}`,
    '  - service: http_status:404',
    ''
  ].join('\n');
}

export function spawnOnce(command: string, args: string[], options: { cwd?: string } = {}): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code: number | null) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
