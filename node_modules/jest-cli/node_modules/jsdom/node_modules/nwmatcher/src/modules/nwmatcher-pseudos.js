/*
 * Copyright (C) 2007-2015 Diego Perini
 * All rights reserved.
 *
 * CSS3 pseudo-classes extension for NWMatcher
 *
 * Added capabilities:
 *
 * - structural pseudo-classes
 *
 * :root, :empty,
 * :nth-child(), nth-of-type(),
 * :nth-last-child(), nth-last-of-type(),
 * :first-child, :last-child, :only-child
 * :first-of-type, :last-of-type, :only-of-type
 *
 * - negation, language, target and UI element pseudo-classes
 *
 * :not(), :target, :lang(), :target
 * :link, :visited, :active, :focus, :hover,
 * :checked, :disabled, :enabled, :selected
 */

(function(global) {

  var LINK_NODES = global.Object({
    'a': 1, 'A': 1,
    'area': 1, 'AREA': 1,
    'link': 1, 'LINK': 1
  }),

  root = document.documentElement,

  contains = 'compareDocumentPosition' in root ?
    function(container, element) {
      return (container.compareDocumentPosition(element) & 16) == 16;
    } : 'contains' in root ?
    function(container, element) {
      return element.nodeType == 1 && container.contains(element);
    } :
    function(container, element) {
      while ((element = element.parentNode) && element.nodeType == 1) {
        if (element === container) return true;
      }
      return false;
    },

  isLink =
    function(element) {
      return element.getAttribute('href') && LINK_NODES[element.nodeName];
    },

  isEmpty =
    function(node) {
      node = node.firstChild;
      while (node) {
        if (node.nodeType == 3 || node.nodeName > '@') return false;
        node = node.nextSibling;
      }
      return true;
    },

  nthElement =
    function(element, last) {
      var count = 1, succ = last ? 'nextSibling' : 'previousSibling';
      while ((element = element[succ])) {
        if (element.nodeName > '@') ++count;
      }
      return count;
    },

  nthOfType =
    function(element, last) {
      var count = 1, succ = last ? 'nextSibling' : 'previousSibling', type = element.nodeName;
      while ((element = element[succ])) {
        if (element.nodeName == type) ++count;
      }
      return count;
    };

  NW.Dom.Snapshot['contains'] = contains;

  NW.Dom.Snapshot['isLink'] = isLink;
  NW.Dom.Snapshot['isEmpty'] = isEmpty;
  NW.Dom.Snapshot['nthOfType'] = nthOfType;
  NW.Dom.Snapshot['nthElement'] = nthElement;

})(this);

NW.Dom.registerSelector(
  'nwmatcher:spseudos',
  /^\:(root|empty|(?:first|last|only)(?:-child|-of-type)|nth(?:-last)?(?:-child|-of-type)\(\s*(even|odd|(?:[-+]{0,1}\d*n\s*)?[-+]{0,1}\s*\d*)\s*\))?(.*)/i,
  (function(global) {

    return function(match, source) {

      var a, n, b, status = true, test, type;

      switch (match[1]) {

        case 'root':
          if (match[3])
            source = 'if(e===h||s.contains(h,e)){' + source + '}';
          else
            source = 'if(e===h){' + source + '}';
          break;

        case 'empty':
          source = 'if(s.isEmpty(e)){' + source + '}';
          break;

        default:
          if (match[1] && match[2]) {

            if (match[2] == 'n') {
              source = 'if(e!==h){' + source + '}';
              break;
            } else if (match[2] == 'even') {
              a = 2;
              b = 0;
            } else if (match[2] == 'odd') {
              a = 2;
              b = 1;
            } else {
              b = ((n = match[2].match(/(-?\d+)$/)) ? global.parseInt(n[1], 10) : 0);
              a = ((n = match[2].match(/(-?\d*)n/i)) ? global.parseInt(n[1], 10) : 0);
              if (n && n[1] == '-') a = -1;
            }
            test = a > 1 ?
              (/last/i.test(match[1])) ? '(n-(' + b + '))%' + a + '==0' :
              'n>=' + b + '&&(n-(' + b + '))%' + a + '==0' : a < -1 ?
              (/last/i.test(match[1])) ? '(n-(' + b + '))%' + a + '==0' :
              'n<=' + b + '&&(n-(' + b + '))%' + a + '==0' : a === 0 ?
              'n==' + b : a == -1 ? 'n<=' + b : 'n>=' + b;
            source =
              'if(e!==h){' +
                'n=s[' + (/-of-type/i.test(match[1]) ? '"nthOfType"' : '"nthElement"') + ']' +
                  '(e,' + (/last/i.test(match[1]) ? 'true' : 'false') + ');' +
                'if(' + test + '){' + source + '}' +
              '}';

          } else if (match[1]) {

            a = /first/i.test(match[1]) ? 'previous' : 'next';
            n = /only/i.test(match[1]) ? 'previous' : 'next';
            b = /first|last/i.test(match[1]);
            type = /-of-type/i.test(match[1]) ? '&&n.nodeName!==e.nodeName' : '&&n.nodeName<"@"';
            source = 'if(e!==h){' +
              ( 'n=e;while((n=n.' + a + 'Sibling)' + type + ');if(!n){' + (b ? source :
                'n=e;while((n=n.' + n + 'Sibling)' + type + ');if(!n){' + source + '}') + '}' ) + '}';

          } else {

            status = false;

          }
          break;
      }

      return global.Object({
        'source': source,
        'status': status
      });

    };

  })(this));

