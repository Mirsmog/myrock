export interface LoggerOptions {
    quiet?: boolean;
    json?: boolean;
}
export declare class Logger {
    private quiet;
    private json;
    private connectionCount;
    private tunnelStarted;
    private spinnerInterval?;
    constructor(options?: LoggerOptions);
    private clearLine;
    private updateLine;
    info(message: string): void;
    success(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    url(url: string): void;
    config(path: string): void;
    ready(): void;
    startSpinner(message: string): void;
    stopSpinner(finalMessage?: string): void;
    filterCloudflaredLog(line: string): boolean;
    cloudflaredLog(line: string): void;
    jsonOutput(data: any): void;
}
