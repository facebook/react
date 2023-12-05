'use strict';

const http2 = require('http2');
const httpServer = require('http-server');
const { existsSync, statSync, createReadStream } = require('fs');
const { join } = require('path');
const argv = require('minimist')(process.argv.slice(2));
const mime = require('mime');

const HTTP_PORT = 8080;

// Function to send a file as the response
function sendFile(filename, response) {
  const contentType = mime.lookup(filename);
  response.setHeader('Content-Type', contentType);
  
  response.writeHead(200);
  
  const fileStream = createReadStream(filename);
  fileStream.pipe(response);
  
  fileStream.on('finish', response.end);
}

// Function to serve a 404 Not Found response
function serveNotFound(response) {
  response.writeHead(404);
  response.end();
}

// Function to create an HTTP/2 server for a specific benchmark
function createHTTP2Server(benchmark) {
  const server = http2.createServer({}, (request, response) => {
    const filename = join(__dirname, 'benchmarks', benchmark, request.url).replace(/\?.*/g, '');

    if (existsSync(filename) && statSync(filename).isFile()) {
      // Serve the requested file
      sendFile(filename, response);
    } else {
      const indexHtmlPath = join(filename, 'index.html');

      if (existsSync(indexHtmlPath)) {
        // Serve the index.html file if it exists
        sendFile(indexHtmlPath, response);
      } else {
        // Otherwise, serve a 404 Not Found response
        serveNotFound(response);
      }
    }
  });

  server.listen(HTTP_PORT);
  return server;
}

// Function to create an HTTP server for a specific benchmark
function createHTTPServer() {
  const server = httpServer.createServer({
    root: join(__dirname, 'benchmarks'),
    robots: true,
    cache: 'no-store',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  });

  server.listen(HTTP_PORT);
  return server;
}

// Function to serve a benchmark based on whether HTTP/2 is enabled
function serveBenchmark(benchmark, http2Enabled) {
  if (http2Enabled) {
    return createHTTP2Server(benchmark);
  } else {
    return createHTTPServer();
  }
}

// Run directly via CLI
if (require.main === module) {
  const benchmarkInput = argv._[0];

  if (benchmarkInput) {
    // Serve the specified benchmark
    serveBenchmark(benchmarkInput);
  } else {
    console.error('Please specify a benchmark directory to serve!');
    process.exit(1);
  }
}

module.exports = serveBenchmark;

