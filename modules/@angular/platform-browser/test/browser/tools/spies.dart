import 'package:angular2/testing_internal.dart' show SpyObject;
import 'package:angular2/core.dart' show Injector, ReflectiveInjector, bind;
import 'package:angular2/src/core/application_ref.dart' show ApplicationRef;
import 'package:angular2/src/core/linker/component_factory.dart'
    show ComponentRef;
import 'dart:js';

@proxy
class SpyApplicationRef extends SpyObject implements ApplicationRef {
  tick() {}
}

@proxy
class SpyComponentRef extends SpyObject implements ComponentRef<dynamic> {
  Injector injector;

  SpyComponentRef() {
    this.injector = ReflectiveInjector
        .resolveAndCreate([{provide: ApplicationRef, useClass: SpyApplicationRef}]);
  }
}

void callNgProfilerTimeChangeDetection([config]) {
  context['ng']['profiler']
      .callMethod('timeChangeDetection', config != null ? [config] : []);
}
