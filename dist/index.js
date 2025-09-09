"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTunnel = startTunnel;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const readline_1 = __importDefault(require("readline"));
const utils_1 = require("./utils");
function getDefaultCredentialsFile() {
    const home = os_1.default.homedir();
    return path_1.default.join(home, '.cloudflared', 'c656547d-1502-4922-995f-3bac3bc58b07.json');
}
async function startTunnel(options, logger) {
    const { port, subdomainPrefix, domain = 'dreamteamit.xyz', tunnelId = 'my-tunnel', credentialsFile = getDefaultCredentialsFile(), randomDigits = 4, configDir = path_1.default.join(os_1.default.homedir(), '.cloudflared'), dnsWaitSeconds = 2, cloudflaredBin = 'cloudflared', protocol = 'http', staticSubdomain = false } = options;
    if (!port || !Number.isFinite(port)) {
        throw new Error('Invalid port');
    }
    if (!subdomainPrefix) {
        throw new Error('subdomainPrefix is required');
    }
    const safePrefix = (0, utils_1.sanitizeSubdomainPrefix)(subdomainPrefix);
    const subdomain = staticSubdomain
        ? `${safePrefix}.${domain}`
        : `${safePrefix}-${(0, utils_1.generateRandomDigits)(randomDigits)}.${domain}`;
    const expandedCred = (0, utils_1.expandTilde)(credentialsFile);
    const expandedConfigDir = (0, utils_1.expandTilde)(configDir);
    logger?.startSpinner('Creating configuration...');
    await (0, utils_1.ensureDirectoryExists)(expandedConfigDir);
    const configFile = path_1.default.join(expandedConfigDir, `config_${safePrefix}_${port}.yml`);
    const configContent = (0, utils_1.buildConfigContent)({
        tunnelId,
        credentialsFile: expandedCred,
        subdomain,
        port,
        protocol
    });
    await promises_1.default.writeFile(configFile, configContent, { encoding: 'utf8' });
    logger?.stopSpinner();
    logger?.startSpinner('Setting up DNS route...');
    const routeResult = await (0, utils_1.spawnOnce)(cloudflaredBin, ['tunnel', 'route', 'dns', tunnelId, subdomain]);
    if (routeResult.code !== 0) {
        const output = `${routeResult.stderr}\n${routeResult.stdout}`;
        if (!/already exists|already.*CNAME/i.test(output)) {
            logger?.stopSpinner();
            const msg = `cloudflared route dns failed (code ${routeResult.code}): ${routeResult.stderr || routeResult.stdout}`;
            throw new Error(msg);
        }
    }
    logger?.stopSpinner();
    if (dnsWaitSeconds > 0) {
        logger?.startSpinner('Waiting for DNS propagation...');
        await (0, utils_1.sleep)(dnsWaitSeconds * 1000);
        logger?.stopSpinner();
    }
    logger?.startSpinner('Starting cloudflared tunnel...');
    const runArgs = ['tunnel', '--config', configFile, 'run', tunnelId];
    const child = (0, child_process_1.spawn)(cloudflaredBin, runArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
    const ready = new Promise((resolve) => {
        const rl = readline_1.default.createInterface({ input: child.stdout });
        const timeout = setTimeout(() => {
            rl.close();
            resolve();
        }, 10000);
        rl.on('line', (line) => {
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
    logger?.stopSpinner();
    const url = `https://${subdomain}`;
    const stop = async () => {
        if (!child.killed) {
            child.kill('SIGINT');
        }
        await new Promise((res) => child.on('close', () => res()));
    };
    return { url, subdomain, configFile, process: child, stop };
}
exports.default = { startTunnel };
