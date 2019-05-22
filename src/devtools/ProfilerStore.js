// @flow

import EventEmitter from 'events';
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import { prepareProfilingDataFrontendFromBackendAndStore } from './views/Profiler/utils';
import ProfilingCache from './ProfilingCache';
import Store from './store';

import type { ProfilingDataBackend } from 'src/backend/types';
import type {
  CommitDataFrontend,
  ProfilingDataForRootFrontend,
  ProfilingDataFrontend,
  SnapshotNode,
} from './views/Profiler/types';
import type { Bridge } from '../types';

const THROTTLE_CAPTURE_SCREENSHOT_DURATION = 500;

export default class ProfilerStore extends EventEmitter {
  _bridge: Bridge;

  // Suspense cache for lazily calculating derived profiling data.
  _cache: ProfilingCache;

  // Temporary store of profiling data from the backend renderer(s).
  // This data will be converted to the ProfilingDataFrontend format after being collected from all renderers.
  _dataBackends: Array<ProfilingDataBackend> = [];

  // Data from the most recently completed profiling session,
  // or data that has been imported from a previously exported session.
  // This object contains all necessary data to drive the Profiler UI interface,
  // even though some of it is lazily parsed/derived via the ProfilingCache.
  _dataFrontend: ProfilingDataFrontend | null = null;

  // Snapshot of the state of the main Store (including all roots) when profiling started.
  // Once profiling is finished, this snapshot can be used along with "operations" messages emitted during profiling,
  // to reconstruct the state of each root for each commit.
  // It's okay to use a single root to store this information because node IDs are unique across all roots.
  //
  // This map is only updated while profiling is in progress;
  // Upon completion, it is converted into the exportable ProfilingDataFrontend format.
  _initialSnapshotsByRootID: Map<number, Map<number, SnapshotNode>> = new Map();

  // Map of root (id) to a list of tree mutation that occur during profiling.
  // Once profiling is finished, these mutations can be used, along with the initial tree snapshots,
  // to reconstruct the state of each root for each commit.
  //
  // This map is only updated while profiling is in progress;
  // Upon completion, it is converted into the exportable ProfilingDataFrontend format.
  _inProgressOperationsByRootID: Map<number, Array<Uint32Array>> = new Map();

  // Map of root (id) to a Map of screenshots by commit ID.
  // Stores screenshots for each commit (when profiling).
  //
  // This map is only updated while profiling is in progress;
  // Upon completion, it is converted into the exportable ProfilingDataFrontend format.
  _inProgressScreenshotsByRootID: Map<number, Map<number, string>> = new Map();

  // The backend is currently profiling.
  // When profiling is in progress, operations are stored so that we can later reconstruct past commit trees.
  _isProfiling: boolean = false;

  // After profiling, data is requested from each attached renderer using this queue.
  // So long as this queue is not empty, the store is retrieving and processing profiling data from the backend.
  _rendererQueue: Set<number> = new Set();

  _store: Store;

  constructor(bridge: Bridge, store: Store, defaultIsProfiling: boolean) {
    super();

    this._bridge = bridge;
    this._isProfiling = defaultIsProfiling;
    this._store = store;

    bridge.addListener('operations', this.onBridgeOperations);
    bridge.addListener('profilingData', this.onBridgeProfilingData);
    bridge.addListener('profilingStatus', this.onProfilingStatus);
    bridge.addListener('shutdown', this.onBridgeShutdown);

    // It's possible that profiling has already started (e.g. "reload and start profiling")
    // so the frontend needs to ask the backend for its status after mounting.
    bridge.send('getProfilingStatus');

    this._cache = new ProfilingCache(this);
  }

  getCommitData(rootID: number, commitIndex: number): CommitDataFrontend {
    if (this._dataFrontend !== null) {
      const dataForRoot = this._dataFrontend.dataForRoots.get(rootID);
      if (dataForRoot != null) {
        const commitDatum = dataForRoot.commitData[commitIndex];
        if (commitDatum != null) {
          return commitDatum;
        }
      }
    }

    throw Error(
      `Could not find commit data for root "${rootID}" and commit ${commitIndex}`
    );
  }

