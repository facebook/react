import {canUseDOM} from 'shared/ExecutionEnvironment';
import {useSyncExternalStore as client} from './useSyncExternalStoreClient';
import {useSyncExternalStore as server} from './useSyncExternalStoreServer';

export const useSyncExternalStore = canUseDOM ? client : server;
