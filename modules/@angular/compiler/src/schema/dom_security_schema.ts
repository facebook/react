import {SecurityContext} from '../../core_private';

// =================================================================================================
// =================================================================================================
// =========== S T O P   -  S T O P   -  S T O P   -  S T O P   -  S T O P   -  S T O P  ===========
// =================================================================================================
// =================================================================================================
//
//        DO NOT EDIT THIS LIST OF SECURITY SENSITIVE PROPERTIES WITHOUT A SECURITY REVIEW!
//                               Reach out to mprobst for details.
//
// =================================================================================================

/** Map from tagName|propertyName SecurityContext. Properties applying to all tags use '*'. */
export const SECURITY_SCHEMA: {[k: string]: SecurityContext} = {};

function registerContext(ctx: SecurityContext, specs: string[]) {
  for (let spec of specs) SECURITY_SCHEMA[spec.toLowerCase()] = ctx;
}

// Case is insignificant below, all element and attribute names are lower-cased for lookup.

registerContext(SecurityContext.HTML, [
  'iframe|srcdoc',
  '*|innerHTML',
  '*|outerHTML',
]);
registerContext(SecurityContext.STYLE, ['*|style']);
// NB: no SCRIPT contexts here, they are never allowed due to the parser stripping them.
registerContext(SecurityContext.URL, [
  '*|formAction', 'area|href',       'area|ping',       'audio|src', 'a|href',
  'a|ping',       'blockquote|cite', 'body|background', 'del|cite',  'form|action',
  'img|src',      'img|srcset',      'input|src',       'ins|cite',  'q|cite',
  'source|src',   'source|srcset',   'video|poster',    'video|src',
]);
registerContext(SecurityContext.RESOURCE_URL, [
  'applet|code',
  'applet|codebase',
  'base|href',
  'embed|src',
  'frame|src',
  'head|profile',
  'html|manifest',
  'iframe|src',
  'link|href',
  'media|src',
  'object|codebase',
  'object|data',
  'script|src',
  'track|src',
]);
