import { program } from 'commander';

import { registerAnalyzeCommand } from '@cli/analyze';
import { registerConnectionsCommand } from '@cli/connections';
import { registerCreateCommand } from '@cli/create';
import { registerImportCommand } from '@cli/import';
import { registerSamplerCommand } from '@cli/sampler';
import { registerScanCommand } from '@cli/scan';

program.name('csv-to-mysql').description('Process and import CSV files into MySQL');

registerScanCommand(program);
registerAnalyzeCommand(program);
registerCreateCommand(program);
registerImportCommand(program);
registerConnectionsCommand(program);
registerSamplerCommand(program);

program.parse();