  getDataForRoot(rootID: number): ProfilingDataForRootFrontend {
    if (this._dataFrontend !== null) {
      const dataForRoot = this._dataFrontend.dataForRoots.get(rootID);
      if (dataForRoot != null) {
        return dataForRoot;
      }
    }

    throw Error(`Could not find commit data for root "${rootID}"`);
  }

  // Profiling data has been recorded for at least one root.
  get hasProfilingData(): boolean {
    return (
      this._dataFrontend !== null && this._dataFrontend.dataForRoots.size > 0
    );
  }

  get isProcessingData(): boolean {
    return this._rendererQueue.size > 0 || this._dataBackends.length > 0;
  }

  get isProfiling(): boolean {
    return this._isProfiling;
  }

  get profilingCache(): ProfilingCache {
    return this._cache;
  }

  get profilingData(): ProfilingDataFrontend | null {
    return this._dataFrontend;
  }
  set profilingData(value: ProfilingDataFrontend | null): void {
    this._dataBackends.splice(0);
    this._dataFrontend = value;
    this._initialSnapshotsByRootID.clear();
    this._inProgressOperationsByRootID.clear();
    this._inProgressScreenshotsByRootID.clear();
    this._cache.invalidate();

    this.emit('profilingData');
  }

  clear(): void {
    this._dataBackends.splice(0);
    this._dataFrontend = null;
    this._initialSnapshotsByRootID.clear();
    this._inProgressOperationsByRootID.clear();
    this._inProgressScreenshotsByRootID.clear();
    this._rendererQueue.clear();

    // Invalidate suspense cache if profiling data is being (re-)recorded.
    // Note that we clear now because any existing data is "stale".
    this._cache.invalidate();

    this.emit('profilingData');
  }

  startProfiling(): void {
    this._bridge.send('startProfiling');

    // Don't actually update the local profiling boolean yet!
    // Wait for onProfilingStatus() to confirm the status has changed.
    // This ensures the frontend and backend are in sync wrt which commits were profiled.
    // We do this to avoid mismatches on e.g. CommitTreeBuilder that would cause errors.
  }

  stopProfiling(): void {
    this._bridge.send('stopProfiling');

    // Don't actually update the local profiling boolean yet!
    // Wait for onProfilingStatus() to confirm the status has changed.
    // This ensures the frontend and backend are in sync wrt which commits were profiled.
    // We do this to avoid mismatches on e.g. CommitTreeBuilder that would cause errors.
  }

  _captureScreenshot = throttle(
    memoize((rootID: number, commitIndex: number) => {
      this._bridge.send('captureScreenshot', { commitIndex, rootID });
    }),
    THROTTLE_CAPTURE_SCREENSHOT_DURATION
  );

  _takeProfilingSnapshotRecursive = (
    elementID: number,
    profilingSnapshots: Map<number, SnapshotNode>
  ) => {
    const element = this._store.getElementByID(elementID);
    if (element !== null) {
      const snapshotNode: SnapshotNode = {
        id: elementID,
        children: element.children.slice(0),
        displayName: element.displayName,
        key: element.key,
        type: element.type,
      };
      profilingSnapshots.set(elementID, snapshotNode);

      element.children.forEach(childID =>
        this._takeProfilingSnapshotRecursive(childID, profilingSnapshots)
      );
    }
  };

  onBridgeOperations = (operations: Uint32Array) => {
    if (!(operations instanceof Uint32Array)) {
      // $FlowFixMe TODO HACK Temporary workaround for the fact that Chrome is not transferring the typed array.
      operations = Uint32Array.from(Object.values(operations));
    }

    // The first two values are always rendererID and rootID
    const rootID = operations[1];

    if (this._isProfiling) {
      let profilingOperations = this._inProgressOperationsByRootID.get(rootID);
      if (profilingOperations == null) {
        profilingOperations = [operations];
        this._inProgressOperationsByRootID.set(rootID, profilingOperations);
      } else {
        profilingOperations.push(operations);
      }

      if (!this._initialSnapshotsByRootID.has(rootID)) {
        this._initialSnapshotsByRootID.set(rootID, new Map());
      }

      if (this._store.captureScreenshots) {
        const commitIndex = profilingOperations.length - 1;
        this._captureScreenshot(rootID, commitIndex);
      }
    }
  };

