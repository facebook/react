library angular2.test.transform.transform.old.spec;

import 'package:guinness/guinness.dart';
import 'package:unittest/unittest.dart' hide expect;
import 'package:unittest/vm_config.dart';

import 'reflection_remover/all_tests.dart' as reflectionRemover;
import 'template_compiler/all_tests.dart' as templateCompiler;
import 'stylesheet_compiler/all_tests.dart' as stylesheetCompiler;

main() {
  useVMConfiguration();
  describe('Reflection Remover', reflectionRemover.allTests);
  describe('Template Compiler', templateCompiler.allTests);
  describe('Stylesheet Compiler', stylesheetCompiler.allTests);
}


