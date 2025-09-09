export declare function expandTilde(inputPath: string | undefined): string | undefined;
export declare function ensureDirectoryExists(dirPath: string): Promise<void>;
export declare function generateRandomDigits(length: number): string;
export declare function sanitizeSubdomainPrefix(prefix: string): string;
export declare function buildConfigContent(params: {
    tunnelId: string;
    credentialsFile: string;
    subdomain: string;
    port: number;
    protocol?: 'http' | 'tcp';
}): string;
export declare function spawnOnce(command: string, args: string[], options?: {
    cwd?: string;
}): Promise<{
    code: number;
    stdout: string;
    stderr: string;
}>;
export declare function sleep(ms: number): Promise<void>;
