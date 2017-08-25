import {createElement} from 'glamor/react'; // eslint-disable-line
/* @jsx createElement */
import './App.css';

import {MultiGrid, AutoSizer} from 'react-virtualized';
import 'react-virtualized/styles.css';

const React = global.React;
const {Component} = React;

const ReactDOM15 = global.ReactDOM15;
const ReactDOM16 = global.ReactDOM;

const types = [
  {
    name: 'string',
    testValue: 'a string',
    testDisplayValue: "'a string'",
  },
  {
    name: 'null',
    testValue: null,
  },
  {
    name: 'undefined',
    testValue: undefined,
  },
  {
    name: 'empty string',
    testValue: '',
    testDisplayValue: "''",
  },
  {
    name: 'array with string',
    testValue: ['string'],
    testDisplayValue: "['string']",
  },
  {
    name: 'empty array',
    testValue: [],
    testDisplayValue: '[]',
  },
  {
    name: 'object',
    testValue: {
      toString() {
        return 'result of toString()';
      },
    },
    testDisplayValue: "{ toString() { return 'result of toString()'; } }",
  },
  {
    name: 'numeric string',
    testValue: '42',
    displayValue: "'42'",
  },
  {
    name: '-1',
    testValue: -1,
  },
  {
    name: '0',
    testValue: 0,
  },
  {
    name: 'integer',
    testValue: 1,
  },
  {
    name: 'NaN',
    testValue: NaN,
  },
  {
    name: 'float',
    testValue: 99.99,
  },
  {
    name: 'true',
    testValue: true,
  },
  {
    name: 'false',
    testValue: 'false',
  },
  {
    name: "string 'true'",
    testValue: 'true',
    displayValue: "'true'",
  },
  {
    name: "string 'false'",
    testValue: 'false',
    displayValue: "'false'",
  },
  {
    name: "string 'on'",
    testValue: 'on',
    displayValue: "'on'",
  },
  {
    name: "string 'off'",
    testValue: 'off',
    displayValue: "'off'",
  },
  {
    name: 'symbol',
    testValue: Symbol('foo'),
    testDisplayValue: "Symbol('foo')",
  },
  {
    name: 'function',
    testValue: function f() {},
  },
];

function getProperty(propertyName) {
  return el => el[propertyName];
}

function getAttribute(attributeName) {
  return el => el.getAttribute(attributeName);
}

