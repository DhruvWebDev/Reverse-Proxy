import { program } from 'commander';
import { parseConfig, validateConfig } from './parser';
const cluster = require('cluster');
import * as os from 'node:os';
import * as http from 'node:http';
import { createServer } from './server';

async function main() {
    console.log(`Running Node.js version: ${process.version}`);
    program.option('--config <path>');
    program.parse();
    const options = program.opts();

    if (options && 'config' in options) {
        try {
            const parseData = await parseConfig(options.config);
            const validatedContent = await validateConfig(parseData);

            const port = validatedContent.server.listen || 8000;
            const workers = validatedContent.server.workers || os.cpus().length;

            await createServer({ port, workers, config: validatedContent });
        } catch (error) {
            console.error('Error while setting up the server:', error.message);
        }
    } else {
        console.error('No config file specified. Use --config <path> to specify the configuration file.');
    }
}

main();
