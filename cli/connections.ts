import { appConfig } from '@config';
import { log } from '@lib/logger';
import type { Command } from 'commander';
import mysql from 'mysql2/promise';

export const registerConnectionsCommand = (program: Command) => {
    const conn = program.command('connections').description('Manage MySQL connection profiles');

    conn.command('list')
        .description('List all available MySQL connection profiles')
        .action(() => {
            for (const connection of appConfig.connections) {
                log(`${connection.name} → ${connection.user}@${connection.host}/${connection.database}`);
            }
        });

    conn.command('check')
        .description('Try connecting to all configured databases')
        .action(async () => {
            for (const c of appConfig.connections) {
                try {
                    const conn = await mysql.createConnection({ ...c, multipleStatements: false });
                    await conn.ping();
                    log(`✅ ${c.name} connection succeeded`);
                    await conn.end();
                } catch (err) {
                    log(`❌ ${c.name} failed`, { data: { error: String(err) } });
                }
            }
        });
};
