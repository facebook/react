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

describe('ReactDOMSrcObject', () => {
  let React;
  let ReactDOMClient;
  // let ReactDOMServer;
  let act;
  let container;
  let assertConsoleErrorDev;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    // ReactDOMServer = require('react-dom/server');
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
});
