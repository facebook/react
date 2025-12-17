'use strict';

const http2Server = require('http2');
const httpServer = require('http-server');
const {existsSync, statSync, createReadStream} = require('fs');
const {join} = require('path');
const argv = require('minimist')(process.argv.slice(2));
const mime = require('mime');

function sendFile(filename, response) {
  response.setHeader('Content-Type', mime.lookup(filename));
  response.writeHead(200);
  const fileStream = createReadStream(filename);
  fileStream.pipe(response);
  fileStream.on('finish', response.end);
}

function createHTTP2Server(benchmark) {
  const server = http2Server.createServer({}, (request, response) => {
    const filename = join(
      __dirname,
      'benchmarks',
      benchmark,
      request.url
    ).replace(/\?.*/g, '');

    if (existsSync(filename) && statSync(filename).isFile()) {
      sendFile(filename, response);
    } else {
      const indexHtmlPath = join(filename, 'index.html');

      if (existsSync(indexHtmlPath)) {
        sendFile(indexHtmlPath, response);
      } else {
        response.writeHead(404);
        response.end();
      }
    }
  });
  server.listen(8080);
  return server;
}

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
  server.listen(8080);
  return server;
}

function serveBenchmark(benchmark, http2) {
  if (http2) {
    return createHTTP2Server(benchmark);
  } else {
    return createHTTPServer();
  }
}

// if run directly via CLI
if (require.main === module) {
  const benchmarkInput = argv._[0];

  if (benchmarkInput) {
    serveBenchmark(benchmarkInput);
  } else {
    console.error('Please specify a benchmark directory to serve!');
    process.exit(1);
  }
}

module.exports = serveBenchmark;