const attributes = [
  {name: 'about', read: getAttribute('about')},
  {name: 'aBoUt', read: getAttribute('about')},
  {
    name: 'accent-Height',
    containerTagName: 'svg',
    tagName: 'font-face',
    read: getAttribute('accent-height'),
  },
  {
    name: 'accent-height',
    containerTagName: 'svg',
    tagName: 'font-face',
    read: getAttribute('accent-height'),
  },
  {
    name: 'accentHeight',
    containerTagName: 'svg',
    tagName: 'font-face',
    read: getAttribute('accent-height'),
  },
  {name: 'accept', tagName: 'input'},
  {name: 'accept-charset', tagName: 'form', read: getProperty('acceptCharset')},
  {name: 'accept-Charset', tagName: 'form', read: getProperty('acceptCharset')},
  {name: 'acceptCharset', tagName: 'form'},
  {name: 'accessKey'},
  {
    name: 'accumulate',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('accumulate'),
  },
  {name: 'action', tagName: 'form', overrideStringValue: 'https://reactjs.com'},
  {
    name: 'additive',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('additive'),
  },
  {
    name: 'alignment-baseline',
    containerTagName: 'svg',
    tagName: 'textPath',
    read: getAttribute('alignment-baseline'),
  },
  {
    name: 'alignmentBaseline',
    containerTagName: 'svg',
    tagName: 'textPath',
    read: getAttribute('alignment-baseline'),
  },
  {
    name: 'allowFullScreen',
    tagName: 'iframe',
    read: getProperty('allowFullscreen'),
  },
  {
    name: 'allowfullscreen',
    tagName: 'iframe',
    read: getProperty('allowFullscreen'),
  },
  {
    name: 'allowFullscreen',
    tagName: 'iframe',
  },
  {
    name: 'allowReorder',
    containerTagName: 'svg',
    tagName: 'switch',
    read: getAttribute('allowreorder'),
  },
  {
    name: 'allowTransparency',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('allowtransparency'),
  },
  {
    name: 'alphabetic',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('alphabetic'),
  },
  {name: 'alt', tagName: 'img'},
  {
    name: 'amplitude',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('amplitude'),
  },
  {
    name: 'arabic-form',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('arabic-form'),
  },
  {
    name: 'arabicForm',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('arabic-form'),
  },
  {name: 'aria', read: getAttribute('aria')},
  {name: 'aria-', read: getAttribute('aria-')},
  {name: 'aria-invalidattribute', read: getAttribute('aria-invalidattribute')},
  {name: 'as', read: getAttribute('aria-invalidattribute')},
  {
    name: 'ascent',
    containerTagName: 'svg',
    tagName: 'font-face',
    read: getAttribute('ascent'),
  },
  {name: 'async', tagName: 'script'},
  {
    name: 'attributeName',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('attributeName'),
  },
  {
    name: 'attributeType',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('attributeType'),
  },
  {
    name: 'autoCapitalize',
    tagName: 'input',
    read: getProperty('autocapitalize'),
    overrideStringValue: 'words',
  },
  {
    name: 'autoComplete',
    tagName: 'input',
    overrideStringValue: 'email',
    read: getProperty('autocomplete'),
  },
  {
    name: 'autoCorrect',
    tagName: 'input',
    overrideStringValue: 'off',
    read: getAttribute('autocorrect'), // Chrome doesn't support the property.
  },
  {name: 'autoPlay', tagName: 'video', read: getProperty('autoplay')},
  {
    name: 'autoReverse',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('autoreverse'),
  },
  {name: 'autoSave', tagName: 'input', read: getAttribute('autosave')},
  {
    name: 'azimuth',
    containerTagName: 'svg',
    tagName: 'fedistantlight',
    read: getAttribute('azimuth'),
  },
  {
    name: 'baseFrequency',
    containerTagName: 'svg',
    tagName: 'feturbulance',
    read: getAttribute('baseFrequency'),
  },
  {
    name: 'baseline-shift',
    containerTagName: 'svg',
    tagName: 'textPath',
    read: getAttribute('baseline-shift'),
  },
  {
    name: 'baselineShift',
    containerTagName: 'svg',
    tagName: 'textPath',
    read: getAttribute('baseline-shift'),
  },
  {
    name: 'baseProfile',
    tagName: 'svg',
    read: getAttribute('baseProfile'),
  },
  {
    name: 'bbox',
    containerTagName: 'svg',
    tagName: 'font-face',
    read: getAttribute('bbox'),
  },
  {
    name: 'begin',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('begin'),
  },
  {
    name: 'bias',
    containerTagName: 'svg',
    tagName: 'feconvolvematrix',
    read: getAttribute('bias'),
  },
  {
    name: 'by',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('by'),
  },
  {
    name: 'calcMode',
    containerTagName: 'svg',
    tagName: 'animate',
    overrideStringValue: 'discrete',
    read: getAttribute('calcMode'),
  },
  {
    name: 'cap-height',
    containerTagName: 'svg',
    tagName: 'font-face',
    read: getAttribute('cap-height'),
  },
  {
    name: 'capHeight',
    containerTagName: 'svg',
    tagName: 'font-face',
    read: getAttribute('cap-height'),
  },
  {
    name: 'capture',
    tagName: 'input',
    overrideStringValue: 'environment',
    read: getAttribute('capture'), // The property is not supported in Chrome.
  },
  {name: 'cellPadding', tagName: 'table'},
  {name: 'cellSpacing', tagName: 'table'},
  {
    name: 'challenge',
    tagName: 'keygen',
    read: getAttribute('challenge'), // The property is not supported in Chrome.
  },
  {name: 'charSet', tagName: 'script', read: getProperty('charset')},
  {name: 'checked', tagName: 'input'},
  {name: 'Checked', tagName: 'input', read: getAttribute('Checked')},
  {name: 'Children', read: getAttribute('children')},
  {name: 'children'},
  {
    name: 'cite',
    tagName: 'blockquote',
    overrideStringValue: 'http://reactjs.com/',
  },
  {name: 'class', read: getAttribute('class')},
  {name: 'classID', tagName: 'object', read: getAttribute('classid')},
  {name: 'className'},
  {name: 'clip', tagName: 'svg', read: getAttribute('clip')},
  {
    name: 'clip-path',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('clip-path'),
  },
  {
    name: 'clipPath',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('clip-path'),
  },
  {
    name: 'clipPathUnits',
    containerTagName: 'svg',
    tagName: 'clipPath',
    read: getAttribute('clipPathUnits'),
  },
  {
    name: 'clip-rule',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('clip-rule'),
  },
  {
    name: 'clipRule',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('clip-rule'),
  },
  {
    name: 'color',
    containerTagName: 'svg',
    tagName: 'text',
    read: getAttribute('color'),
  },
  {
    name: 'color-interpolation',
    containerTagName: 'svg',
    tagName: 'animate',
    overrideStringValue: 'sRGB',
    read: getAttribute('color-interpolation'),
  },
  {
    name: 'colorInterpolation',
    containerTagName: 'svg',
    tagName: 'animate',
    overrideStringValue: 'sRGB',
    read: getAttribute('color-interpolation'),
  },
  {
    name: 'color-interpolation-filters',
    containerTagName: 'svg',
    tagName: 'feComposite',
    overrideStringValue: 'sRGB',
    read: getAttribute('color-interpolation-filters'),
  },
  {
    name: 'colorInterpolationFilters',
    containerTagName: 'svg',
    tagName: 'feComposite',
    overrideStringValue: 'sRGB',
    read: getAttribute('color-interpolation-filters'),
  },
  {
    name: 'color-profile',
    containerTagName: 'svg',
    tagName: 'image',
    overrideStringValue: 'sRGB',
    read: getAttribute('color-profile'),
  },
  {
    name: 'colorProfile',
    containerTagName: 'svg',
    tagName: 'image',
    overrideStringValue: 'sRGB',
    read: getAttribute('color-profile'),
  },
  {
    name: 'color-rendering',
    containerTagName: 'svg',
    tagName: 'animate',
    overrideStringValue: 'optimizeSpeed',
    read: getAttribute('color-rendering'),
  },
  {
    name: 'colorRendering',
    containerTagName: 'svg',
    tagName: 'animate',
    overrideStringValue: 'optimizeSpeed',
    read: getAttribute('color-rendering'),
  },
  {name: 'cols', tagName: 'textarea'},
  {name: 'colSpan', tagName: 'td'},
  {name: 'content', tagName: 'meta'},
  {name: 'contentEditable'},
  {
    name: 'contentScriptType',
    tagName: 'svg',
    read: getAttribute('contentScriptType'),
  },
  {
    name: 'contentStyleType',
    tagName: 'svg',
    read: getAttribute('contentStyleType'),
  },
  {name: 'contextMenu', read: getAttribute('contextmenu')}, // TODO: Read the property by rendering a menu with the ID.
  {name: 'controls', tagName: 'video'},
  {name: 'coords', tagName: 'a'},
  {name: 'crossOrigin', tagName: 'script'},
  {name: 'cursor', tag: 'svg', read: getAttribute('cursor')},
  {
    name: 'cx',
    containerTagName: 'svg',
    tagName: 'circle',
    read: getAttribute('cx'),
  },
  {
    name: 'cy',
    containerTagName: 'svg',
    tagName: 'circle',
    read: getAttribute('cy'),
  },
  {
    name: 'd',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('d'),
  },
  {
    name: 'dangerouslySetInnerHTML',
    read: getAttribute('dangerouslySetInnerHTML'),
  },
  {
    name: 'DangerouslySetInnerHTML',
    read: getAttribute('DangerouslySetInnerHTML'),
  },
  {name: 'data', read: getAttribute('data')},
  {name: 'data-', read: getAttribute('data-')},
  {name: 'data-unknownattribute', read: getAttribute('data-unknownattribute')},
  {name: 'datatype', read: getAttribute('datatype')},
  {
    name: 'dateTime',
    tagName: 'time',
    overrideStringValue: '2001-05-15T19:00',
    read: getAttribute('datetime'),
  },
  {
    name: 'decelerate',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('decelerate'),
  },
  {name: 'default', tagName: 'track'},
  {
    name: 'defaultchecked',
    tagName: 'input',
    read: getAttribute('defaultchecked'),
  },
  {name: 'defaultChecked', tagName: 'input'},
  {name: 'defaultValue', tagName: 'input'},
  {
    name: 'defaultValuE',
    tagName: 'input',
    read: getAttribute('defaultValuE'),
  },
  {name: 'defer', tagName: 'script'},
  {
    name: 'descent',
    containerTagName: 'svg',
    tagName: 'font-face',
    read: getAttribute('descent'),
  },
  {
    name: 'diffuseConstant',
    containerTagName: 'svg',
    tagName: 'fediffuselighting',
    read: getAttribute('diffuseConstant'),
  },
  {name: 'dir', overrideStringValue: 'rtl'},
  {
    name: 'direction',
    containerTagName: 'svg',
    tagName: 'text',
    overrideStringValue: 'rtl',
    read: getAttribute('direction'),
  },
  {name: 'disabled', tagName: 'input'},
  {
    name: 'display',
    tagName: 'svg',
    overrideStringValue: 'list-item',
    read: getAttribute('display'),
  },
  {
    name: 'divisor',
    containerTagName: 'svg',
    tagName: 'feconvolvematrix',
    read: getAttribute('divisor'),
  },
  {
    name: 'dominant-baseline',
    containerTagName: 'svg',
    tagName: 'text',
    read: getAttribute('dominant-baseline'),
  },
  {
    name: 'dominantBaseline',
    containerTagName: 'svg',
    tagName: 'text',
    read: getAttribute('dominant-baseline'),
  },
  {name: 'download', tagName: 'a'},
  {name: 'dOwNlOaD', tagName: 'a', read: getAttribute('dOwNlOaD')},
  {name: 'draggable'},
  {
    name: 'dur',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('dur'),
  },
  {
    name: 'dx',
    containerTagName: 'svg',
    tagName: 'dx',
    read: getAttribute('dx'),
  },
  {
    name: 'dX',
    containerTagName: 'svg',
    tagName: 'dX',
    read: getAttribute('dX'),
  },
  {
    name: 'dy',
    containerTagName: 'svg',
    tagName: 'dy',
    read: getAttribute('dy'),
  },
  {
    name: 'dY',
    containerTagName: 'svg',
    tagName: 'dY',
    read: getAttribute('dY'),
  },
  {
    name: 'edgeMode',
    containerTagName: 'svg',
    tagName: 'feConvolveMatrix',
    overrideStringValue: 'wrap',
    read: getAttribute('edgeMode'),
  },
  {
    name: 'elevation',
    containerTagName: 'svg',
    tagName: 'fedistantlight',
    read: getAttribute('elevation'),
  },
  {
    name: 'enable-background',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('enable-background'),
  },
  {
    name: 'enableBackground',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('enable-background'),
  },
  {
    name: 'encType',
    tagName: 'form',
    overrideStringValue: 'text/plain',
    read: getProperty('enctype'),
  },
  {
    name: 'end',
    containerTagName: 'svg',
    tagName: 'animate',
    read: getAttribute('end'),
  },
  {name: 'exponent', read: getAttribute('exponent')},
  {
    name: 'externalResourcesRequired',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('externalResourcesRequired'),
  },
  {
    name: 'fill',
    containerTagName: 'svg',
    tagName: 'path',
    read: getAttribute('fill'),
  },
  {
    name: 'fillOpacity',
    containerTagName: 'svg',
    tagName: 'circle',
    read: getAttribute('fill-opacity'),
  },
  {
    name: 'fill-opacity',
    containerTagName: 'svg',
    tagName: 'circle',
    read: getAttribute('fill-opacity'),
  },
  {
    name: 'fillRule',
    containerTagName: 'svg',
    tagName: 'circle',
    read: getAttribute('fill-rule'),
  },
  {
    name: 'fill-rule',
    containerTagName: 'svg',
    tagName: 'circle',
    read: getAttribute('fill-rule'),
  },
  {
    name: 'filter',
    containerTagName: 'svg',
    tagName: 'g',
    read: getAttribute('filter'),
  },
  {
    name: 'filterRes',
    containerTagName: 'svg',
    tagName: 'filter',
    read: getAttribute('filterRes'),
  },
  {
    name: 'filterUnits',
    containerTagName: 'svg',
    tagName: 'filter',
    overrideStringValue: 'userSpaceOnUse',
    read: getAttribute('filterUnits'),
  },
  {
    name: 'flood-color',
    containerTagName: 'svg',
    tagName: 'feflood',
    overrideStringValue: 'currentColor',
    read: getAttribute('flood-color'),
  },
  {
    name: 'floodColor',
    containerTagName: 'svg',
    tagName: 'feflood',
    overrideStringValue: 'currentColor',
    read: getAttribute('flood-color'),
  },
  {
    name: 'flood-opacity',
    containerTagName: 'svg',
    tagName: 'feflood',
    overrideStringValue: 'inherit',
    read: getAttribute('flood-opacity'),
  },
  {
    name: 'floodOpacity',
    containerTagName: 'svg',
    tagName: 'feflood',
    overrideStringValue: 'inherit',
    read: getAttribute('flood-opacity'),
  },
  {name: 'focusable', tagName: 'p', read: getAttribute('focusable')},
  {name: 'font-family', read: getAttribute('font-family')},
  {name: 'font-size', read: getAttribute('font-size')},
  {name: 'font-size-adjust', read: getAttribute('font-size-adjust')},
  {name: 'font-stretch', read: getAttribute('font-stretch')},
  {name: 'font-style', read: getAttribute('font-style')},
  {name: 'font-variant', read: getAttribute('font-variant')},
  {name: 'font-weight', read: getAttribute('font-weight')},
  {name: 'fontFamily', read: getAttribute('font-family')},
  {name: 'fontSize', read: getAttribute('font-size')},
  {name: 'fontSizeAdjust', read: getAttribute('font-size-adjust')},
  {name: 'fontStretch', read: getAttribute('font-stretch')},
  {name: 'fontStyle', read: getAttribute('font-style')},
  {name: 'fontVariant', read: getAttribute('font-variant')},
  {name: 'fontWeight', read: getAttribute('font-weight')},
  {name: 'for', tagName: 'label', read: getProperty('htmlFor')},
  {name: 'fOr', tagName: 'label', read: getProperty('htmlFor')},
  {name: 'form', read: getAttribute('form')}, // TODO: Read the property by rendering into a form with id
  {
    name: 'formAction',
    tagName: 'input',
    overrideStringValue: 'https://reactjs.com',
  },
  {name: 'format', read: getAttribute('format')},
  {name: 'formEncType', tagName: 'input', read: getProperty('formEnctype')},
  {name: 'formMethod', tagName: 'input', overrideStringValue: 'POST'},
  {name: 'formNoValidate', tagName: 'input'},
  {name: 'formTarget', tagName: 'input'},
  {name: 'frameBorder', tagName: 'frame'},
  {name: 'from', read: getAttribute('from')},
  {name: 'fx', read: getAttribute('fx')},
  {name: 'fX', read: getAttribute('fx')},
  {name: 'fY', read: getAttribute('fy')},
  {name: 'fy', read: getAttribute('fy')},
  {name: 'G1', read: getAttribute('g1')},
  {name: 'g1', read: getAttribute('g1')},
  {name: 'G2', read: getAttribute('g2')},
  {name: 'g2', read: getAttribute('g2')},
  {name: 'glyph-name', read: getAttribute('glyph-name')},
  {
    name: 'glyph-orientation-horizontal',
    read: getAttribute('glyph-orientation-horizontal'),
  },
  {
    name: 'glyph-orientation-vertical',
    read: getAttribute('glyph-orientation-vertical'),
  },
  {name: 'glyphName', read: getAttribute('glyph-name')},
  {
    name: 'glyphOrientationHorizontal',
    read: getAttribute('glyph-orientation-horizontal'),
  },
  {
    name: 'glyphOrientationVertical',
    read: getAttribute('glyph-orientation-vertical'),
  },
  {name: 'glyphRef', read: getAttribute('glyph-ref')},
  {name: 'gradientTransform', read: getAttribute('gradient-transform')},
  {name: 'gradientUnits', read: getAttribute('gradient-units')},
  {name: 'hanging', read: getAttribute('hanging')},
  {name: 'hasOwnProperty', read: getAttribute('hasOwnProperty')},
  {name: 'headers', tagName: 'td'},
  {name: 'height', tagName: 'img'},
  {name: 'hidden'},
  {name: 'high', tagName: 'meter'},
  {name: 'horiz-adv-x', read: getAttribute('horiz-adv-x')},
  {name: 'horiz-origin-x', read: getAttribute('horiz-origin-x')},
  {name: 'horizAdvX', read: getAttribute('horiz-adv-x')},
  {name: 'horizOriginX', read: getAttribute('horiz-origin-x')},
  {name: 'href', tagName: 'a', overrideStringValue: 'https://reactjs.com'},
  {name: 'hrefLang', read: getAttribute('hreflang')},
  {name: 'htmlFor', tagName: 'label'},
  {name: 'http-equiv', tagName: 'meta', read: getProperty('httpEquiv')},
  {name: 'httpEquiv', tagName: 'meta'},
  {name: 'icon', tagName: 'command', read: getAttribute('icon')},
  {name: 'id'},
  {name: 'ID', read: getProperty('id')},
  {name: 'ideographic', read: getAttribute('ideographic')},
  {name: 'image-rendering', read: getAttribute('image-rendering')},
  {name: 'imageRendering', read: getAttribute('image-rendering')},
  {name: 'in', read: getAttribute('in')},
  {name: 'in2', read: getAttribute('in2')},
  {name: 'initialChecked', read: getAttribute('initialchecked')},
  {name: 'initialValue', read: getAttribute('initialvalue')},
  {name: 'inlist', read: getAttribute('inlist')},
  {name: 'inputMode', tagName: 'input', read: getAttribute('inputmode')}, // TODO: Should use property but it's not implemented in Chrome
  {name: 'integrity', tagName: 'script'},
  {name: 'intercept', read: getAttribute('intercept')},
  {
    name: 'is',
    tagName: 'button',
    overrideStringValue: 'x-test-element',
    read: getAttribute('is'),
  }, // TODO: This could check if this is an extended custom element but this is a controversial spec.
  {name: 'itemID', read: getAttribute('itemid')},
  {name: 'itemProp', read: getAttribute('itemprop')},
  {name: 'itemRef', read: getAttribute('itemref')},
  {name: 'itemScope', read: getAttribute('itemscope')},
  {name: 'itemType', read: getAttribute('itemtype')},
  {name: 'k', read: getAttribute('k')},
  {name: 'K', read: getAttribute('k')},
  {name: 'K1', read: getAttribute('k1')},
  {name: 'k1', read: getAttribute('k1')},
  {name: 'k2', read: getAttribute('k2')},
  {name: 'k3', read: getAttribute('k3')},
  {name: 'k4', read: getAttribute('k4')},
  {name: 'kernelMatrix', read: getAttribute('kernelMatrix')},
  {name: 'kernelUnitLength', read: getAttribute('kernelUnitLength')},
  {name: 'kerning', read: getAttribute('kerning')},
  {name: 'keyParams', read: getAttribute('keyParams')},
  {name: 'keyPoints', read: getAttribute('keyPoints')},
  {name: 'keySplines', read: getAttribute('keySplines')},
  {name: 'keyTimes', read: getAttribute('keyTimes')},
  {name: 'keyType', read: getAttribute('keyType')},
  {name: 'kind', tagName: 'track', overrideStringValue: 'captions'},
  {name: 'label', tagName: 'track'},
  {name: 'LANG', read: getProperty('lang')},
  {name: 'lang'},
  {name: 'length', read: getAttribute('length')},
  {name: 'lengthAdjust', read: getAttribute('lengthAdjust')},
  {name: 'letter-spacing', read: getAttribute('letter-spacing')},
  {name: 'letterSpacing', read: getAttribute('letter-spacing')},
  {name: 'lighting-color', read: getAttribute('lighting-color')},
  {name: 'lightingColor', read: getAttribute('lighting-color')},
  {name: 'limitingConeAngle', read: getAttribute('limitingConeAngle')},
  {name: 'list', read: getAttribute('list')}, // TODO: This should match the ID of a datalist element and then read property.
  {name: 'local', read: getAttribute('local')},
  {name: 'loop', tagName: 'audio'},
  {name: 'low', tagName: 'meter'},
  {name: 'manifest', read: getAttribute('manifest')},
  {name: 'marginHeight', tagName: 'frame'},
  {name: 'marginWidth', tagName: 'frame'},
  {name: 'marker-end', read: getAttribute('marker-end')},
  {name: 'marker-mid', read: getAttribute('marker-mid')},
  {name: 'marker-start', read: getAttribute('marker-start')},
  {name: 'markerEnd', read: getAttribute('marker-end')},
  {name: 'markerHeight', read: getAttribute('markerHeight')},
  {name: 'markerMid', read: getAttribute('marker-mid')},
  {name: 'markerStart', read: getAttribute('marker-start')},
  {name: 'markerUnits', read: getAttribute('markerUnits')},
  {name: 'markerWidth', read: getAttribute('markerWidth')},
  {name: 'mask', read: getAttribute('mask')},
  {name: 'maskContentUnits', read: getAttribute('maskContentUnits')},
  {name: 'maskUnits', read: getAttribute('maskUnits')},
  {name: 'mathematical', read: getAttribute('mathematical')},
  {name: 'max', tagName: 'input'},
  {name: 'max', tagName: 'meter'},
  {name: 'max', tagName: 'progress'},
  {name: 'maxLength', tagName: 'textarea'},
  {name: 'media', tagName: 'link'},
  {name: 'mediaGroup', tagName: 'video', read: getAttribute('mediagroup')}, // TODO: Not yet implemented in Chrome.
  {name: 'method', tagName: 'form', overrideStringValue: 'POST'},
  {name: 'min', tagName: 'input'},
  {name: 'min', tagName: 'meter'},
  {name: 'minLength', tagName: 'input'},
  {name: 'mode', read: getAttribute('mode')},
  {name: 'multiple', tagName: 'select'},
  {name: 'muted', tagName: 'video'},
  {name: 'name', tagName: 'input'},
  {name: 'nonce', read: getAttribute('nonce')},
  {name: 'noValidate', tagName: 'form'},
  {name: 'numOctaves', read: getAttribute('numOctaves')},
  {name: 'offset', read: getAttribute('offset')},
  {name: 'on-click'}, // TODO: Check for event subscriptions
  {name: 'on-unknownevent'}, // TODO: Check for event subscriptions
  {name: 'onclick'}, // TODO: Check for event subscriptions
  {name: 'onClick'}, // TODO: Check for event subscriptions
  {name: 'onunknownevent'}, // TODO: Check for event subscriptions
  {name: 'onUnknownEvent'}, // TODO: Check for event subscriptions
  {name: 'opacity', read: getAttribute('opacity')},
  {name: 'open', tagName: 'details'},
  {name: 'operator', read: getAttribute('operator')},
  {name: 'optimum', tagName: 'meter'},
  {name: 'order', read: getAttribute('order')},
  {name: 'orient', read: getAttribute('orient')},
  {name: 'orientation', read: getAttribute('orientation')},
  {name: 'origin', read: getAttribute('origin')},
  {name: 'overflow', read: getAttribute('overflow')},
  {name: 'overline-position', read: getAttribute('overline-position')},
  {name: 'overline-thickness', read: getAttribute('overline-thickness')},
  {name: 'overlinePosition', read: getAttribute('overline-position')},
  {name: 'overlineThickness', read: getAttribute('overline-thickness')},
  {name: 'paint-order', read: getAttribute('paint-order')},
  {name: 'paintOrder', read: getAttribute('paint-order')},
  {name: 'panose-1', read: getAttribute('panose-1')},
  {name: 'panose1', read: getAttribute('panose-1')},
  {name: 'pathLength', read: getAttribute('pathLength')},
  {name: 'pattern', tagName: 'input'},
  {name: 'patternContentUnits', read: getAttribute('patternContentUnits')},
  {name: 'patternTransform', read: getAttribute('patternTransform')},
  {name: 'patternUnits', read: getAttribute('patternUnits')},
  {name: 'placeholder', tagName: 'input'},
  {name: 'playsInline', read: getAttribute('playsinline')},
  {name: 'pointer-events', read: getAttribute('pointer-events')},
  {name: 'pointerEvents', read: getAttribute('pointer-events')},
  {name: 'points', read: getAttribute('points')},
  {name: 'pointsAtX', read: getAttribute('pointsAtX')},
  {name: 'pointsAtY', read: getAttribute('pointsAtY')},
  {name: 'pointsAtZ', read: getAttribute('pointsAtZ')},
  {
    name: 'poster',
    tagName: 'video',
    overrideStringValue: 'https://reactjs.com',
  },
  {name: 'prefix', read: getAttribute('prefix')},
  {name: 'preload', tagName: 'video', overrideStringValue: 'none'},
  {name: 'preserveAlpha', read: getAttribute('preserveAlpha')},
  {name: 'preserveAspectRatio', read: getAttribute('preserveAspectRatio')},
  {name: 'primitiveUnits', read: getAttribute('primitiveUnits')},
  {name: 'profile', read: getAttribute('profile')},
  {name: 'property', read: getAttribute('property')},
  {name: 'props', read: getAttribute('props')},
  {name: 'r', read: getAttribute('r')},
  {name: 'radioGroup', tagName: 'command', read: getAttribute('radiogroup')},
  {name: 'radius', read: getAttribute('radius')},
  {name: 'readOnly', tagName: 'input'},
  {name: 'referrerPolicy', tagName: 'iframe'},
  {name: 'refX', read: getAttribute('refX')},
  {name: 'refY', read: getAttribute('refY')},
  {name: 'rel', tagName: 'a'},
  {name: 'rendering-intent', read: getAttribute('rendering-intent')},
  {name: 'renderingIntent', read: getAttribute('rendering-intent')},
  {name: 'repeatCount', read: getAttribute('repeatcount')},
  {name: 'repeatDur', read: getAttribute('repeatdur')},
  {name: 'required', tagName: 'input'},
  {name: 'requiredExtensions', read: getAttribute('requiredExtensions')},
  {name: 'requiredFeatures', read: getAttribute('requiredFeatures')},
  {name: 'resource', read: getAttribute('resource')},
  {name: 'restart', read: getAttribute('resource')},
  {name: 'result', read: getAttribute('result')},
  {name: 'results', tagName: 'input', read: getAttribute('results')}, // TODO: Should use property but it's not supported in Chrome.
  {name: 'reversed', tagName: 'ol'},
  {name: 'role', read: getAttribute('role')},
  {name: 'rotate', read: getAttribute('role')},
  {name: 'rows', tagName: 'textarea'},
  {name: 'rowSpan', tagName: 'td'},
  {name: 'rx', read: getAttribute('rx')},
  {name: 'ry', read: getAttribute('ry')},
  {
    name: 'sandbox',
    tagName: 'iframe',
    overrideStringValue: 'allow-forms  allow-scripts',
    read(element) {
      return element.sandbox.value;
    },
  },
  {name: 'scale', read: getAttribute('scale')},
  {name: 'scope', tagName: 'th', overrideStringValue: 'row'},
  {name: 'scoped', tagName: 'style', read: getAttribute('scoped')},
  {name: 'scrolling', tagName: 'iframe', overrideStringValue: 'no'},
  {name: 'seamless', tagName: 'iframe', read: getAttribute('seamless')},
  {name: 'security', tagName: 'iframe', read: getAttribute('security')},
  {name: 'seed', read: getAttribute('seed')},
  {name: 'selected', tagName: 'option', containerTagName: 'select'},
  {name: 'selectedIndex', tagName: 'select'},
  {name: 'shape', tagName: 'a'},
  {name: 'shape-rendering', read: getAttribute('shape-rendering')},
  {name: 'shapeRendering', read: getAttribute('shape-rendering')},
  {name: 'size', tagName: 'input'},
  {
    name: 'sizes',
    tagName: 'link',
    read(element) {
      return element.sizes.value;
    },
  },
  {name: 'slope', read: getAttribute('slope')},
  {name: 'spacing', read: getAttribute('spacing')},
  {name: 'span', tagName: 'col'},
  {name: 'specularConstant', read: getAttribute('specularConstant')},
  {name: 'specularExponent', read: getAttribute('specularConstant')},
  {name: 'speed', read: getAttribute('speed')},
  {
    name: 'spellCheck',
    overrideStringValue: 'false',
    tagName: 'input',
    read: getProperty('spellcheck'),
  },
  {
    name: 'spellcheck',
    overrideStringValue: 'false',
    tagName: 'input',
    read: getProperty('spellcheck'),
  },
  {name: 'spreadMethod', read: getAttribute('spreadMethod')},
  {name: 'src', tagName: 'img', overrideStringValue: 'https://reactjs.com'},
  {
    name: 'srcDoc',
    tagName: 'iframe',
    overrideStringValue: '<p>Hi</p>',
    read: getProperty('srcdoc'),
  },
  {
    name: 'srcdoc',
    tagName: 'iframe',
    overrideStringValue: '<p>Hi</p>',
    read: getProperty('srcdoc'),
  },
  {
    name: 'srcLang',
    containerTagName: 'audio',
    tagName: 'track',
    overrideStringValue: 'en',
    read: getProperty('srclang'),
  },
  {
    name: 'srclang',
    containerTagName: 'audio',
    tagName: 'track',
    overrideStringValue: 'en',
    read: getProperty('srclang'),
  },
  {name: 'srcSet', tagName: 'img'},
  {name: 'srcset', tagName: 'img'},
  {name: 'start', tagName: 'ol'},
  {name: 'startOffset', read: getAttribute('startOffset')},
  {name: 'state', read: getAttribute('state')},
  {name: 'stdDeviation', read: getAttribute('stdDeviation')},
  {name: 'stemh', read: getAttribute('stemh')},
  {name: 'stemv', read: getAttribute('stemv')},
  {name: 'step', read: getAttribute('step')},
  {name: 'stitchTiles', read: getAttribute('stitchTiles')},
  {name: 'stop-color', read: getAttribute('stop-color')},
  {name: 'stop-opacity', read: getAttribute('stop-opacity')},
  {name: 'stopColor', read: getAttribute('stop-color')},
  {name: 'stopOpacity', read: getAttribute('stop-opacity')},
  {
    name: 'strikethrough-position',
    read: getAttribute('strikethrough-thickness'),
  },
  {
    name: 'strikethrough-thickness',
    read: getAttribute('strikethrough-thickness'),
  },
  {name: 'strikethroughPosition', read: getAttribute('strikethrough-position')},
  {
    name: 'strikethroughThickness',
    read: getAttribute('strikethrough-thickness'),
  },
  {name: 'string', read: getAttribute('string')},
  {name: 'stroke', read: getAttribute('stroke')},
  {name: 'stroke-dasharray', read: getAttribute('stroke-dasharray')},
  {name: 'stroke-Dasharray', read: getAttribute('stroke-dasharray')},
  {name: 'stroke-dashoffset', read: getAttribute('stroke-dashoffset')},
  {name: 'stroke-linecap', read: getAttribute('stroke-linecap')},
  {name: 'stroke-linejoin', read: getAttribute('stroke-linejoin')},
  {name: 'stroke-miterlimit', read: getAttribute('stroke-miterlimit')},
  {name: 'stroke-opacity', read: getAttribute('stroke-opacity')},
  {name: 'stroke-width', read: getAttribute('stroke-width')},
  {name: 'strokeDasharray', read: getAttribute('stroke-dasharray')},
  {name: 'strokeDashoffset', read: getAttribute('stroke-dashoffset')},
  {name: 'strokeLinecap', read: getAttribute('stroke-linecap')},
  {name: 'strokeLinejoin', read: getAttribute('stroke-linejoin')},
  {name: 'strokeMiterlimit', read: getAttribute('stroke-miterlimit')},
  {name: 'strokeOpacity', read: getAttribute('stroke-opacity')},
  {name: 'strokeWidth', read: getAttribute('stroke-width')},
  {name: 'style'},
  {name: 'summary', tagName: 'table'},
  {
    name: 'suppressContentEditableWarning',
    read: getAttribute('suppresscontenteditablewarning'),
  },
  {name: 'surfaceScale', read: getAttribute('surfaceScale')},
  {
    name: 'systemLanguage',
    overrideStringValue: 'en',
    read: getAttribute('systemLanguage'),
  }, // obsolete as of IE9
  {name: 'tabIndex'},
  {name: 'tableValues', read: getAttribute('tableValues')},
  {name: 'target', read: getAttribute('target')},
  {name: 'targetX', read: getAttribute('targetX')},
  {name: 'targetY', read: getAttribute('targetY')},
  {name: 'text-anchor', read: getAttribute('text-anchor')},
  {name: 'text-decoration', read: getAttribute('text-decoration')},
  {name: 'text-rendering', read: getAttribute('text-rendering')},
  {name: 'textAnchor', read: getAttribute('text-anchor')},
  {name: 'textDecoration', read: getAttribute('text-decoration')},
  {name: 'textLength', read: getAttribute('textLength')},
  {name: 'textRendering', read: getAttribute('text-rendering')},
  {name: 'title'},
  {name: 'to', read: getAttribute('to')},
  {name: 'transform', read: getAttribute('transform')},
  {name: 'type', tagName: 'button', overrideStringValue: 'reset'},
  {name: 'typeof', read: getAttribute('typeof')},
  {name: 'u1', read: getAttribute('u1')},
  {name: 'u2', read: getAttribute('u2')},
  {name: 'underline-position', read: getAttribute('underline-position')},
  {name: 'underline-thickness', read: getAttribute('underline-thickness')},
  {name: 'underlinePosition', read: getAttribute('underline-position')},
  {name: 'underlineThickness', read: getAttribute('underline-thickness')},
  {name: 'unicode', read: getAttribute('unicode')},
  {name: 'unicode-bidi', read: getAttribute('unicode-bidi')},
  {name: 'unicode-range', read: getAttribute('unicode-range')},
  {name: 'unicodeBidi', read: getAttribute('unicode-bidi')},
  {name: 'unicodeRange', read: getAttribute('unicode-range')},
  {name: 'units-per-em', read: getAttribute('units-per-em')},
  {name: 'unitsPerEm', read: getAttribute('unites-per-em')},
  {name: 'unknown', read: getAttribute('unknown')},
  {
    name: 'unselectable',
    read: getAttribute('unselectable'),
    tagName: 'span',
    overrideStringValue: 'on',
  }, // seems to be IE only
  {name: 'useMap', tagName: 'img'},
  {name: 'v-alphabetic', read: getAttribute('v-alphabetic')},
  {name: 'v-hanging', read: getAttribute('v-hanging')},
  {name: 'v-ideographic', read: getAttribute('v-ideographic')},
  {name: 'v-mathematical', read: getAttribute('v-mathematical')},
  {name: 'vAlphabetic', read: getAttribute('v-alphabetic')},
  {name: 'value', tagName: 'input'},
  {name: 'value', tagName: 'input', type: 'email'},
  {
    name: 'value',
    tagName: 'input',
    type: 'number',
    read(element) {
      return element.valueAsNumber;
    },
  },
  {name: 'value', tagName: 'textarea'},
  {name: 'value', containerTagName: 'select', tagName: 'option'},
  {
    name: 'Value',
    containerTagName: 'select',
    tagName: 'option',
    read: getProperty('value'),
  },
  {name: 'values', read: getAttribute('values')},
  {name: 'vector-effect', read: getAttribute('vector-effect')},
  {name: 'vectorEffect', read: getAttribute('vector-effect')},
  {name: 'version', tagName: 'html'},
  {name: 'vert-adv-y', read: getAttribute('vert-origin-y')},
  {name: 'vert-origin-x', read: getAttribute('vert-origin-y')},
  {name: 'vert-origin-y', read: getAttribute('vert-origin-y')},
  {name: 'vertAdvY', read: getAttribute('vert-adv-y')},
  {name: 'vertOriginX', read: getAttribute('vert-origin-x')},
  {name: 'vertOriginY', read: getAttribute('vert-origin-y')},
  {name: 'vHanging', read: getAttribute('v-hanging')},
  {name: 'vIdeographic', read: getAttribute('v-ideographic')},
  {name: 'viewBox', read: getAttribute('viewBox')},
  {name: 'viewTarget', read: getAttribute('viewTarget')},
  {name: 'visibility', read: getAttribute('visibility')},
  {name: 'vMathematical', read: getAttribute('v-mathematical')},
  {name: 'vocab', read: getAttribute('vocab')},
  {name: 'width', tagName: 'img'},
  {name: 'widths', read: getAttribute('widths')},
  {name: 'wmode', read: getAttribute('wmode'), tagName: 'embed'},
  {name: 'word-spacing', read: getAttribute('word-spacing')},
  {name: 'wordSpacing', read: getAttribute('word-spacing')},
  {name: 'wrap', tagName: 'textarea'},
  {name: 'writing-mode', read: getAttribute('writing-mode')},
  {name: 'writingMode', read: getAttribute('writing-mode')},
  {name: 'x', read: getAttribute('x')},
  {name: 'x-height', read: getAttribute('x-height')},
  {name: 'x1', read: getAttribute('x1')},
  {name: 'x2', read: getAttribute('x2')},
  {name: 'xChannelSelector', read: getAttribute('xChannelSelector')},
  {name: 'xHeight', read: getAttribute('x-height')},
  {name: 'XLink:Actuate', read: getAttribute('XLink:Actuate')},
  {name: 'xlink:actuate', read: getAttribute('xlink:actuate')},
  {name: 'xlink:arcrole', read: getAttribute('xlink:arcrole')},
  {name: 'xlink:href', read: getAttribute('xlink:href')},
  {name: 'xlink:role', read: getAttribute('xlink:role')},
  {name: 'xlink:show', read: getAttribute('xlink:show')},
  {name: 'xlink:title', read: getAttribute('xlink:title')},
  {name: 'xlink:type', read: getAttribute('xlink:type')},
  {name: 'xlinkActuate', read: getAttribute('xlink:actuate')},
  {name: 'XlinkActuate', read: getAttribute('Xlink:actuate')},
  {name: 'xlinkArcrole', read: getAttribute('xlink:arcrole')},
  {name: 'xlinkHref', read: getAttribute('xlink:href')},
  {name: 'xlinkRole', read: getAttribute('xlink:role')},
  {name: 'xlinkShow', read: getAttribute('xlink:show')},
  {name: 'xlinkTitle', read: getAttribute('xlink:title')},
  {name: 'xlinkType', read: getAttribute('xlink:type')},
  {name: 'xml:base', read: getAttribute('xml:base')},
  {name: 'xml:lang', read: getAttribute('xml:lang')},
  {name: 'xml:space', read: getAttribute('xml:space')},
  {name: 'xmlBase', read: getAttribute('xml:base')},
  {name: 'xmlLang', read: getAttribute('xml:lang')},
  {
    name: 'xmlns',
    read: getProperty('namespaceURI'),
    tagName: 'svg',
  },
  {name: 'xmlns:xlink', read: getAttribute('xmlns:xlink')},
  {name: 'xmlnsXlink', read: getAttribute('xmlns:xlink')},
  {name: 'xmlSpace', read: getAttribute('xml:space')},
  {name: 'y', read: getAttribute('y')},
  {name: 'y1', read: getAttribute('y1')},
  {name: 'y2', read: getAttribute('y2')},
  {name: 'yChannelSelector', read: getAttribute('yChannelSelector')},
  {name: 'z', read: getAttribute('z')},
  {name: 'zoomAndPan', read: getAttribute('zoomAndPan')},
];

