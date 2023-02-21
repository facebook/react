'use strict';

const {register} = require('react-server-dom-webpack/node-register');
register();

const {register: babelRegister} = require('@babel/register');
const path = require('path');

babelRegister({
  babelrc: false,
  ignore: [
    /\/(build|node_modules)\//,
    file => {
      const isFileInThisDirectory = (path.dirname(file) + '/').startsWith(
        __dirname + '/'
      );
      return isFileInThisDirectory;
    },
  ],
  presets: ['react-app'],
  plugins: ['@babel/transform-modules-commonjs'],
});

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
app.use(jsonParser);

const handler = require('./handler.js');

// Application
app.get('/', (req, res) => {
  handler(req, res);
});

app.options('/', (req, res) => {
  res
    .set({
      Allow: 'GET,HEAD,POST',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'rsc-action',
    })
    .end();
});

app.post('/', jsonParser, (req, res) => {
  handler(req, res);
});

app.get('/todos', (req, res) => {
  res
    .set({
      'Access-Control-Allow-Origin': '*',
    })
    .json([
      {id: 1, text: 'Shave yaks'},
      {id: 2, text: 'Eat kale'},
    ]);
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Flight Server listening on port ${PORT}`);
});

server.on('error', error => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      return;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      return;
    default:
      throw error;
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: 'Internal server error',
  });
});
