const assert = require('node:assert/strict');
const test = require('node:test');

const {
  experimental_createRenderTraceSession,
  experimental_createTraceSelector,
} = require('../dist/index.js');

function createBaseInput(overrides = {}) {
  return {
    count: 0,
    items: ['a', 'b'],
    showMeta: true,
    theme: 'dark',
    title: 'Inbox',
    user: 'ada',
    ...overrides,
  };
}

function createSession() {
  let renderCalls = 0;
  const titleSelector = experimental_createTraceSelector('title', input => input.title);
  const countSelector = experimental_createTraceSelector('count', input => input.count);
  const themeSelector = experimental_createTraceSelector('theme', input => input.theme);
  const showMetaSelector = experimental_createTraceSelector(
    'showMeta',
    input => input.showMeta,
  );
  const userSelector = experimental_createTraceSelector('user', input => input.user);
  const itemsSelector = experimental_createTraceSelector(
    'items.length',
    input => input.items,
    (prev, next) => prev.length === next.length,
  );

  const session = experimental_createRenderTraceSession((trace, input) => {
    renderCalls++;
    trace.text('title', [titleSelector], data => data.title);
    trace.text('body', [countSelector], data => `#${data.count}`);
    trace.text('bucket', [countSelector], data => Math.floor(data.count / 2));

    if (trace.guard(themeSelector) === 'dark') {
      trace.attr('root', 'color', [themeSelector], () => '#fff');
    } else {
      trace.attr('root', 'color', [themeSelector], () => '#111');
    }

    if (trace.guard(showMetaSelector)) {
      trace.text('meta', [userSelector, itemsSelector], data => {
        return `${data.user}:${data.items.length}`;
      });
    }
  });

  return {
    getRenderCalls() {
      return renderCalls;
    },
    session,
  };
}

test('records the initial render as mutations', () => {
  const {session, getRenderCalls} = createSession();
  const result = session.update(createBaseInput());

  assert.equal(result.mode, 'record');
  assert.equal(result.invalidatedBy, null);
  assert.equal(getRenderCalls(), 1);
  assert.equal(result.mutations.length, 5);
  assert.deepEqual(
    result.mutations.map(mutation => mutation.slot),
    ['title', 'body', 'bucket', 'root', 'meta'],
  );
  assert.deepEqual(result.stats, {
    fullRenders: 1,
    guardInvalidations: 0,
    patchMutations: 0,
    patchRecomputations: 0,
  });
});

test('replays stable-path updates without re-running the render callback', () => {
  const {session, getRenderCalls} = createSession();
  session.update(createBaseInput());

  const result = session.update(createBaseInput({count: 1}));

  assert.equal(result.mode, 'replay');
  assert.equal(getRenderCalls(), 1);
  assert.equal(result.mutations.length, 1);
  assert.deepEqual(result.mutations[0], {
    kind: 'text',
    name: null,
    previousValue: '#0',
    slot: 'body',
    value: '#1',
  });
  assert.deepEqual(result.stats, {
    fullRenders: 1,
    guardInvalidations: 0,
    patchMutations: 1,
    patchRecomputations: 2,
  });
});

test('invalidates and re-records when a branch guard changes', () => {
  const {session, getRenderCalls} = createSession();
  session.update(createBaseInput());

  const result = session.update(createBaseInput({theme: 'light'}));

  assert.equal(result.mode, 'invalidate');
  assert.equal(result.invalidatedBy, 'theme');
  assert.equal(getRenderCalls(), 2);
  assert.equal(result.mutations.length, 5);
  assert.equal(result.mutations[3].name, 'color');
  assert.equal(result.mutations[3].value, '#111');
  assert.deepEqual(result.stats, {
    fullRenders: 2,
    guardInvalidations: 1,
    patchMutations: 0,
    patchRecomputations: 0,
  });
});

test('supports selector equality functions to suppress noisy recomputations', () => {
  const {session, getRenderCalls} = createSession();
  session.update(createBaseInput());

  const result = session.update(createBaseInput({items: ['x', 'y']}));

  assert.equal(result.mode, 'replay');
  assert.equal(getRenderCalls(), 1);
  assert.equal(result.mutations.length, 0);
  assert.deepEqual(result.stats, {
    fullRenders: 1,
    guardInvalidations: 0,
    patchMutations: 0,
    patchRecomputations: 0,
  });
});

test('reset drops the recorded tape and starts over on the next update', () => {
  const {session, getRenderCalls} = createSession();
  session.update(createBaseInput());
  session.reset();

  const result = session.update(createBaseInput({count: 3}));

  assert.equal(result.mode, 'record');
  assert.equal(getRenderCalls(), 2);
  assert.equal(session.getRecordedOperationCount(), 5);
  assert.deepEqual(session.stats(), {
    fullRenders: 1,
    guardInvalidations: 0,
    patchMutations: 0,
    patchRecomputations: 0,
  });
});
