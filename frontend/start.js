require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const buildPath = path.join(__dirname, 'build');

app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'), err => {
    if (err) {
      res.status(500).send(err);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Frontend server is running on port ${PORT}`);
});
