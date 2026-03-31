'use strict';

const {PassThrough, Transform} = require('stream');

// ---------------------------------------------------------------------------
// Fizz (Node) — renders App directly via Node streams.
// Returns a Node Readable stream of HTML.
// ---------------------------------------------------------------------------

function renderFizzNode(AppComponent, itemCount) {
  const React = require('react');
  const {renderToPipeableStream} = require('react-dom/server');

  const output = new PassThrough();
  const {pipe} = renderToPipeableStream(
    React.createElement(AppComponent, {itemCount}),
    {
      onShellReady() {
        pipe(output);
      },
      onError(e) {
        console.error('Fizz Node error:', e);
        output.destroy(e);
      },
    }
  );
  return output;
}

// ---------------------------------------------------------------------------
// Fizz (Edge) — renders App directly via web streams.
// Returns a promise that resolves to a Node Readable stream of HTML.
// ---------------------------------------------------------------------------

function renderFizzEdge(AppComponent, itemCount) {
  const React = require('react');
  const {renderToReadableStream} = require('react-dom/server');

  return renderToReadableStream(React.createElement(AppComponent, {itemCount}));
}

// ---------------------------------------------------------------------------
// Flight + Fizz (Node) — RSC render → tee → Fizz + script injection.
// HTML chunks are buffered within a tick to avoid injecting scripts mid-tag.
// Returns a Node Readable stream of HTML with injected Flight scripts.
// ---------------------------------------------------------------------------

function renderFlightFizzNode(
  renderRSCNode,
  AppComponent,
  itemCount,
  clientManifest,
  ssrManifest
) {
  const React = require('react');
  const {renderToPipeableStream} = require('react-dom/server');
  const {createFromNodeStream} = require('react-server-dom-webpack/client');

  // Phase 1: RSC → Flight stream, tee into SSR + script injection
  const {pipe: rscPipe} = renderRSCNode(
    clientManifest,
    AppComponent,
    itemCount
  );
  const trunk = new PassThrough();
  const forSsr = new PassThrough();
  const forInline = new PassThrough();
  trunk.pipe(forSsr);
  trunk.pipe(forInline);

  let flightScripts = '';
  forInline.on('data', function (chunk) {
    flightScripts +=
      '<script>(self.__FLIGHT_DATA||=[]).push(' +
      JSON.stringify(chunk.toString()) +
      ')</script>';
  });

  rscPipe(trunk);

  // Phase 2: Flight stream → React tree → HTML with injected scripts
  let cachedResult;
  function Root() {
    if (!cachedResult) {
      cachedResult = createFromNodeStream(forSsr, ssrManifest);
    }
    return React.use(cachedResult);
  }

  const output = new PassThrough();
  const trailer = '</body></html>';

  const {pipe} = renderToPipeableStream(React.createElement(Root), {
    onShellReady() {
      let buffered = [];
      let timeout = null;
      const injector = new Transform({
        transform(chunk, _encoding, cb) {
          buffered.push(chunk);
          if (!timeout) {
            timeout = setTimeout(() => {
              for (const buf of buffered) {
                let str = buf.toString();
                if (str.endsWith(trailer)) {
                  str = str.slice(0, -trailer.length);
                }
                this.push(str);
              }
              buffered.length = 0;
              timeout = null;
              if (flightScripts) {
                this.push(flightScripts);
                flightScripts = '';
              }
            }, 0);
          }
          cb();
        },
        flush(cb) {
          if (timeout) {
            clearTimeout(timeout);
            for (const buf of buffered) {
              let str = buf.toString();
              if (str.endsWith(trailer)) {
                str = str.slice(0, -trailer.length);
              }
              this.push(str);
            }
            buffered.length = 0;
          }
          if (flightScripts) {
            this.push(flightScripts);
            flightScripts = '';
          }
          this.push(trailer);
          cb();
        },
      });
      pipe(injector);
      injector.pipe(output);
    },
    onError(e) {
      console.error('Flight+Fizz Node error:', e);
      output.destroy(e);
    },
  });

  return output;
}

