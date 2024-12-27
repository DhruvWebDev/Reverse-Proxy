import { program } from 'commander';
import { parseConfig, validateConfig } from './parser';
import cluster from 'node:cluster';
import * as os from 'node:os'; // Corrected the import statement

interface createServerConfig {
    port: number;
    workers: number;
}

async function createServer(createServerOptions: createServerConfig) {
}

async function main() {
    program.option('--config <path>');
    program.parse();
    const options = program.opts();
    if (options && 'config' in options) {
        // console.log('config file path:', options);
        const parseDatas = await parseConfig(options.config);
        // console.log(parseDatas);
        const validatedContent = await validateConfig(parseDatas);
        // console.log("hello", validatedContent);
        await createServer({
            port: validatedContent.server.listen,
            workers: validatedContent.server.workers, // Correct usage of os.cpus()
        });
    }
}

main();
