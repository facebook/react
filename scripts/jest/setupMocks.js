
jest.mock('react-reconciler', () => {
  return (config) => {
    jest.mock('react-reconciler/src/ReactFiberHostConfig', () => config);
    return require.requireActual('react-reconciler');
  };
});