let _didWarn = false;
function warn(str) {
  _didWarn = true;
}

function getRenderedAttributeValue(renderer, attribute, type) {
  _didWarn = false;
  const originalConsoleError = console.error;
  console.error = warn;

  const containerTagName = attribute.containerTagName || 'div';
  const tagName = attribute.tagName || 'div';

  let container;
  if (containerTagName === 'svg') {
    container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  } else {
    container = document.createElement(containerTagName);
  }

  let defaultValue;
  try {
    const read = attribute.read || getProperty(attribute.name);

    let testValue = type.testValue;
    if (attribute.overrideStringValue !== undefined) {
      switch (type.name) {
        case 'string':
          testValue = attribute.overrideStringValue;
          break;
        case 'array with string':
          testValue = [attribute.overrideStringValue];
          break;
      }
    }

    let baseProps = {};
    if (attribute.type) {
      baseProps.type = attribute.type;
    }
    renderer.render(React.createElement(tagName, baseProps), container);
    defaultValue = read(container.firstChild);

    const props = {
      ...baseProps,
      [attribute.name]: testValue,
    };
    renderer.render(React.createElement(tagName, props), container);

    const result = read(container.firstChild);

    return {
      defaultValue,
      result,
      didWarn: _didWarn,
      didError: false,
    };
  } catch (error) {
    return {
      defaultValue,
      result: null,
      didWarn: _didWarn,
      didError: true,
    };
  } finally {
    console.error = originalConsoleError;
  }
}

