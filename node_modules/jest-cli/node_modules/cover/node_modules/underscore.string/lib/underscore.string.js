// Underscore.string
// (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
// Underscore.strings is freely distributable under the terms of the MIT license.
// Documentation: https://github.com/epeli/underscore.string
// Some code is borrowed from MooTools and Alexandru Marasteanu.

// Version 2.0.0

(function(root){
  'use strict';

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(i, m) {
    for (var o = []; m > 0; o[--m] = i) {}
    return o.join('');
  };

  var slice = function(a){
    return Array.prototype.slice.call(a);
  };

  var defaultToWhiteSpace = function(characters){
    if (characters) {
      return _s.escapeRegExp(characters);
    }
    return '\\s';
  };

  var sArgs = function(method){
    return function(){
      var args = slice(arguments);
      for(var i=0; i<args.length; i++)
        args[i] = args[i] == null ? '' : '' + args[i];
      return method.apply(null, args);
    };
  };

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {
              
    VERSION: '2.0.0',

    isBlank: sArgs(function(str){
      return (/^\s*$/).test(str);
    }),

    stripTags: sArgs(function(str){
      return str.replace(/<\/?[^>]+>/ig, '');
    }),

    capitalize : sArgs(function(str) {
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    }),

    chop: sArgs(function(str, step){
      step = parseNumber(step) || str.length;
      var arr = [];
      for (var i = 0; i < str.length;) {
        arr.push(str.slice(i,i + step));
        i = i + step;
      }
      return arr;
    }),

    clean: sArgs(function(str){
      return _s.strip(str.replace(/\s+/g, ' '));
    }),

    count: sArgs(function(str, substr){
      var count = 0, index;
      for (var i=0; i < str.length;) {
        index = str.indexOf(substr, i);
        index >= 0 && count++;
        i = i + (index >= 0 ? index : 0) + substr.length;
      }
      return count;
    }),

    chars: sArgs(function(str) {
      return str.split('');
    }),

    escapeHTML: sArgs(function(str) {
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                            .replace(/"/g, '&quot;').replace(/'/g, "&apos;");
    }),

    unescapeHTML: sArgs(function(str) {
      return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    }),

    escapeRegExp: sArgs(function(str){
      // From MooTools core 1.2.4
      return str.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
    }),

    insert: sArgs(function(str, i, substr){
      var arr = str.split('');
      arr.splice(parseNumber(i), 0, substr);
      return arr.join('');
    }),

    include: sArgs(function(str, needle){
      return str.indexOf(needle) !== -1;
    }),

    join: sArgs(function(sep) {
      var args = slice(arguments);
      return args.join(args.shift());
    }),

    lines: sArgs(function(str) {
      return str.split("\n");
    }),

    reverse: sArgs(function(str){
        return Array.prototype.reverse.apply(String(str).split('')).join('');
    }),

    splice: sArgs(function(str, i, howmany, substr){
      var arr = str.split('');
      arr.splice(parseNumber(i), parseNumber(howmany), substr);
      return arr.join('');
    }),

    startsWith: sArgs(function(str, starts){
      return str.length >= starts.length && str.substring(0, starts.length) === starts;
    }),

    endsWith: sArgs(function(str, ends){
      return str.length >= ends.length && str.substring(str.length - ends.length) === ends;
    }),

    succ: sArgs(function(str){
      var arr = str.split('');
      arr.splice(str.length-1, 1, String.fromCharCode(str.charCodeAt(str.length-1) + 1));
      return arr.join('');
    }),

    titleize: sArgs(function(str){
      var arr = str.split(' '),
          word;
      for (var i=0; i < arr.length; i++) {
        word = arr[i].split('');
        if(typeof word[0] !== 'undefined') word[0] = word[0].toUpperCase();
        i+1 === arr.length ? arr[i] = word.join('') : arr[i] = word.join('') + ' ';
      }
      return arr.join('');
    }),

    camelize: sArgs(function(str){
      return _s.trim(str).replace(/(\-|_|\s)+(.)?/g, function(match, separator, chr) {
        return chr ? chr.toUpperCase() : '';
      });
    }),

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-|\s+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1-$2').replace(/^([A-Z]+)/, '-$1').replace(/\_|\s+/g, '-').toLowerCase();
    },

    humanize: function(str){
      return _s.capitalize(this.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: sArgs(function(str, characters){
      if (!characters && nativeTrim) {
        return nativeTrim.call(str);
      }
      characters = defaultToWhiteSpace(characters);
      return str.replace(new RegExp('\^[' + characters + ']+|[' + characters + ']+$', 'g'), '');
    }),

    ltrim: sArgs(function(str, characters){
      characters = defaultToWhiteSpace(characters);
      return str.replace(new RegExp('\^[' + characters + ']+', 'g'), '');
    }),

    rtrim: sArgs(function(str, characters){
      characters = defaultToWhiteSpace(characters);
      return str.replace(new RegExp('[' + characters + ']+$', 'g'), '');
    }),

    truncate: sArgs(function(str, length, truncateStr){
      truncateStr = truncateStr || '...';
      length = parseNumber(length);
      return str.length > length ? str.slice(0,length) + truncateStr : str;
    }),

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/sergiokas
     */
    prune: sArgs(function(str, length, pruneStr){
      // Function to check word/digit chars including non-ASCII encodings. 
      var isWordChar = function(c) { return ((c.toUpperCase() != c.toLowerCase()) || /[-_\d]/.test(c)); }
      
      var template = '';
      var pruned = '';
      var i = 0;
      
      // Set default values
      pruneStr = pruneStr || '...';
      length = parseNumber(length);
      
      // Convert to an ASCII string to avoid problems with unicode chars.
      for (i in str) {
        template += (isWordChar(str[i]))?'A':' ';
      } 

      // Check if we're in the middle of a word
      if( template.substring(length-1, length+1).search(/^\w\w$/) === 0 )
        pruned = _s.rtrim(template.slice(0,length).replace(/([\W][\w]*)$/,''));
      else
        pruned = _s.rtrim(template.slice(0,length));

      pruned = pruned.replace(/\W+$/,'');

      return (pruned.length+pruneStr.length>str.length) ? str : str.substring(0, pruned.length)+pruneStr;
    }),

    words: function(str, delimiter) {
      return String(str).split(delimiter || " ");
    },

    pad: sArgs(function(str, length, padStr, type) {
      var padding = '',
          padlen  = 0;

      length = parseNumber(length);

      if (!padStr) { padStr = ' '; }
      else if (padStr.length > 1) { padStr = padStr.charAt(0); }
      switch(type) {
        case 'right':
          padlen = (length - str.length);
          padding = strRepeat(padStr, padlen);
          str = str+padding;
          break;
        case 'both':
          padlen = (length - str.length);
          padding = {
            'left' : strRepeat(padStr, Math.ceil(padlen/2)),
            'right': strRepeat(padStr, Math.floor(padlen/2))
          };
          str = padding.left+str+padding.right;
          break;
        default: // 'left'
          padlen = (length - str.length);
          padding = strRepeat(padStr, padlen);;
          str = padding+str;
        }
      return str;
    }),

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      var num = parseNumber(parseNumber(str).toFixed(parseNumber(decimals)));
      return (!(num === 0 && (str !== "0" && str !== 0))) ? num : Number.NaN;
    },

    strRight: sArgs(function(sourceStr, sep){
      var pos =  (!sep) ? -1 : sourceStr.indexOf(sep);
      return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
    }),

    strRightBack: sArgs(function(sourceStr, sep){
      var pos =  (!sep) ? -1 : sourceStr.lastIndexOf(sep);
      return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
    }),

    strLeft: sArgs(function(sourceStr, sep){
      var pos = (!sep) ? -1 : sourceStr.indexOf(sep);
      return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
    }),

    strLeftBack: sArgs(function(sourceStr, sep){
      var pos = sourceStr.lastIndexOf(sep);
      return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
    }),

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop == 'include' || prop == 'contains' || prop == 'reverse') continue;
        result[prop] = this[prop];
      }

      return result;
    }

  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.ljust    = _s.lpad;
  _s.rjust    = _s.rpad;
  _s.contains = _s.include;

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      // Export module
      module.exports = _s;
    }
    exports._s = _s;

  // Integrate with Underscore.js
  } else if (typeof root._ !== 'undefined') {
    // root._.mixin(_s);
    root._.string = _s;
    root._.str = root._.string;

  // Or define it
  } else {
    root._ = {
      string: _s,
      str: _s
    };
  }

}(this || window));
