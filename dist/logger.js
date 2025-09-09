"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
class Logger {
    constructor(options = {}) {
        this.connectionCount = 0;
        this.tunnelStarted = false;
        this.quiet = options.quiet || false;
        this.json = options.json || false;
    }
    clearLine() {
        if (this.quiet || this.json)
            return;
        process.stdout.write('\r\x1b[K');
    }
    updateLine(message) {
        if (this.quiet || this.json)
            return;
        this.clearLine();
        process.stdout.write(message);
    }
    info(message) {
        if (this.quiet || this.json)
            return;
        console.log(chalk_1.default.blue('ℹ'), message);
    }
    success(message) {
        if (this.quiet || this.json)
            return;
        console.log(chalk_1.default.green('✓'), message);
    }
    warn(message) {
        if (this.quiet || this.json)
            return;
        console.log(chalk_1.default.yellow('⚠'), message);
    }
    error(message) {
        if (this.json)
            return;
        console.error(chalk_1.default.red('✗'), message);
    }
    url(url) {
        if (this.quiet || this.json)
            return;
        console.log(chalk_1.default.cyan('🌐 URL:'), chalk_1.default.underline.cyan(url));
    }
    config(path) {
        if (this.quiet || this.json)
            return;
        console.log(chalk_1.default.gray('📁 Config:'), chalk_1.default.gray(path));
    }
    ready() {
        if (this.quiet || this.json)
            return;
        console.log(chalk_1.default.green('🚀 Tunnel ready! Press Ctrl+C to stop...'));
    }
    startSpinner(message) {
        if (this.quiet || this.json)
            return;
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        process.stdout.write(chalk_1.default.blue(`${frames[0]} ${message}`));
        this.spinnerInterval = setInterval(() => {
            i = (i + 1) % frames.length;
            this.clearLine();
            process.stdout.write(chalk_1.default.blue(`${frames[i]} ${message}`));
        }, 80);
    }
    stopSpinner(finalMessage) {
        if (this.quiet || this.json)
            return;
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = undefined;
        }
        this.clearLine();
        if (finalMessage) {
            console.log(finalMessage);
        }
    }
    filterCloudflaredLog(line) {
        // Фильтруем только важные логи cloudflared
        const importantPatterns = [
            /Starting tunnel/,
            /Registered tunnel connection/,
            /Added CNAME/,
            /route.*dns/,
            /error|Error|ERROR/i,
            /warn|Warn|WARN/i,
            /fail|Fail|FAIL/i
        ];
        const skipPatterns = [
            /ICMP proxy/,
            /ping_group_range/,
            /receive buffer size/,
            /Tunnel connection curve preferences/,
            /Generated Connector ID/,
            /Initial protocol/,
            /Starting metrics server/,
            /Autoupdate frequency/,
            /Settings:/,
            /Version \d/,
            /GOOS:/
        ];
        // Пропускаем неважные логи
        if (skipPatterns.some(pattern => pattern.test(line))) {
            return false;
        }
        // Показываем важные логи
        return importantPatterns.some(pattern => pattern.test(line));
    }
    cloudflaredLog(line) {
        if (this.quiet || this.json)
            return;
        if (!this.filterCloudflaredLog(line))
            return;
        // Раскрашиваем логи cloudflared
        if (/error|Error|ERROR|fail|Fail|FAIL/i.test(line)) {
            console.log(chalk_1.default.red('  ✗ ' + line));
        }
        else if (/warn|Warn|WARN/i.test(line)) {
            console.log(chalk_1.default.yellow('  ⚠ ' + line));
        }
        else if (/Registered tunnel connection/i.test(line)) {
            this.connectionCount++;
            if (this.connectionCount === 1) {
                // Заменяем "Starting tunnel..." на первое соединение
                if (this.tunnelStarted) {
                    this.updateLine(chalk_1.default.green('  ✓ Connection established (1/4)'));
                }
                else {
                    console.log(chalk_1.default.green('  ✓ Connection established (1/4)'));
                }
            }
            else if (this.connectionCount <= 4) {
                this.updateLine(chalk_1.default.green(`  ✓ Connections established (${this.connectionCount}/4)`));
            }
            // После 4-го соединения просто очищаем строку
            if (this.connectionCount === 4) {
                this.clearLine();
            }
        }
        else if (/Starting tunnel/i.test(line)) {
            this.tunnelStarted = true;
            process.stdout.write(chalk_1.default.blue('  🔄 Starting tunnel...'));
        }
        else if (/Added CNAME/i.test(line)) {
            console.log(chalk_1.default.cyan('  📡 DNS route configured'));
        }
        else {
            console.log(chalk_1.default.gray('  ' + line));
        }
    }
    jsonOutput(data) {
        if (this.json) {
            console.log(JSON.stringify(data, null, 2));
        }
    }
}
exports.Logger = Logger;
