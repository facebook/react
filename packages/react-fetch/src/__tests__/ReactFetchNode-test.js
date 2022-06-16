/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactFetchNode', () => {
  let http;
  let fetch;
  let waitForSuspense;
  let server;
  let serverEndpoint;
  let serverImpl;

  beforeEach(done => {
    jest.resetModules();

    fetch = require('react-fetch').fetch;
    http = require('http');
    waitForSuspense = require('react-suspense-test-utils').waitForSuspense;

    server = http.createServer((req, res) => {
      serverImpl(req, res);
    });
    serverEndpoint = null;
    server.listen(() => {
      serverEndpoint = `http://localhost:${server.address().port}/`;
      done();
    });
  });

  afterEach(done => {
    server.close(done);
    server = null;
  });

  // @gate experimental || www
  it('can fetch text from a server component', async () => {
    serverImpl = (req, res) => {
      res.write('mango');
      res.end();
    };
    const text = await waitForSuspense(() => {
      return fetch(serverEndpoint).text();
    });
    expect(text).toEqual('mango');
  });

  // @gate experimental || www
  it('can fetch json from a server component', async () => {
    serverImpl = (req, res) => {
      res.write(JSON.stringify({name: 'Sema'}));
      res.end();
    };
    const json = await waitForSuspense(() => {
      return fetch(serverEndpoint).json();
    });
    expect(json).toEqual({name: 'Sema'});
  });

  // @gate experimental || www
  it('provides response status', async () => {
    serverImpl = (req, res) => {
      res.write(JSON.stringify({name: 'Sema'}));
      res.end();
    };
    const response = await waitForSuspense(() => {
      return fetch(serverEndpoint);
    });
    expect(response).toMatchObject({
      status: 200,
      statusText: 'OK',
      ok: true,
    });
  });

  // @gate experimental || www
  it('handles different paths', async () => {
    serverImpl = (req, res) => {
      switch (req.url) {
        case '/banana':
          res.write('banana');
          break;
        case '/mango':
          res.write('mango');
          break;
        case '/orange':
          res.write('orange');
          break;
      }
      res.end();
    };
    const outputs = await waitForSuspense(() => {
      return [
        fetch(serverEndpoint + 'banana').text(),
        fetch(serverEndpoint + 'mango').text(),
        fetch(serverEndpoint + 'orange').text(),
      ];
    });
    expect(outputs).toMatchObject(['banana', 'mango', 'orange']);
  });

  // @gate experimental || www
  it('can produce an error', async () => {
    serverImpl = (req, res) => {};

    expect.assertions(1);
    try {
      await waitForSuspense(() => {
        return fetch('BOOM');
      });
    } catch (err) {
      expect(err.message).toEqual('Invalid URL: BOOM');
    }
  });
});
