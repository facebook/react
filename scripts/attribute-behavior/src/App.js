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
    name: 'array',
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
  {name: 'about'},
  {name: 'aBoUt'},
  {name: 'accent-Height'},
  {name: 'accent-height'},
  {name: 'accentHeight', read: getAttribute('accent-height')},
  {name: 'accept'},
  {name: 'accept-charset'},
  {name: 'accept-Charset'},
  {name: 'acceptCharset', read: getAttribute('accept-charset')},
  {name: 'accessKey'},
  {name: 'accumulate'},
  {name: 'action'},
  {name: 'additive'},
  {name: 'alignment-baseline'},
  {name: 'alignmentBaseline', read: getAttribute('alignment-baseline')},
  {name: 'allowFullScreen'},
  {name: 'allowReorder'},
  {name: 'allowTransparency'},
  {name: 'alphabetic'},
  {name: 'alt'},
  {name: 'amplitude'},
  {name: 'arabic-form'},
  {name: 'arabicForm', read: getAttribute('arabic-form')},
  {name: 'aria'},
  {name: 'aria-'},
  {name: 'aria-invalidattribute'},
  {name: 'as'},
  {name: 'ascent'},
  {name: 'async'},
  {name: 'attributeName'},
  {name: 'attributeType'},
  {name: 'autoCapitalize'},
  {name: 'autoComplete'},
  {name: 'autoCorrect'},
  {name: 'autoPlay'},
  {name: 'autoReverse'},
  {name: 'autoSave'},
  {name: 'azimuth'},
  {name: 'baseFrequency'},
  {name: 'baseline-shift'},
  {name: 'baselineShift', read: getAttribute('baseline-shift')},
  {name: 'baseProfile'},
  {name: 'bbox'},
  {name: 'begin'},
  {name: 'bias'},
  {name: 'by'},
  {name: 'calcMode'},
  {name: 'cap-height'},
  {name: 'capHeight', read: getAttribute('cap-height')},
  {name: 'capture'},
  {name: 'cellPadding'},
  {name: 'cellSpacing'},
  {name: 'challenge'},
  {name: 'charSet'},
  {name: 'checked', read: getProperty('checked')},
  {name: 'Checked'},
  {name: 'Children'},
  {name: 'children'},
  {name: 'cite'},
  {name: 'class'},
  {name: 'classID'},
  {name: 'className', read: getProperty('className')},
  {name: 'clip'},
  {name: 'clip-path'},
  {name: 'clip-rule'},
  {name: 'clipPath', read: getAttribute('clip-path')},
  {name: 'clipPathUnits'},
  {name: 'clipRule'},
  {name: 'color'},
  {name: 'color-interpolation'},
  {name: 'color-interpolation-filters'},
  {name: 'color-profile'},
  {name: 'color-rendering'},
  {name: 'colorInterpolation'},
  {name: 'colorInterpolationFilters'},
  {name: 'colorProfile'},
  {name: 'colorRendering'},
  {name: 'cols'},
  {name: 'colSpan'},
  {name: 'content'},
  {name: 'contentEditable'},
  {name: 'contentScriptType'},
  {name: 'contentStyleType'},
  {name: 'contextMenu'},
  {name: 'controls'},
  {name: 'coords'},
  {name: 'crossOrigin'},
  {name: 'cursor'},
  {name: 'cx'},
  {name: 'cy'},
  {name: 'd'},
  {name: 'dangerouslySetInnerHTML'},
  {name: 'DangerouslySetInnerHTML'},
  {name: 'data'},
  {name: 'data-'},
  {name: 'data-unknownattribute'},
  {name: 'datatype'},
  {name: 'dateTime'},
  {name: 'decelerate'},
  {name: 'default'},
  {name: 'defaultchecked'},
  {name: 'defaultChecked'},
  {name: 'defaultValue'},
  {name: 'defaultValuE'},
  {name: 'defer'},
  {name: 'descent'},
  {name: 'diffuseConstant'},
  {name: 'dir'},
  {name: 'direction'},
  {name: 'disabled'},
  {name: 'display'},
  {name: 'divisor'},
  {name: 'dominant-baseline'},
  {name: 'dominantBaseline'},
  {name: 'download'},
  {name: 'dOwNlOaD'},
  {name: 'draggable'},
  {name: 'dur'},
  {name: 'dx'},
  {name: 'dX'},
  {name: 'dy'},
  {name: 'dY'},
  {name: 'edgeMode'},
  {name: 'elevation'},
  {name: 'enable-background'},
  {name: 'enableBackground'},
  {name: 'encType'},
  {name: 'end'},
  {name: 'exponent'},
  {name: 'externalResourcesRequired'},
  {name: 'fill'},
  {name: 'fill-opacity'},
  {name: 'fill-rule'},
  {name: 'fillOpacity'},
  {name: 'fillRule'},
  {name: 'filter'},
  {name: 'filterRes'},
  {name: 'filterUnits'},
  {name: 'flood-color'},
  {name: 'flood-opacity'},
  {name: 'floodColor'},
  {name: 'floodOpacity'},
  {name: 'focusable'},
  {name: 'font-family'},
  {name: 'font-size'},
  {name: 'font-size-adjust'},
  {name: 'font-stretch'},
  {name: 'font-style'},
  {name: 'font-variant'},
  {name: 'font-weight'},
  {name: 'fontFamily'},
  {name: 'fontSize'},
  {name: 'fontSizeAdjust'},
  {name: 'fontStretch'},
  {name: 'fontStyle'},
  {name: 'fontVariant'},
  {name: 'fontWeight'},
  {name: 'for'},
  {name: 'fOr'},
  {name: 'form'},
  {name: 'formAction'},
  {name: 'format'},
  {name: 'formEncType'},
  {name: 'formMethod'},
  {name: 'formNoValidate'},
  {name: 'formTarget'},
  {name: 'frameBorder'},
  {name: 'from'},
  {name: 'fx'},
  {name: 'fX'},
  {name: 'fY'},
  {name: 'fy'},
  {name: 'G1'},
  {name: 'g1'},
  {name: 'G2'},
  {name: 'g2'},
  {name: 'glyph-name'},
  {name: 'glyph-orientation-horizontal'},
  {name: 'glyph-orientation-vertical'},
  {name: 'glyphName'},
  {name: 'glyphOrientationHorizontal'},
  {name: 'glyphOrientationVertical'},
  {name: 'glyphRef'},
  {name: 'gradientTransform'},
  {name: 'gradientUnits'},
  {name: 'hanging'},
  {name: 'hasOwnProperty'},
  {name: 'headers'},
  {name: 'height'},
  {name: 'hidden'},
  {name: 'high'},
  {name: 'horiz-adv-x'},
  {name: 'horiz-origin-x'},
  {name: 'horizAdvX'},
  {name: 'horizOriginX'},
  {name: 'href'},
  {name: 'hrefLang'},
  {name: 'htmlFor'},
  {name: 'http-equiv'},
  {name: 'httpEquiv'},
  {name: 'icon'},
  {name: 'id'},
  {name: 'ID'},
  {name: 'ideographic'},
  {name: 'image-rendering'},
  {name: 'imageRendering'},
  {name: 'in'},
  {name: 'in2'},
  {name: 'initialChecked'},
  {name: 'initialValue'},
  {name: 'inlist'},
  {name: 'inputMode'},
  {name: 'integrity'},
  {name: 'intercept'},
  {name: 'is'},
  {name: 'itemID'},
  {name: 'itemProp'},
  {name: 'itemRef'},
  {name: 'itemScope'},
  {name: 'itemType'},
  {name: 'k'},
  {name: 'K'},
  {name: 'K1'},
  {name: 'k1'},
  {name: 'k2'},
  {name: 'k3'},
  {name: 'k4'},
  {name: 'kernelMatrix'},
  {name: 'kernelUnitLength'},
  {name: 'kerning'},
  {name: 'keyParams'},
  {name: 'keyPoints'},
  {name: 'keySplines'},
  {name: 'keyTimes'},
  {name: 'keyType'},
  {name: 'kind'},
  {name: 'label'},
  {name: 'LANG'},
  {name: 'lang'},
  {name: 'length'},
  {name: 'lengthAdjust'},
  {name: 'letter-spacing'},
  {name: 'letterSpacing'},
  {name: 'lighting-color'},

  // Start here Flarnie

  {name: 'lightingColor'},
  {name: 'limitingConeAngle'},
  {name: 'list'},
  {name: 'local'},
  {name: 'loop'},
  {name: 'low'},
  {name: 'manifest'},
  {name: 'marginHeight'},
  {name: 'marginWidth'},
  {name: 'marker-end'},
  {name: 'marker-mid'},
  {name: 'marker-start'},
  {name: 'markerEnd'},
  {name: 'markerHeight'},
  {name: 'markerMid'},
  {name: 'markerStart'},
  {name: 'markerUnits'},
  {name: 'markerWidth'},
  {name: 'mask'},
  {name: 'maskContentUnits'},
  {name: 'maskUnits'},
  {name: 'mathematical'},
  {name: 'max'},
  {name: 'maxLength'},
  {name: 'media'},
  {name: 'mediaGroup'},
  {name: 'method'},
  {name: 'min'},
  {name: 'minLength'},
  {name: 'mode'},
  {name: 'multiple'},
  {name: 'muted'},
  {name: 'name'},
  {name: 'nonce'},
  {name: 'noValidate'},
  {name: 'numOctaves'},
  {name: 'offset'},
  {name: 'on-click'},
  {name: 'on-unknownevent'},
  {name: 'onclick'},
  {name: 'onClick'},
  {name: 'onunknownevent'},
  {name: 'onUnknownEvent'},
  {name: 'opacity'},
  {name: 'open'},
  {name: 'operator'},
  {name: 'optimum'},
  {name: 'order'},
  {name: 'orient'},
  {name: 'orientation'},
  {name: 'origin'},
  {name: 'overflow'},
  {name: 'overline-position'},
  {name: 'overline-thickness'},
  {name: 'overlinePosition'},
  {name: 'overlineThickness'},
  {name: 'paint-order'},
  {name: 'paintOrder'},
  {name: 'panose-1'},
  {name: 'panose1'},
  {name: 'pathLength'},
  {name: 'pattern'},
  {name: 'patternContentUnits'},
  {name: 'patternTransform'},
  {name: 'patternUnits'},
  {name: 'placeholder'},
  {name: 'playsInline'},
  {name: 'pointer-events'},
  {name: 'pointerEvents'},
  {name: 'points'},
  {name: 'pointsAtX'},
  {name: 'pointsAtY'},
  {name: 'pointsAtZ'},
  {name: 'poster'},
  {name: 'prefix'},
  {name: 'preload'},
  {name: 'preserveAlpha'},
  {name: 'preserveAspectRatio'},
  {name: 'primitiveUnits'},
  {name: 'profile'},
  {name: 'property'},
  {name: 'props'},
  {name: 'r'},
  {name: 'radioGroup'},
  {name: 'radius'},
  {name: 'readOnly'},
  {name: 'referrerPolicy'},
  {name: 'refX'},
  {name: 'refY'},
  {name: 'rel'},
  {name: 'rendering-intent'},
  {name: 'renderingIntent'},
  {name: 'repeatCount'},
  {name: 'repeatDur'},
  {name: 'required'},
  {name: 'requiredExtensions'},
  {name: 'requiredFeatures'},
  {name: 'resource'},
  {name: 'restart'},
  {name: 'result'},
  {name: 'results'},
  {name: 'reversed'},
  {name: 'role'},
  {name: 'rotate'},
  {name: 'rows'},
  {name: 'rowSpan'},
  {name: 'rx'},
  {name: 'ry'},
  {name: 'sandbox'},
  {name: 'scale'},
  {name: 'scope'},
  {name: 'scoped'},
  {name: 'scrolling'},
  {name: 'seamless'},
  {name: 'security'},
  {name: 'seed'},
  {name: 'selected'},
  {name: 'selectedValue'},
  {name: 'shape'},
  {name: 'shape-rendering'},
  {name: 'shapeRendering', read: getAttribute('shape-rendering')},
  {name: 'size'},
  {name: 'sizes'},
  {name: 'slope'},
  {name: 'spacing'},
  {name: 'span'},
  {name: 'specularConstant'},
  {name: 'specularExponent'},
  {name: 'speed'},
  {name: 'spellCheck'},
  {name: 'spreadMethod'},
  {name: 'src'},
  {name: 'srcDoc'},
  {name: 'srcLang'},
  {name: 'srcSet'},
  {name: 'start'},
  {name: 'startOffset'},
  {name: 'state'},
  {name: 'stdDeviation'},
  {name: 'stemh'},
  {name: 'stemv'},
  {name: 'step'},
  {name: 'stitchTiles'},
  {name: 'stop-color'},
  {name: 'stop-opacity'},
  {name: 'stopColor', read: getAttribute('stop-color')},
  {name: 'stopOpacity', read: getAttribute('stop-opacity')},
  {name: 'strikethrough-position'},
  {name: 'strikethrough-thickness'},
  {name: 'strikethroughPosition', read: getAttribute('strikethrough-position')},
  {name: 'strikethroughThickness', read: getAttribute('strikethrough-thickness')},
  {name: 'string'},
  {name: 'stroke'},
  {name: 'stroke-dasharray'},
  {name: 'stroke-Dasharray', read: getAttribute('stroke-dasharray')},
  {name: 'stroke-dashoffset'},
  {name: 'stroke-linecap'},
  {name: 'stroke-linejoin'},
  {name: 'stroke-miterlimit'},
  {name: 'stroke-opacity'},
  {name: 'stroke-width'},
  {name: 'strokeDasharray', read: getAttribute('stroke-dasharray')},
  {name: 'strokeDashoffset', read: getAttribute('stroke-dashoffset')},
  {name: 'strokeLinecap', read: getAttribute('stroke-linecap')},
  {name: 'strokeLinejoin', read: getAttribute('stroke-linejoin')},
  {name: 'strokeMiterlimit', read: getAttribute('stroke-miterlimit')},
  {name: 'strokeOpacity', read: getAttribute('stroke-opacity')},
  {name: 'strokeWidth', read: getAttribute('stroke-width')},
  {name: 'style'},
  {name: 'summary'},
  {name: 'suppressContentEditableWarning'},
  {name: 'surfaceScale'},
  {name: 'systemLanguage'},
  {name: 'tabIndex'},
  {name: 'tableValues'},
  {name: 'target'},
  {name: 'targetX'},
  {name: 'targetY'},
  {name: 'text-anchor'},
  {name: 'text-decoration'},
  {name: 'text-rendering'},
  {name: 'textAnchor', read: getAttribute('text-anchor')},
  {name: 'textDecoration', read: getAttribute('text-decoration')},
  {name: 'textLength', read: getAttribute('text-length')},
  {name: 'textRendering', read: getAttribute('text-rendering')},
  {name: 'title'},
  {name: 'to'},
  {name: 'transform'},
  {name: 'type'},
  {name: 'typeof'},
  {name: 'u1'},
  {name: 'u2'},
  {name: 'underline-position'},
  {name: 'underline-thickness'},
  {name: 'underlinePosition', read: getAttribute('underline-position')},
  {name: 'underlineThickness', read: getAttribute('underline-thickness')},
  {name: 'unicode'},
  {name: 'unicode-bidi'},
  {name: 'unicode-range'},
  {name: 'unicodeBidi', read: getAttribute('unicode-bidi')},
  {name: 'unicodeRange', read: getAttribute('unicode-range')},
  {name: 'units-per-em'},
  {name: 'unitsPerEm', read: getAttribute('unites-per-em')},
  {name: 'unknown'},
  {name: 'unselectable'},
  {name: 'useMap'},
  {name: 'v-alphabetic'},
  {name: 'v-hanging'},
  {name: 'v-ideographic'},
  {name: 'v-mathematical'},
  {name: 'vAlphabetic', read: getAttribute('v-alphabetic')},
  {name: 'value'},
  {name: 'Value'},
  {name: 'values'},
  {name: 'vector-effect'},
  {name: 'vectorEffect', read: getAttribute('vector-effect')},
  {name: 'version'},
  {name: 'vert-adv-y'},
  {name: 'vert-origin-x'},
  {name: 'vert-origin-y'},
  {name: 'vertAdvY', read: getAttribute('vert-adv-y')},
  {name: 'vertOriginX', read: getAttribute('vert-origin-x')},
  {name: 'vertOriginY', read: getAttribute('vert-origin-y')},
  {name: 'vHanging', read: getAttribute('v-hanging')},
  {name: 'vIdeographic', read: getAttribute('v-ideographic')},
  {name: 'viewBox'},
  {name: 'viewTarget'},
  {name: 'visibility'},
  {name: 'vMathematical', read: getAttribute('v-mathematical')},
  {name: 'vocab'},
  {name: 'width'},
  {name: 'widths'},
  {name: 'wmode'},
  {name: 'word-spacing'},
  {name: 'wordSpacing', read: getAttribute('word-spacing')},
  {name: 'wrap'},
  {name: 'writing-mode'},
  {name: 'writingMode', read: getAttribute('writing-mode')},
  {name: 'x'},
  {name: 'x-height'},
  {name: 'x1'},
  {name: 'x2'},
  {name: 'xChannelSelector'},
  {name: 'xHeight', read: getAttribute('x-height')},
  {name: 'XLink:Actuate'},
  {name: 'xlink:actuate'},
  {name: 'xlink:arcrole'},
  {name: 'xlink:href'},
  {name: 'xlink:role'},
  {name: 'xlink:show'},
  {name: 'xlink:title'},
  {name: 'xlink:type'},
  {name: 'xlinkActuate', read: getAttribute('xlink:actuate')},
  {name: 'XlinkActuate', read: getAttribute('Xlink:actuate')},
  {name: 'xlinkArcrole', read: getAttribute('xlink:arcrole')},
  {name: 'xlinkHref', read: getAttribute('xlink:href')},
  {name: 'xlinkRole', read: getAttribute('xlink:role')},
  {name: 'xlinkShow', read: getAttribute('xlink:show')},
  {name: 'xlinkTitle', read: getAttribute('xlink:title')},
  {name: 'xlinkType', read: getAttribute('xlink:type')},
  {name: 'xml:base'},
  {name: 'xml:lang'},
  {name: 'xml:space'},
  {name: 'xmlBase', read: getAttribute('xml:base')},
  {name: 'xmlLang', read: getAttribute('xml:lang')},
  {name: 'xmlns'},
  {name: 'xmlns:xlink'},
  {name: 'xmlnsXlink', read: getAttribute('xmlns:xlink')},
  {name: 'xmlSpace', read: getAttribute('xml:space')},
  {name: 'y'},
  {name: 'y1'},
  {name: 'y2'},
  {name: 'yChannelSelector'},
  {name: 'z'},
  {name: 'zoomAndPan'},
];

