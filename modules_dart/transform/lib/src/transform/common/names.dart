library angular2.transform.common.names;

const BOOTSTRAP_NAME = 'bootstrap';
const BOOTSTRAP_STATIC_NAME = 'bootstrapStatic';
const SETUP_METHOD_NAME = 'initReflector';
const REFLECTOR_VAR_NAME = 'reflector';
const TRANSFORM_DYNAMIC_MODE = 'transform_dynamic';
const CSS_EXTENSION = '.css';
const DEFERRED_EXTENSION = '.dart.deferredCount';
const SHIMMED_STYLESHEET_EXTENSION = '.css.shim.dart';
const NON_SHIMMED_STYLESHEET_EXTENSION = '.css.dart';
const META_EXTENSION = '.ng_meta.json';
const REFLECTION_CAPABILITIES_NAME = 'ReflectionCapabilities';
const REFLECTOR_IMPORT = 'package:angular2/src/core/reflection/reflection.dart';
const REFLECTOR_PREFIX = '_ngRef';
const REGISTER_TYPE_METHOD_NAME = 'registerType';
const SUMMARY_META_EXTENSION = '.ng_summary.json';
const TEMPLATE_EXTENSION = '.ngfactory.dart';

/// Note that due to the implementation of `_toExtension`, ordering is
/// important. For example, putting '.dart' first in this list will cause
/// incorrect behavior because it will (incompletely) match '.ngfactory.dart'
/// files.
const ALL_EXTENSIONS = const [
  DEFERRED_EXTENSION,
  META_EXTENSION,
  SUMMARY_META_EXTENSION,
  TEMPLATE_EXTENSION,
  '.dart'
];

/// Whether `uri` was created by a transform phase.
///
/// This may return false positives for problematic inputs.
/// This just tests file extensions known to be created by the transformer, so
/// any files named like transformer outputs will be reported as generated.
bool isGenerated(String uri) {
  return const [
    DEFERRED_EXTENSION,
    META_EXTENSION,
    NON_SHIMMED_STYLESHEET_EXTENSION,
    SHIMMED_STYLESHEET_EXTENSION,
    SUMMARY_META_EXTENSION,
    TEMPLATE_EXTENSION,
  ].any((ext) => uri.endsWith(ext));
}

/// Returns `uri` with its extension updated to [DEFERRED_EXTENSION].
String toDeferredExtension(String uri) =>
    _toExtension(uri, ALL_EXTENSIONS, DEFERRED_EXTENSION);

/// Returns `uri` with its extension updated to [META_EXTENSION].
String toMetaExtension(String uri) =>
    _toExtension(uri, ALL_EXTENSIONS, META_EXTENSION);

/// Returns `uri` with its extension updated to [TEMPLATES_EXTENSION].
String toTemplateExtension(String uri) =>
    _toExtension(uri, ALL_EXTENSIONS, TEMPLATE_EXTENSION);

/// Returns `uri` with its extension updated to [SHIMMED_STYLESHEET_EXTENSION].
String toShimmedStylesheetExtension(String uri) =>
    _toExtension(uri, const [CSS_EXTENSION], SHIMMED_STYLESHEET_EXTENSION);

/// Returns `uri` with its extension updated to [NON_SHIMMED_STYLESHEET_EXTENSION].
String toNonShimmedStylesheetExtension(String uri) =>
    _toExtension(uri, const [CSS_EXTENSION], NON_SHIMMED_STYLESHEET_EXTENSION);

/// Returns `uri` with its extension updated to [SUMMARY_META_EXTENSION].
String toSummaryExtension(String uri) =>
    _toExtension(uri, ALL_EXTENSIONS, SUMMARY_META_EXTENSION);

/// Returns `uri` with its extension updated to `toExtension` if its
/// extension is currently in `fromExtension`.
String _toExtension(
    String uri, Iterable<String> fromExtensions, String toExtension) {
  if (uri == null) return null;
  if (uri.endsWith(toExtension)) return uri;
  for (var extension in fromExtensions) {
    if (uri.endsWith(extension)) {
      return '${uri.substring(0, uri.length-extension.length)}'
          '$toExtension';
    }
  }
  throw new ArgumentError.value(
      uri,
      'uri',
      'Provided value ends with an unexpected extension. '
      'Expected extension(s): [${fromExtensions.join(', ')}].');
}
