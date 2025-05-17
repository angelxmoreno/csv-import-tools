import type { Command } from 'commander';

export const registerImportCommand = (program: Command) => {
    program
        .command('import')
        .description('Scan a directory of CSV files and create metadata')
        .action(async (dir: string) => {
            console.log(`[scan] Would scan folder: ${dir}`);
        });
};
