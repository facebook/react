@TestOn('vm')
library angular2.test.transform.transform.server.spec;

import 'package:test/test.dart';

import 'common/annotation_matcher_test.dart' as annotationMatcher;
import 'common/async_string_writer_tests.dart' as asyncStringWriter;
import 'common/code/ng_deps_code_tests.dart' as ngDepsCode;
import 'common/ng_meta_test.dart' as ngMetaTest;
import 'common/url_resolver_tests.dart' as urlResolver;
import 'deferred_rewriter/all_tests.dart' as deferredRewriter;
import 'directive_metadata_linker/all_tests.dart' as directiveMeta;
import 'directive_processor/all_tests.dart' as directiveProcessor;
import 'inliner_for_test/all_tests.dart' as inliner;

main() {
  group('AnnotationMatcher', annotationMatcher.allTests);
  group('AsyncStringWriter', asyncStringWriter.allTests);
  group('Deferred Rewriter', deferredRewriter.allTests);
  group('Directive Metadata Linker', directiveMeta.allTests);
  group('Directive Processor', directiveProcessor.allTests);
  group('Inliner For Test', inliner.allTests);
  group('NgDepsCode', ngDepsCode.allTests);
  group('NgMeta', ngMetaTest.allTests);
  group('Url Resolver', urlResolver.allTests);
}