NW.Dom.registerSelector(
  'nwmatcher:dpseudos',
  /^\:(link|visited|target|active|focus|hover|checked|disabled|enabled|selected|lang\(([-\w]{2,})\)|not\(([^()]*|.*)\))?(.*)/i,
  (function(global) {

    var doc = global.document,
    Config = NW.Dom.Config,
    Tokens = NW.Dom.Tokens,

    reTrimSpace = global.RegExp('^\\s+|\\s+$', 'g'),

    reSimpleNot = global.RegExp('^((?!:not)' +
      '(' + Tokens.prefixes + '|' + Tokens.identifier +
      '|\\([^()]*\\))+|\\[' + Tokens.attributes + '\\])$');

    return function(match, source) {

      var expr, status = true, test;

      switch (match[1].match(/^\w+/)[0]) {

        case 'not':
          expr = match[3].replace(reTrimSpace, '');
          if (Config.SIMPLENOT && !reSimpleNot.test(expr)) {
            NW.Dom.emit('Negation pseudo-class only accepts simple selectors "' + match.join('') + '"');
          } else {
            if ('compatMode' in doc) {
              source = 'if(!' + NW.Dom.compile(expr, '', false) + '(e,s,r,d,h,g)){' + source + '}';
            } else {
              source = 'if(!s.match(e, "' + expr.replace(/\x22/g, '\\"') + '",g)){' + source +'}';
            }
          }
          break;

        case 'checked':
          source = 'if((typeof e.form!=="undefined"&&(/^(?:radio|checkbox)$/i).test(e.type)&&e.checked)' +
            (Config.USE_HTML5 ? '||(/^option$/i.test(e.nodeName)&&(e.selected||e.checked))' : '') +
            '){' + source + '}';
          break;

        case 'disabled':
          source = 'if(((typeof e.form!=="undefined"' +
            (Config.USE_HTML5 ? '' : '&&!(/^hidden$/i).test(e.type)') +
            ')||s.isLink(e))&&e.disabled===true){' + source + '}';
          break;

        case 'enabled':
          source = 'if(((typeof e.form!=="undefined"' +
            (Config.USE_HTML5 ? '' : '&&!(/^hidden$/i).test(e.type)') +
            ')||s.isLink(e))&&e.disabled===false){' + source + '}';
          break;

        case 'lang':
          test = '';
          if (match[2]) test = match[2].substr(0, 2) + '-';
          source = 'do{(n=e.lang||"").toLowerCase();' +
            'if((n==""&&h.lang=="' + match[2].toLowerCase() + '")||' +
            '(n&&(n=="' + match[2].toLowerCase() +
            '"||n.substr(0,3)=="' + test.toLowerCase() + '")))' +
            '{' + source + 'break;}}while((e=e.parentNode)&&e!==g);';
          break;

        case 'target':
          source = 'if(e.id==d.location.hash.slice(1)){' + source + '}';
          break;

        case 'link':
          source = 'if(s.isLink(e)&&!e.visited){' + source + '}';
          break;

        case 'visited':
          source = 'if(s.isLink(e)&&e.visited){' + source + '}';
          break;

        case 'active':
          source = 'if(e===d.activeElement){' + source + '}';
          break;

        case 'hover':
          source = 'if(e===d.hoverElement){' + source + '}';
          break;

        case 'focus':
          source = 'hasFocus' in doc ?
            'if(e===d.activeElement&&d.hasFocus()&&(e.type||e.href||typeof e.tabIndex=="number")){' + source + '}' :
            'if(e===d.activeElement&&(e.type||e.href)){' + source + '}';
          break;

        case 'selected':
          source = 'if(/^option$/i.test(e.nodeName)&&(e.selected||e.checked)){' + source + '}';
          break;

        default:
          status = false;
          break;
      }

      return global.Object({
        'source': source,
        'status': status
      });

    };

  })(this));
