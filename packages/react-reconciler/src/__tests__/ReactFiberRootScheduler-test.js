let _doFlushWork;
const shimHostConfigPath = 'react-reconciler/src/ReactFiberConfig';

jest.mock(shimHostConfigPath, () => {
  return jest.requireActual(
    'react-dom-bindings/src/client/ReactFiberConfigDOM.js',
  );
});
beforeAll(() => {
  _doFlushWork = require('../ReactFiberRootScheduler')._doFlushWork;
});

test('does not hang', () => {
  const root = {
    tag: 1,
    pendingChildren: null,
    pingCache: {},
    finishedWork: null,
    timeoutHandle: -1,
    cancelPendingCommit: null,
    context: {},
    pendingContext: null,
    next: null,
    callbackNode: null,
    callbackPriority: 0,
    expirationTimes: [
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 278303.90000000596,
      278417.1999999881, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      -1, -1, -1, -1,
    ],
    pendingLanes: 6176,
    suspendedLanes: 0,
    pingedLanes: 0,
    expiredLanes: 0,
    mutableReadLanes: 0,
    finishedLanes: 0,
    errorRecoveryDisabledLanes: 0,
    entangledLanes: 6144,
    entanglements: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6144, 6144, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
    ],
    hiddenUpdates: [],
    identifierPrefix: '',
    pooledCache: null,
    pooledCacheLanes: 0,
    mutableSourceEagerHydrationData: null,
    hydrationCallbacks: {
      unstable_concurrentUpdatesByDefault: true,
      unstable_strictMode: true,
    },
    incompleteTransitions: {},
    effectDuration: 0,
    passiveEffectDuration: 0,
    memoizedUpdaters: {},
    pendingUpdatersLaneMap: [],
    _debugRootType: 'hydrateRoot()',
  };

  expect(() => {
    _doFlushWork(root, root, 2, false);
  }).not.toThrow();
});
