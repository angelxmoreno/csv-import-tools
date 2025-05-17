import type { Command } from 'commander';

export const registerScanCommand = (program: Command) => {
    program
        .command('scan <dir>')
        .description('Scan a directory of CSV files and create metadata')
        .action(async (dir: string) => {
            console.log(`[scan] Would scan folder: ${dir}`);
        });
};
