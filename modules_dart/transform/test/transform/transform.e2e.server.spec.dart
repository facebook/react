library angular2.test.transform.transform.e2e.spec;

import 'package:test/test.dart';

import 'inliner_for_test/all_tests.dart' as inliner;
import 'integration/all_tests.dart' as integration;

main() {
  group('Inliner For Test e2e', inliner.endToEndTests);
  group('Transformer Pipeline', integration.allTests);
}
