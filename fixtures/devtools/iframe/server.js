#!/usr/bin/env node

const finalhandler = require('finalhandler');
const http = require('http');
const serveStatic = require('serve-static');

// Serve fixtures folder
const serve = serveStatic(__dirname);

// Create server
const server = http.createServer(function onRequest(req, res) {
  serve(req, res, finalhandler(req, res));
});

console.log('Listening on http://localhost:3000');

// Listen
server.listen(3000);
