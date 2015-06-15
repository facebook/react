
/**
 * Repeats a string.
 *
 * @param {String} char(s)
 * @param {Number} number of times
 * @return {String} repeated string
 */

exports.repeat = function (str, times){
  return Array(times + 1).join(str);
};

/**
 * Pads a string
 *
 * @api public
 */

exports.pad = function (str, len, pad, dir) {
  if (len + 1 >= str.length)
    switch (dir){
      case 'left':
        str = Array(len + 1 - str.length).join(pad) + str;
        break;
      
      case 'both':
        var right = Math.ceil((padlen = len - str.length) / 2);
        var left = padlen - right;
        str = Array(left + 1).join(pad) + str + Array(right + 1).join(pad);
        break;
 
      default:
        str = str + Array(len + 1 - str.length).join(pad);
    };

  return str;
};

/**
 * Truncates a string
 *
 * @api public
 */

exports.truncate = function (str, length, chr){
  chr = chr || '…';
  return str.length >= length ? str.substr(0, length - chr.length) + chr : str;
};

/**
 * Copies and merges options with defaults.
 *
 * @param {Object} defaults
 * @param {Object} supplied options
 * @return {Object} new (merged) object
 */

function clone(a){
  var b;
  if (Array.isArray(a)){
    b = [];
    for (var i = 0, l = a.length; i < l; i++)
      b.push(typeof a[i] == 'object' ? clone(a[i]) : a[i]);
    return b;
  } else if (typeof a == 'object'){
    b = {};
    for (var i in a)
      b[i] = typeof a[i] == 'object' ? clone(a[i]) : a[i];
    return b;
  }
  return a;
};

exports.options = function (defaults, opts){
  var c = clone(opts);
  for (var i in defaults)
    if (!(i in opts))
      c[i] = defaults[i];
  return c;
};


//
// For consideration of terminal "color" programs like colors.js,
// which can add ANSI escape color codes to strings,
// we destyle the ANSI color escape codes for padding calculations.
//
// see: http://en.wikipedia.org/wiki/ANSI_escape_code
//
exports.strlen = function(str){
  var code = /\u001b\[\d+m/g;
  var stripped = ("" + str).replace(code,'');
  return stripped.length;
}  
