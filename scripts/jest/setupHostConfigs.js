'use strict';

const fs = require('fs');
const nodePath = require('path');
const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

function resolveEntryFork(resolvedEntry, isFBBundle) {
  // Pick which entry point fork to use:
  // .modern.fb.js
  // .classic.fb.js
  // .fb.js
  // .stable.js
  // .experimental.js
  // .js

  if (isFBBundle) {
    if (__EXPERIMENTAL__) {
      // We can't currently use the true modern entry point because too many tests fail.
      // TODO: Fix tests to not use ReactDOM.render or gate them. Then we can remove this.
      return resolvedEntry;
    }
    const resolvedFBEntry = resolvedEntry.replace(
      '.js',
      __EXPERIMENTAL__ ? '.modern.fb.js' : '.classic.fb.js'
    );
    if (fs.existsSync(resolvedFBEntry)) {
      return resolvedFBEntry;
    }
    const resolvedGenericFBEntry = resolvedEntry.replace('.js', '.fb.js');
    if (fs.existsSync(resolvedGenericFBEntry)) {
      return resolvedGenericFBEntry;
    }
    // Even if it's a FB bundle we fallthrough to pick stable or experimental if we don't have an FB fork.
  }
  const resolvedForkedEntry = resolvedEntry.replace(
    '.js',
    __EXPERIMENTAL__ ? '.experimental.js' : '.stable.js'
  );
  if (fs.existsSync(resolvedForkedEntry)) {
    return resolvedForkedEntry;
  }
  // Just use the plain .js one.
  return resolvedEntry;
}

function mockReact() {
  jest.mock('react', () => {
    const resolvedEntryPoint = resolveEntryFork(
      require.resolve('react'),
      global.__WWW__
    );
    return jest.requireActual(resolvedEntryPoint);
  });
}

// When we want to unmock React we really need to mock it again.
global.__unmockReact = mockReact;

mockReact();

jest.mock('react/react.shared-subset', () => {
  const resolvedEntryPoint = resolveEntryFork(
    require.resolve('react/src/ReactSharedSubset'),
    global.__WWW__
  );
  return jest.requireActual(resolvedEntryPoint);
});

// When testing the custom renderer code path through `react-reconciler`,
// turn the export into a function, and use the argument as host config.
const shimHostConfigPath = 'react-reconciler/src/ReactFiberConfig';
jest.mock('react-reconciler', () => {
  return config => {
    jest.mock(shimHostConfigPath, () => config);
    return jest.requireActual('react-reconciler');
  };
});
const shimServerStreamConfigPath = 'react-server/src/ReactServerStreamConfig';
const shimServerConfigPath = 'react-server/src/ReactFizzConfig';
const shimFlightServerConfigPath = 'react-server/src/ReactFlightServerConfig';
jest.mock('react-server', () => {
  return config => {
    jest.mock(shimServerStreamConfigPath, () => config);
    jest.mock(shimServerConfigPath, () => config);
    return jest.requireActual('react-server');
  };
});
jest.mock('react-server/flight', () => {
  return config => {
    jest.mock(shimServerStreamConfigPath, () => config);
    jest.mock(shimServerConfigPath, () => config);
    jest.mock('react-server/src/ReactFlightServerConfigBundlerCustom', () => ({
      isClientReference: config.isClientReference,
      isServerReference: config.isServerReference,
      getClientReferenceKey: config.getClientReferenceKey,
      resolveClientReferenceMetadata: config.resolveClientReferenceMetadata,
    }));
    jest.mock(shimFlightServerConfigPath, () =>
      jest.requireActual(
        'react-server/src/forks/ReactFlightServerConfig.custom'
      )
    );
    return jest.requireActual('react-server/flight');
  };
});
const shimFlightClientConfigPath = 'react-client/src/ReactFlightClientConfig';
jest.mock('react-client/flight', () => {
  return config => {
    jest.mock(shimFlightClientConfigPath, () => config);
    return jest.requireActual('react-client/flight');
  };
});

const configPaths = [
  'react-reconciler/src/ReactFiberConfig',
  'react-client/src/ReactFlightClientConfig',
  'react-server/src/ReactServerStreamConfig',
  'react-server/src/ReactFizzConfig',
  'react-server/src/ReactFlightServerConfig',
];

function mockAllConfigs(rendererInfo) {
  configPaths.forEach(path => {
    // We want the reconciler to pick up the host config for this renderer.
    jest.mock(path, () => {
      let idx = path.lastIndexOf('/');
      let forkPath = path.slice(0, idx) + '/forks' + path.slice(idx);
      let parts = rendererInfo.shortName.split('-');
      while (parts.length) {
        try {
          const candidate = `${forkPath}.${parts.join('-')}.js`;
          fs.statSync(nodePath.join(process.cwd(), 'packages', candidate));
          return jest.requireActual(candidate);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
          // try without a part
        }
        parts.pop();
      }
      throw new Error(
        `Expected to find a fork for ${path} but did not find one.`
      );
    });
  });
}

// But for inlined host configs (such as React DOM, Native, etc), we
// mock their named entry points to establish a host config mapping.
inlinedHostConfigs.forEach(rendererInfo => {
  if (rendererInfo.shortName === 'custom') {
    // There is no inline entry point for the custom renderers.
    // Instead, it's handled by the generic `react-reconciler` entry point above.
    return;
  }
  rendererInfo.entryPoints.forEach(entryPoint => {
    jest.mock(entryPoint, () => {
      mockAllConfigs(rendererInfo);
      const resolvedEntryPoint = resolveEntryFork(
        require.resolve(entryPoint),
        global.__WWW__
      );
      return jest.requireActual(resolvedEntryPoint);
    });
  });
});

// Make it possible to import this module inside
// the React package itself.
jest.mock('shared/ReactSharedInternals', () =>
  jest.requireActual('react/src/ReactSharedInternalsClient')
);

// Make it possible to import this module inside
// the ReactDOM package itself.
jest.mock('shared/ReactDOMSharedInternals', () =>
  jest.requireActual('react-dom/src/ReactDOMSharedInternals')
);

jest.mock('scheduler', () => jest.requireActual('scheduler/unstable_mock'));
