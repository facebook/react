/**
 * @module
 * @description
 * Starting point to import all public core APIs.
 */
export * from './src/metadata';
export * from './src/util';
export * from './src/di';
export {createPlatform, assertPlatform, disposePlatform, getPlatform, coreBootstrap, coreLoadAndBootstrap, createNgZone, PlatformRef, ApplicationRef, enableProdMode, lockRunMode, isDevMode} from './src/application_ref';
export {APP_ID, APP_INITIALIZER, PACKAGE_ROOT_URL, PLATFORM_INITIALIZER} from './src/application_tokens';
export * from './src/zone';
export * from './src/render';
export * from './src/linker';
export {DebugElement, DebugNode, asNativeElements, getDebugNode} from './src/debug/debug_node';
export * from './src/testability/testability';
export * from './src/change_detection';
export * from './src/platform_directives_and_pipes';
export * from './src/platform_common_providers';
export * from './src/application_common_providers';
export {wtfCreateScope, wtfLeave, wtfStartTimeRange, wtfEndTimeRange, WtfScopeFn} from './src/profile/profile';

export {Type} from './src/facade/lang';
export {EventEmitter} from './src/facade/async';
export {ExceptionHandler, WrappedException, BaseException} from './src/facade/exceptions';
export * from './private_export';

export * from './src/animation/metadata';
export {AnimationPlayer} from './src/animation/animation_player';
