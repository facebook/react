/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

let React;
let ReactNoop;
let useState;
let Suspense;
let block;
let readString;

describe('ReactBlocks', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');

    block = React.block;
    useState = React.useState;
    Suspense = React.Suspense;
    let cache = new Map();
    readString = function(text) {
      let entry = cache.get(text);
      if (!entry) {
        entry = {
          promise: new Promise(resolve => {
            setTimeout(() => {
              entry.resolved = true;
              resolve();
            }, 100);
          }),
          resolved: false,
        };
        cache.set(text, entry);
      }
      if (!entry.resolved) {
        throw entry.promise;
      }
      return text;
    };
  });

  it.experimental('renders a component with a suspending query', async () => {
    function Query(id) {
      return {
        id: id,
        name: readString('Sebastian'),
      };
    }

    function Render(props, data) {
      return (
        <span>
          {props.title}: {data.name}
        </span>
      );
    }

    let loadUser = block(Query, Render);

    function App({User}) {
      return (
        <Suspense fallback={'Loading...'}>
          <User title="Name" />
        </Suspense>
      );
    }

    await ReactNoop.act(async () => {
      ReactNoop.render(<App User={loadUser(123)} />);
    });

    expect(ReactNoop).toMatchRenderedOutput('Loading...');

    await ReactNoop.act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(ReactNoop).toMatchRenderedOutput(<span>Name: Sebastian</span>);
  });

  it.experimental('supports a lazy wrapper around a chunk', async () => {
    function Query(id) {
      return {
        id: id,
        name: readString('Sebastian'),
      };
    }

    function Render(props, data) {
      return (
        <span>
          {props.title}: {data.name}
        </span>
      );
    }

    let loadUser = block(Query, Render);

    function App({User}) {
      return (
        <Suspense fallback={'Loading...'}>
          <User title="Name" />
        </Suspense>
      );
    }

    let resolveLazy;
    let LazyUser = React.lazy(
      () =>
        new Promise(resolve => {
          resolveLazy = function() {
            resolve({
              default: loadUser(123),
            });
          };
        }),
    );

    await ReactNoop.act(async () => {
      ReactNoop.render(<App User={LazyUser} />);
    });

    expect(ReactNoop).toMatchRenderedOutput('Loading...');

    // Resolve the component.
    await ReactNoop.act(async () => {
      await resolveLazy();
    });

    // We're still waiting on the data.
    expect(ReactNoop).toMatchRenderedOutput('Loading...');

    await ReactNoop.act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(ReactNoop).toMatchRenderedOutput(<span>Name: Sebastian</span>);
  });

  it.experimental(
    'can receive updated data for the same component',
    async () => {
      function Query(firstName) {
        return {
          name: firstName,
        };
      }

      function Render(props, data) {
        let [initialName] = useState(data.name);
        return (
          <>
            <span>Initial name: {initialName}</span>
            <span>Latest name: {data.name}</span>
          </>
        );
      }

      let loadUser = block(Query, Render);

      function App({User}) {
        return (
          <Suspense fallback={'Loading...'}>
            <User title="Name" />
          </Suspense>
        );
      }

      await ReactNoop.act(async () => {
        ReactNoop.render(<App User={loadUser('Sebastian')} />);
      });

      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <span>Initial name: Sebastian</span>
          <span>Latest name: Sebastian</span>
        </>,
      );

      await ReactNoop.act(async () => {
        ReactNoop.render(<App User={loadUser('Dan')} />);
      });

      expect(ReactNoop).toMatchRenderedOutput(
        <>
          <span>Initial name: Sebastian</span>
          <span>Latest name: Dan</span>
        </>,
      );
    },
  );
});
