/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let React;
let ReactNoop;
let Scheduler;
let act;
let Suspense;
let SuspenseList;
let getCacheForType;
let caches;
let seededCache;

beforeEach(() => {
  React = require('react');
  ReactNoop = require('react-noop-renderer');
  Scheduler = require('scheduler');
  act = require('jest-react').act;

  Suspense = React.Suspense;
  if (gate(flags => flags.enableSuspenseList)) {
    SuspenseList = React.SuspenseList;
  }

  getCacheForType = React.unstable_getCacheForType;

  caches = [];
  seededCache = null;
});

function createTextCache() {
  if (seededCache !== null) {
    // Trick to seed a cache before it exists.
    // TODO: Need a built-in API to seed data before the initial render (i.e.
    // not a refresh because nothing has mounted yet).
    const cache = seededCache;
    seededCache = null;
    return cache;
  }

  const data = new Map();
  const version = caches.length + 1;
  const cache = {
    version,
    data,
    resolve(text) {
      const record = data.get(text);
      if (record === undefined) {
        const newRecord = {
          status: 'resolved',
          value: text,
        };
        data.set(text, newRecord);
      } else if (record.status === 'pending') {
        const thenable = record.value;
        record.status = 'resolved';
        record.value = text;
        thenable.pings.forEach(t => t());
      }
    },
    reject(text, error) {
      const record = data.get(text);
      if (record === undefined) {
        const newRecord = {
          status: 'rejected',
          value: error,
        };
        data.set(text, newRecord);
      } else if (record.status === 'pending') {
        const thenable = record.value;
        record.status = 'rejected';
        record.value = error;
        thenable.pings.forEach(t => t());
      }
    },
  };
  caches.push(cache);
  return cache;
}

function readText(text) {
  const textCache = getCacheForType(createTextCache);
  const record = textCache.data.get(text);
  if (record !== undefined) {
    switch (record.status) {
      case 'pending':
        Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
        throw record.value;
      case 'rejected':
        Scheduler.unstable_yieldValue(`Error! [${text}]`);
        throw record.value;
      case 'resolved':
        return textCache.version;
    }
  } else {
    Scheduler.unstable_yieldValue(`Suspend! [${text}]`);

    const thenable = {
      pings: [],
      then(resolve) {
        if (newRecord.status === 'pending') {
          thenable.pings.push(resolve);
        } else {
          Promise.resolve().then(() => resolve(newRecord.value));
        }
      },
    };

    const newRecord = {
      status: 'pending',
      value: thenable,
    };
    textCache.data.set(text, newRecord);

    throw thenable;
  }
}

function Text({text}) {
  Scheduler.unstable_yieldValue(text);
  return <span prop={text} />;
}

function AsyncText({text, showVersion}) {
  const version = readText(text);
  const fullText = showVersion ? `${text} [v${version}]` : text;
  Scheduler.unstable_yieldValue(fullText);
  return <span prop={fullText} />;
}

// function seedNextTextCache(text) {
//   if (seededCache === null) {
//     seededCache = createTextCache();
//   }
//   seededCache.resolve(text);
// }

function resolveMostRecentTextCache(text) {
  if (caches.length === 0) {
    throw Error('Cache does not exist.');
  } else {
    // Resolve the most recently created cache. An older cache can by
    // resolved with `caches[index].resolve(text)`.
    caches[caches.length - 1].resolve(text);
  }
}

const resolveText = resolveMostRecentTextCache;

// Don't feel too guilty if you have to delete this test.
// @gate dfsEffectsRefactor
// @gate __DEV__
test('warns in DEV if return pointer is inconsistent', async () => {
  const {useRef, useLayoutEffect} = React;

  let ref = null;
  function App({text}) {
    ref = useRef(null);
    return (
      <>
        <Sibling text={text} />
        <div ref={ref}>{text}</div>
      </>
    );
  }

  function Sibling({text}) {
    useLayoutEffect(() => {
      if (text === 'B') {
        // Mutate the return pointer of the div to point to the wrong alternate.
        // This simulates the most common type of return pointer inconsistency.
        const current = ref.current.fiber;
        const workInProgress = current.alternate;
        workInProgress.return = current.return;
      }
    }, [text]);
    return null;
  }

  const root = ReactNoop.createRoot();
  await act(async () => {
    root.render(<App text="A" />);
  });

  spyOnDev(console, 'error');
  await act(async () => {
    root.render(<App text="B" />);
  });
  expect(console.error.calls.count()).toBe(1);
  expect(console.error.calls.argsFor(0)[0]).toMatch(
    'Internal React error: Return pointer is inconsistent with parent.',
  );
});

// @gate enableCache
// @gate enableSuspenseList
test('regression (#20932): return pointer is correct before entering deleted tree', async () => {
  // Based on a production bug. Designed to trigger a very specific
  // implementation path.
  function Tail() {
    return (
      <Suspense fallback={<Text text="Loading Tail..." />}>
        <Text text="Tail" />
      </Suspense>
    );
  }

  function App() {
    return (
      <SuspenseList revealOrder="forwards">
        <Suspense fallback={<Text text="Loading Async..." />}>
          <Async />
        </Suspense>
        <Tail />
      </SuspenseList>
    );
  }

  let setAsyncText;
  function Async() {
    const [c, _setAsyncText] = React.useState(0);
    setAsyncText = _setAsyncText;
    return <AsyncText text={c} />;
  }

  const root = ReactNoop.createRoot();
  await act(async () => {
    root.render(<App />);
  });
  expect(Scheduler).toHaveYielded([
    'Suspend! [0]',
    'Loading Async...',
    'Loading Tail...',
  ]);
  await act(async () => {
    resolveText(0);
  });
  expect(Scheduler).toHaveYielded([0, 'Tail']);
  await act(async () => {
    setAsyncText(x => x + 1);
  });
  expect(Scheduler).toHaveYielded([
    'Suspend! [1]',
    'Loading Async...',
    'Suspend! [1]',
    'Loading Async...',
  ]);
});
