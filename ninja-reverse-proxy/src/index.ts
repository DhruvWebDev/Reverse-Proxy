import { program } from 'commander';
import { parseConfig, validateConfig } from './parser';


async function main() {
    program.option('--config <path>')
    program.parse();
    const options = program.opts();
    if(options && 'config' in options) {
        console.log('config file path:', options);
        const parseDatas = await(parseConfig(options.config));
        console.log(parseDatas)
        const validatedContent = await validateConfig(parseDatas);
        console.log('validated content:', validatedContent);
    }
}

main();