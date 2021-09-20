import {canUseDOM} from 'shared/ExecutionEnvironment';
import client from './useSyncExternalStoreClient';
import server from './useSyncExternalStoreServer';

export const useSyncExternalStore = canUseDOM ? client : server;
