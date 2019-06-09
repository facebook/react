#!/usr/bin/env node

const finalhandler = require('finalhandler');
const http = require('http');
const serveStatic = require('serve-static');

// Serve fixtures folder
const serve = serveStatic(__dirname, { index: 'index.html' });

// Create server
const server = http.createServer(function onRequest(req, res) {
  serve(req, res, finalhandler(req, res));
});

// Listen
server.listen(3000);
