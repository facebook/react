'use strict';

const fs = require('fs');
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

jest.mock('react', () => {
  const resolvedEntryPoint = resolveEntryFork(
    require.resolve('react'),
    global.__WWW__
  );
  return jest.requireActual(resolvedEntryPoint);
});

jest.mock('react/react.shared-subset', () => {
  const resolvedEntryPoint = resolveEntryFork(
    require.resolve('react/src/ReactSharedSubset'),
    global.__WWW__
  );
  return jest.requireActual(resolvedEntryPoint);
});

// When testing the custom renderer code path through `react-reconciler`,
// turn the export into a function, and use the argument as host config.
const shimHostConfigPath = 'react-reconciler/src/ReactFiberHostConfig';
jest.mock('react-reconciler', () => {
  return config => {
    jest.mock(shimHostConfigPath, () => config);
    return jest.requireActual('react-reconciler');
  };
});
const shimServerStreamConfigPath = 'react-server/src/ReactServerStreamConfig';
const shimServerFormatConfigPath = 'react-server/src/ReactServerFormatConfig';
const shimFlightServerConfigPath = 'react-server/src/ReactFlightServerConfig';
jest.mock('react-server', () => {
  return config => {
    jest.mock(shimServerStreamConfigPath, () => config);
    jest.mock(shimServerFormatConfigPath, () => config);
    return jest.requireActual('react-server');
  };
});
jest.mock('react-server/flight', () => {
  return config => {
    jest.mock(shimServerStreamConfigPath, () => config);
    jest.mock(shimServerFormatConfigPath, () => config);
    jest.mock('react-server/src/ReactFlightServerBundlerConfigCustom', () => ({
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
const shimFlightClientHostConfigPath =
  'react-client/src/ReactFlightClientHostConfig';
jest.mock('react-client/flight', () => {
  return config => {
    jest.mock(shimFlightClientHostConfigPath, () => config);
    return jest.requireActual('react-client/flight');
  };
});

const configPaths = [
  'react-reconciler/src/ReactFiberHostConfig',
  'react-client/src/ReactFlightClientHostConfig',
  'react-server/src/ReactServerStreamConfig',
  'react-server/src/ReactServerFormatConfig',
  'react-server/src/ReactFlightServerConfig',
];

function mockAllConfigs(rendererInfo) {
  configPaths.forEach(path => {
    // We want the reconciler to pick up the host config for this renderer.
    jest.mock(path, () => {
      let idx = path.lastIndexOf('/');
      let forkPath = path.substr(0, idx) + '/forks' + path.substr(idx);
      return jest.requireActual(`${forkPath}.${rendererInfo.shortName}.js`);
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
  jest.requireActual('react/src/ReactSharedInternals')
);

// Make it possible to import this module inside
// the ReactDOM package itself.
jest.mock('shared/ReactDOMSharedInternals', () =>
  jest.requireActual('react-dom/src/ReactDOMSharedInternals')
);

jest.mock('scheduler', () => jest.requireActual('scheduler/unstable_mock'));
