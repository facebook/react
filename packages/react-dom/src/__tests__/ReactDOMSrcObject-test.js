/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment ./scripts/jest/ReactDOMServerIntegrationEnvironment
 */

'use strict';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;

describe('ReactDOMSrcObject', () => {
  let React;
  let ReactDOMClient;
  let ReactDOMFizzServer;
  let act;
  let container;
  let assertConsoleErrorDev;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactDOMFizzServer = require('react-dom/server.edge');
    act = require('internal-test-utils').act;

    assertConsoleErrorDev =
      require('internal-test-utils').assertConsoleErrorDev;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  // @gate enableSrcObject
  it('can render a Blob as an img src', async () => {
    const root = ReactDOMClient.createRoot(container);
    const ref = React.createRef();

    const blob = new Blob();
    await act(() => {
      root.render(<img src={blob} ref={ref} />);
    });

    expect(ref.current.src).toMatch(/^blob:/);
  });

  // @gate enableSrcObject
  it('can render a Blob as a picture img src', async () => {
    const root = ReactDOMClient.createRoot(container);
    const ref = React.createRef();

    const blob = new Blob();
    await act(() => {
      root.render(
        <picture>
          <img src={blob} ref={ref} />
        </picture>,
      );
    });

    expect(ref.current.src).toMatch(/^blob:/);
  });

  // @gate enableSrcObject
  it('can render a Blob as a video and audio src', async () => {
    const root = ReactDOMClient.createRoot(container);
    const videoRef = React.createRef();
    const audioRef = React.createRef();

    const blob = new Blob();
    await act(() => {
      root.render(
        <>
          <video src={blob} ref={videoRef} />
          <audio src={blob} ref={audioRef} />
        </>,
      );
    });

    expect(videoRef.current.src).toMatch(/^blob:/);
    expect(audioRef.current.src).toMatch(/^blob:/);
  });

  // @gate enableSrcObject || !__DEV__
  it('warn when rendering a Blob as a source src of a video, audio or picture element', async () => {
    const root = ReactDOMClient.createRoot(container);
    const videoRef = React.createRef();
    const audioRef = React.createRef();
    const pictureRef = React.createRef();

    const blob = new Blob();
    await act(() => {
      root.render(
        <>
          <video ref={videoRef}>
            <source src={blob} />
          </video>
          <audio ref={audioRef}>
            <source src={blob} />
          </audio>
          <picture ref={pictureRef}>
            <source src={blob} />
            <img />
          </picture>
        </>,
      );
    });

    assertConsoleErrorDev([
      'Passing Blob, MediaSource or MediaStream to <source src> is not supported. ' +
        'Pass it directly to <img src>, <video src> or <audio src> instead.',
      'Passing Blob, MediaSource or MediaStream to <source src> is not supported. ' +
        'Pass it directly to <img src>, <video src> or <audio src> instead.',
      'Passing Blob, MediaSource or MediaStream to <source src> is not supported. ' +
        'Pass it directly to <img src>, <video src> or <audio src> instead.',
    ]);
    expect(videoRef.current.firstChild.src).not.toMatch(/^blob:/);
    expect(videoRef.current.firstChild.src).toContain('[object%20Blob]'); // toString:ed
    expect(audioRef.current.firstChild.src).not.toMatch(/^blob:/);
    expect(audioRef.current.firstChild.src).toContain('[object%20Blob]'); // toString:ed
    expect(pictureRef.current.firstChild.src).not.toMatch(/^blob:/);
    expect(pictureRef.current.firstChild.src).toContain('[object%20Blob]'); // toString:ed
  });

  async function readContent(stream) {
    const reader = stream.getReader();
    let content = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return content;
      }
      content += Buffer.from(value).toString('utf8');
    }
  }

  // @gate enableSrcObject
  it('can SSR a Blob as an img src', async () => {
    const blob = new Blob([new Uint8Array([69, 230, 156, 181, 68, 75])], {
      type: 'image/jpeg',
    });

    const ref = React.createRef();

    function App() {
      return <img src={blob} ref={ref} />;
    }

    const stream = await ReactDOMFizzServer.renderToReadableStream(<App />);
    container.innerHTML = await readContent(stream);

    expect(container.firstChild.src).toBe('data:image/jpeg;base64,ReactURL');

    await act(() => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });

    expect(container.firstChild.src).toBe('data:image/jpeg;base64,ReactURL');
  });
});
