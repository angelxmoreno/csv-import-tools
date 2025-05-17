import type { Command } from 'commander';

export const registerAnalyzeCommand = (program: Command) => {
    program
        .command('analyze')
        .description('Scan a directory of CSV files and create metadata')
        .action(async (dir: string) => {
            console.log(`[scan] Would scan folder: ${dir}`);
        });
};
