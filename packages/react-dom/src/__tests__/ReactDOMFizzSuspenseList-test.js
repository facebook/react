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
import {
  insertNodesAndExecuteScripts,
  getVisibleChildren,
} from '../test-utils/FizzTestUtils';

let JSDOM;
let React;
let Suspense;
let SuspenseList;
let assertLog;
let Scheduler;
let ReactDOMFizzServer;
let Stream;
let document;
let writable;
let container;
let buffer = '';
let hasErrored = false;
let hasCompleted = false;
let fatalError = undefined;

describe('ReactDOMFizzSuspenseList', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    React = require('react');
    assertLog = require('internal-test-utils').assertLog;
    ReactDOMFizzServer = require('react-dom/server');
    Stream = require('stream');

    Suspense = React.Suspense;
    SuspenseList = React.unstable_SuspenseList;

    Scheduler = require('scheduler');

    // Test Environment
    const jsdom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body><div id="container">',
      {
        runScripts: 'dangerously',
      },
    );
    document = jsdom.window.document;
    container = document.getElementById('container');
    global.window = jsdom.window;
    // The Fizz runtime assumes requestAnimationFrame exists so we need to polyfill it.
    global.requestAnimationFrame = global.window.requestAnimationFrame = cb =>
      setTimeout(cb);

    buffer = '';
    hasErrored = false;
    hasCompleted = false;

    writable = new Stream.PassThrough();
    writable.setEncoding('utf8');
    writable.on('data', chunk => {
      buffer += chunk;
    });
    writable.on('error', error => {
      hasErrored = true;
      fatalError = error;
    });
    writable.on('finish', () => {
      hasCompleted = true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function serverAct(callback) {
    await callback();
    // Await one turn around the event loop.
    // This assumes that we'll flush everything we have so far.
    await new Promise(resolve => {
      setImmediate(resolve);
    });
    if (hasErrored) {
      throw fatalError;
    }
    // JSDOM doesn't support stream HTML parser so we need to give it a proper fragment.
    // We also want to execute any scripts that are embedded.
    // We assume that we have now received a proper fragment of HTML.
    const bufferedContent = buffer;
    console.log(bufferedContent);
    buffer = '';
    const temp = document.createElement('body');
    temp.innerHTML = bufferedContent;
    await insertNodesAndExecuteScripts(temp, container, null);
    jest.runAllTimers();
  }

  function Text(props) {
    Scheduler.log(props.text);
    return <span>{props.text}</span>;
  }

  function createAsyncText(text) {
    let resolved = false;
    let error = undefined;
    const Component = function () {
      if (error !== undefined) {
        Scheduler.log('Error! [' + error.message + ']');
        throw error;
      }
      if (!resolved) {
        Scheduler.log('Suspend! [' + text + ']');
        throw promise;
      }
      return <Text text={text} />;
    };
    const promise = new Promise(resolve => {
      Component.resolve = function () {
        resolved = true;
        return resolve();
      };
      Component.reject = function (e) {
        error = e;
        return resolve();
      };
    });
    return Component;
  }

  // @gate enableSuspenseList && enableFizzSuspenseListTail
  fit('shows content forwards but hidden tail by default', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList>
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'C',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(<div />);

    await serverAct(() => A.resolve());
    assertLog(['A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('independently with revealOrder="independent"', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="independent">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await A.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog(['A', 'Suspend! [B]', 'Suspend! [C]', 'Loading B', 'Loading C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => C.resolve());
    assertLog(['C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>Loading B</span>
        <span>C</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('displays all "together"', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="together">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await A.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'A',
      'Suspend! [B]',
      'Suspend! [C]',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => C.resolve());
    assertLog(['C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('displays all "together" in a single pass', async () => {
    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="together">
            <Suspense fallback={<Text text="Loading A" />}>
              <Text text="A" />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <Text text="B" />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <Text text="C" />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
    pipe(writable);
    await 0;
    const bufferedContent = buffer;
    buffer = '';

    assertLog(['A', 'B', 'C', 'Loading A', 'Loading B', 'Loading C']);

    expect(bufferedContent).toMatchInlineSnapshot(
      `"<div><!--$--><span>A</span><!--/$--><!--$--><span>B</span><!--/$--><!--$--><span>C</span><!--/$--></div>"`,
    );
  });

  // @gate enableSuspenseList
  it('displays all "together" even when nested as siblings', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="together">
            <div>
              <Suspense fallback={<Text text="Loading A" />}>
                <A />
              </Suspense>
              <Suspense fallback={<Text text="Loading B" />}>
                <B />
              </Suspense>
            </div>
            <div>
              <Suspense fallback={<Text text="Loading C" />}>
                <C />
              </Suspense>
            </div>
          </SuspenseList>
        </div>
      );
    }

    await A.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'A',
      'Suspend! [B]',
      'Suspend! [C]',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>
          <span>Loading A</span>
          <span>Loading B</span>
        </div>
        <div>
          <span>Loading C</span>
        </div>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>
          <span>Loading A</span>
          <span>Loading B</span>
        </div>
        <div>
          <span>Loading C</span>
        </div>
      </div>,
    );

    await serverAct(() => C.resolve());
    assertLog(['C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <div>
          <span>A</span>
          <span>B</span>
        </div>
        <div>
          <span>C</span>
        </div>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('displays all "together" in nested SuspenseLists', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="together">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <SuspenseList revealOrder="together">
              <Suspense fallback={<Text text="Loading B" />}>
                <B />
              </Suspense>
              <Suspense fallback={<Text text="Loading C" />}>
                <C />
              </Suspense>
            </SuspenseList>
          </SuspenseList>
        </div>
      );
    }

    await A.resolve();
    await B.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'A',
      'B',
      'Suspend! [C]',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => C.resolve());
    assertLog(['C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('displays all "together" in nested SuspenseLists where the inner is "independent"', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="together">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <SuspenseList revealOrder="independent">
              <Suspense fallback={<Text text="Loading B" />}>
                <B />
              </Suspense>
              <Suspense fallback={<Text text="Loading C" />}>
                <C />
              </Suspense>
            </SuspenseList>
          </SuspenseList>
        </div>
      );
    }

    await A.resolve();
    await B.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'A',
      'B',
      'Suspend! [C]',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => C.resolve());
    assertLog(['C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('displays each items in "forwards" order', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="visible">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'C',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => A.resolve());
    assertLog(['A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('displays each items in "backwards" mount order', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="backwards" tail="visible">
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await A.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [C]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'A',
      'Loading C',
      'Loading B',
      'Loading A',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => C.resolve());
    assertLog(['C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>C</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('displays each items in "backwards" order in legacy mode', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="unstable_legacy-backwards" tail="visible">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await A.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [C]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'A',
      'Loading C',
      'Loading B',
      'Loading A',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => C.resolve());
    assertLog(['C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>C</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('waits for a nested SuspenseList to complete before resolving "forwards"', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="visible">
            <SuspenseList revealOrder="backwards" tail="visible">
              <Suspense fallback={<Text text="Loading B" />}>
                <B />
              </Suspense>
              <Suspense fallback={<Text text="Loading A" />}>
                <A />
              </Suspense>
            </SuspenseList>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [B]',
      'Suspend! [A]',
      'C',
      'Loading B',
      'Loading A',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => A.resolve());
    assertLog(['A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('can abort a pending SuspenseList', async () => {
    const A = createAsyncText('A');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="visible">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <Text text="B" />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    const errors = [];
    let abortStream;
    await serverAct(async () => {
      const {pipe, abort} = ReactDOMFizzServer.renderToPipeableStream(<Foo />, {
        onError(error) {
          errors.push(error.message);
        },
      });
      pipe(writable);
      abortStream = abort;
    });

    assertLog([
      'Suspend! [A]',
      'B', // TODO: Defer rendering the content after fallback if previous suspended,
      'Loading A',
      'Loading B',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
      </div>,
    );

    await serverAct(() => {
      abortStream();
    });

    expect(hasCompleted).toBe(true);
    expect(errors).toEqual([
      'The render was aborted by the server without a reason.',
    ]);
  });

  // @gate enableSuspenseList
  it('can error a pending SuspenseList', async () => {
    const A = createAsyncText('A');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="visible">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <Text text="B" />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    const errors = [];
    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />, {
        onError(error) {
          errors.push(error.message);
        },
      });
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'B', // TODO: Defer rendering the content after fallback if previous suspended,
      'Loading A',
      'Loading B',
    ]);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>Loading B</span>
      </div>,
    );

    await serverAct(async () => {
      A.reject(new Error('hi'));
    });

    assertLog(['Error! [hi]']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
        <span>B</span>
      </div>,
    );

    expect(errors).toEqual(['hi']);
    expect(hasErrored).toBe(false);
    expect(hasCompleted).toBe(true);
  });

  // @gate enableSuspenseList && enableFizzSuspenseListTail
  it('can stream in "forwards" with tail "hidden" with boundaries', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="hidden">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'C',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(<div />);

    await serverAct(() => A.resolve());
    assertLog(['A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList && enableFizzSuspenseListTail
  it('can stream in "forwards" with tail "hidden" without boundaries', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="hidden">
            <A />
            <B />
            <C />
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'C',
    ]);

    expect(getVisibleChildren(container)).toEqual(<div />);

    await serverAct(() => A.resolve());
    assertLog(['A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList && enableFizzSuspenseListTail
  it('can stream in "backwards" with tail "hidden" with boundaries', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="backwards" tail="hidden">
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'C',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(getVisibleChildren(container)).toEqual(<div />);

    await serverAct(() => A.resolve());
    assertLog(['A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>C</span>
        <span>B</span>
        <span>A</span>
      </div>,
    );
  });

  // @gate enableSuspenseList && enableFizzSuspenseListTail
  it('can stream in "backwards" with tail "hidden" without boundaries', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="backwards" tail="hidden">
            <A />
            <B />
            <C />
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'C',
    ]);

    expect(getVisibleChildren(container)).toEqual(<div />);

    await serverAct(() => A.resolve());
    assertLog(['A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>C</span>
        <span>B</span>
        <span>A</span>
      </div>,
    );
  });

  // @gate enableSuspenseList && enableFizzSuspenseListTail
  it('can stream in "forwards" with tail "collapsed"', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');
    const LoadingA = createAsyncText('Loading A');
    const LoadingB = createAsyncText('Loading B');
    const LoadingC = createAsyncText('Loading C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="collapsed">
            <Suspense fallback={<LoadingA />}>
              <A />
            </Suspense>
            <Suspense fallback={<LoadingB />}>
              <B />
            </Suspense>
            <Suspense fallback={<LoadingC />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'C',
      'Suspend! [Loading A]',
      'Suspend! [Loading B]',
      'Suspend! [Loading C]',
    ]);

    // We need the loading state for the first row before the shell completes.
    expect(getVisibleChildren(container)).toEqual(undefined);

    await serverAct(() => LoadingA.resolve());

    assertLog(['Loading A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
      </div>,
    );

    await serverAct(() => A.resolve());
    assertLog(['A']);

    // We can't show A yet because we don't yet have the loading state for the next row.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
      </div>,
    );

    await serverAct(() => LoadingB.resolve());
    assertLog(['Loading B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>Loading B</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList && enableFizzSuspenseListTail
  it('can stream in "backwards" with tail "collapsed"', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');
    const LoadingA = createAsyncText('Loading A');
    const LoadingB = createAsyncText('Loading B');
    const LoadingC = createAsyncText('Loading C');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="backwards" tail="collapsed">
            <Suspense fallback={<LoadingA />}>
              <A />
            </Suspense>
            <Suspense fallback={<LoadingB />}>
              <B />
            </Suspense>
            <Suspense fallback={<LoadingC />}>
              <C />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await C.resolve();

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog([
      'Suspend! [A]',
      'Suspend! [B]', // TODO: Defer rendering the content after fallback if previous suspended,
      'C',
      'Suspend! [Loading A]',
      'Suspend! [Loading B]',
      'Suspend! [Loading C]',
    ]);

    // We need the loading state for the first row before the shell completes.
    expect(getVisibleChildren(container)).toEqual(undefined);

    await serverAct(() => LoadingA.resolve());

    assertLog(['Loading A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
      </div>,
    );

    await serverAct(() => A.resolve());
    assertLog(['A']);

    // We can't show A yet because we don't yet have the loading state for the next row.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
      </div>,
    );

    await serverAct(() => LoadingB.resolve());
    assertLog(['Loading B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading B</span>
        <span>A</span>
      </div>,
    );

    await serverAct(() => B.resolve());
    assertLog(['B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>C</span>
        <span>B</span>
        <span>A</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('can stream in a single row "forwards" with tail "collapsed"', async () => {
    // This is a special case since there's no second loading state to unblock the first row.
    const A = createAsyncText('A');
    const LoadingA = createAsyncText('Loading A');

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="collapsed">
            {[
              <Suspense key="a" fallback={<LoadingA />}>
                <A />
              </Suspense>,
            ]}
          </SuspenseList>
        </div>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog(['Suspend! [A]', 'Suspend! [Loading A]']);

    // We need the loading state for the first row before the shell completes.
    expect(getVisibleChildren(container)).toEqual(undefined);

    await serverAct(() => LoadingA.resolve());

    assertLog(['Loading A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Loading A</span>
      </div>,
    );

    await serverAct(() => A.resolve());
    assertLog(['A']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
      </div>,
    );
  });

  // @gate enableSuspenseList && enableFizzSuspenseListTail
  it('can stream in sync rows "forwards" with tail "collapsed"', async () => {
    // Notably, this doesn't currently work if the fallbacks are blocked.
    // We need the fallbacks to unblock previous rows and we don't know we won't
    // need them until later. Needs some resolution at the end.
    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="collapsed">
            <Suspense fallback={<Text text="Loading A" />}>
              <Text text="A" />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <Text text="B" />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <Text text="C" />
            </Suspense>
          </SuspenseList>
        </div>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog(['A', 'B', 'C', 'Loading A', 'Loading B']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('can stream in sync rows "forwards" with tail "collapsed" without boundaries', async () => {
    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards" tail="collapsed">
            <Text text="A" />
            <Text text="B" />
            <Text text="C" />
          </SuspenseList>
        </div>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    assertLog(['A', 'B', 'C']);

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });

  // @gate enableSuspenseList
  it('inserts text separators (comments) for text nodes (forwards)', async () => {
    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards">{['A', 'B', 'C']}</SuspenseList>
        </div>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(<div>{['A', 'B', 'C']}</div>);

    const textNodes = 3;
    const boundaryComments = 0;
    const textSeparators = gate(flags => flags.enableFizzSuspenseListTail)
      ? textNodes // One after each node.
      : textNodes - 1; // One between each node
    const suspenseListComments = gate(flags => flags.enableFizzSuspenseListTail)
      ? 2
      : 0;
    expect(container.firstChild.childNodes.length).toBe(
      textNodes + textSeparators + boundaryComments + suspenseListComments,
    );
  });

  // @gate enableSuspenseList
  it('inserts text separators (comments) for text nodes (backwards)', async () => {
    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="backwards">{['C', 'B', 'A']}</SuspenseList>
        </div>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(<div>{['A', 'B', 'C']}</div>);

    const textNodes = 3;
    const boundaryComments = 0;
    const textSeparators = textNodes; // One after each node.
    const suspenseListComments = gate(flags => flags.enableFizzSuspenseListTail)
      ? 2
      : 0;
    expect(container.firstChild.childNodes.length).toBe(
      textNodes + textSeparators + boundaryComments + suspenseListComments,
    );
  });

  // @gate enableSuspenseList
  it('inserts text separators (comments) for text nodes (legacy)', async () => {
    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="unstable_legacy-backwards">
            {['A', 'B', 'C']}
          </SuspenseList>
        </div>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<Foo />);
      pipe(writable);
    });

    expect(getVisibleChildren(container)).toEqual(<div>{['A', 'B', 'C']}</div>);

    const textNodes = 3;
    const boundaryComments = 0;
    const textSeparators = textNodes; // One after each node.
    const suspenseListComments = gate(flags => flags.enableFizzSuspenseListTail)
      ? 2
      : 0;
    expect(container.firstChild.childNodes.length).toBe(
      textNodes + textSeparators + boundaryComments + suspenseListComments,
    );
  });
});
