/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMUnknownPropertyHook
 */

'use strict';

var DOMProperty = require('DOMProperty');
var EventPluginRegistry = require('EventPluginRegistry');
var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
var {ReactComponentTreeHook} = require('ReactGlobalSharedState');

var warning = require('fbjs/lib/warning');

function getStackAddendum(debugID) {
  if (debugID != null) {
    // This can only happen on Stack
    return ReactComponentTreeHook.getStackAddendumByID(debugID);
  } else {
    // This can only happen on Fiber / Server
    var stack = ReactDebugCurrentFiber.getCurrentFiberStackAddendum();
    return stack != null ? stack : '';
  }
}

if (__DEV__) {
  var additionalProps = [
    // HTML
    'about',
    'accept',
    'acceptCharset',
    'accessKey',
    'action',
    'allowFullScreen',
    'allowTransparency',
    'alt',
    'as',
    'async',
    'autoCapitalize',
    'autoComplete',
    'autoCorrect',
    'autoPlay',
    'autoSave',
    'capture',
    'cellPadding',
    'cellSpacing',
    'challenge',
    'charSet',
    'checked',
    'cite',
    'classID',
    'className',
    'colSpan',
    'color',
    'cols',
    'content',
    'contentEditable',
    'contextMenu',
    'controls',
    'coords',
    'crossOrigin',
    'data',
    'datatype',
    'dateTime',
    'default',
    'defer',
    'dir',
    'disabled',
    'download',
    'draggable',
    'encType',
    'form',
    'formAction',
    'formEncType',
    'formMethod',
    'formNoValidate',
    'formTarget',
    'frameBorder',
    'headers',
    'height',
    'hidden',
    'high',
    'href',
    'hrefLang',
    'htmlFor',
    'httpEquiv',
    'id',
    'inlist',
    'inputMode',
    'integrity',
    'is',
    'itemID',
    'itemProp',
    'itemRef',
    'itemScope',
    'itemType',
    'keyParams',
    'keyType',
    'kind',
    'label',
    'lang',
    'list',
    'loop',
    'low',
    'manifest',
    'marginHeight',
    'marginWidth',
    'max',
    'maxLength',
    'media',
    'mediaGroup',
    'method',
    'min',
    'minLength',
    'multiple',
    'muted',
    'name',
    'noValidate',
    'nonce',
    'open',
    'optimum',
    'pattern',
    'placeholder',
    'playsInline',
    'poster',
    'prefix',
    'preload',
    'profile',
    'property',
    'radioGroup',
    'readOnly',
    'referrerPolicy',
    'rel',
    'required',
    'resource',
    'results',
    'reversed',
    'role',
    'rowSpan',
    'rows',
    'sandbox',
    'scope',
    'scoped',
    'scrolling',
    'seamless',
    'security',
    'selected',
    'shape',
    'size',
    'sizes',
    'slot',
    'span',
    'spellCheck',
    'src',
    'srcDoc',
    'srcLang',
    'srcSet',
    'start',
    'step',
    'style',
    'summary',
    'tabIndex',
    'target',
    'title',
    'type',
    'typeof',
    'unselectable',
    'useMap',
    'value',
    'vocab',
    'width',
    'wmode',
    'wrap',

    // SVG
    'accentHeight',
    'accumulate',
    'additive',
    'alignmentBaseline',
    'allowReorder',
    'alphabetic',
    'amplitude',
    'arabicForm',
    'ascent',
    'attributeName',
    'attributeType',
    'autoReverse',
    'azimuth',
    'baseFrequency',
    'baseProfile',
    'baselineShift',
    'bbox',
    'begin',
    'bias',
    'by',
    'calcMode',
    'capHeight',
    'clip',
    'clipPath',
    'clipPathUnits',
    'clipRule',
    'colorInterpolation',
    'colorInterpolationFilters',
    'colorProfile',
    'colorRendering',
    'contentScriptType',
    'contentStyleType',
    'cursor',
    'cx',
    'cy',
    'd',
    'decelerate',
    'descent',
    'diffuseConstant',
    'direction',
    'display',
    'divisor',
    'dominantBaseline',
    'dur',
    'dx',
    'dy',
    'edgeMode',
    'elevation',
    'enableBackground',
    'end',
    'exponent',
    'externalResourcesRequired',
    'fill',
    'fillOpacity',
    'fillRule',
    'filter',
    'filterRes',
    'filterUnits',
    'floodColor',
    'floodOpacity',
    'focusable',
    'fontFamily',
    'fontSize',
    'fontSizeAdjust',
    'fontStretch',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'format',
    'from',
    'fx',
    'fy',
    'g1',
    'g2',
    'glyphName',
    'glyphOrientationHorizontal',
    'glyphOrientationVertical',
    'glyphRef',
    'gradientTransform',
    'gradientUnits',
    'hanging',
    'horizAdvX',
    'horizOriginX',
    'ideographic',
    'imageRendering',
    'in',
    'in2',
    'intercept',
    'k',
    'k1',
    'k2',
    'k3',
    'k4',
    'kernelMatrix',
    'kernelUnitLength',
    'kerning',
    'keyPoints',
    'keySplines',
    'keyTimes',
    'lengthAdjust',
    'letterSpacing',
    'lightingColor',
    'limitingConeAngle',
    'local',
    'markerEnd',
    'markerHeight',
    'markerMid',
    'markerStart',
    'markerUnits',
    'markerWidth',
    'mask',
    'maskContentUnits',
    'maskUnits',
    'mathematical',
    'mode',
    'numOctaves',
    'offset',
    'opacity',
    'operator',
    'order',
    'orient',
    'orientation',
    'origin',
    'overflow',
    'overlinePosition',
    'overlineThickness',
    'paintOrder',
    'panose1',
    'pathLength',
    'patternContentUnits',
    'patternTransform',
    'patternUnits',
    'pointerEvents',
    'points',
    'pointsAtX',
    'pointsAtY',
    'pointsAtZ',
    'preserveAlpha',
    'preserveAspectRatio',
    'primitiveUnits',
    'r',
    'radius',
    'refX',
    'refY',
    'renderingIntent',
    'repeatCount',
    'repeatDur',
    'requiredExtensions',
    'requiredFeatures',
    'restart',
    'result',
    'rotate',
    'rx',
    'ry',
    'scale',
    'seed',
    'shapeRendering',
    'slope',
    'spacing',
    'specularConstant',
    'specularExponent',
    'speed',
    'spreadMethod',
    'startOffset',
    'stdDeviation',
    'stemh',
    'stemv',
    'stitchTiles',
    'stopColor',
    'stopOpacity',
    'strikethroughPosition',
    'strikethroughThickness',
    'string',
    'stroke',
    'strokeDasharray',
    'strokeDashoffset',
    'strokeLinecap',
    'strokeLinejoin',
    'strokeMiterlimit',
    'strokeOpacity',
    'strokeWidth',
    'surfaceScale',
    'systemLanguage',
    'tableValues',
    'targetX',
    'targetY',
    'textAnchor',
    'textDecoration',
    'textLength',
    'textRendering',
    'to',
    'transform',
    'u1',
    'u2',
    'underlinePosition',
    'underlineThickness',
    'unicode',
    'unicodeBidi',
    'unicodeRange',
    'unitsPerEm',
    'vAlphabetic',
    'vHanging',
    'vIdeographic',
    'vMathematical',
    'values',
    'vectorEffect',
    'version',
    'vertAdvY',
    'vertOriginX',
    'vertOriginY',
    'viewBox',
    'viewTarget',
    'visibility',
    'widths',
    'wordSpacing',
    'writingMode',
    'x',
    'x1',
    'x2',
    'xChannelSelector',
    'xHeight',
    'xlinkActuate',
    'xlinkArcrole',
    'xlinkHref',
    'xlinkRole',
    'xlinkShow',
    'xlinkTitle',
    'xlinkType',
    'xmlBase',
    'xmlLang',
    'xmlSpace',
    'xmlns',
    'xmlnsXlink',
    'y',
    'y1',
    'y2',
    'yChannelSelector',
    'z',
    'zoomAndPan',
  ];

  additionalProps.forEach(function(name) {
    var lowerCasedName = name.toLowerCase();

    // Do not warn if the casing will not change
    if (name !== lowerCasedName) {
      DOMProperty.getPossibleStandardName[lowerCasedName] = name;
    }
  });

  var warnedProperties = {};

  var validateProperty = function(tagName, name, debugID) {
    if (
      DOMProperty.properties.hasOwnProperty(name) ||
      DOMProperty.isReservedProp(name) ||
      (warnedProperties.hasOwnProperty(name) && warnedProperties[name])
    ) {
      return true;
    }
    if (EventPluginRegistry.registrationNameModules.hasOwnProperty(name)) {
      return true;
    }
    warnedProperties[name] = true;

    var lowerCasedName = name.toLowerCase();

    // data-* attributes should be lowercase; suggest the lowercase version
    var standardName = DOMProperty.getPossibleStandardName.hasOwnProperty(name)
      ? DOMProperty.getPossibleStandardName[name]
      : null;

    var registrationName = EventPluginRegistry.possibleRegistrationNames.hasOwnProperty(
      lowerCasedName,
    )
      ? EventPluginRegistry.possibleRegistrationNames[lowerCasedName]
      : null;

    if (standardName != null) {
      warning(
        false,
        'Unknown DOM property %s. Did you mean %s?%s',
        name,
        standardName,
        getStackAddendum(debugID),
      );
      return true;
    } else if (registrationName != null) {
      warning(
        false,
        'Unknown event handler property %s. Did you mean `%s`?%s',
        name,
        registrationName,
        getStackAddendum(debugID),
      );
      return true;
    }

    return true;
  };
}

