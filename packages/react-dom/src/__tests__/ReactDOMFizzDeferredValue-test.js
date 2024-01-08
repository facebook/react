'use strict';

// Required imports and polyfills
import {
  insertNodesAndExecuteScripts,
  getVisibleChildren,
} from '../test-utils/FizzTestUtils';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;

// Test variables
let act;
let assertLog;
let waitForPaint;
let container;
let React;
let Scheduler;
let ReactDOMServer;
let ReactDOMClient;
let useDeferredValue;
let Suspense;

// Test suite for -- ReactDOMFizzForm
describe('ReactDOMFizzForm', () => {
  
  //  imp Setup before each test
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    Scheduler = require('scheduler');
    ReactDOMServer = require('react-dom/server.browser');
    ReactDOMClient = require('react-dom/client');
    useDeferredValue = React.useDeferredValue;
    Suspense = React.Suspense;
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    waitForPaint = require('internal-test-utils').waitForPaint;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  // After each test cleanup
  afterEach(() => {
    document.body.removeChild(container);
  });

  // Function to read data into the container
  async function readIntoContainer(stream) {
    const reader = stream.getReader();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      result += Buffer.from(value).toString('utf8');
    }
    const temp = document.createElement('div');
    temp.innerHTML = result;
    insertNodesAndExecuteScripts(temp, container, null);
  }

  // Rendering text -- component
  function Text({ text }) {
    Scheduler.log(text);
    return text;
  }

  // Test case: Returns initialValue argument only if provided
  it('returns initialValue argument, if provided', async () => {
    function App() {
      return useDeferredValue('Final', 'Initial');
    }

    const stream = await ReactDOMServer.renderToReadableStream(<App />);
    await readIntoContainer(stream);
    expect(container.textContent).toEqual('Initial');

    await act(() => ReactDOMClient.hydrateRoot(container, <App />));
    expect(container.textContent).toEqual('Final');
  });

  // here other test cases can be added
});
