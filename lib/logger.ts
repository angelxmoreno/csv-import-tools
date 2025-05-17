import chalk from 'chalk';

type LogLevel = 'info' | 'warn' | 'error';

export interface LogOptions {
    tag?: string;
    data?: Record<string, unknown>;
}

const print = (level: LogLevel, message: string, opts?: LogOptions) => {
    const tag = opts?.tag ? chalk.gray(`[${opts.tag}]`) : '';
    const coloredMessage = {
        info: chalk.cyan(message),
        warn: chalk.yellow(message),
        error: chalk.red(message),
    }[level];

    console.log(`${tag} ${coloredMessage}`);

    if (opts?.data) {
        console.log(chalk.gray(JSON.stringify(opts.data, null, 2)));
    }
};

export const log = (message: string, opts?: LogOptions) => print('info', message, opts);
export const warn = (message: string, opts?: LogOptions) => print('warn', message, opts);
export const error = (message: string, opts?: LogOptions) => print('error', message, opts);
