import chalk from 'chalk';

export interface LoggerOptions {
  quiet?: boolean;
  json?: boolean;
}

export class Logger {
  private quiet: boolean;
  private json: boolean;
  private connectionCount: number = 0;
  private tunnelStarted: boolean = false;
  private spinnerInterval?: NodeJS.Timeout;

  constructor(options: LoggerOptions = {}) {
    this.quiet = options.quiet || false;
    this.json = options.json || false;
  }

  private clearLine(): void {
    if (this.quiet || this.json) return;
    process.stdout.write('\r\x1b[K');
  }

  private updateLine(message: string): void {
    if (this.quiet || this.json) return;
    this.clearLine();
    process.stdout.write(message);
  }

  info(message: string): void {
    if (this.quiet || this.json) return;
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    if (this.quiet || this.json) return;
    console.log(chalk.green('✓'), message);
  }

  warn(message: string): void {
    if (this.quiet || this.json) return;
    console.log(chalk.yellow('⚠'), message);
  }

  error(message: string): void {
    if (this.json) return;
    console.error(chalk.red('✗'), message);
  }

  url(url: string): void {
    if (this.quiet || this.json) return;
    console.log(chalk.cyan('🌐 URL:'), chalk.underline.cyan(url));
  }

  config(path: string): void {
    if (this.quiet || this.json) return;
    console.log(chalk.gray('📁 Config:'), chalk.gray(path));
  }

  ready(): void {
    if (this.quiet || this.json) return;
    console.log(chalk.green('🚀 Tunnel ready! Press Ctrl+C to stop...'));
  }

  startSpinner(message: string): void {
    if (this.quiet || this.json) return;
    
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    
    process.stdout.write(chalk.blue(`${frames[0]} ${message}`));
    
    this.spinnerInterval = setInterval(() => {
      i = (i + 1) % frames.length;
      this.clearLine();
      process.stdout.write(chalk.blue(`${frames[i]} ${message}`));
    }, 80);
  }

  stopSpinner(finalMessage?: string): void {
    if (this.quiet || this.json) return;
    
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = undefined;
    }
    
    this.clearLine();
    if (finalMessage) {
      console.log(finalMessage);
    }
  }

  filterCloudflaredLog(line: string): boolean {
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

  cloudflaredLog(line: string): void {
    if (this.quiet || this.json) return;
    
    if (!this.filterCloudflaredLog(line)) return;

    // Раскрашиваем логи cloudflared
    if (/error|Error|ERROR|fail|Fail|FAIL/i.test(line)) {
      console.log(chalk.red('  ✗ ' + line));
    } else if (/warn|Warn|WARN/i.test(line)) {
      console.log(chalk.yellow('  ⚠ ' + line));
    } else if (/Registered tunnel connection/i.test(line)) {
      this.connectionCount++;
      
      if (this.connectionCount === 1) {
        // Заменяем "Starting tunnel..." на первое соединение
        if (this.tunnelStarted) {
          this.updateLine(chalk.green('  ✓ Connection established (1/4)'));
        } else {
          console.log(chalk.green('  ✓ Connection established (1/4)'));
        }
      } else if (this.connectionCount <= 4) {
        this.updateLine(chalk.green(`  ✓ Connections established (${this.connectionCount}/4)`));
      }
      
      // После 4-го соединения просто очищаем строку
      if (this.connectionCount === 4) {
        this.clearLine();
      }
    } else if (/Starting tunnel/i.test(line)) {
      this.tunnelStarted = true;
      process.stdout.write(chalk.blue('  🔄 Starting tunnel...'));
    } else if (/Added CNAME/i.test(line)) {
      console.log(chalk.cyan('  📡 DNS route configured'));
    } else {
      console.log(chalk.gray('  ' + line));
    }
  }

  jsonOutput(data: any): void {
    if (this.json) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}
