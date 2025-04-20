const express = require('express');
const app = express();
const port = 5000;

// middleware
app.use(express.json());

// basic root route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});