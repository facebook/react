'use strict';

const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

// When testing the custom renderer code path through `react-reconciler`,
// turn the export into a function, and use the argument as host config.
const shimHostConfigPath = 'react-reconciler/src/ReactFiberHostConfig';
jest.mock('react-reconciler', () => {
  return config => {
    jest.mock(shimHostConfigPath, () => config);
    return require.requireActual('react-reconciler');
  };
});
jest.mock('react-reconciler/persistent', () => {
  return config => {
    jest.mock(shimHostConfigPath, () => config);
    return require.requireActual('react-reconciler/persistent');
  };
});
const shimServerHostConfigPath = 'react-server/src/ReactServerHostConfig';
const shimServerFormatConfigPath = 'react-server/src/ReactServerFormatConfig';
jest.mock('react-server', () => {
  return config => {
    jest.mock(shimServerHostConfigPath, () => config);
    jest.mock(shimServerFormatConfigPath, () => config);
    return require.requireActual('react-server');
  };
});
jest.mock('react-server/flight', () => {
  return config => {
    jest.mock(shimServerHostConfigPath, () => config);
    jest.mock(shimServerFormatConfigPath, () => config);
    return require.requireActual('react-server/flight');
  };
});
const shimFlightClientHostConfigPath =
  'react-flight/src/ReactFlightClientHostConfig';
jest.mock('react-flight', () => {
  return config => {
    jest.mock(shimFlightClientHostConfigPath, () => config);
    return require.requireActual('react-flight');
  };
});

// But for inlined host configs (such as React DOM, Native, etc), we
// mock their named entry points to establish a host config mapping.
inlinedHostConfigs.forEach(rendererInfo => {
  if (rendererInfo.shortName === 'custom') {
    // There is no inline entry point for the custom renderers.
    // Instead, it's handled by the generic `react-reconciler` entry point above.
    return;
  }
  jest.mock(`react-reconciler/inline.${rendererInfo.shortName}`, () => {
    let hasImportedShimmedConfig = false;

    // We want the reconciler to pick up the host config for this renderer.
    jest.mock(shimHostConfigPath, () => {
      hasImportedShimmedConfig = true;
      return require.requireActual(
        `react-reconciler/src/forks/ReactFiberHostConfig.${
          rendererInfo.shortName
        }.js`
      );
    });

    const renderer = require.requireActual('react-reconciler');
    // If the shimmed config factory function above has not run,
    // it means this test file loads more than one renderer
    // but doesn't reset modules between them. This won't work.
    if (!hasImportedShimmedConfig) {
      throw new Error(
        `Could not import the "${rendererInfo.shortName}" renderer ` +
          `in this suite because another renderer has already been ` +
          `loaded earlier. Call jest.resetModules() before importing any ` +
          `of the following entry points:\n\n` +
          rendererInfo.entryPoints.map(entry => `  * ${entry}`)
      );
    }

    return renderer;
  });

  if (rendererInfo.isServerSupported) {
    jest.mock(`react-server/inline.${rendererInfo.shortName}`, () => {
      let hasImportedShimmedConfig = false;

      // We want the renderer to pick up the host config for this renderer.
      jest.mock(shimServerHostConfigPath, () => {
        hasImportedShimmedConfig = true;
        return require.requireActual(
          `react-server/src/forks/ReactServerHostConfig.${
            rendererInfo.shortName
          }.js`
        );
      });
      jest.mock(shimServerFormatConfigPath, () => {
        hasImportedShimmedConfig = true;
        return require.requireActual(
          `react-server/src/forks/ReactServerFormatConfig.${
            rendererInfo.shortName
          }.js`
        );
      });

      const renderer = require.requireActual('react-server');
      // If the shimmed config factory function above has not run,
      // it means this test file loads more than one renderer
      // but doesn't reset modules between them. This won't work.
      if (!hasImportedShimmedConfig) {
        throw new Error(
          `Could not import the "${rendererInfo.shortName}" renderer ` +
            `in this suite because another renderer has already been ` +
            `loaded earlier. Call jest.resetModules() before importing any ` +
            `of the following entry points:\n\n` +
            rendererInfo.entryPoints.map(entry => `  * ${entry}`)
        );
      }

      return renderer;
    });

    jest.mock(`react-server/flight.inline.${rendererInfo.shortName}`, () => {
      let hasImportedShimmedConfig = false;

      // We want the renderer to pick up the host config for this renderer.
      jest.mock(shimServerHostConfigPath, () => {
        hasImportedShimmedConfig = true;
        return require.requireActual(
          `react-server/src/forks/ReactServerHostConfig.${
            rendererInfo.shortName
          }.js`
        );
      });
      jest.mock(shimServerFormatConfigPath, () => {
        hasImportedShimmedConfig = true;
        return require.requireActual(
          `react-server/src/forks/ReactServerFormatConfig.${
            rendererInfo.shortName
          }.js`
        );
      });

      const renderer = require.requireActual('react-server/flight');
      // If the shimmed config factory function above has not run,
      // it means this test file loads more than one renderer
      // but doesn't reset modules between them. This won't work.
      if (!hasImportedShimmedConfig) {
        throw new Error(
          `Could not import the "${rendererInfo.shortName}" renderer ` +
            `in this suite because another renderer has already been ` +
            `loaded earlier. Call jest.resetModules() before importing any ` +
            `of the following entry points:\n\n` +
            rendererInfo.entryPoints.map(entry => `  * ${entry}`)
        );
      }

      return renderer;
    });

    jest.mock(`react-flight/inline.${rendererInfo.shortName}`, () => {
      let hasImportedShimmedConfig = false;

      // We want the renderer to pick up the host config for this renderer.
      jest.mock(shimFlightClientHostConfigPath, () => {
        hasImportedShimmedConfig = true;
        return require.requireActual(
          `react-flight/src/forks/ReactFlightClientHostConfig.${
            rendererInfo.shortName
          }.js`
        );
      });

      const renderer = require.requireActual('react-flight');
      // If the shimmed config factory function above has not run,
      // it means this test file loads more than one renderer
      // but doesn't reset modules between them. This won't work.
      if (!hasImportedShimmedConfig) {
        throw new Error(
          `Could not import the "${rendererInfo.shortName}" renderer ` +
            `in this suite because another renderer has already been ` +
            `loaded earlier. Call jest.resetModules() before importing any ` +
            `of the following entry points:\n\n` +
            rendererInfo.entryPoints.map(entry => `  * ${entry}`)
        );
      }

      return renderer;
    });
  }
});

// Make it possible to import this module inside
// the React package itself.
jest.mock('shared/ReactSharedInternals', () =>
  require.requireActual('react/src/ReactSharedInternals')
);

jest.mock('scheduler', () => require.requireActual('scheduler/unstable_mock'));
jest.mock('scheduler/src/SchedulerHostConfig', () =>
  require.requireActual('scheduler/src/forks/SchedulerHostConfig.mock.js')
);
