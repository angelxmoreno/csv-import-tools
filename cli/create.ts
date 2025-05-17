import type { Command } from 'commander';

export const registerCreateCommand = (program: Command) => {
    program
        .command('create')
        .description('Scan a directory of CSV files and create metadata')
        .action(async (dir: string) => {
            console.log(`[scan] Would scan folder: ${dir}`);
        });
};
