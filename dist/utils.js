"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandTilde = expandTilde;
exports.ensureDirectoryExists = ensureDirectoryExists;
exports.generateRandomDigits = generateRandomDigits;
exports.sanitizeSubdomainPrefix = sanitizeSubdomainPrefix;
exports.buildConfigContent = buildConfigContent;
exports.spawnOnce = spawnOnce;
exports.sleep = sleep;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
function expandTilde(inputPath) {
    if (!inputPath)
        return undefined;
    if (inputPath.startsWith('~')) {
        return path_1.default.join(os_1.default.homedir(), inputPath.slice(1));
    }
    return inputPath;
}
async function ensureDirectoryExists(dirPath) {
    await promises_1.default.mkdir(dirPath, { recursive: true });
}
function generateRandomDigits(length) {
    const max = 10 ** length;
    const num = Math.floor(Math.random() * max);
    return num.toString().padStart(length, '0');
}
function sanitizeSubdomainPrefix(prefix) {
    return prefix.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
}
function buildConfigContent(params) {
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
function spawnOnce(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(command, args, { cwd: options.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (d) => (stdout += d.toString()));
        child.stderr.on('data', (d) => (stderr += d.toString()));
        child.on('error', reject);
        child.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
    });
}
function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
