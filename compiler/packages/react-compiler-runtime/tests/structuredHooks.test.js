const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const {JSDOM} = require('jsdom');
const {createRoot} = require('react-dom/client');

const {
  experimental_createStructuredHookSession,
  experimental_useStructuredHooks,
} = require('../dist/index.js');

const act = React.act ?? require('react-dom/test-utils').act;

async function withDom(callback) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
  const previousGlobals = {
    document: global.document,
    HTMLElement: global.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT,
    Node: global.Node,
    navigator: global.navigator,
    window: global.window,
  };

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  try {
    return await callback(dom.window.document.getElementById('root'));
  } finally {
    dom.window.close();
    global.window = previousGlobals.window;
    global.document = previousGlobals.document;
    global.navigator = previousGlobals.navigator;
    global.HTMLElement = previousGlobals.HTMLElement;
    global.Node = previousGlobals.Node;
    global.IS_REACT_ACT_ENVIRONMENT = previousGlobals.IS_REACT_ACT_ENVIRONMENT;
  }
}

test('retains conditional state cells across branch toggles', () => {
  const session = experimental_createStructuredHookSession((hooks, input) => {
    const [count, setCount] = hooks.state('count', 0);
    let detail = null;

    if (input.showDetail) {
      const [label, setLabel] = hooks.state('detail.label', () => 'Ada');
      detail = {label, setLabel};
    }

    return {count, detail, setCount};
  });

  let result = session.update({showDetail: true});
  assert.equal(result.detail.label, 'Ada');
  result.detail.setLabel(prev => prev + ' Lovelace');

  result = session.update({showDetail: false});
  assert.equal(result.detail, null);
  assert.deepEqual(session.getActiveKeys(), ['count']);
  assert.deepEqual(session.getStoredKeys(), ['count', 'detail.label']);

  result = session.update({showDetail: true});
  assert.equal(result.detail.label, 'Ada Lovelace');
  assert.deepEqual(session.getActiveKeys(), ['count', 'detail.label']);
});

test('memo cells survive hidden branches without recomputing', () => {
  let computeCount = 0;
  const session = experimental_createStructuredHookSession((hooks, input) => {
    if (!input.showBadge) {
      return null;
    }
    return hooks.memo('badge.text', [input.label], () => {
      computeCount++;
      return input.label.toUpperCase();
    });
  });

  assert.equal(session.update({label: 'alpha', showBadge: true}), 'ALPHA');
  assert.equal(computeCount, 1);

  assert.equal(session.update({label: 'ignored', showBadge: false}), null);
  assert.equal(computeCount, 1);

  assert.equal(session.update({label: 'alpha', showBadge: true}), 'ALPHA');
  assert.equal(computeCount, 1);

  assert.equal(session.update({label: 'beta', showBadge: true}), 'BETA');
  assert.equal(computeCount, 2);
});

test('throws when the same structured hook key is reused in one render', () => {
  const session = experimental_createStructuredHookSession(hooks => {
    hooks.state('dup', 0);
    hooks.state('dup', 1);
    return null;
  });

  assert.throws(() => session.update({}), /used more than once in the same render/);
});

test('throws when a key changes hook kind across renders', () => {
  const session = experimental_createStructuredHookSession((hooks, input) => {
    if (input.mode === 'state') {
      return hooks.state('shared', 0)[0];
    }
    return hooks.memo('shared', [], () => 1);
  });

  assert.equal(session.update({mode: 'state'}), 0);
  assert.throws(() => session.update({mode: 'memo'}), /changed hook kind/);
});

test('reset clears dormant cells and restarts initialization', () => {
  const session = experimental_createStructuredHookSession((hooks, input) => {
    const [value, setValue] = hooks.state('value', () => 10);
    if (input.bump) {
      setValue(prev => prev + 1);
    }
    return value;
  });

  assert.equal(session.update({bump: false}), 10);
  session.update({bump: true});
  assert.deepEqual(session.getStoredKeys(), ['value']);

  session.reset();
  assert.deepEqual(session.getStoredKeys(), []);
  assert.equal(session.update({bump: false}), 10);
});

test('react-hosted structured hooks preserve conditional state across rerenders', async () => {
  await withDom(async container => {
    let latest = null;

    function App({showDetail}) {
      latest = experimental_useStructuredHooks(hooks => {
        const [count, setCount] = hooks.state('count', 0);
        let detail = 'hidden';
        let rename = null;

        if (showDetail) {
          const [label, setLabel] = hooks.state('detail.label', () => 'Ada');
          detail = label;
          rename = () => setLabel(prev => prev + '!');
        }

        return {
          count,
          detail,
          increment: () => setCount(prev => prev + 1),
          rename,
        };
      });

      return React.createElement('div', null, `${latest.count}:${latest.detail}`);
    }

    const root = createRoot(container);
    try {
      await act(async () => {
        root.render(React.createElement(App, {showDetail: true}));
      });
      assert.equal(container.textContent, '0:Ada');

      await act(async () => {
        latest.rename();
      });
      assert.equal(container.textContent, '0:Ada!');

      await act(async () => {
        root.render(React.createElement(App, {showDetail: false}));
      });
      assert.equal(container.textContent, '0:hidden');

      await act(async () => {
        latest.increment();
      });
      assert.equal(container.textContent, '1:hidden');

      await act(async () => {
        root.render(React.createElement(App, {showDetail: true}));
      });
      assert.equal(container.textContent, '1:Ada!');
    } finally {
      await act(async () => {
        root.unmount();
      });
    }
  });
});