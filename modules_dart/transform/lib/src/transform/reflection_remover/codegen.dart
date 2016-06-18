library angular2.transform.reflection_remover.codegen;

import 'package:angular2/src/transform/common/names.dart';
import 'package:barback/barback.dart';
import 'package:path/path.dart' as path;

class Codegen {
  static const _PREFIX_BASE = 'ngStaticInit';
  final AssetId reflectionEntryPoint;

  /// The prefix used to import our generated file.
  final String prefix;

  Codegen(this.reflectionEntryPoint, {String prefix})
      : this.prefix = prefix == null ? _PREFIX_BASE : prefix {
    if (this.prefix.isEmpty) throw new ArgumentError.value('(empty)', 'prefix');
  }

  /// Generates code to import the library containing the method which sets up
  /// Angular2 reflection statically.
  ///
  /// The code generated here should follow the example of code generated for
  /// an {@link ImportDirective} node.
  String codegenImport() {
    var importUri = path.basename(
        reflectionEntryPoint.changeExtension(TEMPLATE_EXTENSION).path);
    return '''import '$importUri' as $prefix;''';
  }

  /// Generates code to call the method which sets up Angular2 reflection
  /// statically.
  String codegenSetupReflectionCall() {
    return '$prefix.$SETUP_METHOD_NAME();';
  }
}
