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
let resolvePromises;
let Scheduler;

describe('ReactBlocks', () => {
  beforeEach(() => {
    jest.resetModules();

    Scheduler = require('scheduler');
    React = require('react');
    ReactNoop = require('react-noop-renderer');

    block = React.unstable_block;
    useState = React.useState;
    Suspense = React.Suspense;
    const cache = new Map();
    let unresolved = [];
    readString = function(text) {
      let entry = cache.get(text);
      if (!entry) {
        entry = {
          promise: new Promise(resolve => {
            unresolved.push(() => {
              entry.resolved = true;
              resolve();
            });
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

    resolvePromises = () => {
      const res = unresolved;
      unresolved = [];
      res.forEach(r => r());
    };
  });

  // @gate experimental
  it('renders a simple component', () => {
    function User(props, data) {
      return <div>{typeof data}</div>;
    }

    function App({Component}) {
      return (
        <Suspense fallback={'Loading...'}>
          <Component name="Name" />
        </Suspense>
      );
    }

    const loadUser = block(User);

    ReactNoop.act(() => {
      ReactNoop.render(<App Component={loadUser()} />);
    });

    expect(ReactNoop).toMatchRenderedOutput(<div>undefined</div>);
  });

  // @gate experimental
  it('prints the name of the render function in warnings', () => {
    function load(firstName) {
      return {
        name: firstName,
      };
    }

    function User(props, data) {
      const array = [<span>{data.name}</span>];
      return <div>{array}</div>;
    }

    function App({Component}) {
      return (
        <Suspense fallback={'Loading...'}>
          <Component name="Name" />
        </Suspense>
      );
    }

    const loadUser = block(User, load);

    expect(() => {
      ReactNoop.act(() => {
        ReactNoop.render(<App Component={loadUser()} />);
      });
    }).toErrorDev(
      'Warning: Each child in a list should have a unique ' +
        '"key" prop.\n\nCheck the render method of `User`. See ' +
        'https://reactjs.org/link/warning-keys for more information.\n' +
        '    in span (at **)\n' +
        '    in User (at **)\n' +
        '    in Suspense (at **)\n' +
        '    in App (at **)',
    );
  });

  // @gate experimental
  it('renders a component with a suspending load', async () => {
    function load(id) {
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

    const loadUser = block(Render, load);

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
      resolvePromises();
    });

    expect(ReactNoop).toMatchRenderedOutput(<span>Name: Sebastian</span>);
  });

  // @gate experimental
  it('does not support a lazy wrapper around a chunk', async () => {
    function load(id) {
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

    const loadUser = block(Render, load);

    function App({User}) {
      return (
        <Suspense fallback={'Loading...'}>
          <User title="Name" />
        </Suspense>
      );
    }

    let resolveLazy;
    const LazyUser = React.lazy(
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
    await resolveLazy();

    expect(Scheduler).toFlushAndThrow(
      'Element type is invalid. Received a promise that resolves to: [object Object]. ' +
        'Lazy element type must resolve to a class or function.' +
        (__DEV__
          ? ' Did you wrap a component in React.lazy() more than once?'
          : ''),
    );
  });

  // @gate experimental
  it('can receive updated data for the same component', async () => {
    function load(firstName) {
      return {
        name: firstName,
      };
    }

    function Render(props, data) {
      const [initialName] = useState(data.name);
      return (
        <>
          <span>Initial name: {initialName}</span>
          <span>Latest name: {data.name}</span>
        </>
      );
    }

    const loadUser = block(Render, load);

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
  });

  // Regression test.
  // @gate experimental
  it('does not render stale data after ping', async () => {
    function Child() {
      return <span>Name: {readString('Sebastian')}</span>;
    }

    const loadParent = block(
      function Parent(props, data) {
        return (
          <Suspense fallback="Loading...">
            {data.name ? <Child /> : <span>Empty</span>}
          </Suspense>
        );
      },
      function load(name) {
        return {name};
      },
    );

    function App({Page}) {
      return <Page />;
    }

    await ReactNoop.act(async () => {
      ReactNoop.render(<App Page={loadParent(null)} />);
    });
    expect(ReactNoop).toMatchRenderedOutput(<span>Empty</span>);

    await ReactNoop.act(async () => {
      ReactNoop.render(<App Page={loadParent('Sebastian')} />);
    });
    await ReactNoop.act(async () => {
      resolvePromises();
    });
    expect(ReactNoop).toMatchRenderedOutput(<span>Name: Sebastian</span>);
  });

  // Regression test.
  // @gate experimental
  it('does not render stale data after ping and setState', async () => {
    function Child() {
      return <span>Name: {readString('Sebastian')}</span>;
    }

    let _setSuspend;
    const loadParent = block(
      function Parent(props, data) {
        const [suspend, setSuspend] = useState(true);
        _setSuspend = setSuspend;
        if (!suspend) {
          return <span>{data.name}</span>;
        }
        return (
          <Suspense fallback="Loading...">
            {data.name ? <Child /> : <span>Empty</span>}
          </Suspense>
        );
      },
      function load(name) {
        return {name};
      },
    );

    function App({Page}) {
      return <Page />;
    }

    await ReactNoop.act(async () => {
      ReactNoop.render(<App Page={loadParent(null)} />);
    });
    expect(ReactNoop).toMatchRenderedOutput(<span>Empty</span>);

    await ReactNoop.act(async () => {
      ReactNoop.render(<App Page={loadParent('Sebastian')} />);
    });
    await ReactNoop.act(async () => {
      _setSuspend(false);
      resolvePromises();
    });
    expect(ReactNoop).toMatchRenderedOutput(<span>Sebastian</span>);
  });
});
