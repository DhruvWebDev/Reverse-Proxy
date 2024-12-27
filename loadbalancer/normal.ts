const express = require('express');

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  const result = Array(1e6)
  .fill(0)
  .reduce((acc, curr) => acc + curr, 0);
res.send(`Computed result: ${result}`);});

// Sample route
app.get('/hello', (req, res) => {
  res.send('Hello, world!');
});

// Route for heavy computation (example)
app.get('/compute', (req, res) => {
  // Simulate heavy computation
  const result = Array(1e6)
    .fill(0)
    .reduce((acc, curr) => acc + curr, 0);
  res.send(`Computed result: ${result}`);
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  res.status(404).send('Route not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
