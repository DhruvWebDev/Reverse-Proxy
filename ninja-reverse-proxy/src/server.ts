import { configSchemaType } from "./config-schema";
import { ReplyMessageType, workerMessageSchema, WorkerMessageType } from "./server-schema";

const cluster = require('cluster');
const http = require('http');

interface CreateServerConfig {
    port: number;
    workers: number;
    config:configSchemaType;
}

export async function createServer(createServerOptions: CreateServerConfig) {
    const { port, workers, config } = createServerOptions;
    const workerList = [];
    let currentWorkerIndex = 0;

    if (cluster.isPrimary) {
        console.log(`Primary process ${process.pid} is running`);

        // Fork workers
        for (let i = 0; i < workers; i++) {
            const worker = cluster.fork();
            workerList.push(worker);
        }

        // Round-robin function to get the next worker
        const getNextWorker = () => {
            const worker = workerList[currentWorkerIndex];
            currentWorkerIndex = (currentWorkerIndex + 1) % workerList.length;
            return worker;
        };

        // Listen for worker exits and restart them
        cluster.on('exit', (worker) => {
            console.log(`Worker ${worker.process.pid} died. Spawning a new one.`);
            const newWorker = cluster.fork();
            workerList.splice(workerList.indexOf(worker), 1, newWorker);
        });

        // Load balancer - handle incoming requests and delegate to workers
        http.createServer((req, res) => {
            const worker = getNextWorker();
            const message: WorkerMessageType = {
                requestType: 'HTTP',
                header: req.headers,
                body: null, // `req.body` might not be directly available; handle parsing if necessary
                url: `${req.url}`,
            };
            worker.send(message);

            worker.once('message', (responseMessage: { response: string, pid: number }) => {
                res.writeHead(200);
                res.end(`Request forwarded to worker ${responseMessage.pid}. Response: ${responseMessage.response}`);
            });
        }).listen(port, () => {
            console.log(`Load balancer listening on port ${port}`);
        });

    } else {
        // Worker process - handle requests sent by the primary process
        process.on('message', async (message: WorkerMessageType) => {
            try {
                const validatedContent = await workerMessageSchema.parseAsync(message);
                console.log(validatedContent)
                const { url, requestType, header, body } = validatedContent;
                const requestedUrl = validatedContent.url;
                //Regex expression to filter out the upstream for that url
                const rule = config.server.rules.find((rule) => {
                    return rule.path === requestedUrl;
                });
                if(!rule) {
                    const reply:ReplyMessageType = {
                        errorCode: 404,
                        error: 'No rule found for the requested url',
                    }
                }
                console.log(rule);


                const upstreamID = rule.upstream[0];
                console.log(upstreamID)

                process.send!({ response: `Worker ${process.pid} processed the request`, pid: process.pid });

            } catch (error) {
                console.error(`Validation failed in Worker ${process.pid}:`, error);
                process.send!({ response: `Error: ${error.message}`, pid: process.pid });
            }
        });

        console.log(`Worker ${process.pid} started`);
    }
}
