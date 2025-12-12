// @jest-environment jsdom

import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import {act} from 'internal-test-utils';

describe('form submitter with input[name="id"]', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    delete window.__SUBMIT_ACTION__;
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
    delete window.__SUBMIT_ACTION__;
  });

  it('includes submitter when input[name="id"] exists (button inside form)', async () => {
    function App() {
      async function action(fd) {
        window.__SUBMIT_ACTION__ = fd.get('action');
      }
      return (
        <form id="my-form" action={action}>
          <input type="hidden" name="id" value="1" />
          <button type="submit" name="action" value="save">
            Save
          </button>
        </form>
      );
    }

    await act(async () => {
      const root = ReactDOMClient.createRoot(container);
      root.render(<App />);
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(window.__SUBMIT_ACTION__).toBe('save');
  });

  it('includes submitter when using external button with form attribute', async () => {
    function AppExternal() {
      async function action(fd) {
        window.__SUBMIT_ACTION__ = fd.get('action');
      }
      return (
        <>
          <form id="my-form" action={action}>
            <input type="hidden" name="id" value="1" />
          </form>
          <button type="submit" name="action" value="save" form="my-form">
            Save
          </button>
        </>
      );
    }

    await act(async () => {
      const root = ReactDOMClient.createRoot(container);
      root.render(<AppExternal />);
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(window.__SUBMIT_ACTION__).toBe('save');
  });
});
