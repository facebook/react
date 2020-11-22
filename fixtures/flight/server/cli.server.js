'use strict';

const register = require('react-transport-dom-webpack/node-register');
register();

const babelRegister = require('@babel/register');

babelRegister({
  ignore: [/\/(build|node_modules)\//],
  presets: ['react-app'],
  plugins: ['@babel/transform-modules-commonjs'],
});

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Application
app.get('/', function(req, res) {
  if (process.env.NODE_ENV === 'development') {
    // This doesn't work in ESM mode.
    // for (var key in require.cache) {
    //   delete require.cache[key];
    // }
  }
  require('./handler.server.js')(req, res);
});

let todos = [
  {
    id: 1,
    text: 'Shave yaks',
  },
  {
    id: 2,
    text: 'Eat kale!',
  },
];

app.get('/todos', function(req, res) {
  res.json(todos);
});

app.post('/todos', function(req, res) {
  todos.push({
    id: todos.length + 1,
    text: req.body.text,
  });
  res.json(todos);
});

app.listen(3001, () => {
  console.log('Flight Server listening on port 3001...');
});

app.on('error', function(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