function getRenderedAttributeValues(attribute, type) {
  const react15Value = getRenderedAttributeValue(ReactDOM15, attribute, type);
  const react16Value = getRenderedAttributeValue(ReactDOM16, attribute, type);

  let hasSameBehavior;
  if (react15Value.didError && react16Value.didError) {
    hasSameBehavior = true;
  } else if (!react15Value.didError && !react16Value.didError) {
    hasSameBehavior =
      react15Value.didWarn === react16Value.didWarn &&
      Object.is(react15Value.result, react16Value.result);
  } else {
    hasSameBehavior = false;
  }

  return {
    react15: react15Value,
    react16: react16Value,
    hasSameBehavior,
  };
}

const table = new Map();

for (let attribute of attributes) {
  const row = new Map();
  for (let type of types) {
    const result = getRenderedAttributeValues(attribute, type);
    row.set(type.name, result);
  }
  table.set(attribute, row);
}

const successColor = 'white';
const warnColor = 'yellow';
const errorColor = 'red';

function RendererResult({version, result, defaultValue, didWarn, didError}) {
  let backgroundColor;
  if (didError) {
    backgroundColor = errorColor;
  } else if (didWarn) {
    backgroundColor = warnColor;
  } else if (result !== defaultValue) {
    backgroundColor = 'cyan';
  } else {
    backgroundColor = successColor;
  }

  let style = {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor,
  };

  let displayResult;
  switch (typeof result) {
    case 'undefined':
      displayResult = '<undefined>';
      break;
    case 'object':
      if (result === null) {
        displayResult = '<null>';
        break;
      }
      displayResult = '<object>';
      break;
    case 'function':
      displayResult = '<function>';
      break;
    case 'symbol':
      displayResult = '<symbol>';
      break;
    case 'number':
      displayResult = `<number: ${result}>`;
      break;
    case 'string':
      if (result === '') {
        displayResult = '<empty string>';
        break;
      }
      displayResult = '"' + result + '"';
      break;
    case 'boolean':
      displayResult = `<boolean: ${result}>`;
      break;
    default:
      throw new Error('Switch statement should be exhaustive.');
  }

  return <div css={style}>{displayResult}</div>;
}

