import { ChildProcessWithoutNullStreams } from 'child_process';
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
    staticSubdomain?: boolean;
}
export interface StartedTunnel {
    url: string;
    subdomain: string;
    configFile: string;
    process: ChildProcessWithoutNullStreams;
    stop: () => Promise<void>;
}
export declare function startTunnel(options: StartTunnelOptions, logger?: any): Promise<StartedTunnel>;
declare const _default: {
    startTunnel: typeof startTunnel;
};
export default _default;