// ---------------------------------------------------------------------------
// Flight + Fizz (Edge) — RSC render → tee → Fizz + script injection via web
// streams. HTML chunks are buffered within a tick to avoid injecting scripts
// mid-tag. The </body></html> trailer is stripped, Flight scripts injected,
// and the trailer re-added at flush.
// Returns a promise that resolves to a web ReadableStream.
// ---------------------------------------------------------------------------

function renderFlightFizzEdge(
  renderRSCEdge,
  AppComponent,
  itemCount,
  clientManifest,
  ssrManifest
) {
  const React = require('react');
  const {renderToReadableStream} = require('react-dom/server');
  const {
    createFromReadableStream,
  } = require('react-server-dom-webpack/client.edge');

  const htmlTrailer = '</body></html>';
  const enc = new TextEncoder();

  // Phase 1: RSC → Web ReadableStream, tee into SSR + script injection
  const webStream = renderRSCEdge(clientManifest, AppComponent, itemCount);
  const [forSsr, forInline] = webStream.tee();

  let resolveInline;
  const inlinePromise = new Promise(function (r) {
    resolveInline = r;
  });
  const htmlDecoder = new TextDecoder();
  let buffered = [];
  let timeout = null;

  function flushBuffered(controller) {
    for (const chunk of buffered) {
      let buf = htmlDecoder.decode(chunk, {stream: true});
      if (buf.endsWith(htmlTrailer)) {
        buf = buf.slice(0, -htmlTrailer.length);
      }
      controller.enqueue(enc.encode(buf));
    }
    const remaining = htmlDecoder.decode();
    if (remaining.length) {
      let buf = remaining;
      if (buf.endsWith(htmlTrailer)) {
        buf = buf.slice(0, -htmlTrailer.length);
      }
      controller.enqueue(enc.encode(buf));
    }
    buffered.length = 0;
    timeout = null;
  }

  function writeFlightChunk(data, controller) {
    controller.enqueue(
      enc.encode(
        '<script>(self.__FLIGHT_DATA||=[]).push(' +
          JSON.stringify(data) +
          ')</script>'
      )
    );
  }

  const injector = new TransformStream({
    start(controller) {
      (async function () {
        const reader = forInline.getReader();
        const decoder = new TextDecoder('utf-8', {fatal: true});
        for (;;) {
          const {done, value} = await reader.read();
          if (done) break;
          writeFlightChunk(decoder.decode(value, {stream: true}), controller);
        }
        const remaining = decoder.decode();
        if (remaining.length) {
          writeFlightChunk(remaining, controller);
        }
        resolveInline();
      })();
    },
    transform(chunk, controller) {
      buffered.push(chunk);
      if (!timeout) {
        timeout = setTimeout(function () {
          flushBuffered(controller);
        }, 0);
      }
    },
    async flush(controller) {
      await inlinePromise;
      if (timeout) {
        clearTimeout(timeout);
        flushBuffered(controller);
      }
      controller.enqueue(enc.encode(htmlTrailer));
    },
  });

  // Phase 2: ReadableStream → React tree → HTML → injector → output
  const cachedResult = createFromReadableStream(forSsr, {
    serverConsumerManifest: ssrManifest,
  });
  function Root() {
    return React.use(cachedResult);
  }

  return renderToReadableStream(React.createElement(Root)).then(
    function (htmlStream) {
      return htmlStream.pipeThrough(injector);
    }
  );
}

// ---------------------------------------------------------------------------
// Utilities: collect streams into strings.
// ---------------------------------------------------------------------------

function nodeStreamToString(nodeStream) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    nodeStream.on('data', function (chunk) {
      chunks.push(chunk);
    });
    nodeStream.on('end', function () {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    nodeStream.on('error', reject);
  });
}

function webStreamToString(webStream) {
  const reader = webStream.getReader();
  const chunks = [];
  function read() {
    return reader.read().then(function ({done, value}) {
      if (done) {
        return Buffer.concat(chunks).toString('utf-8');
      }
      chunks.push(Buffer.from(value));
      return read();
    });
  }
  return read();
}

module.exports = {
  renderFizzNode,
  renderFizzEdge,
  renderFlightFizzNode,
  renderFlightFizzEdge,
  nodeStreamToString,
  webStreamToString,
};