function Result(props) {
  const {react15, react16, hasSameBehavior} = props;
  const style = {position: 'absolute', width: '100%', height: '100%'};
  if (!hasSameBehavior) {
    style.border = '4px solid purple';
  }
  return (
    <div css={style}>
      <div css={{position: 'absolute', width: '50%', height: '100%'}}>
        <RendererResult version={15} {...react15} />
      </div>
      <div
        css={{position: 'absolute', width: '50%', left: '50%', height: '100%'}}>
        <RendererResult version={16} {...react16} />
      </div>
    </div>
  );
}

function ColumnHeader({children}) {
  return (
    <div
      css={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}>
      {children}
    </div>
  );
}

function RowHeader({children}) {
  return (
    <div
      css={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}>
      {children}
    </div>
  );
}

function CellContent(props) {
  const {columnIndex, rowIndex} = props;

  const attribute = attributes[rowIndex - 1];
  const type = types[columnIndex - 1];

  if (columnIndex === 0) {
    if (rowIndex === 0) {
      return null;
    }
    return <RowHeader>{attribute.name}</RowHeader>;
  }

  if (rowIndex === 0) {
    return <ColumnHeader>{type.name}</ColumnHeader>;
  }

  const row = table.get(attribute);
  const result = row.get(type.name);

  return <Result {...result} />;
}

function cellRenderer(props) {
  return <div style={props.style}><CellContent {...props} /></div>;
}

class App extends Component {
  render() {
    return (
      <AutoSizer disableHeight={true}>
        {({width}) => (
          <MultiGrid
            cellRenderer={cellRenderer}
            columnWidth={200}
            columnCount={1 + types.length}
            fixedColumnCount={1}
            enableFixedColumnScroll={true}
            enableFixedRowScroll={true}
            height={1200}
            rowHeight={40}
            rowCount={attributes.length + 1}
            fixedRowCount={1}
            width={width}
          />
        )}
      </AutoSizer>
    );
  }
}

export default App;
