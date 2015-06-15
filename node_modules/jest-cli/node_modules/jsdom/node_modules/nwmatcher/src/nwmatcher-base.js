/*
 * Copyright (C) 2007-2015 Diego Perini
 * All rights reserved.
 *
 * nwmatcher-base.js - A fast CSS selector engine and matcher
 *
 * Author: Diego Perini <diego.perini at gmail com>
 * Version: 1.3.4
 * Created: 20070722
 * Release: 20150101
 *
 * License:
 *  http://javascript.nwbox.com/NWMatcher/MIT-LICENSE
 * Download:
 *  http://javascript.nwbox.com/NWMatcher/nwmatcher.js
 */

(function(global, factory) {

  if (typeof module == 'object' && typeof exports == 'object') {
    module.exports = function (browserGlobal) {
      // passed global does not contain
      // references to native objects
      browserGlobal.console = console;
      browserGlobal.parseInt = parseInt;
      browserGlobal.Function = Function;
      browserGlobal.Boolean = Boolean;
      browserGlobal.Number = Number;
      browserGlobal.RegExp = RegExp;
      browserGlobal.String = String;
      browserGlobal.Object = Object;
      browserGlobal.Array = Array;
      browserGlobal.Error = Error;
      browserGlobal.Date = Date;
      browserGlobal.Math = Math;
      var exports = browserGlobal.Object();
      factory(browserGlobal, exports);
      return exports;
    };
    module.factory = factory;
  } else {
    factory(global,
      (global.NW || (global.NW = global.Object())) &&
      (global.NW.Dom || (global.NW.Dom = global.Object())));
    global.NW.Dom.factory = factory;
  }

})(this, function(global, exports) {

  var version = 'nwmatcher-1.3.4',

  Dom = exports,

  doc = global.document,
  root = doc.documentElement,

  slice = global.Array.slice,

  isSingleMatch,
  isSingleSelect,

  lastSlice,
  lastContext,
  lastPosition,

  lastMatcher,
  lastSelector,

  lastPartsMatch,
  lastPartsSelect,

  prefixes = '[#.:]?',
  operators = '([~*^$|!]?={1})',
  whitespace = '[\\x20\\t\\n\\r\\f]*',
  combinators = '[\\x20]|[>+~][^>+~]',
  pseudoparms = '(?:[-+]?\\d*n)?[-+]?\\d*',

  quotedvalue = '"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"' + "|'[^'\\\\]*(?:\\\\.[^'\\\\]*)*'",
  skipgroup = '\\[.*\\]|\\(.*\\)|\\{.*\\}',

  encoding = '(?:[-\\w]|[^\\x00-\\xa0]|\\\\.)',
  identifier = '(?:-?[_a-zA-Z]{1}[-\\w]*|[^\\x00-\\xa0]+|\\\\.+)+',

  attrcheck = '(' + quotedvalue + '|' + identifier + ')',
  attributes = whitespace + '(' + encoding + '*:?' + encoding + '+)' +
    whitespace + '(?:' + operators + whitespace + attrcheck + ')?' + whitespace,

  attrmatcher = attributes.replace(attrcheck, '([\\x22\\x27]*)((?:\\\\?.)*?)\\3'),

  pseudoclass = '((?:' +
    pseudoparms + '|' + quotedvalue + '|' +
    prefixes + '|' + encoding + '+|' +
    '\\[' + attributes + '\\]|' +
    '\\(.+\\)|' + whitespace + '|' +
    ',)+)',

  extensions = '.+',

  standardValidator =
    '(?=[\\x20\\t\\n\\r\\f]*[^>+~(){}<>])' +
    '(' +
    '\\*' +
    '|(?:' + prefixes + identifier + ')' +
    '|' + combinators +
    '|\\[' + attributes + '\\]' +
    '|\\(' + pseudoclass + '\\)' +
    '|\\{' + extensions + '\\}' +
    '|(?:,|' + whitespace + ')' +
    ')+',

  extendedValidator = standardValidator.replace(pseudoclass, '.*'),

  reValidator = global.RegExp(standardValidator, 'g'),

  reTrimSpaces = global.RegExp('^' +
    whitespace + '|' + whitespace + '$', 'g'),

  reSplitGroup = global.RegExp('(' +
    '[^,\\\\()[\\]]+' +
    '|\\[[^[\\]]*\\]|\\[.*\\]' +
    '|\\([^()]+\\)|\\(.*\\)' +
    '|\\{[^{}]+\\}|\\{.*\\}' +
    '|\\\\.' +
    ')+', 'g'),

  reSplitToken = global.RegExp('(' +
    '\\[' + attributes + '\\]|' +
    '\\(' + pseudoclass + '\\)|' +
    '\\\\.|[^\\x20\\t\\n\\r\\f>+~])+', 'g'),

  reWhiteSpace = /[\x20\t\n\r\f]+/g,

  reOptimizeSelector = global.RegExp(identifier + '|^$'),

  ATTR_BOOLEAN = global.Object({
    checked: 1, disabled: 1, ismap: 1,
    multiple: 1, readonly: 1, selected: 1
  }),

  ATTR_DEFAULT = global.Object({
    value: 'defaultValue',
    checked: 'defaultChecked',
    selected: 'defaultSelected'
  }),

  ATTR_URIDATA = global.Object({
    action: 2, cite: 2, codebase: 2, data: 2, href: 2,
    longdesc: 2, lowsrc: 2, src: 2, usemap: 2
  }),

  Selectors = global.Object(),

  Operators = global.Object({
     '=': "n=='%m'",
    '^=': "n.indexOf('%m')==0",
    '*=': "n.indexOf('%m')>-1",
    '|=': "(n+'-').indexOf('%m-')==0",
    '~=': "(' '+n+' ').indexOf(' %m ')>-1",
    '$=': "n.substr(n.length-'%m'.length)=='%m'"
  }),

  Optimize = global.Object({
    ID: global.RegExp('^\\*?#(' + encoding + '+)|' + skipgroup),
    TAG: global.RegExp('^(' + encoding + '+)|' + skipgroup),
    CLASS: global.RegExp('^\\*?\\.(' + encoding + '+$)|' + skipgroup)
  }),

  Patterns = global.Object({
    universal: /^\*(.*)/,
    id: global.RegExp('^#(' + encoding + '+)(.*)'),
    tagName: global.RegExp('^(' + encoding + '+)(.*)'),
    className: global.RegExp('^\\.(' + encoding + '+)(.*)'),
    attribute: global.RegExp('^\\[' + attrmatcher + '\\](.*)'),
    children: /^[\x20\t\n\r\f]*\>[\x20\t\n\r\f]*(.*)/,
    adjacent: /^[\x20\t\n\r\f]*\+[\x20\t\n\r\f]*(.*)/,
    relative: /^[\x20\t\n\r\f]*\~[\x20\t\n\r\f]*(.*)/,
    ancestor: /^[\x20\t\n\r\f]+(.*)/
  }),

  QUIRKS_MODE,
  XML_DOCUMENT,

  GEBTN = 'getElementsByTagName' in doc,
  GEBCN = 'getElementsByClassName' in doc,

  IE_LT_9 = typeof doc.addEventListener != 'function',

  INSENSITIVE_MAP = global.Object({
    'href': 1, 'lang': 1, 'src': 1, 'style': 1, 'title': 1,
    'type': 1, 'xmlns': 1, 'xml:lang': 1, 'xml:space': 1
  }),

  TO_UPPER_CASE = IE_LT_9 ? '.toUpperCase()' : '',

  ACCEPT_NODE = 'r[r.length]=c[k];if(f&&false===f(c[k]))break main;else continue main;',
  REJECT_NODE = IE_LT_9 ? 'if(e.nodeName<"A")continue;' : '',

  Config = global.Object({
    CACHING: false,
    SIMPLENOT: true,
    UNIQUE_ID: true,
    USE_HTML5: true,
    VERBOSITY: true
  }),

  configure =
    function(option) {
      if (typeof option == 'string') { return Config[option] || Config; }
      if (typeof option != 'object') { return false; }
      for (var i in option) {
        Config[i] = !!option[i];
        if (i == 'SIMPLENOT') {
          matchContexts = global.Object();
          matchResolvers = global.Object();
          selectContexts = global.Object();
          selectResolvers = global.Object();
        }
      }
      reValidator = global.RegExp(Config.SIMPLENOT ?
        standardValidator : extendedValidator, 'g');
      return true;
    },

  concatCall =
    function(data, elements, callback) {
      var i = -1, element;
      while ((element = elements[++i])) {
        if (false === callback(data[data.length] = element)) { break; }
      }
      return data;
    },

  emit =
    function(message) {
      if (Config.VERBOSITY) { throw global.Error(message); }
      if (global.console && global.console.log) {
        global.console.log(message);
      }
    },

  switchContext =
    function(from, force) {
      var oldDoc = doc;
      lastContext = from;
      doc = from.ownerDocument || from;
      if (force || oldDoc !== doc) {
        root = doc.documentElement;
        XML_DOCUMENT = doc.createElement('DiV').nodeName == 'DiV';
        QUIRKS_MODE = !XML_DOCUMENT &&
          typeof doc.compatMode == 'string' ?
          doc.compatMode.indexOf('CSS') < 0 :
          (function() {
            var style = doc.createElement('div').style;
            return style && (style.width = 1) && style.width == '1px';
          })();

        Config.CACHING && Dom.setCache(true, doc);
      }
    },

  convertEscapes =
    function(str) {
      return str.replace(/\\([0-9a-fA-F]{1,6}\x20?|.)|([\x22\x27])/g, function(substring, p1, p2) {
        var codePoint, highHex, highSurrogate, lowHex, lowSurrogate;

        if (p2) {
          return '\\' + p2;
        }

        if (/^[0-9a-fA-F]/.test(p1)) {
          codePoint = parseInt(p1, 16);

          if (codePoint < 0 || codePoint > 0x10ffff) {
            return '\\ufffd';
          }

          if (codePoint <= 0xffff) {
            lowHex = '000' + codePoint.toString(16);
            return '\\u' + lowHex.substr(lowHex.length - 4);
          }

          codePoint -= 0x10000;
          highSurrogate = (codePoint >> 10) + 0xd800;
          lowSurrogate = (codePoint % 0x400) + 0xdc00;
          highHex = '000' + highSurrogate.toString(16);
          lowHex = '000' + lowSurrogate.toString(16);

          return '\\u' + highHex.substr(highHex.length - 4) +
            '\\u' + lowHex.substr(lowHex.length - 4);
        }

        if (/^[\\\x22\x27]/.test(p1)) {
          return substring;
        }

        return p1;
      });
    },

  byIdRaw =
    function(id, elements) {
      var i = 0, element = null;
      while ((element = elements[i])) {
        if (element.getAttribute('id') == id) {
          break;
        }
        ++i;
      }
      return element;
    },

  _byId = !('fileSize' in doc) ?
    function(id, from) {
      id = id.replace(/\\([^\\]{1})/g, '$1');
      return from.getElementById && from.getElementById(id) ||
        byIdRaw(id, from.getElementsByTagName('*'));
    } :
    function(id, from) {
      var element = null;
      id = id.replace(/\\([^\\]{1})/g, '$1');
      if (XML_DOCUMENT || from.nodeType != 9) {
        return byIdRaw(id, from.getElementsByTagName('*'));
      }
      if ((element = from.getElementById(id)) &&
        element.name == id && from.getElementsByName) {
        return byIdRaw(id, from.getElementsByName(id));
      }
      return element;
    },

  byId =
    function(id, from) {
      from || (from = doc);
      if (lastContext !== from) { switchContext(from); }
      return _byId(id, from);
    },

  byTagRaw =
    function(tag, from) {
      var any = tag == '*', element = from, elements = global.Array(), next = element.firstChild;
      any || (tag = tag.toUpperCase());
      while ((element = next)) {
        if (element.tagName > '@' && (any || element.tagName.toUpperCase() == tag)) {
          elements[elements.length] = element;
        }
        if ((next = element.firstChild || element.nextSibling)) continue;
        while (!next && (element = element.parentNode) && element !== from) {
          next = element.nextSibling;
        }
      }
      return elements;
    },

  getAttribute =
    function(node, attribute) {
      attribute = attribute.toLowerCase();
      if (typeof node[attribute] == 'object') {
        return node.attributes[attribute] &&
          node.attributes[attribute].value || '';
      }
      return (
        attribute == 'type' ? node.getAttribute(attribute) || '' :
        ATTR_URIDATA[attribute] ? node.getAttribute(attribute, 2) || '' :
        ATTR_BOOLEAN[attribute] ? node.getAttribute(attribute) ? attribute : 'false' :
          ((node = node.getAttributeNode(attribute)) && node.value) || '');
    },

  hasAttribute = root.hasAttribute ?
    function(node, attribute) {
        return node.hasAttribute(attribute);
    } :
    function(node, attribute) {
      attribute = attribute.toLowerCase();
      if (ATTR_DEFAULT[attribute]) {
        return !!node[ATTR_DEFAULT[attribute]];
      }
      node = node.getAttributeNode(attribute);
      return !!(node && node.specified);
    },

  compile =
    function(selector, source, mode) {

      var parts = typeof selector == 'string' ? selector.match(reSplitGroup) : selector;

      typeof source == 'string' || (source = '');

      if (parts.length == 1) {
        source += compileSelector(parts[0], mode ? ACCEPT_NODE : 'f&&f(k);return true;', mode);
      } else {
        var i = -1, seen = global.Object(), token;
        while ((token = parts[++i])) {
          token = token.replace(reTrimSpaces, '');
          if (!seen[token] && (seen[token] = true)) {
            source += compileSelector(token, mode ? ACCEPT_NODE : 'f&&f(k);return true;', mode);
          }
        }
      }

      if (mode)
        return global.Function('c,s,r,d,h,g,f,v',
          'var N,n,x=0,k=-1,e;main:while((e=c[++k])){' + source + '}return r;');
      else
        return global.Function('e,s,r,d,h,g,f,v',
          'var N,n,x=0,k=e;' + source + 'return false;');
    },

  FILTER =
    'var z=v[@]||(v[@]=[]),l=z.length-1;' +
    'while(l>=0&&z[l]!==e)--l;' +
    'if(l!==-1){break;}' +
    'z[z.length]=e;',

  compileSelector =
    function(selector, source, mode) {

      var k = 0, expr, match, name, result, status, test, type;

      while (selector) {

        k++;

        if ((match = selector.match(Patterns.universal))) {
          expr = '';
        }

        else if ((match = selector.match(Patterns.id))) {
          source = 'if(' + (XML_DOCUMENT ?
            's.getAttribute(e,"id")' :
            '(e.submit?s.getAttribute(e,"id"):e.id)') +
            '=="' + match[1] + '"' +
            '){' + source + '}';
        }

        else if ((match = selector.match(Patterns.tagName))) {
          source = 'if(e.nodeName' + (XML_DOCUMENT ?
            '=="' + match[1] + '"' : TO_UPPER_CASE +
            '=="' + match[1].toUpperCase() + '"') +
            '){' + source + '}';
        }

        else if ((match = selector.match(Patterns.className))) {
          source = 'if((n=' + (XML_DOCUMENT ?
            'e.getAttribute("class")' : 'e.className') +
            ')&&n.length&&(" "+' + (QUIRKS_MODE ? 'n.toLowerCase()' : 'n') +
            '.replace(' + reWhiteSpace + '," ")+" ").indexOf(" ' +
            (QUIRKS_MODE ? match[1].toLowerCase() : match[1]) + ' ")>-1' +
            '){' + source + '}';
        }

        else if ((match = selector.match(Patterns.attribute))) {
          if (match[2] && !Operators[match[2]]) {
            emit('Unsupported operator in attribute selectors "' + selector + '"');
            return '';
          }
          test = 'false';
          if (match[2] && match[4] && (test = Operators[match[2]])) {
            match[4] = convertEscapes(match[4]);
            type = INSENSITIVE_MAP[match[1].toLowerCase()];
            test = test.replace(/\%m/g, type ? match[4].toLowerCase() : match[4]);
          } else if (match[2] == '!=' || match[2] == '=') {
            test = 'n' + match[2] + '=""';
          }
          expr = 'n=s.' + (match[2] ? 'get' : 'has') + 'Attribute(e,"' + match[1] + '")' + (type && match[2] ? '.toLowerCase();' : ';');
          source = expr + 'if(' + (match[2] ? test : 'n') + '){' + source + '}';
        }

        else if ((match = selector.match(Patterns.adjacent))) {
          source = (mode ? '' : FILTER.replace(/@/g, k)) + source;
          source = 'var N' + k + '=e;while(e&&(e=e.previousSibling)){if(e.nodeName>"@"){' + source + 'break;}}e=N' + k + ';';
        }

        else if ((match = selector.match(Patterns.relative))) {
          source = (mode ? '' : FILTER.replace(/@/g, k)) + source;
          source = 'var N' + k + '=e;e=e.parentNode.firstChild;while(e&&e!==N' + k + '){if(e.nodeName>"@"){' + source + '}e=e.nextSibling;}e=N' + k + ';';
        }

        else if ((match = selector.match(Patterns.children))) {
          source = (mode ? '' : FILTER.replace(/@/g, k)) + source;
          source = 'var N' + k + '=e;while(e&&e!==h&&e!==g&&(e=e.parentNode)){' + source + 'break;}e=N' + k + ';';
        }

        else if ((match = selector.match(Patterns.ancestor))) {
          source = (mode ? '' : FILTER.replace(/@/g, k)) + source;
          source = 'var N' + k + '=e;while(e&&e!==h&&e!==g&&(e=e.parentNode)){' + source + '}e=N' + k + ';';
        }

        else {

          expr = false;
          status = false;
          for (expr in Selectors) {
            if ((match = selector.match(Selectors[expr].Expression)) && match[1]) {
              result = Selectors[expr].Callback(match, source);
              source = result.source;
              status = result.status;
              if (status) { break; }
            }
          }

          if (!status) {
            emit('Unknown pseudo-class selector "' + selector + '"');
            return '';
          }

          if (!expr) {
            emit('Unknown token in selector "' + selector + '"');
            return '';
          }

        }

        if (!match) {
          emit('Invalid syntax in selector "' + selector + '"');
          return '';
        }

        selector = match && match[match.length - 1];
      }

      return source;
    },

  match =
    function(element, selector, from, callback) {

      var parts;

      if (!(element && element.nodeType == 1)) {
        emit('Invalid element argument');
        return false;
      } else if (typeof selector != 'string') {
        emit('Invalid selector argument');
        return false;
      } else if (lastContext !== from) {
        switchContext(from || (from = element.ownerDocument));
      }

      selector = selector.replace(reTrimSpaces, '');

      Config.SHORTCUTS && (selector = Dom.shortcuts(selector, element, from));

      if (lastMatcher != selector) {
        if ((parts = selector.match(reValidator)) && parts[0] == selector) {
          isSingleMatch = (parts = selector.match(reSplitGroup)).length < 2;
          lastMatcher = selector;
          lastPartsMatch = parts;
        } else {
          emit('The string "' + selector + '", is not a valid CSS selector');
          return false;
        }
      } else parts = lastPartsMatch;

      if (!matchResolvers[selector] || matchContexts[selector] !== from) {
        matchResolvers[selector] = compile(isSingleMatch ? [selector] : parts, '', false);
        matchContexts[selector] = from;
      }

      return matchResolvers[selector](element, Snapshot, [ ], doc, root, from, callback, { });
    },

  first =
    function(selector, from) {
      return select(selector, from, function() { return false; })[0] || null;
    },

  select =
    function(selector, from, callback) {

      var i, changed, element, elements, parts, token, original = selector;

      if (arguments.length === 0) {
        emit('Not enough arguments');
        return [ ];
      } else if (typeof selector != 'string') {
        return [ ];
      } else if (from && !(/1|9|11/).test(from.nodeType)) {
        emit('Invalid or illegal context element');
        return [ ];
      } else if (lastContext !== from) {
        switchContext(from || (from = doc));
      }

      if (Config.CACHING && (elements = Dom.loadResults(original, from, doc, root))) {
        return callback ? concatCall([ ], elements, callback) : elements;
      }

      selector = selector.replace(reTrimSpaces, '');

      Config.SHORTCUTS && (selector = Dom.shortcuts(selector, from));

      if ((changed = lastSelector != selector)) {
        if ((parts = selector.match(reValidator)) && parts[0] == selector) {
          isSingleSelect = (parts = selector.match(reSplitGroup)).length < 2;
          lastSelector = selector;
          lastPartsSelect = parts;
        } else {
          emit('The string "' + selector + '", is not a valid CSS selector');
          return [ ];
        }
      } else parts = lastPartsSelect;

      if (from.nodeType == 11) {

        elements = byTagRaw('*', from);

      } else if (isSingleSelect) {

        if (changed) {
          parts = selector.match(reSplitToken);
          token = parts[parts.length - 1];
          lastSlice = token.split(':not')[0];
          lastPosition = selector.length - token.length;
        }

        if (Config.UNIQUE_ID && (parts = lastSlice.match(Optimize.ID)) && (token = parts[1])) {
          if ((element = _byId(token, from))) {
            if (match(element, selector)) {
              callback && callback(element);
              elements = global.Array(element);
            } else elements = global.Array();
          }
        }

        else if (Config.UNIQUE_ID && (parts = selector.match(Optimize.ID)) && (token = parts[1])) {
          if ((element = _byId(token, doc))) {
            if ('#' + token == selector) {
              callback && callback(element);
              elements = global.Array(element);
            } else if (/[>+~]/.test(selector)) {
              from = element.parentNode;
            } else {
              from = element;
            }
          } else elements = global.Array();
        }

        if (elements) {
          Config.CACHING && Dom.saveResults(original, from, doc, elements);
          return elements;
        }

        if (!XML_DOCUMENT && GEBTN && (parts = lastSlice.match(Optimize.TAG)) && (token = parts[1])) {
          if ((elements = from.getElementsByTagName(token)).length === 0) return [ ];
          selector = selector.slice(0, lastPosition) + selector.slice(lastPosition).replace(token, '*');
        }

        else if (!XML_DOCUMENT && GEBCN && (parts = lastSlice.match(Optimize.CLASS)) && (token = parts[1])) {
          if ((elements = from.getElementsByClassName(token.replace(/\\([^\\]{1})/g, '$1'))).length === 0) return [ ];
            selector = selector.slice(0, lastPosition) + selector.slice(lastPosition).replace('.' + token,
              reOptimizeSelector.test(selector.charAt(selector.indexOf(token) - 1)) ? '' : '*');
        }

      }

      if (!elements) {
        if (IE_LT_9) {
          elements = /^(?:applet|object)$/i.test(from.nodeName) ?
            from.childNodes : from.all;
        } else {
          elements = from.getElementsByTagName('*');
        }
      }

      if (!selectResolvers[selector] || selectContexts[selector] !== from) {
        selectResolvers[selector] = compile(isSingleSelect ? [selector] : parts, REJECT_NODE, true);
        selectContexts[selector] = from;
      }

      elements = selectResolvers[selector](elements, Snapshot, [ ], doc, root, from, callback, { });

      Config.CACHING && Dom.saveResults(original, from, doc, elements);

      return elements;
    },

  FN = function(x) { return x; },

  matchContexts = global.Object(),
  matchResolvers = global.Object(),

  selectContexts = global.Object(),
  selectResolvers = global.Object(),

  Snapshot = global.Object({
    byId: _byId,
    match: match,
    select: select,
    getAttribute: getAttribute,
    hasAttribute: hasAttribute
  });

  Tokens = global.Object({
    prefixes: prefixes,
    encoding: encoding,
    operators: operators,
    whitespace: whitespace,
    identifier: identifier,
    attributes: attributes,
    combinators: combinators,
    pseudoclass: pseudoclass,
    pseudoparms: pseudoparms,
    quotedvalue: quotedvalue
  });

  Dom.ACCEPT_NODE = ACCEPT_NODE;

  Dom.byId = byId;
  Dom.match = match;
  Dom.first = first;
  Dom.select = select;
  Dom.compile = compile;
  Dom.configure = configure;

  Dom.setCache = FN;
  Dom.shortcuts = FN;
  Dom.loadResults = FN;
  Dom.saveResults = FN;

  Dom.emit = emit;
  Dom.Config = Config;
  Dom.Snapshot = Snapshot;

  Dom.Operators = Operators;
  Dom.Selectors = Selectors;

  Dom.Tokens = Tokens;
  Dom.Version = version;

  Dom.registerOperator =
    function(symbol, resolver) {
      Operators[symbol] || (Operators[symbol] = resolver);
    };

  Dom.registerSelector =
    function(name, rexp, func) {
      Selectors[name] || (Selectors[name] = global.Object({
        Expression: rexp,
        Callback: func
      }));
    };

  switchContext(doc, true);

});
