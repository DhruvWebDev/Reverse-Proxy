import { configSchemaType } from "./config-schema";
import { ReplyMessageType, workerMessageSchema, WorkerMessageType } from "./server-schema";
const cluster = require('cluster');
const http = require('http');

interface CreateServerConfig {
    port: number;
    workers: number;
    config: configSchemaType;
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
            if (workerList.length === 0) throw new Error("No workers available");
            const worker = workerList[currentWorkerIndex];
            currentWorkerIndex = (currentWorkerIndex + 1) % workerList.length;
            return worker;
        };

        // Restart workers on exit
        cluster.on('exit', (worker) => {
            console.log(`Worker ${worker.process.pid} died. Spawning a new one.`);
            const newWorker = cluster.fork();
            workerList.splice(workerList.indexOf(worker), 1, newWorker);
        });

        // Load balancer
        http.createServer((req, res) => {
            try {
                const worker = getNextWorker();
                const message: WorkerMessageType = {
                    requestType: 'HTTP',
                    header: req.headers,
                    body: null,
                    url: req.url || "",
                };
                console.log("message", message)
                worker.send(message);

                worker.once('message', (workerMessage: string) => {
                    try {
                        const response = JSON.parse(workerMessage) as ReplyMessageType;
                        if (response.errorCode) {
                            res.writeHead(parseInt(response.errorCode));
                            res.end(response.error);
                        } else {
                            res.writeHead(200);
                            res.end(response.data);
                        }
                    } catch (err) {
                        console.error('Error parsing worker response:', err);
                        res.writeHead(500);
                        res.end('Invalid worker response');
                    }
                });
            } catch (error) {
                res.writeHead(500);
                res.end("Internal Server Error");
            }
        }).listen(port, () => {
            console.log(`Load balancer listening on port ${port}`);
        });

    } else {
        // Worker process
        process.on('message', async (message: WorkerMessageType) => {
            try {
                const validatedContent = await workerMessageSchema.parseAsync(message);
                const { url } = validatedContent;

                const rule = config.server.rules.find((rule) => rule.path === url);
                console.log("rule",rule)
                if (!rule) {
                    const replyMessage: ReplyMessageType = {
                        errorCode: '404',
                        error: 'No rule found for the requested URL',
                    };
                    process.send!(JSON.stringify(replyMessage));
                    return;
                }

                const upstreamID = rule.upstream[0];
                const upstream = config.server.upstream.find(m => m.id === upstreamID);

                if (!upstream) {
                    const replyMessage: ReplyMessageType = {
                        errorCode: '500',
                        error: 'No upstream found for the requested URL',
                    };
                    process.send!(JSON.stringify(replyMessage));
                    return;
                }
                console.log(upstream.url,url)
                const proxyReq = http.request({
                    // protocol: 'http:',
                    host: upstream.url,
                    path: url,
                    method: 'GET',
                }, (proxyRes) => {
                    let body = '';
                    proxyRes.on('data', (chunk) => {
                        body += chunk;
                    });

                    proxyRes.on('end', () => {
                        const reply: ReplyMessageType = {
                            data: body,
                        };
                        process.send!(JSON.stringify(reply));
                    });
                });

                proxyReq.on('error', (err) => {
                    const replyMessage: ReplyMessageType = {
                        errorCode: '500',
                        error: `Upstream error: ${err.message}`,
                    };
                    process.send!(JSON.stringify(replyMessage));
                });

                proxyReq.end();
            } catch (error) {
                console.error(`Validation failed in Worker ${process.pid}:`, error);
                const replyMessage: ReplyMessageType = {
                    errorCode: '500',
                    error: `Worker error: ${error.message}`,
                };
                process.send!(JSON.stringify(replyMessage));
            }
        });

        console.log(`Worker ${process.pid} started`);
    }
}