var warnUnknownProperties = function(type, props, debugID) {
  var unknownProps = [];
  for (var key in props) {
    var isValid = validateProperty(type, key, debugID);
    if (!isValid) {
      unknownProps.push(key);
    }
  }

  var unknownPropString = unknownProps.map(prop => '`' + prop + '`').join(', ');

  if (unknownProps.length === 1) {
    warning(
      false,
      'Unknown prop %s on <%s> tag. Remove this prop from the element. ' +
        'For details, see https://fb.me/react-unknown-prop%s',
      unknownPropString,
      type,
      getStackAddendum(debugID),
    );
  } else if (unknownProps.length > 1) {
    warning(
      false,
      'Unknown props %s on <%s> tag. Remove these props from the element. ' +
        'For details, see https://fb.me/react-unknown-prop%s',
      unknownPropString,
      type,
      getStackAddendum(debugID),
    );
  }
};

function validateProperties(type, props, debugID /* Stack only */) {
  if (type.indexOf('-') >= 0 || props.is) {
    return;
  }
  warnUnknownProperties(type, props, debugID);
}

var ReactDOMUnknownPropertyHook = {
  // Fiber
  validateProperties,
  // Stack
  onBeforeMountComponent(debugID, element) {
    if (__DEV__ && element != null && typeof element.type === 'string') {
      validateProperties(element.type, element.props, debugID);
    }
  },
  onBeforeUpdateComponent(debugID, element) {
    if (__DEV__ && element != null && typeof element.type === 'string') {
      validateProperties(element.type, element.props, debugID);
    }
  },
};

module.exports = ReactDOMUnknownPropertyHook;
