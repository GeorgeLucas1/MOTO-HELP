require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();

const port = parseInt(process.env.PORT) || process.argv[3] || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login', 'index.html'));
});

app.use('/', routes);

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})