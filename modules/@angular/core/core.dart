library angular2.core;

export './src/core/angular_entrypoint.dart' show AngularEntrypoint;
export './src/core/metadata.dart';
export './src/core/util.dart';
export './src/core/di.dart' hide ForwardRefFn, resolveForwardRef, forwardRef;
export './src/facade/facade.dart';
export './src/core/application_ref.dart' show createPlatform, assertPlatform,
    disposePlatform, getPlatform,
    coreLoadAndBootstrap, coreBootstrap, createNgZone, PlatformRef, ApplicationRef;
export './src/core/application_tokens.dart' show APP_ID,
  APP_INITIALIZER,
  PACKAGE_ROOT_URL,
  PLATFORM_INITIALIZER;
export './src/core/zone.dart';
export './src/core/render.dart';
export './src/core/linker.dart';
export './src/core/debug/debug_node.dart' show DebugElement,
  DebugNode,
  asNativeElements;
export './src/core/testability/testability.dart';
export './src/core/change_detection.dart';
export './src/core/platform_directives_and_pipes.dart';
export './src/core/platform_common_providers.dart';
export './src/core/application_common_providers.dart';
export './src/core/reflection/reflection.dart';