  onBridgeProfilingData = (dataBackend: ProfilingDataBackend) => {
    if (this._isProfiling) {
      // This should never happen, but if it does- ignore previous profiling data.
      return;
    }

    const { rendererID } = dataBackend;

    if (!this._rendererQueue.has(rendererID)) {
      throw Error(
        `Unexpected profiling data update from renderer "${rendererID}"`
      );
    }

    this._dataBackends.push(dataBackend);
    this._rendererQueue.delete(rendererID);

    if (this._rendererQueue.size === 0) {
      this._dataFrontend = prepareProfilingDataFrontendFromBackendAndStore(
        this._dataBackends,
        this._inProgressOperationsByRootID,
        this._inProgressScreenshotsByRootID,
        this._initialSnapshotsByRootID
      );

      this._dataBackends.splice(0);

      this.emit('isProcessingData');
    }
  };

  onBridgeShutdown = () => {
    this._bridge.removeListener('operations', this.onBridgeOperations);
    this._bridge.removeListener('profilingStatus', this.onProfilingStatus);
    this._bridge.removeListener('shutdown', this.onBridgeShutdown);
  };

  onProfilingStatus = (isProfiling: boolean) => {
    if (isProfiling) {
      this._dataBackends.splice(0);
      this._dataFrontend = null;
      this._initialSnapshotsByRootID.clear();
      this._inProgressOperationsByRootID.clear();
      this._inProgressScreenshotsByRootID.clear();
      this._rendererQueue.clear();

      // Record snapshot of tree at the time profiling is started.
      // This info is required to handle cases of e.g. nodes being removed during profiling.
      this._store.roots.forEach(rootID => {
        const profilingSnapshots = new Map();
        this._initialSnapshotsByRootID.set(rootID, profilingSnapshots);
        this._takeProfilingSnapshotRecursive(rootID, profilingSnapshots);
      });
    }

    if (this._isProfiling !== isProfiling) {
      this._isProfiling = isProfiling;

      // Invalidate suspense cache if profiling data is being (re-)recorded.
      // Note that we clear again, in case any views read from the cache while profiling.
      // (That would have resolved a now-stale value without any profiling data.)
      this._cache.invalidate();

      this.emit('isProfiling');

      // If we've just finished a profiling session, we need to fetch data stored in each renderer interface
      // and re-assemble it on the front-end into a format (ProfilingDataFrontend) that can power the Profiler UI.
      // During this time, DevTools UI should probably not be interactive.
      if (!isProfiling) {
        this._dataBackends.splice(0);
        this._rendererQueue.clear();

        for (let rendererID of this._store.rootIDToRendererID.values()) {
          if (!this._rendererQueue.has(rendererID)) {
            this._rendererQueue.add(rendererID);

            this._bridge.send('getProfilingData', { rendererID });
          }
        }

        this.emit('isProcessingData');
      }
    }
  };

  onScreenshotCaptured = ({
    commitIndex,
    dataURL,
    rootID,
  }: {|
    commitIndex: number,
    dataURL: string,
    rootID: number,
  |}) => {
    let screenshotsForRootByCommitIndex = this._inProgressScreenshotsByRootID.get(
      rootID
    );
    if (!screenshotsForRootByCommitIndex) {
      screenshotsForRootByCommitIndex = new Map();
      this._inProgressScreenshotsByRootID.set(
        rootID,
        screenshotsForRootByCommitIndex
      );
    }
    screenshotsForRootByCommitIndex.set(commitIndex, dataURL);
  };
}
