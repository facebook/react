import {canUseDOM} from 'shared/ExecutionEnvironment';
import { useSyncExternalStore as client } from './useSyncExternalStoreClient';
import { useSYncExternalStore as server } from './useSyncExternalStoreServer';

export const useSyncExternalStore = canUseDOM ? client : server;
