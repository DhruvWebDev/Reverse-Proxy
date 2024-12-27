const cluster = require('cluster');
const os = require('os');
const express = require('express');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);

  // Fork workers equal to the number of CPU cores
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart workers on exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker process ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  // Middleware for parsing JSON requests
  app.use(express.json());

  // Sample route
  app.get('/', (req, res) => {
    
  res.send(`Computed result: ${worker.process.pid}`);});

  // Route for heavy computation (example)
  app.get('/compute', (req, res) => {
    // Simulate heavy computation
    const result = Array(1e6)
      .fill(0)
      .reduce((acc, curr) => acc + curr, 0);
    res.send(`Computed result: ${result}`);
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(`Error in Worker ${process.pid}:`, err);
    res.status(500).send('Something went wrong!');
  });

  // Start the server
  const server = app.listen(3000, () => {
    console.log(`Worker process ${process.pid} is listening on port 3000`);
  });
}
