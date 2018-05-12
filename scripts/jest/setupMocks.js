const obj = {};
jest.mock('fbjs/lib/emptyObject', () => obj);

jest.mock('react-reconciler', () => {
  return (config) => {
    jest.mock('react-reconciler/src/ReactFiberHostConfig', () => config);
    return require.requireActual('react-reconciler');
  };
});

jest.mock('react-test-renderer', () => {
  jest.mock('react-reconciler/inline', () => {
    jest.mock('react-reconciler/src/ReactFiberHostConfig',
      () => require.requireActual('react-test-renderer/src/ReactTestHostConfig')
    );
    return require.requireActual('react-reconciler');
  });
  return require.requireActual('react-test-renderer');
});

jest.mock('react-dom', () => {
  jest.mock('react-reconciler/inline', () => {
    jest.mock('react-reconciler/src/ReactFiberHostConfig',
      () => require.requireActual('react-dom/src/client/ReactDOMHostConfig')
    );
    return require.requireActual('react-reconciler');
  });
  return require.requireActual('react-dom');
});

jest.mock('react-art', () => {
  jest.mock('react-reconciler/inline', () => {
    jest.mock('react-reconciler/src/ReactFiberHostConfig',
      () => require.requireActual('react-art/src/ReactARTHostConfig')
    );
    return require.requireActual('react-reconciler');
  });
  return require.requireActual('react-art');
});

jest.mock('react-native-renderer', () => {
  jest.mock('react-reconciler/inline', () => {
    jest.mock('react-reconciler/src/ReactFiberHostConfig',
      () => require.requireActual('react-native-renderer/src/ReactNativeHostConfig')
    );
    return require.requireActual('react-reconciler');
  });
  return require.requireActual('react-native-renderer');
});

jest.mock('react-native-renderer/fabric', () => {
  jest.mock('react-reconciler/inline', () => {
    jest.mock('react-reconciler/src/ReactFiberHostConfig',
      () => require.requireActual('react-native-renderer/src/ReactFabricHostConfig')
    );
    return require.requireActual('react-reconciler');
  });
  return require.requireActual('react-native-renderer/fabric');
});
