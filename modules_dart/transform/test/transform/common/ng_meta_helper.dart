library angular2.test.transform.common.ng_meta_helper;

import 'package:angular2/src/compiler/compile_metadata.dart';
import 'package:angular2/src/core/change_detection/change_detection.dart';
import 'package:angular2/src/core/metadata/view.dart' show ViewEncapsulation;

export 'package:angular2/src/compiler/compile_metadata.dart';
export 'package:angular2/src/core/change_detection/change_detection.dart';
export 'package:angular2/src/core/metadata/view.dart' show ViewEncapsulation;
export 'package:angular2/src/transform/common/model/annotation_model.pb.dart';
export 'package:angular2/src/transform/common/model/import_export_model.pb.dart';
export 'package:angular2/src/transform/common/model/ng_deps_model.pb.dart';
export 'package:angular2/src/transform/common/model/reflection_info_model.pb.dart';
export 'package:angular2/src/transform/common/ng_meta.dart';

CompileDirectiveMetadata createComponentMetadataForTest(
    {String name: 'TestMetadata',
    moduleUrl: 'asset:angular2/test/test.dart',
    selector: '[test]',
    String template: 'Test'}) {
  return createDirectiveMetadataForTest(
      name: name,
      moduleUrl: moduleUrl,
      selector: selector,
      template: new CompileTemplateMetadata(
          encapsulation: ViewEncapsulation.Emulated, template: template));
}

CompilePipeMetadata createPipeMetadataForTest(
    {String name: 'TestPipe',
    moduleUrl: 'asset:angular2/test/test.dart',
    String pipeName: 'test',
    bool pure: false}) {
  return new CompilePipeMetadata(
      type: new CompileTypeMetadata(name: name, moduleUrl: moduleUrl),
      name: pipeName,
      pure: pure);
}

CompileDirectiveMetadata createDirectiveMetadataForTest(
    {String name: 'TestMetadata',
    String moduleUrl: 'asset:angular2/test/test.dart',
    String selector: 'test',
    CompileTemplateMetadata template: null}) {
  return CompileDirectiveMetadata.create(
      type: new CompileTypeMetadata(name: name, moduleUrl: moduleUrl),
      isComponent: template != null,
      selector: selector,
      exportAs: null,
      changeDetection: ChangeDetectionStrategy.Default,
      inputs: [],
      outputs: [],
      host: {},
      lifecycleHooks: [],
      template: template);
}

CompileDirectiveMetadata createFoo([String moduleBase = 'asset:a']) =>
    createComponentMetadataForTest(
        name: 'FooComponent',
        moduleUrl: '$moduleBase/export_cycle_files/foo.dart',
        selector: 'foo',
        template: 'Foo');

CompileDirectiveMetadata createBar([String moduleBase = 'asset:a']) =>
    createComponentMetadataForTest(
        name: 'BarComponent',
        moduleUrl: '$moduleBase/export_cycle_files/bar.dart',
        selector: 'bar',
        template: 'Bar');

CompilePipeMetadata createBarPipe([String moduleBase = 'asset:a']) =>
    createPipeMetadataForTest(
        name: 'BarPipe',
        pipeName: 'bar',
        moduleUrl: '$moduleBase/export_cycle_files/bar.dart',
        pure: false);

CompileDirectiveMetadata createBaz([String moduleBase = 'asset:a']) =>
    createComponentMetadataForTest(
        name: 'BazComponent',
        moduleUrl: '$moduleBase/export_cycle_files/baz.dart',
        selector: 'baz',
        template: 'Baz');
