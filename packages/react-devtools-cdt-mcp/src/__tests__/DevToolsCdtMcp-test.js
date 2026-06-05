/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const TOOL_NAMES = [
  'react_get_component_tree',
  'react_get_component',
  'react_find_components',
  'react_get_component_source',
  'react_get_owners_stack',
  'react_get_owners_branch',
  'react_start_profiling',
  'react_stop_profiling',
  'react_get_trace_overview',
  'react_get_commit_report',
];

let register;
let facade;
let toolGroup;
let unregister;
let React;
let ReactDOMClient;
let act;
let container;

// Look up a registered tool by name.
function getTool(name) {
  return toolGroup.tools.find(tool => tool.name === name);
}

// Dispatch chrome-devtools-mcp's discovery event and return the tool group the
// page responds with (synchronously). The tools are built lazily in the
// handler, so discovery is what actually constructs them.
function discover() {
  let group = null;
  const event = new CustomEvent('devtoolstooldiscovery');
  // $FlowFixMe[prop-missing] chrome-devtools-mcp attaches respondWith
  event.respondWith = responded => {
    group = responded;
  };
  window.dispatchEvent(event);
  return group;
}

describe('react-devtools-cdt-mcp', () => {
  beforeEach(() => {
    jest.resetModules();
    global.IS_REACT_ACT_ENVIRONMENT = true;

    delete globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    delete globalThis.__dtmcp;

    // register() installs the facade BEFORE React so the hook captures the
    // first commit, then registers the discovery listener (tools are built
    // lazily when chrome-devtools-mcp discovers them).
    register = require('../DevToolsCdtMcp').register;
    const result = register();
    facade = result.facade;
    unregister = result.unregister;

    // Obtain the tool group the way chrome-devtools-mcp does.
    toolGroup = discover();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = React.act;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Remove the discovery listener so it does not accumulate on the shared
    // jsdom window across tests.
    unregister();
    document.body.removeChild(container);
    container = null;
  });

  it('installs the DevTools hook on register', () => {
    expect(globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBe(facade.hook);
  });

  it('does not install any tool globals (chrome-devtools-mcp owns __dtmcp)', () => {
    expect(globalThis.__REACT_TOOLS__).toBeUndefined();
    expect(globalThis.__dtmcp).toBeUndefined();
  });

  it('builds a "react" tool group exposing every facade tool', () => {
    expect(toolGroup.name).toBe('react');
    expect(typeof toolGroup.description).toBe('string');
    expect(toolGroup.description.length).toBeGreaterThan(0);
    expect(toolGroup.tools.map(tool => tool.name)).toEqual(TOOL_NAMES);

    toolGroup.tools.forEach(tool => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema.type).toBe('object');
      expect(typeof tool.execute).toBe('function');
    });
  });

  it('declares JSON-Schema input with required params', () => {
    expect(getTool('react_get_component').inputSchema).toEqual({
      type: 'object',
      properties: {label: {type: 'string', description: expect.any(String)}},
      required: ['label'],
    });
    expect(getTool('react_get_commit_report').inputSchema).toEqual({
      type: 'object',
      properties: {
        traceName: {type: 'string', description: expect.any(String)},
        commitIndex: {type: 'number', description: expect.any(String)},
      },
      required: ['traceName', 'commitIndex'],
    });
    expect(getTool('react_stop_profiling').inputSchema).toEqual({
      type: 'object',
      properties: {},
    });
  });

  it('react_get_component_tree returns the component tree', () => {
    function App() {
      return <div>hello</div>;
    }

    act(() => {
      ReactDOMClient.createRoot(container).render(<App />);
    });

    const result = getTool('react_get_component_tree').execute({});
    // Labels are assigned deterministically as fibers are first encountered. A
    // fiber's first child is labeled before the fiber itself, so App (the host
    // root's first child) is @c0, the host root is @c1, and the div is @c2.
    expect(result).toEqual([
      {
        label: '@c1',
        type: 'root',
        name: 'createRoot()',
        key: null,
        firstChild: '@c0',
        nextSibling: null,
      },
      {
        label: '@c0',
        type: 'function',
        name: 'App',
        key: null,
        firstChild: '@c2',
        nextSibling: null,
      },
      {
        label: '@c2',
        type: 'host',
        name: 'div',
        key: null,
        firstChild: null,
        nextSibling: null,
      },
    ]);
  });

  it('react_find_components maps args and returns paginated results', () => {
    function Card() {
      return <div>card</div>;
    }
    function App() {
      return (
        <div>
          <Card key="a" />
          <Card key="b" />
        </div>
      );
    }

    act(() => {
      ReactDOMClient.createRoot(container).render(<App />);
    });

    const result = getTool('react_find_components').execute({name: 'Card'});
    // Matches are labeled in result order during row building: Card "a" is @c0
    // (its div @c1) and Card "b" is @c2 (its div @c3).
    expect(result).toEqual({
      page: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
      results: [
        {
          label: '@c0',
          type: 'function',
          name: 'Card',
          key: 'a',
          firstChild: '@c1',
          nextSibling: null,
        },
        {
          label: '@c2',
          type: 'function',
          name: 'Card',
          key: 'b',
          firstChild: '@c3',
          nextSibling: null,
        },
      ],
    });
  });

  it('react_get_component returns props and hooks', () => {
    function Counter() {
      const [count] = React.useState(3);
      return <div>{count}</div>;
    }

    act(() => {
      ReactDOMClient.createRoot(container).render(<Counter title="hi" />);
    });

    const tree = getTool('react_get_component_tree').execute({});
    // Counter is the host root's first child, so it is @c0 (host root @c1, the
    // div @c2).
    expect(tree).toEqual([
      {
        label: '@c1',
        type: 'root',
        name: 'createRoot()',
        key: null,
        firstChild: '@c0',
        nextSibling: null,
      },
      {
        label: '@c0',
        type: 'function',
        name: 'Counter',
        key: null,
        firstChild: '@c2',
        nextSibling: null,
      },
      {
        label: '@c2',
        type: 'host',
        name: 'div',
        key: null,
        firstChild: null,
        nextSibling: null,
      },
    ]);

    const counter = tree.find(n => n.name === 'Counter');
    expect(counter.label).toBe('@c0');

    const info = getTool('react_get_component').execute({label: counter.label});
    expect(info).toEqual({
      label: '@c0',
      type: 'function',
      name: 'Counter',
      props: {title: 'hi'},
      hooks: [{id: 0, name: 'State', value: 3, subHooks: []}],
    });
  });

  it('returns tool errors as a raw payload', () => {
    const result = getTool('react_get_component').execute({label: '@c9999'});
    expect(result).toEqual({error: 'Component not found: "@c9999"'});
  });

  it('profiling tools record and report commits through the integration', () => {
    function Counter({count}) {
      return <div>{'Count: ' + count}</div>;
    }

    const root = ReactDOMClient.createRoot(container);
    act(() => {
      root.render(<Counter count={0} />);
    });

    expect(getTool('react_start_profiling').execute({name: 'trace'})).toEqual({
      status: 'started',
      trace: 'trace',
    });

    act(() => {
      root.render(<Counter count={1} />);
    });

    expect(getTool('react_stop_profiling').execute({})).toEqual({
      status: 'stopped',
      trace: 'trace',
      commits: 1,
    });

    const overview = getTool('react_get_trace_overview').execute({
      traceName: 'trace',
    });
    expect(overview).toHaveLength(1);
    expect(overview[0].commit).toBe(0);

    // The commit report lists the fibers that rendered, sorted by actualDuration
    // descending, with labels assigned in commit-walk order: the host root @c0
    // (widest duration), then Counter @c1, then the div @c2. Durations are
    // timing-dependent, so assert identity (label/name/type) only.
    const report = getTool('react_get_commit_report').execute({
      traceName: 'trace',
      commitIndex: 0,
    });
    expect(
      report.components.map(c => ({
        label: c.label,
        name: c.name,
        type: c.type,
      })),
    ).toEqual([
      {label: '@c0', name: 'createRoot()', type: 'root'},
      {label: '@c1', name: 'Counter', type: 'function'},
      {label: '@c2', name: 'div', type: 'host'},
    ]);
  });

  it('responds synchronously to discovery with the react tool group', () => {
    const discovered = discover();
    expect(discovered).not.toBe(null);
    expect(discovered.name).toBe('react');
    expect(discovered.tools.map(tool => tool.name)).toEqual(TOOL_NAMES);
  });

  it('builds the tool group lazily and memoizes it across discoveries', () => {
    // Repeated discovery returns the same instance, so component labels stay
    // stable across calls.
    expect(discover()).toBe(discover());
  });

  it('unregister removes the discovery listener', () => {
    unregister();
    // No listener responds, so chrome-devtools-mcp would discover nothing.
    expect(discover()).toBe(null);
  });

  it('tools are callable via window.__dtmcp.executeTool', async () => {
    function App() {
      return <div>hello</div>;
    }
    act(() => {
      ReactDOMClient.createRoot(container).render(<App />);
    });

    // Reproduce chrome-devtools-mcp's exact discovery + execution wiring.
    const event = new CustomEvent('devtoolstooldiscovery');
    // $FlowFixMe[prop-missing] chrome-devtools-mcp attaches respondWith
    event.respondWith = group => {
      globalThis.__dtmcp = {
        toolGroup: group,
        executeTool: async (toolName, args) => {
          const tool = group.tools.find(t => t.name === toolName);
          return tool.execute(args);
        },
      };
    };
    window.dispatchEvent(event);

    const result = await globalThis.__dtmcp.executeTool(
      'react_get_component_tree',
      {},
    );
    // Same deterministic labels as the direct react_get_component_tree path: App @c0,
    // host root @c1, div @c2.
    expect(result).toEqual([
      {
        label: '@c1',
        type: 'root',
        name: 'createRoot()',
        key: null,
        firstChild: '@c0',
        nextSibling: null,
      },
      {
        label: '@c0',
        type: 'function',
        name: 'App',
        key: null,
        firstChild: '@c2',
        nextSibling: null,
      },
      {
        label: '@c2',
        type: 'host',
        name: 'div',
        key: null,
        firstChild: null,
        nextSibling: null,
      },
    ]);
  });
});
