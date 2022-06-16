/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
let React;
let ReactNoop;
let Scheduler;
let Suspense;
let getCacheForType;
let caches;
let seededCache;

describe('ReactSuspenseFallback', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
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

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  // @gate enableCache
  it('suspends and shows fallback', () => {
    ReactNoop.render(
      <Suspense fallback={<Text text="Loading..." />}>
        <AsyncText text="A" ms={100} />
      </Suspense>,
    );

    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
  });

  // @gate enableCache
  it('suspends and shows null fallback', () => {
    ReactNoop.render(
      <Suspense fallback={null}>
        <AsyncText text="A" ms={100} />
      </Suspense>,
    );

    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      // null
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  // @gate enableCache
  it('suspends and shows undefined fallback', () => {
    ReactNoop.render(
      <Suspense>
        <AsyncText text="A" ms={100} />
      </Suspense>,
    );

    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      // null
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  // @gate enableCache
  it('suspends and shows inner fallback', () => {
    ReactNoop.render(
      <Suspense fallback={<Text text="Should not show..." />}>
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="A" ms={100} />
        </Suspense>
      </Suspense>,
    );

    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading...']);
    expect(ReactNoop.getChildren()).toEqual([span('Loading...')]);
  });

  // @gate enableCache
  it('suspends and shows inner undefined fallback', () => {
    ReactNoop.render(
      <Suspense fallback={<Text text="Should not show..." />}>
        <Suspense>
          <AsyncText text="A" ms={100} />
        </Suspense>
      </Suspense>,
    );

    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      // null
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });

  // @gate enableCache
  it('suspends and shows inner null fallback', () => {
    ReactNoop.render(
      <Suspense fallback={<Text text="Should not show..." />}>
        <Suspense fallback={null}>
          <AsyncText text="A" ms={100} />
        </Suspense>
      </Suspense>,
    );

    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      // null
    ]);
    expect(ReactNoop.getChildren()).toEqual([]);
  });
});