// function getTestDisplayValue(type) {
//   if (typeof type.testDisplayValue === 'string') {
//     return type.testDisplayValue;
//   }
//   return '' + type.testValue;
// }

let _didWarn = false;
function warn(str) {
  _didWarn = true;
}

function getRenderedAttributeValue(renderer, attribute, givenValue) {
  _didWarn = false;
  const originalConsoleError = console.error;
  console.error = warn;

  const container = document.createElement(attribute.tagName || 'div');

  try {
    const props = {
      [attribute.name]: givenValue,
    };
    renderer.render(<div {...props} />, container);

    // if (
    //   renderer === ReactDOM15 &&
    //   attribute.name === 'accentHeight' &&
    //   typeof givenValue === 'string'
    // ) {
    //   debugger;
    // }

    const read = attribute.read || getAttribute(attribute.name);

    return {
      result: read(container.firstChild),
      didWarn: _didWarn,
      didError: false,
    };
  } catch (error) {
    return {
      result: null,
      didWarn: _didWarn,
      didError: true,
    };
  } finally {
    console.error = originalConsoleError;
  }
}

function getRenderedAttributeValues(attribute, givenValue) {
  const react15Value = getRenderedAttributeValue(
    ReactDOM15,
    attribute,
    givenValue,
  );
  const react16Value = getRenderedAttributeValue(
    ReactDOM16,
    attribute,
    givenValue,
  );

  let hasSameBehavior;
  if (react15Value.didError && react16Value.didError) {
    hasSameBehavior = true;
  } else if (!react15Value.didError && !react16Value.didError) {
    hasSameBehavior =
      react15Value.didWarn === react16Value.didWarn &&
      react15Value.result === react16Value.result;
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
    const result = getRenderedAttributeValues(attribute, type.testValue);
    row.set(type.name, result);
  }
  table.set(attribute.name, row);
}

const successColor = 'green';
const warnColor = 'yellow';
const errorColor = 'red';

function RendererResult({version, result, didWarn, didError}) {
  let backgroundColor;
  if (didError) {
    backgroundColor = errorColor;
  } else if (didWarn) {
    backgroundColor = warnColor;
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
        style.backgroundColor = 'cyan';
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
      displayResult = `<Number: ${result}>`;
      break;
    case 'string':
      if (result === '') {
        displayResult = '<empty string>';
        break;
      }
      displayResult = result;
      break;
    case 'boolean':
      displayResult = `<Boolean: ${result}>`;
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

  const row = table.get(attribute.name);
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
            height={800}
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
