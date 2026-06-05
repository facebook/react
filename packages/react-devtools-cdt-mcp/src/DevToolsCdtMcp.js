/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {installFacade, createTools} from 'react-devtools-facade';

import type {Facade, Tools} from 'react-devtools-facade';

// A tool definition: its chrome-devtools-mcp metadata plus how to invoke the
// underlying react-devtools-facade tool. `call` maps the params object that
// chrome-devtools-mcp passes (parsed + ajv-validated against inputSchema) onto
// the facade tool's positional arguments.
type ToolDefinition = {
  name: string,
  description: string,
  inputSchema: {[string]: mixed},
  call: (tools: Tools, args: {[string]: any}) => mixed,
};

const TOOL_DEFINITIONS: Array<ToolDefinition> = [
  {
    name: 'react_get_component_tree',
    description:
      'Snapshot of the React component tree as a flat array of nodes ' +
      '{label, type, name, key, firstChild, nextSibling}, where firstChild/' +
      'nextSibling link nodes by label. label is the stable handle the other ' +
      'tools accept. Covers every mounted root unless rootLabel scopes the ' +
      'walk (depth defaults to 20).',
    inputSchema: {
      type: 'object',
      properties: {
        depth: {
          type: 'number',
          description: 'Maximum tree depth to traverse (default 20).',
        },
        rootLabel: {
          type: 'string',
          description:
            'Start the snapshot from this component label (e.g. "@c5").',
        },
      },
    },
    call: (tools, args) => tools.getComponentTree(args.depth, args.rootLabel),
  },
  {
    name: 'react_get_component',
    description:
      'Detailed info for one component by label: ' +
      '{label, type, name, key?, props?, hooks?}. props excludes children and ' +
      'is normalized for serialization; hooks is the nested hooks tree ' +
      '({id, name, value, subHooks}), present only for function/forwardRef/' +
      'memo components.',
    inputSchema: {
      type: 'object',
      properties: {
        label: {type: 'string', description: 'Component label, e.g. "@c5".'},
      },
      required: ['label'],
    },
    call: (tools, args) => tools.getComponentByLabel(args.label),
  },
  {
    name: 'react_find_components',
    description:
      'Find components whose name contains a substring (case-insensitive). ' +
      'Paginated: {page, pageSize, totalCount, totalPages, results}, where ' +
      'results are tree nodes. rootLabel limits the search to a subtree.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {type: 'string', description: 'Name substring to match.'},
        rootLabel: {
          type: 'string',
          description: "Limit the search to this component's subtree.",
        },
        page: {type: 'number', description: 'Page number (default 1).'},
        pageSize: {
          type: 'number',
          description: 'Results per page (default 10).',
        },
      },
      required: ['name'],
    },
    call: (tools, args) =>
      tools.findComponents(args.name, args.rootLabel, args.page, args.pageSize),
  },
  {
    name: 'react_get_component_source',
    description:
      'Source location where a component is defined: ' +
      '{source: {name, fileName, line, column}}, or {source: null} when ' +
      'unavailable (e.g. host components or production builds).',
    inputSchema: {
      type: 'object',
      properties: {
        label: {type: 'string', description: 'Component label, e.g. "@c5".'},
      },
      required: ['label'],
    },
    call: (tools, args) => tools.getComponentSource(args.label),
  },
  {
    name: 'react_get_owners_stack',
    description:
      'Owner stack trace for a component — the chain of JSX creation sites up ' +
      'to the root, as a raw string ({stack}) for source-map symbolication. ' +
      'DEV-only (empty in production).',
    inputSchema: {
      type: 'object',
      properties: {
        label: {type: 'string', description: 'Component label, e.g. "@c5".'},
      },
      required: ['label'],
    },
    call: (tools, args) => tools.getOwnersStack(args.label),
  },
  {
    name: 'react_get_owners_branch',
    description:
      'Structured owner chain for a component, from immediate owner to root ' +
      'ancestor: an array of {label, name, type} (empty for a root ' +
      'component). DEV-only.',
    inputSchema: {
      type: 'object',
      properties: {
        label: {type: 'string', description: 'Component label, e.g. "@c5".'},
      },
      required: ['label'],
    },
    call: (tools, args) => tools.getOwnersBranch(args.label),
  },
  {
    name: 'react_start_profiling',
    description:
      'Start a profiling session that records render timing on every commit. ' +
      'Returns {status: "started", trace}; errors if a session is already ' +
      'active.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Trace name (auto-generated if omitted).',
        },
      },
    },
    call: (tools, args) => tools.startProfiling(args.name),
  },
  {
    name: 'react_stop_profiling',
    description:
      'Stop the active profiling session. Returns ' +
      '{status: "stopped", trace, commits} (commits recorded); errors if none ' +
      'is active.',
    inputSchema: {type: 'object', properties: {}},
    call: tools => tools.stopProfiling(),
  },
  {
    name: 'react_get_trace_overview',
    description:
      'Per-commit overview of a trace — one row each: ' +
      '{commit, committedAt, renderDuration, layoutDuration, ' +
      'passiveDuration, componentsChanged}. Durations are in ms (null if the ' +
      'build omits profiler timing).',
    inputSchema: {
      type: 'object',
      properties: {
        traceName: {type: 'string', description: 'The trace to query.'},
      },
      required: ['traceName'],
    },
    call: (tools, args) => tools.getTraceOverview(args.traceName),
  },
  {
    name: 'react_get_commit_report',
    description:
      'Detailed report for one commit of a trace: ' +
      '{committedAt, priority, renderDuration, layoutDuration, ' +
      'passiveDuration, components}, where components is ' +
      '{label, name, type, actualDuration, selfDuration} sorted by ' +
      'actualDuration descending.',
    inputSchema: {
      type: 'object',
      properties: {
        traceName: {type: 'string', description: 'The trace to query.'},
        commitIndex: {
          type: 'number',
          description: 'Zero-based commit index within the trace.',
        },
      },
      required: ['traceName', 'commitIndex'],
    },
    call: (tools, args) =>
      tools.getCommitReport(args.traceName, args.commitIndex),
  },
];

