require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();

const port = parseInt(process.env.PORT) || process.argv[3] || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('login');
});

app.use('/', routes);

app.listen(port, () => {
  console.log(`servidor localhost ativado com sucesso em http://localhost:${port}`);
})