// A chrome-devtools-mcp third-party tool. `execute` runs in the page and
// returns the facade tool's result, which chrome-devtools-mcp forwards to the
// MCP client.
export type CdtMcpTool = {
  name: string,
  description: string,
  inputSchema: {[string]: mixed},
  execute: (args: {[string]: any}) => mixed,
};

export type CdtMcpToolGroup = {
  name: string,
  description: string,
  tools: Array<CdtMcpTool>,
};

/**
 * Build the chrome-devtools-mcp tool group from an assembled set of facade
 * tools. Each tool returns its facade result directly.
 */
export function buildToolGroup(tools: Tools): CdtMcpToolGroup {
  return {
    name: 'react',
    description:
      'Inspect and profile the running React app. Components are addressed by ' +
      'stable labels (e.g. "@c5") from react_get_component_tree; pass a label ' +
      'to the other tools.',
    tools: TOOL_DEFINITIONS.map(definition => ({
      name: definition.name,
      description: definition.description,
      inputSchema: definition.inputSchema,
      execute: (args: {[string]: any}) => definition.call(tools, args || {}),
    })),
  };
}

/**
 * Install the facade and register the React tools with chrome-devtools-mcp.
 *
 * The facade is installed EAGERLY (synchronously, when this runs) so the
 * DevTools hook is in place before React initializes. The tools, however, are
 * built LAZILY inside the `devtoolstooldiscovery` handler — no tool work
 * happens until chrome-devtools-mcp actually discovers them. The tool group is
 * memoized so component labels stay stable across repeated discovery.
 *
 * chrome-devtools-mcp dispatches a `devtoolstooldiscovery` event and expects a
 * synchronous `respondWith(toolGroup)`.
 *
 * Best run once per page before React initializes so the first commit is
 * captured. If a DevTools hook is already installed (e.g. the React DevTools
 * browser extension), installFacade attaches to it instead of installing a
 * second one. Returns the Facade and an `unregister` function that removes the
 * discovery listener.
 */
export function register(target?: any = globalThis): {
  facade: Facade,
  unregister: () => void,
} {
  const facade = installFacade(target);

  let toolGroup: CdtMcpToolGroup | null = null;
  const listener = (event: any) => {
    if (toolGroup === null) {
      toolGroup = buildToolGroup(createTools(facade));
    }
    event.respondWith(toolGroup);
  };
  target.addEventListener('devtoolstooldiscovery', listener);

  return {
    facade,
    unregister: () => {
      target.removeEventListener('devtoolstooldiscovery', listener);
    },
  };
}
