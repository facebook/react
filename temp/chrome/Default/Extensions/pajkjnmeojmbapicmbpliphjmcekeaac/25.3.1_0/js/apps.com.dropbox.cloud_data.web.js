/*! For license information please see apps.com.dropbox.cloud_data.web.js.LICENSE.txt */
(() => {
  var __webpack_modules__ = {
    8045: module => {
      "use strict";
      module.exports = function(fn, ctx) {
        var params = new Array(arguments.length - 1), offset = 0, index = 2, pending = !0;
        for (;index < arguments.length; ) params[offset++] = arguments[index++];
        return new Promise((function(resolve, reject) {
          params[offset] = function(err) {
            if (pending) if (pending = !1, err) reject(err); else {
              for (var params = new Array(arguments.length - 1), offset = 0; offset < params.length; ) params[offset++] = arguments[offset];
              resolve.apply(null, params);
            }
          };
          try {
            fn.apply(ctx || null, params);
          } catch (err) {
            pending && (pending = !1, reject(err));
          }
        }));
      };
    },
    8839: (__unused_webpack_module, exports) => {
      "use strict";
      var base64 = exports;
      base64.length = function(string) {
        var p = string.length;
        if (!p) return 0;
        for (var n = 0; --p % 4 > 1 && "=" === string.charAt(p); ) ++n;
        return Math.ceil(3 * string.length) / 4 - n;
      };
      for (var b64 = new Array(64), s64 = new Array(123), i = 0; i < 64; ) s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
      base64.encode = function(buffer, start, end) {
        for (var t, parts = null, chunk = [], i = 0, j = 0; start < end; ) {
          var b = buffer[start++];
          switch (j) {
           case 0:
            chunk[i++] = b64[b >> 2], t = (3 & b) << 4, j = 1;
            break;

           case 1:
            chunk[i++] = b64[t | b >> 4], t = (15 & b) << 2, j = 2;
            break;

           case 2:
            chunk[i++] = b64[t | b >> 6], chunk[i++] = b64[63 & b], j = 0;
          }
          i > 8191 && ((parts || (parts = [])).push(String.fromCharCode.apply(String, chunk)), 
          i = 0);
        }
        return j && (chunk[i++] = b64[t], chunk[i++] = 61, 1 === j && (chunk[i++] = 61)), 
        parts ? (i && parts.push(String.fromCharCode.apply(String, chunk.slice(0, i))), 
        parts.join("")) : String.fromCharCode.apply(String, chunk.slice(0, i));
      };
      base64.decode = function(string, buffer, offset) {
        for (var t, start = offset, j = 0, i = 0; i < string.length; ) {
          var c = string.charCodeAt(i++);
          if (61 === c && j > 1) break;
          if (void 0 === (c = s64[c])) throw Error("invalid encoding");
          switch (j) {
           case 0:
            t = c, j = 1;
            break;

           case 1:
            buffer[offset++] = t << 2 | (48 & c) >> 4, t = c, j = 2;
            break;

           case 2:
            buffer[offset++] = (15 & t) << 4 | (60 & c) >> 2, t = c, j = 3;
            break;

           case 3:
            buffer[offset++] = (3 & t) << 6 | c, j = 0;
          }
        }
        if (1 === j) throw Error("invalid encoding");
        return offset - start;
      }, base64.test = function(string) {
        return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
      };
    },
    4358: module => {
      "use strict";
      function EventEmitter() {
        this._listeners = {};
      }
      module.exports = EventEmitter, EventEmitter.prototype.on = function(evt, fn, ctx) {
        return (this._listeners[evt] || (this._listeners[evt] = [])).push({
          fn,
          ctx: ctx || this
        }), this;
      }, EventEmitter.prototype.off = function(evt, fn) {
        if (void 0 === evt) this._listeners = {}; else if (void 0 === fn) this._listeners[evt] = []; else for (var listeners = this._listeners[evt], i = 0; i < listeners.length; ) listeners[i].fn === fn ? listeners.splice(i, 1) : ++i;
        return this;
      }, EventEmitter.prototype.emit = function(evt) {
        var listeners = this._listeners[evt];
        if (listeners) {
          for (var args = [], i = 1; i < arguments.length; ) args.push(arguments[i++]);
          for (i = 0; i < listeners.length; ) listeners[i].fn.apply(listeners[i++].ctx, args);
        }
        return this;
      };
    },
    9410: module => {
      "use strict";
      function factory(exports) {
        return "undefined" != typeof Float32Array ? function() {
          var f32 = new Float32Array([ -0 ]), f8b = new Uint8Array(f32.buffer), le = 128 === f8b[3];
          function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val, buf[pos] = f8b[0], buf[pos + 1] = f8b[1], buf[pos + 2] = f8b[2], buf[pos + 3] = f8b[3];
          }
          function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val, buf[pos] = f8b[3], buf[pos + 1] = f8b[2], buf[pos + 2] = f8b[1], buf[pos + 3] = f8b[0];
          }
          function readFloat_f32_cpy(buf, pos) {
            return f8b[0] = buf[pos], f8b[1] = buf[pos + 1], f8b[2] = buf[pos + 2], f8b[3] = buf[pos + 3], 
            f32[0];
          }
          function readFloat_f32_rev(buf, pos) {
            return f8b[3] = buf[pos], f8b[2] = buf[pos + 1], f8b[1] = buf[pos + 2], f8b[0] = buf[pos + 3], 
            f32[0];
          }
          exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev, exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy, 
          exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev, exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;
        }() : function() {
          function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign && (val = -val), 0 === val) writeUint(1 / val > 0 ? 0 : 2147483648, buf, pos); else if (isNaN(val)) writeUint(2143289344, buf, pos); else if (val > 34028234663852886e22) writeUint((sign << 31 | 2139095040) >>> 0, buf, pos); else if (val < 11754943508222875e-54) writeUint((sign << 31 | Math.round(val / 1401298464324817e-60)) >>> 0, buf, pos); else {
              var exponent = Math.floor(Math.log(val) / Math.LN2);
              writeUint((sign << 31 | exponent + 127 << 23 | 8388607 & Math.round(val * Math.pow(2, -exponent) * 8388608)) >>> 0, buf, pos);
            }
          }
          function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos), sign = 2 * (uint >> 31) + 1, exponent = uint >>> 23 & 255, mantissa = 8388607 & uint;
            return 255 === exponent ? mantissa ? NaN : sign * (1 / 0) : 0 === exponent ? 1401298464324817e-60 * sign * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
          }
          exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE), exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE), 
          exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE), exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
        }(), "undefined" != typeof Float64Array ? function() {
          var f64 = new Float64Array([ -0 ]), f8b = new Uint8Array(f64.buffer), le = 128 === f8b[7];
          function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val, buf[pos] = f8b[0], buf[pos + 1] = f8b[1], buf[pos + 2] = f8b[2], buf[pos + 3] = f8b[3], 
            buf[pos + 4] = f8b[4], buf[pos + 5] = f8b[5], buf[pos + 6] = f8b[6], buf[pos + 7] = f8b[7];
          }
          function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val, buf[pos] = f8b[7], buf[pos + 1] = f8b[6], buf[pos + 2] = f8b[5], buf[pos + 3] = f8b[4], 
            buf[pos + 4] = f8b[3], buf[pos + 5] = f8b[2], buf[pos + 6] = f8b[1], buf[pos + 7] = f8b[0];
          }
          function readDouble_f64_cpy(buf, pos) {
            return f8b[0] = buf[pos], f8b[1] = buf[pos + 1], f8b[2] = buf[pos + 2], f8b[3] = buf[pos + 3], 
            f8b[4] = buf[pos + 4], f8b[5] = buf[pos + 5], f8b[6] = buf[pos + 6], f8b[7] = buf[pos + 7], 
            f64[0];
          }
          function readDouble_f64_rev(buf, pos) {
            return f8b[7] = buf[pos], f8b[6] = buf[pos + 1], f8b[5] = buf[pos + 2], f8b[4] = buf[pos + 3], 
            f8b[3] = buf[pos + 4], f8b[2] = buf[pos + 5], f8b[1] = buf[pos + 6], f8b[0] = buf[pos + 7], 
            f64[0];
          }
          exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev, exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy, 
          exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev, exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;
        }() : function() {
          function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign && (val = -val), 0 === val) writeUint(0, buf, pos + off0), writeUint(1 / val > 0 ? 0 : 2147483648, buf, pos + off1); else if (isNaN(val)) writeUint(0, buf, pos + off0), 
            writeUint(2146959360, buf, pos + off1); else if (val > 17976931348623157e292) writeUint(0, buf, pos + off0), 
            writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1); else {
              var mantissa;
              if (val < 22250738585072014e-324) writeUint((mantissa = val / 5e-324) >>> 0, buf, pos + off0), 
              writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1); else {
                var exponent = Math.floor(Math.log(val) / Math.LN2);
                1024 === exponent && (exponent = 1023), writeUint(4503599627370496 * (mantissa = val * Math.pow(2, -exponent)) >>> 0, buf, pos + off0), 
                writeUint((sign << 31 | exponent + 1023 << 20 | 1048576 * mantissa & 1048575) >>> 0, buf, pos + off1);
              }
            }
          }
          function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0), hi = readUint(buf, pos + off1), sign = 2 * (hi >> 31) + 1, exponent = hi >>> 20 & 2047, mantissa = 4294967296 * (1048575 & hi) + lo;
            return 2047 === exponent ? mantissa ? NaN : sign * (1 / 0) : 0 === exponent ? 5e-324 * sign * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
          }
          exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4), exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0), 
          exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4), exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
        }(), exports;
      }
      function writeUintLE(val, buf, pos) {
        buf[pos] = 255 & val, buf[pos + 1] = val >>> 8 & 255, buf[pos + 2] = val >>> 16 & 255, 
        buf[pos + 3] = val >>> 24;
      }
      function writeUintBE(val, buf, pos) {
        buf[pos] = val >>> 24, buf[pos + 1] = val >>> 16 & 255, buf[pos + 2] = val >>> 8 & 255, 
        buf[pos + 3] = 255 & val;
      }
      function readUintLE(buf, pos) {
        return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
      }
      function readUintBE(buf, pos) {
        return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
      }
      module.exports = factory(factory);
    },
    4153: module => {
      "use strict";
      function inquire(moduleName) {
        try {
          var mod = eval("quire".replace(/^/, "re"))(moduleName);
          if (mod && (mod.length || Object.keys(mod).length)) return mod;
        } catch (e) {}
        return null;
      }
      module.exports = inquire;
    },
    9390: module => {
      "use strict";
      module.exports = function(alloc, slice, size) {
        var SIZE = size || 8192, MAX = SIZE >>> 1, slab = null, offset = SIZE;
        return function(size) {
          if (size < 1 || size > MAX) return alloc(size);
          offset + size > SIZE && (slab = alloc(SIZE), offset = 0);
          var buf = slice.call(slab, offset, offset += size);
          return 7 & offset && (offset = 1 + (7 | offset)), buf;
        };
      };
    },
    1447: (__unused_webpack_module, exports) => {
      "use strict";
      var utf8 = exports;
      utf8.length = function(string) {
        for (var len = 0, c = 0, i = 0; i < string.length; ++i) (c = string.charCodeAt(i)) < 128 ? len += 1 : c < 2048 ? len += 2 : 55296 == (64512 & c) && 56320 == (64512 & string.charCodeAt(i + 1)) ? (++i, 
        len += 4) : len += 3;
        return len;
      }, utf8.read = function(buffer, start, end) {
        if (end - start < 1) return "";
        for (var t, parts = null, chunk = [], i = 0; start < end; ) (t = buffer[start++]) < 128 ? chunk[i++] = t : t > 191 && t < 224 ? chunk[i++] = (31 & t) << 6 | 63 & buffer[start++] : t > 239 && t < 365 ? (t = ((7 & t) << 18 | (63 & buffer[start++]) << 12 | (63 & buffer[start++]) << 6 | 63 & buffer[start++]) - 65536, 
        chunk[i++] = 55296 + (t >> 10), chunk[i++] = 56320 + (1023 & t)) : chunk[i++] = (15 & t) << 12 | (63 & buffer[start++]) << 6 | 63 & buffer[start++], 
        i > 8191 && ((parts || (parts = [])).push(String.fromCharCode.apply(String, chunk)), 
        i = 0);
        return parts ? (i && parts.push(String.fromCharCode.apply(String, chunk.slice(0, i))), 
        parts.join("")) : String.fromCharCode.apply(String, chunk.slice(0, i));
      }, utf8.write = function(string, buffer, offset) {
        for (var c1, c2, start = offset, i = 0; i < string.length; ++i) (c1 = string.charCodeAt(i)) < 128 ? buffer[offset++] = c1 : c1 < 2048 ? (buffer[offset++] = c1 >> 6 | 192, 
        buffer[offset++] = 63 & c1 | 128) : 55296 == (64512 & c1) && 56320 == (64512 & (c2 = string.charCodeAt(i + 1))) ? (c1 = 65536 + ((1023 & c1) << 10) + (1023 & c2), 
        ++i, buffer[offset++] = c1 >> 18 | 240, buffer[offset++] = c1 >> 12 & 63 | 128, 
        buffer[offset++] = c1 >> 6 & 63 | 128, buffer[offset++] = 63 & c1 | 128) : (buffer[offset++] = c1 >> 12 | 224, 
        buffer[offset++] = c1 >> 6 & 63 | 128, buffer[offset++] = 63 & c1 | 128);
        return offset - start;
      };
    },
    7526: (__unused_webpack_module, exports) => {
      "use strict";
      exports.byteLength = function(b64) {
        var lens = getLens(b64), validLen = lens[0], placeHoldersLen = lens[1];
        return 3 * (validLen + placeHoldersLen) / 4 - placeHoldersLen;
      }, exports.toByteArray = function(b64) {
        var tmp, i, lens = getLens(b64), validLen = lens[0], placeHoldersLen = lens[1], arr = new Arr(function(b64, validLen, placeHoldersLen) {
          return 3 * (validLen + placeHoldersLen) / 4 - placeHoldersLen;
        }(0, validLen, placeHoldersLen)), curByte = 0, len = placeHoldersLen > 0 ? validLen - 4 : validLen;
        for (i = 0; i < len; i += 4) tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)], 
        arr[curByte++] = tmp >> 16 & 255, arr[curByte++] = tmp >> 8 & 255, arr[curByte++] = 255 & tmp;
        2 === placeHoldersLen && (tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4, 
        arr[curByte++] = 255 & tmp);
        1 === placeHoldersLen && (tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2, 
        arr[curByte++] = tmp >> 8 & 255, arr[curByte++] = 255 & tmp);
        return arr;
      }, exports.fromByteArray = function(uint8) {
        for (var tmp, len = uint8.length, extraBytes = len % 3, parts = [], i = 0, len2 = len - extraBytes; i < len2; i += 16383) parts.push(encodeChunk(uint8, i, i + 16383 > len2 ? len2 : i + 16383));
        1 === extraBytes ? (tmp = uint8[len - 1], parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==")) : 2 === extraBytes && (tmp = (uint8[len - 2] << 8) + uint8[len - 1], 
        parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="));
        return parts.join("");
      };
      for (var lookup = [], revLookup = [], Arr = "undefined" != typeof Uint8Array ? Uint8Array : Array, code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", i = 0; i < 64; ++i) lookup[i] = code[i], 
      revLookup[code.charCodeAt(i)] = i;
      function getLens(b64) {
        var len = b64.length;
        if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
        var validLen = b64.indexOf("=");
        return -1 === validLen && (validLen = len), [ validLen, validLen === len ? 0 : 4 - validLen % 4 ];
      }
      function encodeChunk(uint8, start, end) {
        for (var tmp, num, output = [], i = start; i < end; i += 3) tmp = (uint8[i] << 16 & 16711680) + (uint8[i + 1] << 8 & 65280) + (255 & uint8[i + 2]), 
        output.push(lookup[(num = tmp) >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[63 & num]);
        return output.join("");
      }
      revLookup["-".charCodeAt(0)] = 62, revLookup["_".charCodeAt(0)] = 63;
    },
    8287: (__unused_webpack_module, exports, __webpack_require__) => {
      "use strict";
      var base64 = __webpack_require__(7526), ieee754 = __webpack_require__(251), customInspectSymbol = "function" == typeof Symbol && "function" == typeof Symbol.for ? Symbol.for("nodejs.util.inspect.custom") : null;
      exports.hp = Buffer, exports.IS = 50;
      var K_MAX_LENGTH = 2147483647;
      function createBuffer(length) {
        if (length > K_MAX_LENGTH) throw new RangeError('The value "' + length + '" is invalid for option "size"');
        var buf = new Uint8Array(length);
        return Object.setPrototypeOf(buf, Buffer.prototype), buf;
      }
      function Buffer(arg, encodingOrOffset, length) {
        if ("number" == typeof arg) {
          if ("string" == typeof encodingOrOffset) throw new TypeError('The "string" argument must be of type string. Received type number');
          return allocUnsafe(arg);
        }
        return from(arg, encodingOrOffset, length);
      }
      function from(value, encodingOrOffset, length) {
        if ("string" == typeof value) return function(string, encoding) {
          "string" == typeof encoding && "" !== encoding || (encoding = "utf8");
          if (!Buffer.isEncoding(encoding)) throw new TypeError("Unknown encoding: " + encoding);
          var length = 0 | byteLength(string, encoding), buf = createBuffer(length), actual = buf.write(string, encoding);
          actual !== length && (buf = buf.slice(0, actual));
          return buf;
        }(value, encodingOrOffset);
        if (ArrayBuffer.isView(value)) return fromArrayLike(value);
        if (null == value) throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
        if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) return fromArrayBuffer(value, encodingOrOffset, length);
        if ("undefined" != typeof SharedArrayBuffer && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) return fromArrayBuffer(value, encodingOrOffset, length);
        if ("number" == typeof value) throw new TypeError('The "value" argument must not be of type number. Received type number');
        var valueOf = value.valueOf && value.valueOf();
        if (null != valueOf && valueOf !== value) return Buffer.from(valueOf, encodingOrOffset, length);
        var b = function(obj) {
          if (Buffer.isBuffer(obj)) {
            var len = 0 | checked(obj.length), buf = createBuffer(len);
            return 0 === buf.length || obj.copy(buf, 0, 0, len), buf;
          }
          if (void 0 !== obj.length) return "number" != typeof obj.length || numberIsNaN(obj.length) ? createBuffer(0) : fromArrayLike(obj);
          if ("Buffer" === obj.type && Array.isArray(obj.data)) return fromArrayLike(obj.data);
        }(value);
        if (b) return b;
        if ("undefined" != typeof Symbol && null != Symbol.toPrimitive && "function" == typeof value[Symbol.toPrimitive]) return Buffer.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
        throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
      }
      function assertSize(size) {
        if ("number" != typeof size) throw new TypeError('"size" argument must be of type number');
        if (size < 0) throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
      function allocUnsafe(size) {
        return assertSize(size), createBuffer(size < 0 ? 0 : 0 | checked(size));
      }
      function fromArrayLike(array) {
        for (var length = array.length < 0 ? 0 : 0 | checked(array.length), buf = createBuffer(length), i = 0; i < length; i += 1) buf[i] = 255 & array[i];
        return buf;
      }
      function fromArrayBuffer(array, byteOffset, length) {
        if (byteOffset < 0 || array.byteLength < byteOffset) throw new RangeError('"offset" is outside of buffer bounds');
        if (array.byteLength < byteOffset + (length || 0)) throw new RangeError('"length" is outside of buffer bounds');
        var buf;
        return buf = void 0 === byteOffset && void 0 === length ? new Uint8Array(array) : void 0 === length ? new Uint8Array(array, byteOffset) : new Uint8Array(array, byteOffset, length), 
        Object.setPrototypeOf(buf, Buffer.prototype), buf;
      }
      function checked(length) {
        if (length >= K_MAX_LENGTH) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
        return 0 | length;
      }
      function byteLength(string, encoding) {
        if (Buffer.isBuffer(string)) return string.length;
        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) return string.byteLength;
        if ("string" != typeof string) throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string);
        var len = string.length, mustMatch = arguments.length > 2 && !0 === arguments[2];
        if (!mustMatch && 0 === len) return 0;
        for (var loweredCase = !1; ;) switch (encoding) {
         case "ascii":
         case "latin1":
         case "binary":
          return len;

         case "utf8":
         case "utf-8":
          return utf8ToBytes(string).length;

         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
          return 2 * len;

         case "hex":
          return len >>> 1;

         case "base64":
          return base64ToBytes(string).length;

         default:
          if (loweredCase) return mustMatch ? -1 : utf8ToBytes(string).length;
          encoding = ("" + encoding).toLowerCase(), loweredCase = !0;
        }
      }
      function slowToString(encoding, start, end) {
        var loweredCase = !1;
        if ((void 0 === start || start < 0) && (start = 0), start > this.length) return "";
        if ((void 0 === end || end > this.length) && (end = this.length), end <= 0) return "";
        if ((end >>>= 0) <= (start >>>= 0)) return "";
        for (encoding || (encoding = "utf8"); ;) switch (encoding) {
         case "hex":
          return hexSlice(this, start, end);

         case "utf8":
         case "utf-8":
          return utf8Slice(this, start, end);

         case "ascii":
          return asciiSlice(this, start, end);

         case "latin1":
         case "binary":
          return latin1Slice(this, start, end);

         case "base64":
          return base64Slice(this, start, end);

         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
          return utf16leSlice(this, start, end);

         default:
          if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
          encoding = (encoding + "").toLowerCase(), loweredCase = !0;
        }
      }
      function swap(b, n, m) {
        var i = b[n];
        b[n] = b[m], b[m] = i;
      }
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        if (0 === buffer.length) return -1;
        if ("string" == typeof byteOffset ? (encoding = byteOffset, byteOffset = 0) : byteOffset > 2147483647 ? byteOffset = 2147483647 : byteOffset < -2147483648 && (byteOffset = -2147483648), 
        numberIsNaN(byteOffset = +byteOffset) && (byteOffset = dir ? 0 : buffer.length - 1), 
        byteOffset < 0 && (byteOffset = buffer.length + byteOffset), byteOffset >= buffer.length) {
          if (dir) return -1;
          byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
          if (!dir) return -1;
          byteOffset = 0;
        }
        if ("string" == typeof val && (val = Buffer.from(val, encoding)), Buffer.isBuffer(val)) return 0 === val.length ? -1 : arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        if ("number" == typeof val) return val &= 255, "function" == typeof Uint8Array.prototype.indexOf ? dir ? Uint8Array.prototype.indexOf.call(buffer, val, byteOffset) : Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset) : arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir);
        throw new TypeError("val must be string, number or Buffer");
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        var i, indexSize = 1, arrLength = arr.length, valLength = val.length;
        if (void 0 !== encoding && ("ucs2" === (encoding = String(encoding).toLowerCase()) || "ucs-2" === encoding || "utf16le" === encoding || "utf-16le" === encoding)) {
          if (arr.length < 2 || val.length < 2) return -1;
          indexSize = 2, arrLength /= 2, valLength /= 2, byteOffset /= 2;
        }
        function read(buf, i) {
          return 1 === indexSize ? buf[i] : buf.readUInt16BE(i * indexSize);
        }
        if (dir) {
          var foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) if (read(arr, i) === read(val, -1 === foundIndex ? 0 : i - foundIndex)) {
            if (-1 === foundIndex && (foundIndex = i), i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else -1 !== foundIndex && (i -= i - foundIndex), foundIndex = -1;
        } else for (byteOffset + valLength > arrLength && (byteOffset = arrLength - valLength), 
        i = byteOffset; i >= 0; i--) {
          for (var found = !0, j = 0; j < valLength; j++) if (read(arr, i + j) !== read(val, j)) {
            found = !1;
            break;
          }
          if (found) return i;
        }
        return -1;
      }
      function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        var remaining = buf.length - offset;
        length ? (length = Number(length)) > remaining && (length = remaining) : length = remaining;
        var strLen = string.length;
        length > strLen / 2 && (length = strLen / 2);
        for (var i = 0; i < length; ++i) {
          var parsed = parseInt(string.substr(2 * i, 2), 16);
          if (numberIsNaN(parsed)) return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
      }
      function asciiWrite(buf, string, offset, length) {
        return blitBuffer(function(str) {
          for (var byteArray = [], i = 0; i < str.length; ++i) byteArray.push(255 & str.charCodeAt(i));
          return byteArray;
        }(string), buf, offset, length);
      }
      function latin1Write(buf, string, offset, length) {
        return asciiWrite(buf, string, offset, length);
      }
      function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
      }
      function ucs2Write(buf, string, offset, length) {
        return blitBuffer(function(str, units) {
          for (var c, hi, lo, byteArray = [], i = 0; i < str.length && !((units -= 2) < 0); ++i) hi = (c = str.charCodeAt(i)) >> 8, 
          lo = c % 256, byteArray.push(lo), byteArray.push(hi);
          return byteArray;
        }(string, buf.length - offset), buf, offset, length);
      }
      function base64Slice(buf, start, end) {
        return 0 === start && end === buf.length ? base64.fromByteArray(buf) : base64.fromByteArray(buf.slice(start, end));
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        for (var res = [], i = start; i < end; ) {
          var secondByte, thirdByte, fourthByte, tempCodePoint, firstByte = buf[i], codePoint = null, bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
          if (i + bytesPerSequence <= end) switch (bytesPerSequence) {
           case 1:
            firstByte < 128 && (codePoint = firstByte);
            break;

           case 2:
            128 == (192 & (secondByte = buf[i + 1])) && (tempCodePoint = (31 & firstByte) << 6 | 63 & secondByte) > 127 && (codePoint = tempCodePoint);
            break;

           case 3:
            secondByte = buf[i + 1], thirdByte = buf[i + 2], 128 == (192 & secondByte) && 128 == (192 & thirdByte) && (tempCodePoint = (15 & firstByte) << 12 | (63 & secondByte) << 6 | 63 & thirdByte) > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343) && (codePoint = tempCodePoint);
            break;

           case 4:
            secondByte = buf[i + 1], thirdByte = buf[i + 2], fourthByte = buf[i + 3], 128 == (192 & secondByte) && 128 == (192 & thirdByte) && 128 == (192 & fourthByte) && (tempCodePoint = (15 & firstByte) << 18 | (63 & secondByte) << 12 | (63 & thirdByte) << 6 | 63 & fourthByte) > 65535 && tempCodePoint < 1114112 && (codePoint = tempCodePoint);
          }
          null === codePoint ? (codePoint = 65533, bytesPerSequence = 1) : codePoint > 65535 && (codePoint -= 65536, 
          res.push(codePoint >>> 10 & 1023 | 55296), codePoint = 56320 | 1023 & codePoint), 
          res.push(codePoint), i += bytesPerSequence;
        }
        return function(codePoints) {
          var len = codePoints.length;
          if (len <= MAX_ARGUMENTS_LENGTH) return String.fromCharCode.apply(String, codePoints);
          var res = "", i = 0;
          for (;i < len; ) res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
          return res;
        }(res);
      }
      Buffer.TYPED_ARRAY_SUPPORT = function() {
        try {
          var arr = new Uint8Array(1), proto = {
            foo: function() {
              return 42;
            }
          };
          return Object.setPrototypeOf(proto, Uint8Array.prototype), Object.setPrototypeOf(arr, proto), 
          42 === arr.foo();
        } catch (e) {
          return !1;
        }
      }(), Buffer.TYPED_ARRAY_SUPPORT || "undefined" == typeof console || "function" != typeof console.error || console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."), 
      Object.defineProperty(Buffer.prototype, "parent", {
        enumerable: !0,
        get: function() {
          if (Buffer.isBuffer(this)) return this.buffer;
        }
      }), Object.defineProperty(Buffer.prototype, "offset", {
        enumerable: !0,
        get: function() {
          if (Buffer.isBuffer(this)) return this.byteOffset;
        }
      }), Buffer.poolSize = 8192, Buffer.from = function(value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length);
      }, Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype), Object.setPrototypeOf(Buffer, Uint8Array), 
      Buffer.alloc = function(size, fill, encoding) {
        return function(size, fill, encoding) {
          return assertSize(size), size <= 0 ? createBuffer(size) : void 0 !== fill ? "string" == typeof encoding ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill) : createBuffer(size);
        }(size, fill, encoding);
      }, Buffer.allocUnsafe = function(size) {
        return allocUnsafe(size);
      }, Buffer.allocUnsafeSlow = function(size) {
        return allocUnsafe(size);
      }, Buffer.isBuffer = function(b) {
        return null != b && !0 === b._isBuffer && b !== Buffer.prototype;
      }, Buffer.compare = function(a, b) {
        if (isInstance(a, Uint8Array) && (a = Buffer.from(a, a.offset, a.byteLength)), isInstance(b, Uint8Array) && (b = Buffer.from(b, b.offset, b.byteLength)), 
        !Buffer.isBuffer(a) || !Buffer.isBuffer(b)) throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
        if (a === b) return 0;
        for (var x = a.length, y = b.length, i = 0, len = Math.min(x, y); i < len; ++i) if (a[i] !== b[i]) {
          x = a[i], y = b[i];
          break;
        }
        return x < y ? -1 : y < x ? 1 : 0;
      }, Buffer.isEncoding = function(encoding) {
        switch (String(encoding).toLowerCase()) {
         case "hex":
         case "utf8":
         case "utf-8":
         case "ascii":
         case "latin1":
         case "binary":
         case "base64":
         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
          return !0;

         default:
          return !1;
        }
      }, Buffer.concat = function(list, length) {
        if (!Array.isArray(list)) throw new TypeError('"list" argument must be an Array of Buffers');
        if (0 === list.length) return Buffer.alloc(0);
        var i;
        if (void 0 === length) for (length = 0, i = 0; i < list.length; ++i) length += list[i].length;
        var buffer = Buffer.allocUnsafe(length), pos = 0;
        for (i = 0; i < list.length; ++i) {
          var buf = list[i];
          if (isInstance(buf, Uint8Array) && (buf = Buffer.from(buf)), !Buffer.isBuffer(buf)) throw new TypeError('"list" argument must be an Array of Buffers');
          buf.copy(buffer, pos), pos += buf.length;
        }
        return buffer;
      }, Buffer.byteLength = byteLength, Buffer.prototype._isBuffer = !0, Buffer.prototype.swap16 = function() {
        var len = this.length;
        if (len % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
        for (var i = 0; i < len; i += 2) swap(this, i, i + 1);
        return this;
      }, Buffer.prototype.swap32 = function() {
        var len = this.length;
        if (len % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
        for (var i = 0; i < len; i += 4) swap(this, i, i + 3), swap(this, i + 1, i + 2);
        return this;
      }, Buffer.prototype.swap64 = function() {
        var len = this.length;
        if (len % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
        for (var i = 0; i < len; i += 8) swap(this, i, i + 7), swap(this, i + 1, i + 6), 
        swap(this, i + 2, i + 5), swap(this, i + 3, i + 4);
        return this;
      }, Buffer.prototype.toString = function() {
        var length = this.length;
        return 0 === length ? "" : 0 === arguments.length ? utf8Slice(this, 0, length) : slowToString.apply(this, arguments);
      }, Buffer.prototype.toLocaleString = Buffer.prototype.toString, Buffer.prototype.equals = function(b) {
        if (!Buffer.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        return this === b || 0 === Buffer.compare(this, b);
      }, Buffer.prototype.inspect = function() {
        var str = "", max = exports.IS;
        return str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim(), this.length > max && (str += " ... "), 
        "<Buffer " + str + ">";
      }, customInspectSymbol && (Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect), 
      Buffer.prototype.compare = function(target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array) && (target = Buffer.from(target, target.offset, target.byteLength)), 
        !Buffer.isBuffer(target)) throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target);
        if (void 0 === start && (start = 0), void 0 === end && (end = target ? target.length : 0), 
        void 0 === thisStart && (thisStart = 0), void 0 === thisEnd && (thisEnd = this.length), 
        start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) throw new RangeError("out of range index");
        if (thisStart >= thisEnd && start >= end) return 0;
        if (thisStart >= thisEnd) return -1;
        if (start >= end) return 1;
        if (this === target) return 0;
        for (var x = (thisEnd >>>= 0) - (thisStart >>>= 0), y = (end >>>= 0) - (start >>>= 0), len = Math.min(x, y), thisCopy = this.slice(thisStart, thisEnd), targetCopy = target.slice(start, end), i = 0; i < len; ++i) if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i], y = targetCopy[i];
          break;
        }
        return x < y ? -1 : y < x ? 1 : 0;
      }, Buffer.prototype.includes = function(val, byteOffset, encoding) {
        return -1 !== this.indexOf(val, byteOffset, encoding);
      }, Buffer.prototype.indexOf = function(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, !0);
      }, Buffer.prototype.lastIndexOf = function(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, !1);
      }, Buffer.prototype.write = function(string, offset, length, encoding) {
        if (void 0 === offset) encoding = "utf8", length = this.length, offset = 0; else if (void 0 === length && "string" == typeof offset) encoding = offset, 
        length = this.length, offset = 0; else {
          if (!isFinite(offset)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
          offset >>>= 0, isFinite(length) ? (length >>>= 0, void 0 === encoding && (encoding = "utf8")) : (encoding = length, 
          length = void 0);
        }
        var remaining = this.length - offset;
        if ((void 0 === length || length > remaining) && (length = remaining), string.length > 0 && (length < 0 || offset < 0) || offset > this.length) throw new RangeError("Attempt to write outside buffer bounds");
        encoding || (encoding = "utf8");
        for (var loweredCase = !1; ;) switch (encoding) {
         case "hex":
          return hexWrite(this, string, offset, length);

         case "utf8":
         case "utf-8":
          return utf8Write(this, string, offset, length);

         case "ascii":
          return asciiWrite(this, string, offset, length);

         case "latin1":
         case "binary":
          return latin1Write(this, string, offset, length);

         case "base64":
          return base64Write(this, string, offset, length);

         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
          return ucs2Write(this, string, offset, length);

         default:
          if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
          encoding = ("" + encoding).toLowerCase(), loweredCase = !0;
        }
      }, Buffer.prototype.toJSON = function() {
        return {
          type: "Buffer",
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      var MAX_ARGUMENTS_LENGTH = 4096;
      function asciiSlice(buf, start, end) {
        var ret = "";
        end = Math.min(buf.length, end);
        for (var i = start; i < end; ++i) ret += String.fromCharCode(127 & buf[i]);
        return ret;
      }
      function latin1Slice(buf, start, end) {
        var ret = "";
        end = Math.min(buf.length, end);
        for (var i = start; i < end; ++i) ret += String.fromCharCode(buf[i]);
        return ret;
      }
      function hexSlice(buf, start, end) {
        var len = buf.length;
        (!start || start < 0) && (start = 0), (!end || end < 0 || end > len) && (end = len);
        for (var out = "", i = start; i < end; ++i) out += hexSliceLookupTable[buf[i]];
        return out;
      }
      function utf16leSlice(buf, start, end) {
        for (var bytes = buf.slice(start, end), res = "", i = 0; i < bytes.length; i += 2) res += String.fromCharCode(bytes[i] + 256 * bytes[i + 1]);
        return res;
      }
      function checkOffset(offset, ext, length) {
        if (offset % 1 != 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
      }
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
      }
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkIEEE754(buf, 0, offset, 4), 
        ieee754.write(buf, value, offset, littleEndian, 23, 4), offset + 4;
      }
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkIEEE754(buf, 0, offset, 8), 
        ieee754.write(buf, value, offset, littleEndian, 52, 8), offset + 8;
      }
      Buffer.prototype.slice = function(start, end) {
        var len = this.length;
        (start = ~~start) < 0 ? (start += len) < 0 && (start = 0) : start > len && (start = len), 
        (end = void 0 === end ? len : ~~end) < 0 ? (end += len) < 0 && (end = 0) : end > len && (end = len), 
        end < start && (end = start);
        var newBuf = this.subarray(start, end);
        return Object.setPrototypeOf(newBuf, Buffer.prototype), newBuf;
      }, Buffer.prototype.readUIntLE = function(offset, byteLength, noAssert) {
        offset >>>= 0, byteLength >>>= 0, noAssert || checkOffset(offset, byteLength, this.length);
        for (var val = this[offset], mul = 1, i = 0; ++i < byteLength && (mul *= 256); ) val += this[offset + i] * mul;
        return val;
      }, Buffer.prototype.readUIntBE = function(offset, byteLength, noAssert) {
        offset >>>= 0, byteLength >>>= 0, noAssert || checkOffset(offset, byteLength, this.length);
        for (var val = this[offset + --byteLength], mul = 1; byteLength > 0 && (mul *= 256); ) val += this[offset + --byteLength] * mul;
        return val;
      }, Buffer.prototype.readUInt8 = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 1, this.length), this[offset];
      }, Buffer.prototype.readUInt16LE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 2, this.length), this[offset] | this[offset + 1] << 8;
      }, Buffer.prototype.readUInt16BE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 2, this.length), this[offset] << 8 | this[offset + 1];
      }, Buffer.prototype.readUInt32LE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 4, this.length), (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + 16777216 * this[offset + 3];
      }, Buffer.prototype.readUInt32BE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 4, this.length), 16777216 * this[offset] + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      }, Buffer.prototype.readIntLE = function(offset, byteLength, noAssert) {
        offset >>>= 0, byteLength >>>= 0, noAssert || checkOffset(offset, byteLength, this.length);
        for (var val = this[offset], mul = 1, i = 0; ++i < byteLength && (mul *= 256); ) val += this[offset + i] * mul;
        return val >= (mul *= 128) && (val -= Math.pow(2, 8 * byteLength)), val;
      }, Buffer.prototype.readIntBE = function(offset, byteLength, noAssert) {
        offset >>>= 0, byteLength >>>= 0, noAssert || checkOffset(offset, byteLength, this.length);
        for (var i = byteLength, mul = 1, val = this[offset + --i]; i > 0 && (mul *= 256); ) val += this[offset + --i] * mul;
        return val >= (mul *= 128) && (val -= Math.pow(2, 8 * byteLength)), val;
      }, Buffer.prototype.readInt8 = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 1, this.length), 128 & this[offset] ? -1 * (255 - this[offset] + 1) : this[offset];
      }, Buffer.prototype.readInt16LE = function(offset, noAssert) {
        offset >>>= 0, noAssert || checkOffset(offset, 2, this.length);
        var val = this[offset] | this[offset + 1] << 8;
        return 32768 & val ? 4294901760 | val : val;
      }, Buffer.prototype.readInt16BE = function(offset, noAssert) {
        offset >>>= 0, noAssert || checkOffset(offset, 2, this.length);
        var val = this[offset + 1] | this[offset] << 8;
        return 32768 & val ? 4294901760 | val : val;
      }, Buffer.prototype.readInt32LE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 4, this.length), this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
      }, Buffer.prototype.readInt32BE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 4, this.length), this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      }, Buffer.prototype.readFloatLE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 4, this.length), ieee754.read(this, offset, !0, 23, 4);
      }, Buffer.prototype.readFloatBE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 4, this.length), ieee754.read(this, offset, !1, 23, 4);
      }, Buffer.prototype.readDoubleLE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 8, this.length), ieee754.read(this, offset, !0, 52, 8);
      }, Buffer.prototype.readDoubleBE = function(offset, noAssert) {
        return offset >>>= 0, noAssert || checkOffset(offset, 8, this.length), ieee754.read(this, offset, !1, 52, 8);
      }, Buffer.prototype.writeUIntLE = function(value, offset, byteLength, noAssert) {
        (value = +value, offset >>>= 0, byteLength >>>= 0, noAssert) || checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength) - 1, 0);
        var mul = 1, i = 0;
        for (this[offset] = 255 & value; ++i < byteLength && (mul *= 256); ) this[offset + i] = value / mul & 255;
        return offset + byteLength;
      }, Buffer.prototype.writeUIntBE = function(value, offset, byteLength, noAssert) {
        (value = +value, offset >>>= 0, byteLength >>>= 0, noAssert) || checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength) - 1, 0);
        var i = byteLength - 1, mul = 1;
        for (this[offset + i] = 255 & value; --i >= 0 && (mul *= 256); ) this[offset + i] = value / mul & 255;
        return offset + byteLength;
      }, Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 1, 255, 0), 
        this[offset] = 255 & value, offset + 1;
      }, Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 2, 65535, 0), 
        this[offset] = 255 & value, this[offset + 1] = value >>> 8, offset + 2;
      }, Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 2, 65535, 0), 
        this[offset] = value >>> 8, this[offset + 1] = 255 & value, offset + 2;
      }, Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 4, 4294967295, 0), 
        this[offset + 3] = value >>> 24, this[offset + 2] = value >>> 16, this[offset + 1] = value >>> 8, 
        this[offset] = 255 & value, offset + 4;
      }, Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 4, 4294967295, 0), 
        this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, 
        this[offset + 3] = 255 & value, offset + 4;
      }, Buffer.prototype.writeIntLE = function(value, offset, byteLength, noAssert) {
        if (value = +value, offset >>>= 0, !noAssert) {
          var limit = Math.pow(2, 8 * byteLength - 1);
          checkInt(this, value, offset, byteLength, limit - 1, -limit);
        }
        var i = 0, mul = 1, sub = 0;
        for (this[offset] = 255 & value; ++i < byteLength && (mul *= 256); ) value < 0 && 0 === sub && 0 !== this[offset + i - 1] && (sub = 1), 
        this[offset + i] = (value / mul | 0) - sub & 255;
        return offset + byteLength;
      }, Buffer.prototype.writeIntBE = function(value, offset, byteLength, noAssert) {
        if (value = +value, offset >>>= 0, !noAssert) {
          var limit = Math.pow(2, 8 * byteLength - 1);
          checkInt(this, value, offset, byteLength, limit - 1, -limit);
        }
        var i = byteLength - 1, mul = 1, sub = 0;
        for (this[offset + i] = 255 & value; --i >= 0 && (mul *= 256); ) value < 0 && 0 === sub && 0 !== this[offset + i + 1] && (sub = 1), 
        this[offset + i] = (value / mul | 0) - sub & 255;
        return offset + byteLength;
      }, Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 1, 127, -128), 
        value < 0 && (value = 255 + value + 1), this[offset] = 255 & value, offset + 1;
      }, Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 2, 32767, -32768), 
        this[offset] = 255 & value, this[offset + 1] = value >>> 8, offset + 2;
      }, Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 2, 32767, -32768), 
        this[offset] = value >>> 8, this[offset + 1] = 255 & value, offset + 2;
      }, Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 4, 2147483647, -2147483648), 
        this[offset] = 255 & value, this[offset + 1] = value >>> 8, this[offset + 2] = value >>> 16, 
        this[offset + 3] = value >>> 24, offset + 4;
      }, Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
        return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 4, 2147483647, -2147483648), 
        value < 0 && (value = 4294967295 + value + 1), this[offset] = value >>> 24, this[offset + 1] = value >>> 16, 
        this[offset + 2] = value >>> 8, this[offset + 3] = 255 & value, offset + 4;
      }, Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
        return writeFloat(this, value, offset, !0, noAssert);
      }, Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
        return writeFloat(this, value, offset, !1, noAssert);
      }, Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
        return writeDouble(this, value, offset, !0, noAssert);
      }, Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
        return writeDouble(this, value, offset, !1, noAssert);
      }, Buffer.prototype.copy = function(target, targetStart, start, end) {
        if (!Buffer.isBuffer(target)) throw new TypeError("argument should be a Buffer");
        if (start || (start = 0), end || 0 === end || (end = this.length), targetStart >= target.length && (targetStart = target.length), 
        targetStart || (targetStart = 0), end > 0 && end < start && (end = start), end === start) return 0;
        if (0 === target.length || 0 === this.length) return 0;
        if (targetStart < 0) throw new RangeError("targetStart out of bounds");
        if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");
        end > this.length && (end = this.length), target.length - targetStart < end - start && (end = target.length - targetStart + start);
        var len = end - start;
        if (this === target && "function" == typeof Uint8Array.prototype.copyWithin) this.copyWithin(targetStart, start, end); else if (this === target && start < targetStart && targetStart < end) for (var i = len - 1; i >= 0; --i) target[i + targetStart] = this[i + start]; else Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
        return len;
      }, Buffer.prototype.fill = function(val, start, end, encoding) {
        if ("string" == typeof val) {
          if ("string" == typeof start ? (encoding = start, start = 0, end = this.length) : "string" == typeof end && (encoding = end, 
          end = this.length), void 0 !== encoding && "string" != typeof encoding) throw new TypeError("encoding must be a string");
          if ("string" == typeof encoding && !Buffer.isEncoding(encoding)) throw new TypeError("Unknown encoding: " + encoding);
          if (1 === val.length) {
            var code = val.charCodeAt(0);
            ("utf8" === encoding && code < 128 || "latin1" === encoding) && (val = code);
          }
        } else "number" == typeof val ? val &= 255 : "boolean" == typeof val && (val = Number(val));
        if (start < 0 || this.length < start || this.length < end) throw new RangeError("Out of range index");
        if (end <= start) return this;
        var i;
        if (start >>>= 0, end = void 0 === end ? this.length : end >>> 0, val || (val = 0), 
        "number" == typeof val) for (i = start; i < end; ++i) this[i] = val; else {
          var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding), len = bytes.length;
          if (0 === len) throw new TypeError('The value "' + val + '" is invalid for argument "value"');
          for (i = 0; i < end - start; ++i) this[i + start] = bytes[i % len];
        }
        return this;
      };
      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
      function utf8ToBytes(string, units) {
        var codePoint;
        units = units || 1 / 0;
        for (var length = string.length, leadSurrogate = null, bytes = [], i = 0; i < length; ++i) {
          if ((codePoint = string.charCodeAt(i)) > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
              if (codePoint > 56319) {
                (units -= 3) > -1 && bytes.push(239, 191, 189);
                continue;
              }
              if (i + 1 === length) {
                (units -= 3) > -1 && bytes.push(239, 191, 189);
                continue;
              }
              leadSurrogate = codePoint;
              continue;
            }
            if (codePoint < 56320) {
              (units -= 3) > -1 && bytes.push(239, 191, 189), leadSurrogate = codePoint;
              continue;
            }
            codePoint = 65536 + (leadSurrogate - 55296 << 10 | codePoint - 56320);
          } else leadSurrogate && (units -= 3) > -1 && bytes.push(239, 191, 189);
          if (leadSurrogate = null, codePoint < 128) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
          } else if (codePoint < 2048) {
            if ((units -= 2) < 0) break;
            bytes.push(codePoint >> 6 | 192, 63 & codePoint | 128);
          } else if (codePoint < 65536) {
            if ((units -= 3) < 0) break;
            bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, 63 & codePoint | 128);
          } else {
            if (!(codePoint < 1114112)) throw new Error("Invalid code point");
            if ((units -= 4) < 0) break;
            bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, 63 & codePoint | 128);
          }
        }
        return bytes;
      }
      function base64ToBytes(str) {
        return base64.toByteArray(function(str) {
          if ((str = (str = str.split("=")[0]).trim().replace(INVALID_BASE64_RE, "")).length < 2) return "";
          for (;str.length % 4 != 0; ) str += "=";
          return str;
        }(str));
      }
      function blitBuffer(src, dst, offset, length) {
        for (var i = 0; i < length && !(i + offset >= dst.length || i >= src.length); ++i) dst[i + offset] = src[i];
        return i;
      }
      function isInstance(obj, type) {
        return obj instanceof type || null != obj && null != obj.constructor && null != obj.constructor.name && obj.constructor.name === type.name;
      }
      function numberIsNaN(obj) {
        return obj != obj;
      }
      var hexSliceLookupTable = function() {
        for (var table = new Array(256), i = 0; i < 16; ++i) for (var i16 = 16 * i, j = 0; j < 16; ++j) table[i16 + j] = "0123456789abcdef"[i] + "0123456789abcdef"[j];
        return table;
      }();
    },
    251: (__unused_webpack_module, exports) => {
      exports.read = function(buffer, offset, isLE, mLen, nBytes) {
        var e, m, eLen = 8 * nBytes - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, nBits = -7, i = isLE ? nBytes - 1 : 0, d = isLE ? -1 : 1, s = buffer[offset + i];
        for (i += d, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen; nBits > 0; e = 256 * e + buffer[offset + i], 
        i += d, nBits -= 8) ;
        for (m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen; nBits > 0; m = 256 * m + buffer[offset + i], 
        i += d, nBits -= 8) ;
        if (0 === e) e = 1 - eBias; else {
          if (e === eMax) return m ? NaN : 1 / 0 * (s ? -1 : 1);
          m += Math.pow(2, mLen), e -= eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      }, exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c, eLen = 8 * nBytes - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, rt = 23 === mLen ? Math.pow(2, -24) - Math.pow(2, -77) : 0, i = isLE ? 0 : nBytes - 1, d = isLE ? 1 : -1, s = value < 0 || 0 === value && 1 / value < 0 ? 1 : 0;
        for (value = Math.abs(value), isNaN(value) || value === 1 / 0 ? (m = isNaN(value) ? 1 : 0, 
        e = eMax) : (e = Math.floor(Math.log(value) / Math.LN2), value * (c = Math.pow(2, -e)) < 1 && (e--, 
        c *= 2), (value += e + eBias >= 1 ? rt / c : rt * Math.pow(2, 1 - eBias)) * c >= 2 && (e++, 
        c /= 2), e + eBias >= eMax ? (m = 0, e = eMax) : e + eBias >= 1 ? (m = (value * c - 1) * Math.pow(2, mLen), 
        e += eBias) : (m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen), e = 0)); mLen >= 8; buffer[offset + i] = 255 & m, 
        i += d, m /= 256, mLen -= 8) ;
        for (e = e << mLen | m, eLen += mLen; eLen > 0; buffer[offset + i] = 255 & e, i += d, 
        e /= 256, eLen -= 8) ;
        buffer[offset + i - d] |= 128 * s;
      };
    },
    6946: (module, __unused_webpack_exports, __webpack_require__) => {
      "use strict";
      module.exports = __webpack_require__(4394);
    },
    4394: (__unused_webpack_module, exports, __webpack_require__) => {
      "use strict";
      var protobuf = exports;
      function configure() {
        protobuf.util._configure(), protobuf.Writer._configure(protobuf.BufferWriter), protobuf.Reader._configure(protobuf.BufferReader);
      }
      protobuf.build = "minimal", protobuf.Writer = __webpack_require__(3449), protobuf.BufferWriter = __webpack_require__(818), 
      protobuf.Reader = __webpack_require__(6237), protobuf.BufferReader = __webpack_require__(3158), 
      protobuf.util = __webpack_require__(3610), protobuf.rpc = __webpack_require__(5047), 
      protobuf.roots = __webpack_require__(4529), protobuf.configure = configure, configure();
    },
    6237: (module, __unused_webpack_exports, __webpack_require__) => {
      "use strict";
      module.exports = Reader;
      var BufferReader, util = __webpack_require__(3610), LongBits = util.LongBits, utf8 = util.utf8;
      function indexOutOfRange(reader, writeLength) {
        return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
      }
      function Reader(buffer) {
        this.buf = buffer, this.pos = 0, this.len = buffer.length;
      }
      var value, create_array = "undefined" != typeof Uint8Array ? function(buffer) {
        if (buffer instanceof Uint8Array || Array.isArray(buffer)) return new Reader(buffer);
        throw Error("illegal buffer");
      } : function(buffer) {
        if (Array.isArray(buffer)) return new Reader(buffer);
        throw Error("illegal buffer");
      }, create = function() {
        return util.Buffer ? function(buffer) {
          return (Reader.create = function(buffer) {
            return util.Buffer.isBuffer(buffer) ? new BufferReader(buffer) : create_array(buffer);
          })(buffer);
        } : create_array;
      };
      function readLongVarint() {
        var bits = new LongBits(0, 0), i = 0;
        if (!(this.len - this.pos > 4)) {
          for (;i < 3; ++i) {
            if (this.pos >= this.len) throw indexOutOfRange(this);
            if (bits.lo = (bits.lo | (127 & this.buf[this.pos]) << 7 * i) >>> 0, this.buf[this.pos++] < 128) return bits;
          }
          return bits.lo = (bits.lo | (127 & this.buf[this.pos++]) << 7 * i) >>> 0, bits;
        }
        for (;i < 4; ++i) if (bits.lo = (bits.lo | (127 & this.buf[this.pos]) << 7 * i) >>> 0, 
        this.buf[this.pos++] < 128) return bits;
        if (bits.lo = (bits.lo | (127 & this.buf[this.pos]) << 28) >>> 0, bits.hi = (bits.hi | (127 & this.buf[this.pos]) >> 4) >>> 0, 
        this.buf[this.pos++] < 128) return bits;
        if (i = 0, this.len - this.pos > 4) {
          for (;i < 5; ++i) if (bits.hi = (bits.hi | (127 & this.buf[this.pos]) << 7 * i + 3) >>> 0, 
          this.buf[this.pos++] < 128) return bits;
        } else for (;i < 5; ++i) {
          if (this.pos >= this.len) throw indexOutOfRange(this);
          if (bits.hi = (bits.hi | (127 & this.buf[this.pos]) << 7 * i + 3) >>> 0, this.buf[this.pos++] < 128) return bits;
        }
        throw Error("invalid varint encoding");
      }
      function readFixed32_end(buf, end) {
        return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
      }
      function readFixed64() {
        if (this.pos + 8 > this.len) throw indexOutOfRange(this, 8);
        return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
      }
      Reader.create = create(), Reader.prototype._slice = util.Array.prototype.subarray || util.Array.prototype.slice, 
      Reader.prototype.uint32 = (value = 4294967295, function() {
        if (value = (127 & this.buf[this.pos]) >>> 0, this.buf[this.pos++] < 128) return value;
        if (value = (value | (127 & this.buf[this.pos]) << 7) >>> 0, this.buf[this.pos++] < 128) return value;
        if (value = (value | (127 & this.buf[this.pos]) << 14) >>> 0, this.buf[this.pos++] < 128) return value;
        if (value = (value | (127 & this.buf[this.pos]) << 21) >>> 0, this.buf[this.pos++] < 128) return value;
        if (value = (value | (15 & this.buf[this.pos]) << 28) >>> 0, this.buf[this.pos++] < 128) return value;
        if ((this.pos += 5) > this.len) throw this.pos = this.len, indexOutOfRange(this, 10);
        return value;
      }), Reader.prototype.int32 = function() {
        return 0 | this.uint32();
      }, Reader.prototype.sint32 = function() {
        var value = this.uint32();
        return value >>> 1 ^ -(1 & value);
      }, Reader.prototype.bool = function() {
        return 0 !== this.uint32();
      }, Reader.prototype.fixed32 = function() {
        if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
        return readFixed32_end(this.buf, this.pos += 4);
      }, Reader.prototype.sfixed32 = function() {
        if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
        return 0 | readFixed32_end(this.buf, this.pos += 4);
      }, Reader.prototype.float = function() {
        if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
        var value = util.float.readFloatLE(this.buf, this.pos);
        return this.pos += 4, value;
      }, Reader.prototype.double = function() {
        if (this.pos + 8 > this.len) throw indexOutOfRange(this, 4);
        var value = util.float.readDoubleLE(this.buf, this.pos);
        return this.pos += 8, value;
      }, Reader.prototype.bytes = function() {
        var length = this.uint32(), start = this.pos, end = this.pos + length;
        if (end > this.len) throw indexOutOfRange(this, length);
        if (this.pos += length, Array.isArray(this.buf)) return this.buf.slice(start, end);
        if (start === end) {
          var nativeBuffer = util.Buffer;
          return nativeBuffer ? nativeBuffer.alloc(0) : new this.buf.constructor(0);
        }
        return this._slice.call(this.buf, start, end);
      }, Reader.prototype.string = function() {
        var bytes = this.bytes();
        return utf8.read(bytes, 0, bytes.length);
      }, Reader.prototype.skip = function(length) {
        if ("number" == typeof length) {
          if (this.pos + length > this.len) throw indexOutOfRange(this, length);
          this.pos += length;
        } else do {
          if (this.pos >= this.len) throw indexOutOfRange(this);
        } while (128 & this.buf[this.pos++]);
        return this;
      }, Reader.prototype.skipType = function(wireType) {
        switch (wireType) {
         case 0:
          this.skip();
          break;

         case 1:
          this.skip(8);
          break;

         case 2:
          this.skip(this.uint32());
          break;

         case 3:
          for (;4 != (wireType = 7 & this.uint32()); ) this.skipType(wireType);
          break;

         case 5:
          this.skip(4);
          break;

         default:
          throw Error("invalid wire type " + wireType + " at offset " + this.pos);
        }
        return this;
      }, Reader._configure = function(BufferReader_) {
        BufferReader = BufferReader_, Reader.create = create(), BufferReader._configure();
        var fn = util.Long ? "toLong" : "toNumber";
        util.merge(Reader.prototype, {
          int64: function() {
            return readLongVarint.call(this)[fn](!1);
          },
          uint64: function() {
            return readLongVarint.call(this)[fn](!0);
          },
          sint64: function() {
            return readLongVarint.call(this).zzDecode()[fn](!1);
          },
          fixed64: function() {
            return readFixed64.call(this)[fn](!0);
          },
          sfixed64: function() {
            return readFixed64.call(this)[fn](!1);
          }
        });
      };
    },
    3158: (module, __unused_webpack_exports, __webpack_require__) => {
      "use strict";
      module.exports = BufferReader;
      var Reader = __webpack_require__(6237);
      (BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;
      var util = __webpack_require__(3610);
      function BufferReader(buffer) {
        Reader.call(this, buffer);
      }
      BufferReader._configure = function() {
        util.Buffer && (BufferReader.prototype._slice = util.Buffer.prototype.slice);
      }, BufferReader.prototype.string = function() {
        var len = this.uint32();
        return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + len, this.len));
      }, BufferReader._configure();
    },
    4529: module => {
      "use strict";
      module.exports = {};
    },
    5047: (__unused_webpack_module, exports, __webpack_require__) => {
      "use strict";
      exports.Service = __webpack_require__(7595);
    },
    7595: (module, __unused_webpack_exports, __webpack_require__) => {
      "use strict";
      module.exports = Service;
      var util = __webpack_require__(3610);
      function Service(rpcImpl, requestDelimited, responseDelimited) {
        if ("function" != typeof rpcImpl) throw TypeError("rpcImpl must be a function");
        util.EventEmitter.call(this), this.rpcImpl = rpcImpl, this.requestDelimited = Boolean(requestDelimited), 
        this.responseDelimited = Boolean(responseDelimited);
      }
      (Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service, 
      Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
        if (!request) throw TypeError("request must be specified");
        var self = this;
        if (!callback) return util.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);
        if (self.rpcImpl) try {
          return self.rpcImpl(method, requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(), (function(err, response) {
            if (err) return self.emit("error", err, method), callback(err);
            if (null !== response) {
              if (!(response instanceof responseCtor)) try {
                response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
              } catch (err) {
                return self.emit("error", err, method), callback(err);
              }
              return self.emit("data", response, method), callback(null, response);
            }
            self.end(!0);
          }));
        } catch (err) {
          return self.emit("error", err, method), void setTimeout((function() {
            callback(err);
          }), 0);
        } else setTimeout((function() {
          callback(Error("already ended"));
        }), 0);
      }, Service.prototype.end = function(endedByRPC) {
        return this.rpcImpl && (endedByRPC || this.rpcImpl(null, null, null), this.rpcImpl = null, 
        this.emit("end").off()), this;
      };
    },
    2239: (module, __unused_webpack_exports, __webpack_require__) => {
      "use strict";
      module.exports = LongBits;
      var util = __webpack_require__(3610);
      function LongBits(lo, hi) {
        this.lo = lo >>> 0, this.hi = hi >>> 0;
      }
      var zero = LongBits.zero = new LongBits(0, 0);
      zero.toNumber = function() {
        return 0;
      }, zero.zzEncode = zero.zzDecode = function() {
        return this;
      }, zero.length = function() {
        return 1;
      };
      var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";
      LongBits.fromNumber = function(value) {
        if (0 === value) return zero;
        var sign = value < 0;
        sign && (value = -value);
        var lo = value >>> 0, hi = (value - lo) / 4294967296 >>> 0;
        return sign && (hi = ~hi >>> 0, lo = ~lo >>> 0, ++lo > 4294967295 && (lo = 0, ++hi > 4294967295 && (hi = 0))), 
        new LongBits(lo, hi);
      }, LongBits.from = function(value) {
        if ("number" == typeof value) return LongBits.fromNumber(value);
        if (util.isString(value)) {
          if (!util.Long) return LongBits.fromNumber(parseInt(value, 10));
          value = util.Long.fromString(value);
        }
        return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
      }, LongBits.prototype.toNumber = function(unsigned) {
        if (!unsigned && this.hi >>> 31) {
          var lo = 1 + ~this.lo >>> 0, hi = ~this.hi >>> 0;
          return lo || (hi = hi + 1 >>> 0), -(lo + 4294967296 * hi);
        }
        return this.lo + 4294967296 * this.hi;
      }, LongBits.prototype.toLong = function(unsigned) {
        return util.Long ? new util.Long(0 | this.lo, 0 | this.hi, Boolean(unsigned)) : {
          low: 0 | this.lo,
          high: 0 | this.hi,
          unsigned: Boolean(unsigned)
        };
      };
      var charCodeAt = String.prototype.charCodeAt;
      LongBits.fromHash = function(hash) {
        return hash === zeroHash ? zero : new LongBits((charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0, (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0);
      }, LongBits.prototype.toHash = function() {
        return String.fromCharCode(255 & this.lo, this.lo >>> 8 & 255, this.lo >>> 16 & 255, this.lo >>> 24, 255 & this.hi, this.hi >>> 8 & 255, this.hi >>> 16 & 255, this.hi >>> 24);
      }, LongBits.prototype.zzEncode = function() {
        var mask = this.hi >> 31;
        return this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0, this.lo = (this.lo << 1 ^ mask) >>> 0, 
        this;
      }, LongBits.prototype.zzDecode = function() {
        var mask = -(1 & this.lo);
        return this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0, this.hi = (this.hi >>> 1 ^ mask) >>> 0, 
        this;
      }, LongBits.prototype.length = function() {
        var part0 = this.lo, part1 = (this.lo >>> 28 | this.hi << 4) >>> 0, part2 = this.hi >>> 24;
        return 0 === part2 ? 0 === part1 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
      };
    },
    3610: function(__unused_webpack_module, exports, __webpack_require__) {
      "use strict";
      var util = exports;
      function merge(dst, src, ifNotSet) {
        for (var keys = Object.keys(src), i = 0; i < keys.length; ++i) void 0 !== dst[keys[i]] && ifNotSet || (dst[keys[i]] = src[keys[i]]);
        return dst;
      }
      function newError(name) {
        function CustomError(message, properties) {
          if (!(this instanceof CustomError)) return new CustomError(message, properties);
          Object.defineProperty(this, "message", {
            get: function() {
              return message;
            }
          }), Error.captureStackTrace ? Error.captureStackTrace(this, CustomError) : Object.defineProperty(this, "stack", {
            value: (new Error).stack || ""
          }), properties && merge(this, properties);
        }
        return CustomError.prototype = Object.create(Error.prototype, {
          constructor: {
            value: CustomError,
            writable: !0,
            enumerable: !1,
            configurable: !0
          },
          name: {
            get: function() {
              return name;
            },
            set: void 0,
            enumerable: !1,
            configurable: !0
          },
          toString: {
            value: function() {
              return this.name + ": " + this.message;
            },
            writable: !0,
            enumerable: !1,
            configurable: !0
          }
        }), CustomError;
      }
      util.asPromise = __webpack_require__(8045), util.base64 = __webpack_require__(8839), 
      util.EventEmitter = __webpack_require__(4358), util.float = __webpack_require__(9410), 
      util.inquire = __webpack_require__(4153), util.utf8 = __webpack_require__(1447), 
      util.pool = __webpack_require__(9390), util.LongBits = __webpack_require__(2239), 
      util.isNode = Boolean(void 0 !== __webpack_require__.g && __webpack_require__.g && __webpack_require__.g.process && __webpack_require__.g.process.versions && __webpack_require__.g.process.versions.node), 
      util.global = util.isNode && __webpack_require__.g || "undefined" != typeof window && window || "undefined" != typeof self && self || this, 
      util.emptyArray = Object.freeze ? Object.freeze([]) : [], util.emptyObject = Object.freeze ? Object.freeze({}) : {}, 
      util.isInteger = Number.isInteger || function(value) {
        return "number" == typeof value && isFinite(value) && Math.floor(value) === value;
      }, util.isString = function(value) {
        return "string" == typeof value || value instanceof String;
      }, util.isObject = function(value) {
        return value && "object" == typeof value;
      }, util.isset = util.isSet = function(obj, prop) {
        var value = obj[prop];
        return !(null == value || !obj.hasOwnProperty(prop)) && ("object" != typeof value || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0);
      }, util.Buffer = function() {
        try {
          var Buffer = util.inquire("buffer").Buffer;
          return Buffer.prototype.utf8Write ? Buffer : null;
        } catch (e) {
          return null;
        }
      }(), util._Buffer_from = null, util._Buffer_allocUnsafe = null, util.newBuffer = function(sizeOrArray) {
        return "number" == typeof sizeOrArray ? util.Buffer ? util._Buffer_allocUnsafe(sizeOrArray) : new util.Array(sizeOrArray) : util.Buffer ? util._Buffer_from(sizeOrArray) : "undefined" == typeof Uint8Array ? sizeOrArray : new Uint8Array(sizeOrArray);
      }, util.Array = "undefined" != typeof Uint8Array ? Uint8Array : Array, util.Long = util.global.dcodeIO && util.global.dcodeIO.Long || util.global.Long || util.inquire("long"), 
      util.key2Re = /^true|false|0|1$/, util.key32Re = /^-?(?:0|[1-9][0-9]*)$/, util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/, 
      util.longToHash = function(value) {
        return value ? util.LongBits.from(value).toHash() : util.LongBits.zeroHash;
      }, util.longFromHash = function(hash, unsigned) {
        var bits = util.LongBits.fromHash(hash);
        return util.Long ? util.Long.fromBits(bits.lo, bits.hi, unsigned) : bits.toNumber(Boolean(unsigned));
      }, util.merge = merge, util.lcFirst = function(str) {
        return str.charAt(0).toLowerCase() + str.substring(1);
      }, util.newError = newError, util.ProtocolError = newError("ProtocolError"), util.oneOfGetter = function(fieldNames) {
        for (var fieldMap = {}, i = 0; i < fieldNames.length; ++i) fieldMap[fieldNames[i]] = 1;
        return function() {
          for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i) if (1 === fieldMap[keys[i]] && void 0 !== this[keys[i]] && null !== this[keys[i]]) return keys[i];
        };
      }, util.oneOfSetter = function(fieldNames) {
        return function(name) {
          for (var i = 0; i < fieldNames.length; ++i) fieldNames[i] !== name && delete this[fieldNames[i]];
        };
      }, util.toJSONOptions = {
        longs: String,
        enums: String,
        bytes: String,
        json: !0
      }, util._configure = function() {
        var Buffer = util.Buffer;
        Buffer ? (util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from || function(value, encoding) {
          return new Buffer(value, encoding);
        }, util._Buffer_allocUnsafe = Buffer.allocUnsafe || function(size) {
          return new Buffer(size);
        }) : util._Buffer_from = util._Buffer_allocUnsafe = null;
      };
    },
    3449: (module, __unused_webpack_exports, __webpack_require__) => {
      "use strict";
      module.exports = Writer;
      var BufferWriter, util = __webpack_require__(3610), LongBits = util.LongBits, base64 = util.base64, utf8 = util.utf8;
      function Op(fn, len, val) {
        this.fn = fn, this.len = len, this.next = void 0, this.val = val;
      }
      function noop() {}
      function State(writer) {
        this.head = writer.head, this.tail = writer.tail, this.len = writer.len, this.next = writer.states;
      }
      function Writer() {
        this.len = 0, this.head = new Op(noop, 0, 0), this.tail = this.head, this.states = null;
      }
      var create = function() {
        return util.Buffer ? function() {
          return (Writer.create = function() {
            return new BufferWriter;
          })();
        } : function() {
          return new Writer;
        };
      };
      function writeByte(val, buf, pos) {
        buf[pos] = 255 & val;
      }
      function VarintOp(len, val) {
        this.len = len, this.next = void 0, this.val = val;
      }
      function writeVarint64(val, buf, pos) {
        for (;val.hi; ) buf[pos++] = 127 & val.lo | 128, val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0, 
        val.hi >>>= 7;
        for (;val.lo > 127; ) buf[pos++] = 127 & val.lo | 128, val.lo = val.lo >>> 7;
        buf[pos++] = val.lo;
      }
      function writeFixed32(val, buf, pos) {
        buf[pos] = 255 & val, buf[pos + 1] = val >>> 8 & 255, buf[pos + 2] = val >>> 16 & 255, 
        buf[pos + 3] = val >>> 24;
      }
      Writer.create = create(), Writer.alloc = function(size) {
        return new util.Array(size);
      }, util.Array !== Array && (Writer.alloc = util.pool(Writer.alloc, util.Array.prototype.subarray)), 
      Writer.prototype._push = function(fn, len, val) {
        return this.tail = this.tail.next = new Op(fn, len, val), this.len += len, this;
      }, VarintOp.prototype = Object.create(Op.prototype), VarintOp.prototype.fn = function(val, buf, pos) {
        for (;val > 127; ) buf[pos++] = 127 & val | 128, val >>>= 7;
        buf[pos] = val;
      }, Writer.prototype.uint32 = function(value) {
        return this.len += (this.tail = this.tail.next = new VarintOp((value >>>= 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5, value)).len, 
        this;
      }, Writer.prototype.int32 = function(value) {
        return value < 0 ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) : this.uint32(value);
      }, Writer.prototype.sint32 = function(value) {
        return this.uint32((value << 1 ^ value >> 31) >>> 0);
      }, Writer.prototype.uint64 = function(value) {
        var bits = LongBits.from(value);
        return this._push(writeVarint64, bits.length(), bits);
      }, Writer.prototype.int64 = Writer.prototype.uint64, Writer.prototype.sint64 = function(value) {
        var bits = LongBits.from(value).zzEncode();
        return this._push(writeVarint64, bits.length(), bits);
      }, Writer.prototype.bool = function(value) {
        return this._push(writeByte, 1, value ? 1 : 0);
      }, Writer.prototype.fixed32 = function(value) {
        return this._push(writeFixed32, 4, value >>> 0);
      }, Writer.prototype.sfixed32 = Writer.prototype.fixed32, Writer.prototype.fixed64 = function(value) {
        var bits = LongBits.from(value);
        return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
      }, Writer.prototype.sfixed64 = Writer.prototype.fixed64, Writer.prototype.float = function(value) {
        return this._push(util.float.writeFloatLE, 4, value);
      }, Writer.prototype.double = function(value) {
        return this._push(util.float.writeDoubleLE, 8, value);
      };
      var writeBytes = util.Array.prototype.set ? function(val, buf, pos) {
        buf.set(val, pos);
      } : function(val, buf, pos) {
        for (var i = 0; i < val.length; ++i) buf[pos + i] = val[i];
      };
      Writer.prototype.bytes = function(value) {
        var len = value.length >>> 0;
        if (!len) return this._push(writeByte, 1, 0);
        if (util.isString(value)) {
          var buf = Writer.alloc(len = base64.length(value));
          base64.decode(value, buf, 0), value = buf;
        }
        return this.uint32(len)._push(writeBytes, len, value);
      }, Writer.prototype.string = function(value) {
        var len = utf8.length(value);
        return len ? this.uint32(len)._push(utf8.write, len, value) : this._push(writeByte, 1, 0);
      }, Writer.prototype.fork = function() {
        return this.states = new State(this), this.head = this.tail = new Op(noop, 0, 0), 
        this.len = 0, this;
      }, Writer.prototype.reset = function() {
        return this.states ? (this.head = this.states.head, this.tail = this.states.tail, 
        this.len = this.states.len, this.states = this.states.next) : (this.head = this.tail = new Op(noop, 0, 0), 
        this.len = 0), this;
      }, Writer.prototype.ldelim = function() {
        var head = this.head, tail = this.tail, len = this.len;
        return this.reset().uint32(len), len && (this.tail.next = head.next, this.tail = tail, 
        this.len += len), this;
      }, Writer.prototype.finish = function() {
        for (var head = this.head.next, buf = this.constructor.alloc(this.len), pos = 0; head; ) head.fn(head.val, buf, pos), 
        pos += head.len, head = head.next;
        return buf;
      }, Writer._configure = function(BufferWriter_) {
        BufferWriter = BufferWriter_, Writer.create = create(), BufferWriter._configure();
      };
    },
    818: (module, __unused_webpack_exports, __webpack_require__) => {
      "use strict";
      module.exports = BufferWriter;
      var Writer = __webpack_require__(3449);
      (BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;
      var util = __webpack_require__(3610);
      function BufferWriter() {
        Writer.call(this);
      }
      function writeStringBuffer(val, buf, pos) {
        val.length < 40 ? util.utf8.write(val, buf, pos) : buf.utf8Write ? buf.utf8Write(val, pos) : buf.write(val, pos);
      }
      BufferWriter._configure = function() {
        BufferWriter.alloc = util._Buffer_allocUnsafe, BufferWriter.writeBytesBuffer = util.Buffer && util.Buffer.prototype instanceof Uint8Array && "set" === util.Buffer.prototype.set.name ? function(val, buf, pos) {
          buf.set(val, pos);
        } : function(val, buf, pos) {
          if (val.copy) val.copy(buf, pos, 0, val.length); else for (var i = 0; i < val.length; ) buf[pos++] = val[i++];
        };
      }, BufferWriter.prototype.bytes = function(value) {
        util.isString(value) && (value = util._Buffer_from(value, "base64"));
        var len = value.length >>> 0;
        return this.uint32(len), len && this._push(BufferWriter.writeBytesBuffer, len, value), 
        this;
      }, BufferWriter.prototype.string = function(value) {
        var len = util.Buffer.byteLength(value);
        return this.uint32(len), len && this._push(writeStringBuffer, len, value), this;
      }, BufferWriter._configure();
    }
  }, __webpack_module_cache__ = {};
  function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module = __webpack_module_cache__[moduleId] = {
      exports: {}
    };
    return __webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__), 
    module.exports;
  }
  __webpack_require__.n = module => {
    var getter = module && module.__esModule ? () => module.default : () => module;
    return __webpack_require__.d(getter, {
      a: getter
    }), getter;
  }, __webpack_require__.d = (exports, definition) => {
    for (var key in definition) __webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key) && Object.defineProperty(exports, key, {
      enumerable: !0,
      get: definition[key]
    });
  }, __webpack_require__.g = function() {
    if ("object" == typeof globalThis) return globalThis;
    try {
      return this || new Function("return this")();
    } catch (e) {
      if ("object" == typeof window) return window;
    }
  }(), __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
  var __webpack_exports__ = {};
  (() => {
    "use strict";
    let cache = !0;
    function isCurrentPathname(path) {
      if (!path) return !1;
      try {
        const {pathname} = new URL(path, location.origin);
        return pathname === location.pathname;
      } catch {
        return !1;
      }
    }
    function getManifest(_version) {
      return globalThis.chrome?.runtime?.getManifest?.();
    }
    function once(function_) {
      let result;
      return () => (cache && void 0 !== result || (result = function_()), result);
    }
    const isWebPage = once((() => [ "about:", "http:", "https:" ].includes(location.protocol))), isExtensionContext = once((() => "string" == typeof globalThis.chrome?.runtime?.id)), isSandboxedPage = once((() => location.protocol.endsWith("-extension:") && !isExtensionContext())), isContentScript = once((() => isExtensionContext() && isWebPage())), isBackgroundPage = once((() => {
      const manifest = getManifest();
      return !!manifest && (!!isCurrentPathname(manifest.background_page ?? manifest.background?.page) || Boolean(manifest.background?.scripts && isCurrentPathname("/_generated_background_page.html")));
    })), isBackgroundWorker = once((() => isCurrentPathname(getManifest()?.background?.service_worker))), isOptionsPage = (once((() => isBackgroundPage() && 2 === getManifest()?.manifest_version && !1 !== getManifest()?.background?.persistent)), 
    once((() => isCurrentPathname(getManifest()?.options_ui?.page ?? getManifest()?.options_page)))), isSidePanel = once((() => isCurrentPathname(getManifest()?.side_panel?.default_path))), isActionPopup = once((() => globalThis.outerHeight - globalThis.innerHeight == 14 || isCurrentPathname(getManifest()?.action?.default_popup ?? getManifest()?.browser_action?.default_popup))), isDevToolsPage = once((() => isExtensionContext() && Boolean(chrome.devtools) && isCurrentPathname(getManifest()?.devtools_page))), isOffscreenDocument = once((() => isExtensionContext() && "document" in globalThis && void 0 === globalThis.chrome?.extension)), contextChecks = {
      contentScript: isContentScript,
      background: () => isBackgroundPage() || isBackgroundWorker(),
      options: isOptionsPage,
      sidePanel: isSidePanel,
      actionPopup: isActionPopup,
      devTools: () => Boolean(globalThis.chrome?.devtools),
      devToolsPage: isDevToolsPage,
      offscreenDocument: isOffscreenDocument,
      extension: isExtensionContext,
      sandbox: isSandboxedPage,
      web: isWebPage
    };
    Object.keys(contextChecks);
    const globals_isWebWorkerContext = () => "function" == typeof importScripts && !function() {
      for (const [name, test] of Object.entries(contextChecks)) if (test()) return name;
      return "unknown";
    }().includes("background"), abortController = (globals_isWebWorkerContext() ? self : window, 
    new AbortController), abort_controller_getSignal = () => abortController.signal;
    var util, objectUtil;
    !function(util) {
      util.assertEqual = val => val, util.assertIs = function(_arg) {}, util.assertNever = function(_x) {
        throw new Error;
      }, util.arrayToEnum = items => {
        const obj = {};
        for (const item of items) obj[item] = item;
        return obj;
      }, util.getValidEnumValues = obj => {
        const validKeys = util.objectKeys(obj).filter((k => "number" != typeof obj[obj[k]])), filtered = {};
        for (const k of validKeys) filtered[k] = obj[k];
        return util.objectValues(filtered);
      }, util.objectValues = obj => util.objectKeys(obj).map((function(e) {
        return obj[e];
      })), util.objectKeys = "function" == typeof Object.keys ? obj => Object.keys(obj) : object => {
        const keys = [];
        for (const key in object) Object.prototype.hasOwnProperty.call(object, key) && keys.push(key);
        return keys;
      }, util.find = (arr, checker) => {
        for (const item of arr) if (checker(item)) return item;
      }, util.isInteger = "function" == typeof Number.isInteger ? val => Number.isInteger(val) : val => "number" == typeof val && isFinite(val) && Math.floor(val) === val, 
      util.joinValues = function(array, separator = " | ") {
        return array.map((val => "string" == typeof val ? `'${val}'` : val)).join(separator);
      }, util.jsonStringifyReplacer = (_, value) => "bigint" == typeof value ? value.toString() : value;
    }(util || (util = {})), function(objectUtil) {
      objectUtil.mergeShapes = (first, second) => ({
        ...first,
        ...second
      });
    }(objectUtil || (objectUtil = {}));
    const ZodParsedType = util.arrayToEnum([ "string", "nan", "number", "integer", "float", "boolean", "date", "bigint", "symbol", "function", "undefined", "null", "array", "object", "unknown", "promise", "void", "never", "map", "set" ]), getParsedType = data => {
      switch (typeof data) {
       case "undefined":
        return ZodParsedType.undefined;

       case "string":
        return ZodParsedType.string;

       case "number":
        return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;

       case "boolean":
        return ZodParsedType.boolean;

       case "function":
        return ZodParsedType.function;

       case "bigint":
        return ZodParsedType.bigint;

       case "symbol":
        return ZodParsedType.symbol;

       case "object":
        return Array.isArray(data) ? ZodParsedType.array : null === data ? ZodParsedType.null : data.then && "function" == typeof data.then && data.catch && "function" == typeof data.catch ? ZodParsedType.promise : "undefined" != typeof Map && data instanceof Map ? ZodParsedType.map : "undefined" != typeof Set && data instanceof Set ? ZodParsedType.set : "undefined" != typeof Date && data instanceof Date ? ZodParsedType.date : ZodParsedType.object;

       default:
        return ZodParsedType.unknown;
      }
    }, ZodIssueCode = util.arrayToEnum([ "invalid_type", "invalid_literal", "custom", "invalid_union", "invalid_union_discriminator", "invalid_enum_value", "unrecognized_keys", "invalid_arguments", "invalid_return_type", "invalid_date", "invalid_string", "too_small", "too_big", "invalid_intersection_types", "not_multiple_of", "not_finite" ]);
    class ZodError extends Error {
      constructor(issues) {
        super(), this.issues = [], this.addIssue = sub => {
          this.issues = [ ...this.issues, sub ];
        }, this.addIssues = (subs = []) => {
          this.issues = [ ...this.issues, ...subs ];
        };
        const actualProto = new.target.prototype;
        Object.setPrototypeOf ? Object.setPrototypeOf(this, actualProto) : this.__proto__ = actualProto, 
        this.name = "ZodError", this.issues = issues;
      }
      get errors() {
        return this.issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        }, fieldErrors = {
          _errors: []
        }, processError = error => {
          for (const issue of error.issues) if ("invalid_union" === issue.code) issue.unionErrors.map(processError); else if ("invalid_return_type" === issue.code) processError(issue.returnTypeError); else if ("invalid_arguments" === issue.code) processError(issue.argumentsError); else if (0 === issue.path.length) fieldErrors._errors.push(mapper(issue)); else {
            let curr = fieldErrors, i = 0;
            for (;i < issue.path.length; ) {
              const el = issue.path[i];
              i === issue.path.length - 1 ? (curr[el] = curr[el] || {
                _errors: []
              }, curr[el]._errors.push(mapper(issue))) : curr[el] = curr[el] || {
                _errors: []
              }, curr = curr[el], i++;
            }
          }
        };
        return processError(this), fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return 0 === this.issues.length;
      }
      flatten(mapper = issue => issue.message) {
        const fieldErrors = {}, formErrors = [];
        for (const sub of this.issues) sub.path.length > 0 ? (fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [], 
        fieldErrors[sub.path[0]].push(mapper(sub))) : formErrors.push(mapper(sub));
        return {
          formErrors,
          fieldErrors
        };
      }
      get formErrors() {
        return this.flatten();
      }
    }
    ZodError.create = issues => new ZodError(issues);
    const errorMap = (issue, _ctx) => {
      let message;
      switch (issue.code) {
       case ZodIssueCode.invalid_type:
        message = issue.received === ZodParsedType.undefined ? "Required" : `Expected ${issue.expected}, received ${issue.received}`;
        break;

       case ZodIssueCode.invalid_literal:
        message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
        break;

       case ZodIssueCode.unrecognized_keys:
        message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
        break;

       case ZodIssueCode.invalid_union:
        message = "Invalid input";
        break;

       case ZodIssueCode.invalid_union_discriminator:
        message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
        break;

       case ZodIssueCode.invalid_enum_value:
        message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
        break;

       case ZodIssueCode.invalid_arguments:
        message = "Invalid function arguments";
        break;

       case ZodIssueCode.invalid_return_type:
        message = "Invalid function return type";
        break;

       case ZodIssueCode.invalid_date:
        message = "Invalid date";
        break;

       case ZodIssueCode.invalid_string:
        "object" == typeof issue.validation ? "includes" in issue.validation ? (message = `Invalid input: must include "${issue.validation.includes}"`, 
        "number" == typeof issue.validation.position && (message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`)) : "startsWith" in issue.validation ? message = `Invalid input: must start with "${issue.validation.startsWith}"` : "endsWith" in issue.validation ? message = `Invalid input: must end with "${issue.validation.endsWith}"` : util.assertNever(issue.validation) : message = "regex" !== issue.validation ? `Invalid ${issue.validation}` : "Invalid";
        break;

       case ZodIssueCode.too_small:
        message = "array" === issue.type ? `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "more than"} ${issue.minimum} element(s)` : "string" === issue.type ? `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "over"} ${issue.minimum} character(s)` : "number" === issue.type ? `Number must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${issue.minimum}` : "date" === issue.type ? `Date must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(issue.minimum))}` : "Invalid input";
        break;

       case ZodIssueCode.too_big:
        message = "array" === issue.type ? `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "less than"} ${issue.maximum} element(s)` : "string" === issue.type ? `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "under"} ${issue.maximum} character(s)` : "number" === issue.type ? `Number must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ${issue.maximum}` : "bigint" === issue.type ? `BigInt must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ${issue.maximum}` : "date" === issue.type ? `Date must be ${issue.exact ? "exactly" : issue.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(issue.maximum))}` : "Invalid input";
        break;

       case ZodIssueCode.custom:
        message = "Invalid input";
        break;

       case ZodIssueCode.invalid_intersection_types:
        message = "Intersection results could not be merged";
        break;

       case ZodIssueCode.not_multiple_of:
        message = `Number must be a multiple of ${issue.multipleOf}`;
        break;

       case ZodIssueCode.not_finite:
        message = "Number must be finite";
        break;

       default:
        message = _ctx.defaultError, util.assertNever(issue);
      }
      return {
        message
      };
    };
    let overrideErrorMap = errorMap;
    function getErrorMap() {
      return overrideErrorMap;
    }
    const makeIssue = params => {
      const {data, path, errorMaps, issueData} = params, fullPath = [ ...path, ...issueData.path || [] ], fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (void 0 !== issueData.message) return {
        ...issueData,
        path: fullPath,
        message: issueData.message
      };
      let errorMessage = "";
      const maps = errorMaps.filter((m => !!m)).slice().reverse();
      for (const map of maps) errorMessage = map(fullIssue, {
        data,
        defaultError: errorMessage
      }).message;
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    };
    function addIssueToContext(ctx, issueData) {
      const overrideMap = getErrorMap(), issue = makeIssue({
        issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, overrideMap, overrideMap === errorMap ? void 0 : errorMap ].filter((x => !!x))
      });
      ctx.common.issues.push(issue);
    }
    class ParseStatus {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        "valid" === this.value && (this.value = "dirty");
      }
      abort() {
        "aborted" !== this.value && (this.value = "aborted");
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
          if ("aborted" === s.status) return INVALID;
          "dirty" === s.status && status.dirty(), arrayValue.push(s.value);
        }
        return {
          status: status.value,
          value: arrayValue
        };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key, value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const {key, value} = pair;
          if ("aborted" === key.status) return INVALID;
          if ("aborted" === value.status) return INVALID;
          "dirty" === key.status && status.dirty(), "dirty" === value.status && status.dirty(), 
          "__proto__" === key.value || void 0 === value.value && !pair.alwaysSet || (finalObject[key.value] = value.value);
        }
        return {
          status: status.value,
          value: finalObject
        };
      }
    }
    const INVALID = Object.freeze({
      status: "aborted"
    }), DIRTY = value => ({
      status: "dirty",
      value
    }), OK = value => ({
      status: "valid",
      value
    }), isAborted = x => "aborted" === x.status, isDirty = x => "dirty" === x.status, isValid = x => "valid" === x.status, isAsync = x => "undefined" != typeof Promise && x instanceof Promise;
    function __classPrivateFieldGet(receiver, state, kind, f) {
      if ("a" === kind && !f) throw new TypeError("Private accessor was defined without a getter");
      if ("function" == typeof state ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return "m" === kind ? f : "a" === kind ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
      if ("m" === kind) throw new TypeError("Private method is not writable");
      if ("a" === kind && !f) throw new TypeError("Private accessor was defined without a setter");
      if ("function" == typeof state ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return "a" === kind ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), 
      value;
    }
    var errorUtil, _ZodEnum_cache, _ZodNativeEnum_cache;
    "function" == typeof SuppressedError && SuppressedError, function(errorUtil) {
      errorUtil.errToObj = message => "string" == typeof message ? {
        message
      } : message || {}, errorUtil.toString = message => "string" == typeof message ? message : null == message ? void 0 : message.message;
    }(errorUtil || (errorUtil = {}));
    class ParseInputLazyPath {
      constructor(parent, value, path, key) {
        this._cachedPath = [], this.parent = parent, this.data = value, this._path = path, 
        this._key = key;
      }
      get path() {
        return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), 
        this._cachedPath;
      }
    }
    const handleResult = (ctx, result) => {
      if (isValid(result)) return {
        success: !0,
        data: result.value
      };
      if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
      return {
        success: !1,
        get error() {
          if (this._error) return this._error;
          const error = new ZodError(ctx.common.issues);
          return this._error = error, this._error;
        }
      };
    };
    function processCreateParams(params) {
      if (!params) return {};
      const {errorMap, invalid_type_error, required_error, description} = params;
      if (errorMap && (invalid_type_error || required_error)) throw new Error('Can\'t use "invalid_type_error" or "required_error" in conjunction with custom error map.');
      if (errorMap) return {
        errorMap,
        description
      };
      return {
        errorMap: (iss, ctx) => {
          var _a, _b;
          const {message} = params;
          return "invalid_enum_value" === iss.code ? {
            message: null != message ? message : ctx.defaultError
          } : void 0 === ctx.data ? {
            message: null !== (_a = null != message ? message : required_error) && void 0 !== _a ? _a : ctx.defaultError
          } : "invalid_type" !== iss.code ? {
            message: ctx.defaultError
          } : {
            message: null !== (_b = null != message ? message : invalid_type_error) && void 0 !== _b ? _b : ctx.defaultError
          };
        },
        description
      };
    }
    class ZodType {
      constructor(def) {
        this.spa = this.safeParseAsync, this._def = def, this.parse = this.parse.bind(this), 
        this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), 
        this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), 
        this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), 
        this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), 
        this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), 
        this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), 
        this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), 
        this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), 
        this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), 
        this.isOptional = this.isOptional.bind(this);
      }
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return getParsedType(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new ParseStatus,
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) throw new Error("Synchronous parse encountered promise.");
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success) return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        var _a;
        const ctx = {
          common: {
            issues: [],
            async: null !== (_a = null == params ? void 0 : params.async) && void 0 !== _a && _a,
            contextualErrorMap: null == params ? void 0 : params.errorMap
          },
          path: (null == params ? void 0 : params.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        }, result = this._parseSync({
          data,
          path: ctx.path,
          parent: ctx
        });
        return handleResult(ctx, result);
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success) return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: null == params ? void 0 : params.errorMap,
            async: !0
          },
          path: (null == params ? void 0 : params.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        }, maybeAsyncResult = this._parse({
          data,
          path: ctx.path,
          parent: ctx
        }), result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = val => "string" == typeof message || void 0 === message ? {
          message
        } : "function" == typeof message ? message(val) : message;
        return this._refinement(((val, ctx) => {
          const result = check(val), setError = () => ctx.addIssue({
            code: ZodIssueCode.custom,
            ...getIssueProperties(val)
          });
          return "undefined" != typeof Promise && result instanceof Promise ? result.then((data => !!data || (setError(), 
          !1))) : !!result || (setError(), !1);
        }));
      }
      refinement(check, refinementData) {
        return this._refinement(((val, ctx) => !!check(val) || (ctx.addIssue("function" == typeof refinementData ? refinementData(val, ctx) : refinementData), 
        !1)));
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: {
            type: "refinement",
            refinement
          }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this, this._def);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([ this, option ], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: {
            type: "transform",
            transform
          }
        });
      }
      default(def) {
        const defaultValueFunc = "function" == typeof def ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = "function" == typeof def ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        return new (0, this.constructor)({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    }
    const cuidRegex = /^c[^\s-]{8,}$/i, cuid2Regex = /^[0-9a-z]+$/, ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/, uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, nanoidRegex = /^[a-z0-9_-]{21}$/i, durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    let emojiRegex;
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/, base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, dateRegexSource = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", dateRegex = new RegExp(`^${dateRegexSource}$`);
    function timeRegexSource(args) {
      let regex = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
      return args.precision ? regex = `${regex}\\.\\d{${args.precision}}` : null == args.precision && (regex = `${regex}(\\.\\d+)?`), 
      regex;
    }
    function datetimeRegex(args) {
      let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
      const opts = [];
      return opts.push(args.local ? "Z?" : "Z"), args.offset && opts.push("([+-]\\d{2}:?\\d{2})"), 
      regex = `${regex}(${opts.join("|")})`, new RegExp(`^${regex}$`);
    }
    class ZodString extends ZodType {
      _parse(input) {
        this._def.coerce && (input.data = String(input.data));
        if (this._getType(input) !== ZodParsedType.string) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.string,
            received: ctx.parsedType
          }), INVALID;
        }
        const status = new ParseStatus;
        let ctx;
        for (const check of this._def.checks) if ("min" === check.kind) input.data.length < check.value && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: check.message
        }), status.dirty()); else if ("max" === check.kind) input.data.length > check.value && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: check.message
        }), status.dirty()); else if ("length" === check.kind) {
          const tooBig = input.data.length > check.value, tooSmall = input.data.length < check.value;
          (tooBig || tooSmall) && (ctx = this._getOrReturnCtx(input, ctx), tooBig ? addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: !0,
            exact: !0,
            message: check.message
          }) : tooSmall && addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: !0,
            exact: !0,
            message: check.message
          }), status.dirty());
        } else if ("email" === check.kind) emailRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "email",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()); else if ("emoji" === check.kind) emojiRegex || (emojiRegex = new RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")), 
        emojiRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "emoji",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()); else if ("uuid" === check.kind) uuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "uuid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()); else if ("nanoid" === check.kind) nanoidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "nanoid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()); else if ("cuid" === check.kind) cuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "cuid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()); else if ("cuid2" === check.kind) cuid2Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "cuid2",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()); else if ("ulid" === check.kind) ulidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "ulid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()); else if ("url" === check.kind) try {
          new URL(input.data);
        } catch (_a) {
          ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          }), status.dirty();
        } else if ("regex" === check.kind) {
          check.regex.lastIndex = 0;
          check.regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          }), status.dirty());
        } else if ("trim" === check.kind) input.data = input.data.trim(); else if ("includes" === check.kind) input.data.includes(check.value, check.position) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: {
            includes: check.value,
            position: check.position
          },
          message: check.message
        }), status.dirty()); else if ("toLowerCase" === check.kind) input.data = input.data.toLowerCase(); else if ("toUpperCase" === check.kind) input.data = input.data.toUpperCase(); else if ("startsWith" === check.kind) input.data.startsWith(check.value) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: {
            startsWith: check.value
          },
          message: check.message
        }), status.dirty()); else if ("endsWith" === check.kind) input.data.endsWith(check.value) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: {
            endsWith: check.value
          },
          message: check.message
        }), status.dirty()); else if ("datetime" === check.kind) {
          datetimeRegex(check).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          }), status.dirty());
        } else if ("date" === check.kind) {
          dateRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          }), status.dirty());
        } else if ("time" === check.kind) {
          new RegExp(`^${timeRegexSource(check)}$`).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          }), status.dirty());
        } else "duration" === check.kind ? durationRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "duration",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()) : "ip" === check.kind ? (ip = input.data, ("v4" !== (version = check.version) && version || !ipv4Regex.test(ip)) && ("v6" !== version && version || !ipv6Regex.test(ip)) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "ip",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty())) : "base64" === check.kind ? base64Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "base64",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()) : util.assertNever(check);
        var ip, version;
        return {
          status: status.value,
          value: input.data
        };
      }
      _regex(regex, validation, message) {
        return this.refinement((data => regex.test(data)), {
          validation,
          code: ZodIssueCode.invalid_string,
          ...errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new ZodString({
          ...this._def,
          checks: [ ...this._def.checks, check ]
        });
      }
      email(message) {
        return this._addCheck({
          kind: "email",
          ...errorUtil.errToObj(message)
        });
      }
      url(message) {
        return this._addCheck({
          kind: "url",
          ...errorUtil.errToObj(message)
        });
      }
      emoji(message) {
        return this._addCheck({
          kind: "emoji",
          ...errorUtil.errToObj(message)
        });
      }
      uuid(message) {
        return this._addCheck({
          kind: "uuid",
          ...errorUtil.errToObj(message)
        });
      }
      nanoid(message) {
        return this._addCheck({
          kind: "nanoid",
          ...errorUtil.errToObj(message)
        });
      }
      cuid(message) {
        return this._addCheck({
          kind: "cuid",
          ...errorUtil.errToObj(message)
        });
      }
      cuid2(message) {
        return this._addCheck({
          kind: "cuid2",
          ...errorUtil.errToObj(message)
        });
      }
      ulid(message) {
        return this._addCheck({
          kind: "ulid",
          ...errorUtil.errToObj(message)
        });
      }
      base64(message) {
        return this._addCheck({
          kind: "base64",
          ...errorUtil.errToObj(message)
        });
      }
      ip(options) {
        return this._addCheck({
          kind: "ip",
          ...errorUtil.errToObj(options)
        });
      }
      datetime(options) {
        var _a, _b;
        return "string" == typeof options ? this._addCheck({
          kind: "datetime",
          precision: null,
          offset: !1,
          local: !1,
          message: options
        }) : this._addCheck({
          kind: "datetime",
          precision: void 0 === (null == options ? void 0 : options.precision) ? null : null == options ? void 0 : options.precision,
          offset: null !== (_a = null == options ? void 0 : options.offset) && void 0 !== _a && _a,
          local: null !== (_b = null == options ? void 0 : options.local) && void 0 !== _b && _b,
          ...errorUtil.errToObj(null == options ? void 0 : options.message)
        });
      }
      date(message) {
        return this._addCheck({
          kind: "date",
          message
        });
      }
      time(options) {
        return "string" == typeof options ? this._addCheck({
          kind: "time",
          precision: null,
          message: options
        }) : this._addCheck({
          kind: "time",
          precision: void 0 === (null == options ? void 0 : options.precision) ? null : null == options ? void 0 : options.precision,
          ...errorUtil.errToObj(null == options ? void 0 : options.message)
        });
      }
      duration(message) {
        return this._addCheck({
          kind: "duration",
          ...errorUtil.errToObj(message)
        });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: null == options ? void 0 : options.position,
          ...errorUtil.errToObj(null == options ? void 0 : options.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil.errToObj(message)
        });
      }
      nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
      }
      trim() {
        return new ZodString({
          ...this._def,
          checks: [ ...this._def.checks, {
            kind: "trim"
          } ]
        });
      }
      toLowerCase() {
        return new ZodString({
          ...this._def,
          checks: [ ...this._def.checks, {
            kind: "toLowerCase"
          } ]
        });
      }
      toUpperCase() {
        return new ZodString({
          ...this._def,
          checks: [ ...this._def.checks, {
            kind: "toUpperCase"
          } ]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch => "datetime" === ch.kind));
      }
      get isDate() {
        return !!this._def.checks.find((ch => "date" === ch.kind));
      }
      get isTime() {
        return !!this._def.checks.find((ch => "time" === ch.kind));
      }
      get isDuration() {
        return !!this._def.checks.find((ch => "duration" === ch.kind));
      }
      get isEmail() {
        return !!this._def.checks.find((ch => "email" === ch.kind));
      }
      get isURL() {
        return !!this._def.checks.find((ch => "url" === ch.kind));
      }
      get isEmoji() {
        return !!this._def.checks.find((ch => "emoji" === ch.kind));
      }
      get isUUID() {
        return !!this._def.checks.find((ch => "uuid" === ch.kind));
      }
      get isNANOID() {
        return !!this._def.checks.find((ch => "nanoid" === ch.kind));
      }
      get isCUID() {
        return !!this._def.checks.find((ch => "cuid" === ch.kind));
      }
      get isCUID2() {
        return !!this._def.checks.find((ch => "cuid2" === ch.kind));
      }
      get isULID() {
        return !!this._def.checks.find((ch => "ulid" === ch.kind));
      }
      get isIP() {
        return !!this._def.checks.find((ch => "ip" === ch.kind));
      }
      get isBase64() {
        return !!this._def.checks.find((ch => "base64" === ch.kind));
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
        return max;
      }
    }
    function floatSafeRemainder(val, step) {
      const valDecCount = (val.toString().split(".")[1] || "").length, stepDecCount = (step.toString().split(".")[1] || "").length, decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
      return parseInt(val.toFixed(decCount).replace(".", "")) % parseInt(step.toFixed(decCount).replace(".", "")) / Math.pow(10, decCount);
    }
    ZodString.create = params => {
      var _a;
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: null !== (_a = null == params ? void 0 : params.coerce) && void 0 !== _a && _a,
        ...processCreateParams(params)
      });
    };
    class ZodNumber extends ZodType {
      constructor() {
        super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
      }
      _parse(input) {
        this._def.coerce && (input.data = Number(input.data));
        if (this._getType(input) !== ZodParsedType.number) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.number,
            received: ctx.parsedType
          }), INVALID;
        }
        let ctx;
        const status = new ParseStatus;
        for (const check of this._def.checks) if ("int" === check.kind) util.isInteger(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: "integer",
          received: "float",
          message: check.message
        }), status.dirty()); else if ("min" === check.kind) {
          (check.inclusive ? input.data < check.value : input.data <= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: !1,
            message: check.message
          }), status.dirty());
        } else if ("max" === check.kind) {
          (check.inclusive ? input.data > check.value : input.data >= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: !1,
            message: check.message
          }), status.dirty());
        } else "multipleOf" === check.kind ? 0 !== floatSafeRemainder(input.data, check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.not_multiple_of,
          multipleOf: check.value,
          message: check.message
        }), status.dirty()) : "finite" === check.kind ? Number.isFinite(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.not_finite,
          message: check.message
        }), status.dirty()) : util.assertNever(check);
        return {
          status: status.value,
          value: input.data
        };
      }
      gte(value, message) {
        return this.setLimit("min", value, !0, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, !1, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, !0, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, !1, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
          ...this._def,
          checks: [ ...this._def.checks, {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          } ]
        });
      }
      _addCheck(check) {
        return new ZodNumber({
          ...this._def,
          checks: [ ...this._def.checks, check ]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: !1,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: !1,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: !0,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: !0,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: !0,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: !0,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch => "int" === ch.kind || "multipleOf" === ch.kind && util.isInteger(ch.value)));
      }
      get isFinite() {
        let max = null, min = null;
        for (const ch of this._def.checks) {
          if ("finite" === ch.kind || "int" === ch.kind || "multipleOf" === ch.kind) return !0;
          "min" === ch.kind ? (null === min || ch.value > min) && (min = ch.value) : "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    }
    ZodNumber.create = params => new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: (null == params ? void 0 : params.coerce) || !1,
      ...processCreateParams(params)
    });
    class ZodBigInt extends ZodType {
      constructor() {
        super(...arguments), this.min = this.gte, this.max = this.lte;
      }
      _parse(input) {
        this._def.coerce && (input.data = BigInt(input.data));
        if (this._getType(input) !== ZodParsedType.bigint) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.bigint,
            received: ctx.parsedType
          }), INVALID;
        }
        let ctx;
        const status = new ParseStatus;
        for (const check of this._def.checks) if ("min" === check.kind) {
          (check.inclusive ? input.data < check.value : input.data <= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          }), status.dirty());
        } else if ("max" === check.kind) {
          (check.inclusive ? input.data > check.value : input.data >= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          }), status.dirty());
        } else "multipleOf" === check.kind ? input.data % check.value !== BigInt(0) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.not_multiple_of,
          multipleOf: check.value,
          message: check.message
        }), status.dirty()) : util.assertNever(check);
        return {
          status: status.value,
          value: input.data
        };
      }
      gte(value, message) {
        return this.setLimit("min", value, !0, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, !1, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, !0, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, !1, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
          ...this._def,
          checks: [ ...this._def.checks, {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          } ]
        });
      }
      _addCheck(check) {
        return new ZodBigInt({
          ...this._def,
          checks: [ ...this._def.checks, check ]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: !1,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: !1,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: !0,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: !0,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
        return max;
      }
    }
    ZodBigInt.create = params => {
      var _a;
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: null !== (_a = null == params ? void 0 : params.coerce) && void 0 !== _a && _a,
        ...processCreateParams(params)
      });
    };
    class ZodBoolean extends ZodType {
      _parse(input) {
        this._def.coerce && (input.data = Boolean(input.data));
        if (this._getType(input) !== ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.boolean,
            received: ctx.parsedType
          }), INVALID;
        }
        return OK(input.data);
      }
    }
    ZodBoolean.create = params => new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: (null == params ? void 0 : params.coerce) || !1,
      ...processCreateParams(params)
    });
    class ZodDate extends ZodType {
      _parse(input) {
        this._def.coerce && (input.data = new Date(input.data));
        if (this._getType(input) !== ZodParsedType.date) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.date,
            received: ctx.parsedType
          }), INVALID;
        }
        if (isNaN(input.data.getTime())) {
          return addIssueToContext(this._getOrReturnCtx(input), {
            code: ZodIssueCode.invalid_date
          }), INVALID;
        }
        const status = new ParseStatus;
        let ctx;
        for (const check of this._def.checks) "min" === check.kind ? input.data.getTime() < check.value && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          message: check.message,
          inclusive: !0,
          exact: !1,
          minimum: check.value,
          type: "date"
        }), status.dirty()) : "max" === check.kind ? input.data.getTime() > check.value && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          message: check.message,
          inclusive: !0,
          exact: !1,
          maximum: check.value,
          type: "date"
        }), status.dirty()) : util.assertNever(check);
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new ZodDate({
          ...this._def,
          checks: [ ...this._def.checks, check ]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
        return null != min ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
        return null != max ? new Date(max) : null;
      }
    }
    ZodDate.create = params => new ZodDate({
      checks: [],
      coerce: (null == params ? void 0 : params.coerce) || !1,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params)
    });
    class ZodSymbol extends ZodType {
      _parse(input) {
        if (this._getType(input) !== ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.symbol,
            received: ctx.parsedType
          }), INVALID;
        }
        return OK(input.data);
      }
    }
    ZodSymbol.create = params => new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params)
    });
    class ZodUndefined extends ZodType {
      _parse(input) {
        if (this._getType(input) !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.undefined,
            received: ctx.parsedType
          }), INVALID;
        }
        return OK(input.data);
      }
    }
    ZodUndefined.create = params => new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params)
    });
    class ZodNull extends ZodType {
      _parse(input) {
        if (this._getType(input) !== ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.null,
            received: ctx.parsedType
          }), INVALID;
        }
        return OK(input.data);
      }
    }
    ZodNull.create = params => new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params)
    });
    class ZodAny extends ZodType {
      constructor() {
        super(...arguments), this._any = !0;
      }
      _parse(input) {
        return OK(input.data);
      }
    }
    ZodAny.create = params => new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params)
    });
    class ZodUnknown extends ZodType {
      constructor() {
        super(...arguments), this._unknown = !0;
      }
      _parse(input) {
        return OK(input.data);
      }
    }
    ZodUnknown.create = params => new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params)
    });
    class ZodNever extends ZodType {
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.never,
          received: ctx.parsedType
        }), INVALID;
      }
    }
    ZodNever.create = params => new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params)
    });
    class ZodVoid extends ZodType {
      _parse(input) {
        if (this._getType(input) !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.void,
            received: ctx.parsedType
          }), INVALID;
        }
        return OK(input.data);
      }
    }
    ZodVoid.create = params => new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params)
    });
    class ZodArray extends ZodType {
      _parse(input) {
        const {ctx, status} = this._processInputParams(input), def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        }), INVALID;
        if (null !== def.exactLength) {
          const tooBig = ctx.data.length > def.exactLength.value, tooSmall = ctx.data.length < def.exactLength.value;
          (tooBig || tooSmall) && (addIssueToContext(ctx, {
            code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
            minimum: tooSmall ? def.exactLength.value : void 0,
            maximum: tooBig ? def.exactLength.value : void 0,
            type: "array",
            inclusive: !0,
            exact: !0,
            message: def.exactLength.message
          }), status.dirty());
        }
        if (null !== def.minLength && ctx.data.length < def.minLength.value && (addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: !0,
          exact: !1,
          message: def.minLength.message
        }), status.dirty()), null !== def.maxLength && ctx.data.length > def.maxLength.value && (addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: !0,
          exact: !1,
          message: def.maxLength.message
        }), status.dirty()), ctx.common.async) return Promise.all([ ...ctx.data ].map(((item, i) => def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i))))).then((result => ParseStatus.mergeArray(status, result)));
        const result = [ ...ctx.data ].map(((item, i) => def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i))));
        return ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new ZodArray({
          ...this._def,
          minLength: {
            value: minLength,
            message: errorUtil.toString(message)
          }
        });
      }
      max(maxLength, message) {
        return new ZodArray({
          ...this._def,
          maxLength: {
            value: maxLength,
            message: errorUtil.toString(message)
          }
        });
      }
      length(len, message) {
        return new ZodArray({
          ...this._def,
          exactLength: {
            value: len,
            message: errorUtil.toString(message)
          }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    }
    function deepPartialify(schema) {
      if (schema instanceof ZodObject) {
        const newShape = {};
        for (const key in schema.shape) {
          const fieldSchema = schema.shape[key];
          newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
          ...schema._def,
          shape: () => newShape
        });
      }
      return schema instanceof ZodArray ? new ZodArray({
        ...schema._def,
        type: deepPartialify(schema.element)
      }) : schema instanceof ZodOptional ? ZodOptional.create(deepPartialify(schema.unwrap())) : schema instanceof ZodNullable ? ZodNullable.create(deepPartialify(schema.unwrap())) : schema instanceof ZodTuple ? ZodTuple.create(schema.items.map((item => deepPartialify(item)))) : schema;
    }
    ZodArray.create = (schema, params) => new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params)
    });
    class ZodObject extends ZodType {
      constructor() {
        super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
      }
      _getCached() {
        if (null !== this._cached) return this._cached;
        const shape = this._def.shape(), keys = util.objectKeys(shape);
        return this._cached = {
          shape,
          keys
        };
      }
      _parse(input) {
        if (this._getType(input) !== ZodParsedType.object) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          }), INVALID;
        }
        const {status, ctx} = this._processInputParams(input), {shape, keys: shapeKeys} = this._getCached(), extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && "strip" === this._def.unknownKeys)) for (const key in ctx.data) shapeKeys.includes(key) || extraKeys.push(key);
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key], value = ctx.data[key];
          pairs.push({
            key: {
              status: "valid",
              value: key
            },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if ("passthrough" === unknownKeys) for (const key of extraKeys) pairs.push({
            key: {
              status: "valid",
              value: key
            },
            value: {
              status: "valid",
              value: ctx.data[key]
            }
          }); else if ("strict" === unknownKeys) extraKeys.length > 0 && (addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          }), status.dirty()); else if ("strip" !== unknownKeys) throw new Error("Internal ZodObject error: invalid unknownKeys value.");
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: {
                status: "valid",
                value: key
              },
              value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
              alwaysSet: key in ctx.data
            });
          }
        }
        return ctx.common.async ? Promise.resolve().then((async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key, value = await pair.value;
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet
            });
          }
          return syncPairs;
        })).then((syncPairs => ParseStatus.mergeObjectSync(status, syncPairs))) : ParseStatus.mergeObjectSync(status, pairs);
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        return errorUtil.errToObj, new ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...void 0 !== message ? {
            errorMap: (issue, ctx) => {
              var _a, _b, _c, _d;
              const defaultError = null !== (_c = null === (_b = (_a = this._def).errorMap) || void 0 === _b ? void 0 : _b.call(_a, issue, ctx).message) && void 0 !== _c ? _c : ctx.defaultError;
              return "unrecognized_keys" === issue.code ? {
                message: null !== (_d = errorUtil.errToObj(message).message) && void 0 !== _d ? _d : defaultError
              } : {
                message: defaultError
              };
            }
          } : {}
        });
      }
      strip() {
        return new ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      extend(augmentation) {
        return new ZodObject({
          ...this._def,
          shape: () => ({
            ...this._def.shape(),
            ...augmentation
          })
        });
      }
      merge(merging) {
        return new ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: () => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
      }
      setKey(key, schema) {
        return this.augment({
          [key]: schema
        });
      }
      catchall(index) {
        return new ZodObject({
          ...this._def,
          catchall: index
        });
      }
      pick(mask) {
        const shape = {};
        return util.objectKeys(mask).forEach((key => {
          mask[key] && this.shape[key] && (shape[key] = this.shape[key]);
        })), new ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      omit(mask) {
        const shape = {};
        return util.objectKeys(this.shape).forEach((key => {
          mask[key] || (shape[key] = this.shape[key]);
        })), new ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        return util.objectKeys(this.shape).forEach((key => {
          const fieldSchema = this.shape[key];
          mask && !mask[key] ? newShape[key] = fieldSchema : newShape[key] = fieldSchema.optional();
        })), new ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      required(mask) {
        const newShape = {};
        return util.objectKeys(this.shape).forEach((key => {
          if (mask && !mask[key]) newShape[key] = this.shape[key]; else {
            let newField = this.shape[key];
            for (;newField instanceof ZodOptional; ) newField = newField._def.innerType;
            newShape[key] = newField;
          }
        })), new ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      keyof() {
        return createZodEnum(util.objectKeys(this.shape));
      }
    }
    ZodObject.create = (shape, params) => new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    }), ZodObject.strictCreate = (shape, params) => new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    }), ZodObject.lazycreate = (shape, params) => new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
    class ZodUnion extends ZodType {
      _parse(input) {
        const {ctx} = this._processInputParams(input), options = this._def.options;
        if (ctx.common.async) return Promise.all(options.map((async option => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            }),
            ctx: childCtx
          };
        }))).then((function(results) {
          for (const result of results) if ("valid" === result.result.status) return result.result;
          for (const result of results) if ("dirty" === result.result.status) return ctx.common.issues.push(...result.ctx.common.issues), 
          result.result;
          const unionErrors = results.map((result => new ZodError(result.ctx.common.issues)));
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          }), INVALID;
        }));
        {
          let dirty;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            }, result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if ("valid" === result.status) return result;
            "dirty" !== result.status || dirty || (dirty = {
              result,
              ctx: childCtx
            }), childCtx.common.issues.length && issues.push(childCtx.common.issues);
          }
          if (dirty) return ctx.common.issues.push(...dirty.ctx.common.issues), dirty.result;
          const unionErrors = issues.map((issues => new ZodError(issues)));
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          }), INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    }
    ZodUnion.create = (types, params) => new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params)
    });
    const getDiscriminator = type => type instanceof ZodLazy ? getDiscriminator(type.schema) : type instanceof ZodEffects ? getDiscriminator(type.innerType()) : type instanceof ZodLiteral ? [ type.value ] : type instanceof ZodEnum ? type.options : type instanceof ZodNativeEnum ? util.objectValues(type.enum) : type instanceof ZodDefault ? getDiscriminator(type._def.innerType) : type instanceof ZodUndefined ? [ void 0 ] : type instanceof ZodNull ? [ null ] : type instanceof ZodOptional ? [ void 0, ...getDiscriminator(type.unwrap()) ] : type instanceof ZodNullable ? [ null, ...getDiscriminator(type.unwrap()) ] : type instanceof ZodBranded || type instanceof ZodReadonly ? getDiscriminator(type.unwrap()) : type instanceof ZodCatch ? getDiscriminator(type._def.innerType) : [];
    class ZodDiscriminatedUnion extends ZodType {
      _parse(input) {
        const {ctx} = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        }), INVALID;
        const discriminator = this.discriminator, discriminatorValue = ctx.data[discriminator], option = this.optionsMap.get(discriminatorValue);
        return option ? ctx.common.async ? option._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }) : option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }) : (addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union_discriminator,
          options: Array.from(this.optionsMap.keys()),
          path: [ discriminator ]
        }), INVALID);
      }
      get discriminator() {
        return this._def.discriminator;
      }
      get options() {
        return this._def.options;
      }
      get optionsMap() {
        return this._def.optionsMap;
      }
      static create(discriminator, options, params) {
        const optionsMap = new Map;
        for (const type of options) {
          const discriminatorValues = getDiscriminator(type.shape[discriminator]);
          if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
          for (const value of discriminatorValues) {
            if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            optionsMap.set(value, type);
          }
        }
        return new ZodDiscriminatedUnion({
          typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
          discriminator,
          options,
          optionsMap,
          ...processCreateParams(params)
        });
      }
    }
    function mergeValues(a, b) {
      const aType = getParsedType(a), bType = getParsedType(b);
      if (a === b) return {
        valid: !0,
        data: a
      };
      if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util.objectKeys(b), sharedKeys = util.objectKeys(a).filter((key => -1 !== bKeys.indexOf(key))), newObj = {
          ...a,
          ...b
        };
        for (const key of sharedKeys) {
          const sharedValue = mergeValues(a[key], b[key]);
          if (!sharedValue.valid) return {
            valid: !1
          };
          newObj[key] = sharedValue.data;
        }
        return {
          valid: !0,
          data: newObj
        };
      }
      if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) return {
          valid: !1
        };
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
          const sharedValue = mergeValues(a[index], b[index]);
          if (!sharedValue.valid) return {
            valid: !1
          };
          newArray.push(sharedValue.data);
        }
        return {
          valid: !0,
          data: newArray
        };
      }
      return aType === ZodParsedType.date && bType === ZodParsedType.date && +a == +b ? {
        valid: !0,
        data: a
      } : {
        valid: !1
      };
    }
    class ZodIntersection extends ZodType {
      _parse(input) {
        const {status, ctx} = this._processInputParams(input), handleParsed = (parsedLeft, parsedRight) => {
          if (isAborted(parsedLeft) || isAborted(parsedRight)) return INVALID;
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          return merged.valid ? ((isDirty(parsedLeft) || isDirty(parsedRight)) && status.dirty(), 
          {
            status: status.value,
            value: merged.data
          }) : (addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_intersection_types
          }), INVALID);
        };
        return ctx.common.async ? Promise.all([ this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }) ]).then((([left, right]) => handleParsed(left, right))) : handleParsed(this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }));
      }
    }
    ZodIntersection.create = (left, right, params) => new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params)
    });
    class ZodTuple extends ZodType {
      _parse(input) {
        const {status, ctx} = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        }), INVALID;
        if (ctx.data.length < this._def.items.length) return addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: this._def.items.length,
          inclusive: !0,
          exact: !1,
          type: "array"
        }), INVALID;
        !this._def.rest && ctx.data.length > this._def.items.length && (addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: this._def.items.length,
          inclusive: !0,
          exact: !1,
          type: "array"
        }), status.dirty());
        const items = [ ...ctx.data ].map(((item, itemIndex) => {
          const schema = this._def.items[itemIndex] || this._def.rest;
          return schema ? schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex)) : null;
        })).filter((x => !!x));
        return ctx.common.async ? Promise.all(items).then((results => ParseStatus.mergeArray(status, results))) : ParseStatus.mergeArray(status, items);
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new ZodTuple({
          ...this._def,
          rest
        });
      }
    }
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    class ZodRecord extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const {status, ctx} = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        }), INVALID;
        const pairs = [], keyType = this._def.keyType, valueType = this._def.valueType;
        for (const key in ctx.data) pairs.push({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
          value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
          alwaysSet: key in ctx.data
        });
        return ctx.common.async ? ParseStatus.mergeObjectAsync(status, pairs) : ParseStatus.mergeObjectSync(status, pairs);
      }
      get element() {
        return this._def.valueType;
      }
      static create(first, second, third) {
        return new ZodRecord(second instanceof ZodType ? {
          keyType: first,
          valueType: second,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(third)
        } : {
          keyType: ZodString.create(),
          valueType: first,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(second)
        });
      }
    }
    class ZodMap extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const {status, ctx} = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.map,
          received: ctx.parsedType
        }), INVALID;
        const keyType = this._def.keyType, valueType = this._def.valueType, pairs = [ ...ctx.data.entries() ].map((([key, value], index) => ({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [ index, "key" ])),
          value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [ index, "value" ]))
        })));
        if (ctx.common.async) {
          const finalMap = new Map;
          return Promise.resolve().then((async () => {
            for (const pair of pairs) {
              const key = await pair.key, value = await pair.value;
              if ("aborted" === key.status || "aborted" === value.status) return INVALID;
              "dirty" !== key.status && "dirty" !== value.status || status.dirty(), finalMap.set(key.value, value.value);
            }
            return {
              status: status.value,
              value: finalMap
            };
          }));
        }
        {
          const finalMap = new Map;
          for (const pair of pairs) {
            const key = pair.key, value = pair.value;
            if ("aborted" === key.status || "aborted" === value.status) return INVALID;
            "dirty" !== key.status && "dirty" !== value.status || status.dirty(), finalMap.set(key.value, value.value);
          }
          return {
            status: status.value,
            value: finalMap
          };
        }
      }
    }
    ZodMap.create = (keyType, valueType, params) => new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params)
    });
    class ZodSet extends ZodType {
      _parse(input) {
        const {status, ctx} = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.set,
          received: ctx.parsedType
        }), INVALID;
        const def = this._def;
        null !== def.minSize && ctx.data.size < def.minSize.value && (addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: !0,
          exact: !1,
          message: def.minSize.message
        }), status.dirty()), null !== def.maxSize && ctx.data.size > def.maxSize.value && (addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: !0,
          exact: !1,
          message: def.maxSize.message
        }), status.dirty());
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
          const parsedSet = new Set;
          for (const element of elements) {
            if ("aborted" === element.status) return INVALID;
            "dirty" === element.status && status.dirty(), parsedSet.add(element.value);
          }
          return {
            status: status.value,
            value: parsedSet
          };
        }
        const elements = [ ...ctx.data.values() ].map(((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i))));
        return ctx.common.async ? Promise.all(elements).then((elements => finalizeSet(elements))) : finalizeSet(elements);
      }
      min(minSize, message) {
        return new ZodSet({
          ...this._def,
          minSize: {
            value: minSize,
            message: errorUtil.toString(message)
          }
        });
      }
      max(maxSize, message) {
        return new ZodSet({
          ...this._def,
          maxSize: {
            value: maxSize,
            message: errorUtil.toString(message)
          }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    }
    ZodSet.create = (valueType, params) => new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params)
    });
    class ZodFunction extends ZodType {
      constructor() {
        super(...arguments), this.validate = this.implement;
      }
      _parse(input) {
        const {ctx} = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.function,
          received: ctx.parsedType
        }), INVALID;
        function makeArgsIssue(args, error) {
          return makeIssue({
            data: args,
            path: ctx.path,
            errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap ].filter((x => !!x)),
            issueData: {
              code: ZodIssueCode.invalid_arguments,
              argumentsError: error
            }
          });
        }
        function makeReturnsIssue(returns, error) {
          return makeIssue({
            data: returns,
            path: ctx.path,
            errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap ].filter((x => !!x)),
            issueData: {
              code: ZodIssueCode.invalid_return_type,
              returnTypeError: error
            }
          });
        }
        const params = {
          errorMap: ctx.common.contextualErrorMap
        }, fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
          const me = this;
          return OK((async function(...args) {
            const error = new ZodError([]), parsedArgs = await me._def.args.parseAsync(args, params).catch((e => {
              throw error.addIssue(makeArgsIssue(args, e)), error;
            })), result = await Reflect.apply(fn, this, parsedArgs);
            return await me._def.returns._def.type.parseAsync(result, params).catch((e => {
              throw error.addIssue(makeReturnsIssue(result, e)), error;
            }));
          }));
        }
        {
          const me = this;
          return OK((function(...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) throw new ZodError([ makeArgsIssue(args, parsedArgs.error) ]);
            const result = Reflect.apply(fn, this, parsedArgs.data), parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) throw new ZodError([ makeReturnsIssue(result, parsedReturns.error) ]);
            return parsedReturns.data;
          }));
        }
      }
      parameters() {
        return this._def.args;
      }
      returnType() {
        return this._def.returns;
      }
      args(...items) {
        return new ZodFunction({
          ...this._def,
          args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
      }
      returns(returnType) {
        return new ZodFunction({
          ...this._def,
          returns: returnType
        });
      }
      implement(func) {
        return this.parse(func);
      }
      strictImplement(func) {
        return this.parse(func);
      }
      static create(args, returns, params) {
        return new ZodFunction({
          args: args || ZodTuple.create([]).rest(ZodUnknown.create()),
          returns: returns || ZodUnknown.create(),
          typeName: ZodFirstPartyTypeKind.ZodFunction,
          ...processCreateParams(params)
        });
      }
    }
    class ZodLazy extends ZodType {
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const {ctx} = this._processInputParams(input);
        return this._def.getter()._parse({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    ZodLazy.create = (getter, params) => new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params)
    });
    class ZodLiteral extends ZodType {
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_literal,
            expected: this._def.value
          }), INVALID;
        }
        return {
          status: "valid",
          value: input.data
        };
      }
      get value() {
        return this._def.value;
      }
    }
    function createZodEnum(values, params) {
      return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params)
      });
    }
    ZodLiteral.create = (value, params) => new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params)
    });
    class ZodEnum extends ZodType {
      constructor() {
        super(...arguments), _ZodEnum_cache.set(this, void 0);
      }
      _parse(input) {
        if ("string" != typeof input.data) {
          const ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
          return addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          }), INVALID;
        }
        if (__classPrivateFieldGet(this, _ZodEnum_cache, "f") || __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f"), 
        !__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
          const ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
          return addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          }), INVALID;
        }
        return OK(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) enumValues[val] = val;
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) enumValues[val] = val;
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) enumValues[val] = val;
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return ZodEnum.create(this.options.filter((opt => !values.includes(opt))), {
          ...this._def,
          ...newDef
        });
      }
    }
    _ZodEnum_cache = new WeakMap, ZodEnum.create = createZodEnum;
    class ZodNativeEnum extends ZodType {
      constructor() {
        super(...arguments), _ZodNativeEnum_cache.set(this, void 0);
      }
      _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values), ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
          const expectedValues = util.objectValues(nativeEnumValues);
          return addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          }), INVALID;
        }
        if (__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f") || __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f"), 
        !__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
          const expectedValues = util.objectValues(nativeEnumValues);
          return addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          }), INVALID;
        }
        return OK(input.data);
      }
      get enum() {
        return this._def.values;
      }
    }
    _ZodNativeEnum_cache = new WeakMap, ZodNativeEnum.create = (values, params) => new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params)
    });
    class ZodPromise extends ZodType {
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const {ctx} = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && !1 === ctx.common.async) return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.promise,
          received: ctx.parsedType
        }), INVALID;
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data => this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap
        }))));
      }
    }
    ZodPromise.create = (schema, params) => new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params)
    });
    class ZodEffects extends ZodType {
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const {status, ctx} = this._processInputParams(input), effect = this._def.effect || null, checkCtx = {
          addIssue: arg => {
            addIssueToContext(ctx, arg), arg.fatal ? status.abort() : status.dirty();
          },
          get path() {
            return ctx.path;
          }
        };
        if (checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx), "preprocess" === effect.type) {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) return Promise.resolve(processed).then((async processed => {
            if ("aborted" === status.value) return INVALID;
            const result = await this._def.schema._parseAsync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            return "aborted" === result.status ? INVALID : "dirty" === result.status || "dirty" === status.value ? DIRTY(result.value) : result;
          }));
          {
            if ("aborted" === status.value) return INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            return "aborted" === result.status ? INVALID : "dirty" === result.status || "dirty" === status.value ? DIRTY(result.value) : result;
          }
        }
        if ("refinement" === effect.type) {
          const executeRefinement = acc => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) return Promise.resolve(result);
            if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            return acc;
          };
          if (!1 === ctx.common.async) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            return "aborted" === inner.status ? INVALID : ("dirty" === inner.status && status.dirty(), 
            executeRefinement(inner.value), {
              status: status.value,
              value: inner.value
            });
          }
          return this._def.schema._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }).then((inner => "aborted" === inner.status ? INVALID : ("dirty" === inner.status && status.dirty(), 
          executeRefinement(inner.value).then((() => ({
            status: status.value,
            value: inner.value
          }))))));
        }
        if ("transform" === effect.type) {
          if (!1 === ctx.common.async) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!isValid(base)) return base;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
            return {
              status: status.value,
              value: result
            };
          }
          return this._def.schema._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }).then((base => isValid(base) ? Promise.resolve(effect.transform(base.value, checkCtx)).then((result => ({
            status: status.value,
            value: result
          }))) : base));
        }
        util.assertNever(effect);
      }
    }
    ZodEffects.create = (schema, effect, params) => new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params)
    }), ZodEffects.createWithPreprocess = (preprocess, schema, params) => new ZodEffects({
      schema,
      effect: {
        type: "preprocess",
        transform: preprocess
      },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params)
    });
    class ZodOptional extends ZodType {
      _parse(input) {
        return this._getType(input) === ZodParsedType.undefined ? OK(void 0) : this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    }
    ZodOptional.create = (type, params) => new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params)
    });
    class ZodNullable extends ZodType {
      _parse(input) {
        return this._getType(input) === ZodParsedType.null ? OK(null) : this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    }
    ZodNullable.create = (type, params) => new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params)
    });
    class ZodDefault extends ZodType {
      _parse(input) {
        const {ctx} = this._processInputParams(input);
        let data = ctx.data;
        return ctx.parsedType === ZodParsedType.undefined && (data = this._def.defaultValue()), 
        this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    }
    ZodDefault.create = (type, params) => new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: "function" == typeof params.default ? params.default : () => params.default,
      ...processCreateParams(params)
    });
    class ZodCatch extends ZodType {
      _parse(input) {
        const {ctx} = this._processInputParams(input), newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        }, result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        return isAsync(result) ? result.then((result => ({
          status: "valid",
          value: "valid" === result.status ? result.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        }))) : {
          status: "valid",
          value: "valid" === result.status ? result.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      }
      removeCatch() {
        return this._def.innerType;
      }
    }
    ZodCatch.create = (type, params) => new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: "function" == typeof params.catch ? params.catch : () => params.catch,
      ...processCreateParams(params)
    });
    class ZodNaN extends ZodType {
      _parse(input) {
        if (this._getType(input) !== ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          return addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.nan,
            received: ctx.parsedType
          }), INVALID;
        }
        return {
          status: "valid",
          value: input.data
        };
      }
    }
    ZodNaN.create = params => new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params)
    });
    const BRAND = Symbol("zod_brand");
    class ZodBranded extends ZodType {
      _parse(input) {
        const {ctx} = this._processInputParams(input), data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    }
    class ZodPipeline extends ZodType {
      _parse(input) {
        const {status, ctx} = this._processInputParams(input);
        if (ctx.common.async) {
          return (async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            return "aborted" === inResult.status ? INVALID : "dirty" === inResult.status ? (status.dirty(), 
            DIRTY(inResult.value)) : this._def.out._parseAsync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          })();
        }
        {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          return "aborted" === inResult.status ? INVALID : "dirty" === inResult.status ? (status.dirty(), 
          {
            status: "dirty",
            value: inResult.value
          }) : this._def.out._parseSync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }
      static create(a, b) {
        return new ZodPipeline({
          in: a,
          out: b,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    }
    class ZodReadonly extends ZodType {
      _parse(input) {
        const result = this._def.innerType._parse(input), freeze = data => (isValid(data) && (data.value = Object.freeze(data.value)), 
        data);
        return isAsync(result) ? result.then((data => freeze(data))) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    }
    function custom(check, params = {}, fatal) {
      return check ? ZodAny.create().superRefine(((data, ctx) => {
        var _a, _b;
        if (!check(data)) {
          const p = "function" == typeof params ? params(data) : "string" == typeof params ? {
            message: params
          } : params, _fatal = null === (_b = null !== (_a = p.fatal) && void 0 !== _a ? _a : fatal) || void 0 === _b || _b, p2 = "string" == typeof p ? {
            message: p
          } : p;
          ctx.addIssue({
            code: "custom",
            ...p2,
            fatal: _fatal
          });
        }
      })) : ZodAny.create();
    }
    ZodReadonly.create = (type, params) => new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params)
    });
    const late = {
      object: ZodObject.lazycreate
    };
    var ZodFirstPartyTypeKind;
    !function(ZodFirstPartyTypeKind) {
      ZodFirstPartyTypeKind.ZodString = "ZodString", ZodFirstPartyTypeKind.ZodNumber = "ZodNumber", 
      ZodFirstPartyTypeKind.ZodNaN = "ZodNaN", ZodFirstPartyTypeKind.ZodBigInt = "ZodBigInt", 
      ZodFirstPartyTypeKind.ZodBoolean = "ZodBoolean", ZodFirstPartyTypeKind.ZodDate = "ZodDate", 
      ZodFirstPartyTypeKind.ZodSymbol = "ZodSymbol", ZodFirstPartyTypeKind.ZodUndefined = "ZodUndefined", 
      ZodFirstPartyTypeKind.ZodNull = "ZodNull", ZodFirstPartyTypeKind.ZodAny = "ZodAny", 
      ZodFirstPartyTypeKind.ZodUnknown = "ZodUnknown", ZodFirstPartyTypeKind.ZodNever = "ZodNever", 
      ZodFirstPartyTypeKind.ZodVoid = "ZodVoid", ZodFirstPartyTypeKind.ZodArray = "ZodArray", 
      ZodFirstPartyTypeKind.ZodObject = "ZodObject", ZodFirstPartyTypeKind.ZodUnion = "ZodUnion", 
      ZodFirstPartyTypeKind.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", ZodFirstPartyTypeKind.ZodIntersection = "ZodIntersection", 
      ZodFirstPartyTypeKind.ZodTuple = "ZodTuple", ZodFirstPartyTypeKind.ZodRecord = "ZodRecord", 
      ZodFirstPartyTypeKind.ZodMap = "ZodMap", ZodFirstPartyTypeKind.ZodSet = "ZodSet", 
      ZodFirstPartyTypeKind.ZodFunction = "ZodFunction", ZodFirstPartyTypeKind.ZodLazy = "ZodLazy", 
      ZodFirstPartyTypeKind.ZodLiteral = "ZodLiteral", ZodFirstPartyTypeKind.ZodEnum = "ZodEnum", 
      ZodFirstPartyTypeKind.ZodEffects = "ZodEffects", ZodFirstPartyTypeKind.ZodNativeEnum = "ZodNativeEnum", 
      ZodFirstPartyTypeKind.ZodOptional = "ZodOptional", ZodFirstPartyTypeKind.ZodNullable = "ZodNullable", 
      ZodFirstPartyTypeKind.ZodDefault = "ZodDefault", ZodFirstPartyTypeKind.ZodCatch = "ZodCatch", 
      ZodFirstPartyTypeKind.ZodPromise = "ZodPromise", ZodFirstPartyTypeKind.ZodBranded = "ZodBranded", 
      ZodFirstPartyTypeKind.ZodPipeline = "ZodPipeline", ZodFirstPartyTypeKind.ZodReadonly = "ZodReadonly";
    }(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
    const stringType = ZodString.create, numberType = ZodNumber.create, nanType = ZodNaN.create, bigIntType = ZodBigInt.create, booleanType = ZodBoolean.create, dateType = ZodDate.create, symbolType = ZodSymbol.create, undefinedType = ZodUndefined.create, nullType = ZodNull.create, anyType = ZodAny.create, unknownType = ZodUnknown.create, neverType = ZodNever.create, voidType = ZodVoid.create, arrayType = ZodArray.create, objectType = ZodObject.create, strictObjectType = ZodObject.strictCreate, unionType = ZodUnion.create, discriminatedUnionType = ZodDiscriminatedUnion.create, intersectionType = ZodIntersection.create, tupleType = ZodTuple.create, recordType = ZodRecord.create, mapType = ZodMap.create, setType = ZodSet.create, functionType = ZodFunction.create, lazyType = ZodLazy.create, literalType = ZodLiteral.create, enumType = ZodEnum.create, nativeEnumType = ZodNativeEnum.create, promiseType = ZodPromise.create, effectsType = ZodEffects.create, optionalType = ZodOptional.create, nullableType = ZodNullable.create, preprocessType = ZodEffects.createWithPreprocess, pipelineType = ZodPipeline.create, coerce = {
      string: arg => ZodString.create({
        ...arg,
        coerce: !0
      }),
      number: arg => ZodNumber.create({
        ...arg,
        coerce: !0
      }),
      boolean: arg => ZodBoolean.create({
        ...arg,
        coerce: !0
      }),
      bigint: arg => ZodBigInt.create({
        ...arg,
        coerce: !0
      }),
      date: arg => ZodDate.create({
        ...arg,
        coerce: !0
      })
    }, NEVER = INVALID;
    var z = Object.freeze({
      __proto__: null,
      defaultErrorMap: errorMap,
      setErrorMap: function(map) {
        overrideErrorMap = map;
      },
      getErrorMap,
      makeIssue,
      EMPTY_PATH: [],
      addIssueToContext,
      ParseStatus,
      INVALID,
      DIRTY,
      OK,
      isAborted,
      isDirty,
      isValid,
      isAsync,
      get util() {
        return util;
      },
      get objectUtil() {
        return objectUtil;
      },
      ZodParsedType,
      getParsedType,
      ZodType,
      datetimeRegex,
      ZodString,
      ZodNumber,
      ZodBigInt,
      ZodBoolean,
      ZodDate,
      ZodSymbol,
      ZodUndefined,
      ZodNull,
      ZodAny,
      ZodUnknown,
      ZodNever,
      ZodVoid,
      ZodArray,
      ZodObject,
      ZodUnion,
      ZodDiscriminatedUnion,
      ZodIntersection,
      ZodTuple,
      ZodRecord,
      ZodMap,
      ZodSet,
      ZodFunction,
      ZodLazy,
      ZodLiteral,
      ZodEnum,
      ZodNativeEnum,
      ZodPromise,
      ZodEffects,
      ZodTransformer: ZodEffects,
      ZodOptional,
      ZodNullable,
      ZodDefault,
      ZodCatch,
      ZodNaN,
      BRAND,
      ZodBranded,
      ZodPipeline,
      ZodReadonly,
      custom,
      Schema: ZodType,
      ZodSchema: ZodType,
      late,
      get ZodFirstPartyTypeKind() {
        return ZodFirstPartyTypeKind;
      },
      coerce,
      any: anyType,
      array: arrayType,
      bigint: bigIntType,
      boolean: booleanType,
      date: dateType,
      discriminatedUnion: discriminatedUnionType,
      effect: effectsType,
      enum: enumType,
      function: functionType,
      instanceof: (cls, params = {
        message: `Input not instance of ${cls.name}`
      }) => custom((data => data instanceof cls), params),
      intersection: intersectionType,
      lazy: lazyType,
      literal: literalType,
      map: mapType,
      nan: nanType,
      nativeEnum: nativeEnumType,
      never: neverType,
      null: nullType,
      nullable: nullableType,
      number: numberType,
      object: objectType,
      oboolean: () => booleanType().optional(),
      onumber: () => numberType().optional(),
      optional: optionalType,
      ostring: () => stringType().optional(),
      pipeline: pipelineType,
      preprocess: preprocessType,
      promise: promiseType,
      record: recordType,
      set: setType,
      strictObject: strictObjectType,
      string: stringType,
      symbol: symbolType,
      transformer: effectsType,
      tuple: tupleType,
      undefined: undefinedType,
      union: unionType,
      unknown: unknownType,
      void: voidType,
      NEVER,
      ZodIssueCode,
      quotelessJson: obj => JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:"),
      ZodError
    });
    function isZodErrorLike(err) {
      return err instanceof Error && "ZodError" === err.name && "issues" in err && Array.isArray(err.issues);
    }
    var ValidationError = class extends Error {
      name;
      details;
      constructor(message, options) {
        super(message, options), this.name = "ZodValidationError", this.details = function(options) {
          if (options) {
            const cause = options.cause;
            if (isZodErrorLike(cause)) return cause.issues;
          }
          return [];
        }(options);
      }
      toString() {
        return this.message;
      }
    };
    var ISSUE_SEPARATOR = "; ", MAX_ISSUES_IN_MESSAGE = 99, PREFIX = "Validation error", PREFIX_SEPARATOR = ": ", UNION_SEPARATOR = ", or ";
    function prefixMessage(message, prefix, prefixSeparator) {
      return null !== prefix ? message.length > 0 ? [ prefix, message ].join(prefixSeparator) : prefix : message.length > 0 ? message : PREFIX;
    }
    var identifierRegex = /[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u;
    function getMessageFromZodIssue(props) {
      const {issue, issueSeparator, unionSeparator, includePath} = props;
      if ("invalid_union" === issue.code) return issue.unionErrors.reduce(((acc, zodError) => {
        const newIssues = zodError.issues.map((issue2 => getMessageFromZodIssue({
          issue: issue2,
          issueSeparator,
          unionSeparator,
          includePath
        }))).join(issueSeparator);
        return acc.includes(newIssues) || acc.push(newIssues), acc;
      }), []).join(unionSeparator);
      if ("invalid_arguments" === issue.code) return [ issue.message, ...issue.argumentsError.issues.map((issue2 => getMessageFromZodIssue({
        issue: issue2,
        issueSeparator,
        unionSeparator,
        includePath
      }))) ].join(issueSeparator);
      if ("invalid_return_type" === issue.code) return [ issue.message, ...issue.returnTypeError.issues.map((issue2 => getMessageFromZodIssue({
        issue: issue2,
        issueSeparator,
        unionSeparator,
        includePath
      }))) ].join(issueSeparator);
      if (includePath && 0 !== issue.path.length) {
        if (1 === issue.path.length) {
          const identifier = issue.path[0];
          if ("number" == typeof identifier) return `${issue.message} at index ${identifier}`;
        }
        return `${issue.message} at "${path = issue.path, 1 === path.length ? path[0].toString() : path.reduce(((acc, item) => "number" == typeof item ? acc + "[" + item.toString() + "]" : item.includes('"') ? acc + '["' + item.replace(/"/g, '\\"') + '"]' : identifierRegex.test(item) ? acc + (0 === acc.length ? "" : ".") + item : acc + '["' + item + '"]'), "")}"`;
      }
      var path;
      return issue.message;
    }
    function fromZodErrorWithoutRuntimeCheck(zodError, options = {}) {
      const {maxIssuesInMessage = MAX_ISSUES_IN_MESSAGE, issueSeparator = ISSUE_SEPARATOR, unionSeparator = UNION_SEPARATOR, prefixSeparator = PREFIX_SEPARATOR, prefix = PREFIX, includePath = !0} = options, zodIssues = zodError.errors, message = prefixMessage(0 === zodIssues.length ? zodError.message : zodIssues.slice(0, maxIssuesInMessage).map((issue => getMessageFromZodIssue({
        issue,
        issueSeparator,
        unionSeparator,
        includePath
      }))).join(issueSeparator), prefix, prefixSeparator);
      return new ValidationError(message, {
        cause: zodError
      });
    }
    var toValidationError = (options = {}) => err => isZodErrorLike(err) ? fromZodErrorWithoutRuntimeCheck(err, options) : err instanceof Error ? new ValidationError(err.message, {
      cause: err
    }) : new ValidationError("Unknown error");
    function fromError(err, options = {}) {
      return toValidationError(options)(err);
    }
    const scriptId = globalThis?.document?.currentScript?.getAttribute("scriptid");
    let currentScriptAttributes;
    "undefined" != typeof window && window.document && (currentScriptAttributes = document?.currentScript?.attributes);
    const getCurrentFilename = () => isContentScript() ? function() {
      try {
        throw new Error;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (!error.stack) return null;
        const regexes = [ /((https?:\/\/|chrome-extension:\/\/)[^\s)]+)/, /@((https?:\/\/)[^\s)]+)/ ];
        let match = null;
        for (const regex of regexes) if (match = error.stack.match(regex), match) break;
        if (match) {
          const fileNameMatch = match[1].match(/\/([^/]+\.js):/);
          return fileNameMatch ? fileNameMatch[1] : match[1];
        }
      }
      return null;
    }() : isWebPage() ? scriptId : "src/services/get-error-message.ts";
    function getErrorMessage(error) {
      let message = "string" == typeof error ? error : function(maybeError) {
        if (maybeError instanceof z.ZodError) return fromError(maybeError);
        if ("object" == typeof (error = maybeError) && null !== error && "message" in error && "string" == typeof error.message) return maybeError;
        var error;
        try {
          return new Error(JSON.stringify(maybeError));
        } catch {
          return new Error(String(maybeError));
        }
      }(error).message;
      try {
        message += ` (${getCurrentFilename()})`, error instanceof Error && (message += ` (${(error => {
          if (!error.stack) return;
          let cleanedString = error.stack?.replace(/\s?\(chrome-extension:\/\/[^\)]+\)|\s+(\S+\.js:\d+:\d+)/g, "").replaceAll("async", "");
          const startIndex = cleanedString.indexOf("at");
          cleanedString = cleanedString.substring(startIndex);
          const functionNames = cleanedString.match(/(?:at\s+)([\w.<>]+)/g);
          return functionNames ? functionNames.map((name => name.replace("at", "").trim())).join(":").substring(0, 500) : "";
        })(error)})`);
      } catch (e) {
        console.error("Error in getErrorMessage", e), message += ` (Error in getErrorMessage: ${e})`;
      }
      return message;
    }
    let currentDomain;
    const log = (level, data, domain = currentDomain) => {
      const eventData = {
        level,
        domain
      };
      if ("object" == typeof data) Object.assign(eventData, data); else if ("string" == typeof data) {
        const field = "error" === level ? "error" : "message";
        Object.assign(eventData, {
          [field]: data
        });
      }
      globals_isWebWorkerContext() ? ((eventType, data, webworker = self) => {
        webworker.postMessage({
          type: eventType,
          eventData: data
        });
      })("Cyberhaven_Log", eventData) : function(eventName, data, {wrapVersion = addVersionToEventNameByDefault} = {}) {
        const finalEventName = wrapVersion ? addVersion(eventName) : eventName;
        data = setDetail(finalEventName, data), document.dispatchEvent(new CustomEvent(finalEventName, {
          detail: data
        }));
      }("Cyberhaven_Log", eventData);
    }, logError = (data, domain = void 0) => log("error", data, domain), logFeatureError = (eventType, data) => {
      const {error, ...rest} = data;
      logError({
        error: `Error occured in ${eventType}`,
        errorMessage: getErrorMessage(error).substring(0, 1e3),
        ...rest
      });
    };
    globals_isWebWorkerContext() || document.currentScript;
    let addVersionToEventNameByDefault = !0;
    Math.floor(1e3 * Math.random());
    function addVersion(name) {
      return `${name}_25.3.1`;
    }
    function getReplyEventName(name, wrapVersion = !0) {
      const replyEventName = `${name}_reply`;
      return wrapVersion ? addVersion(replyEventName) : replyEventName;
    }
    function listenPageEvent(eventName, callback, {ignoreSignal = !1, wrapVersion = addVersionToEventNameByDefault} = {}) {
      const replyEvent = getReplyEventName(eventName, wrapVersion), listenerEventName = wrapVersion ? addVersion(eventName) : eventName;
      document.addEventListener(listenerEventName, (async function(event) {
        try {
          const detail = getDetails(event, listenerEventName);
          let reply = await Promise.resolve(callback({
            ...event,
            detail
          }));
          void 0 !== reply && (reply = setDetail(replyEvent, reply), document.dispatchEvent(new CustomEvent(replyEvent, {
            detail: reply
          })));
        } catch (error) {
          console.error("Error in page event listener", error), logFeatureError("page-communication", {
            error
          }), abortController.abort();
        }
      }), {
        signal: ignoreSignal ? void 0 : abort_controller_getSignal(),
        capture: !0
      });
    }
    globals_isWebWorkerContext();
    const getDetails = (event, eventName) => {
      const result = window[eventName];
      return result || event.detail;
    }, setDetail = (eventName, detail) => ("undefined" != typeof cloneInto && window.wrappedJSObject && (window.wrappedJSObject[eventName] = cloneInto(detail, window)), 
    detail);
    var buffer = __webpack_require__(8287);
    var minimal = __webpack_require__(6946), minimal_default = __webpack_require__.n(minimal);
    const $Reader = minimal_default().Reader, $util = minimal_default().util, $root = minimal_default().roots.default || (minimal_default().roots.default = {}), dropbox = $root.dropbox = (() => {
      const dropbox = {};
      return dropbox.AccountPage = function() {
        function AccountPage(properties) {
          if (properties) for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i) null != properties[keys[i]] && (this[keys[i]] = properties[keys[i]]);
        }
        return AccountPage.prototype.user = null, AccountPage.prototype.displayName = "", 
        AccountPage.decode = function(reader, length) {
          reader instanceof $Reader || (reader = $Reader.create(reader));
          let end = void 0 === length ? reader.len : reader.pos + length, message = new $root.dropbox.AccountPage;
          for (;reader.pos < end; ) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
             case 1:
              message.user = $root.dropbox.UserProfile.decode(reader, reader.uint32());
              break;

             case 4:
              message.displayName = reader.string();
              break;

             default:
              reader.skipType(7 & tag);
            }
          }
          return message;
        }, AccountPage.decodeDelimited = function(reader) {
          return reader instanceof $Reader || (reader = new $Reader(reader)), this.decode(reader, reader.uint32());
        }, AccountPage.fromObject = function(object) {
          if (object instanceof $root.dropbox.AccountPage) return object;
          let message = new $root.dropbox.AccountPage;
          if (null != object.user) {
            if ("object" != typeof object.user) throw TypeError(".dropbox.AccountPage.user: object expected");
            message.user = $root.dropbox.UserProfile.fromObject(object.user);
          }
          return null != object.displayName && (message.displayName = String(object.displayName)), 
          message;
        }, AccountPage.toObject = function(message, options) {
          options || (options = {});
          let object = {};
          return options.defaults && (object.user = null, object.displayName = ""), null != message.user && message.hasOwnProperty("user") && (object.user = $root.dropbox.UserProfile.toObject(message.user, options)), 
          null != message.displayName && message.hasOwnProperty("displayName") && (object.displayName = message.displayName), 
          object;
        }, AccountPage.prototype.toJSON = function() {
          return this.constructor.toObject(this, minimal_default().util.toJSONOptions);
        }, AccountPage.getTypeUrl = function(typeUrlPrefix) {
          return void 0 === typeUrlPrefix && (typeUrlPrefix = "type.googleapis.com"), typeUrlPrefix + "/dropbox.AccountPage";
        }, AccountPage;
      }(), dropbox.UserProfile = function() {
        function UserProfile(properties) {
          if (properties) for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i) null != properties[keys[i]] && (this[keys[i]] = properties[keys[i]]);
        }
        return UserProfile.prototype.userId = 0, UserProfile.prototype.email = "", UserProfile.prototype.accountType = "", 
        UserProfile.prototype.firstName = "", UserProfile.prototype.lastName = "", UserProfile.prototype.fullName = "", 
        UserProfile.prototype.nickname = "", UserProfile.prototype.avatarUrl = "", UserProfile.prototype.verified = 0, 
        UserProfile.prototype.externalId = "", UserProfile.prototype.flags = 0, UserProfile.prototype.phoneNumber = $util.Long ? $util.Long.fromBits(0, 0, !1) : 0, 
        UserProfile.prototype.phoneNumberAlt = $util.Long ? $util.Long.fromBits(0, 0, !1) : 0, 
        UserProfile.prototype.sessionToken = "", UserProfile.prototype.permission = "", 
        UserProfile.prototype.versionId = "", UserProfile.prototype.statusCode = 0, UserProfile.decode = function(reader, length) {
          reader instanceof $Reader || (reader = $Reader.create(reader));
          let end = void 0 === length ? reader.len : reader.pos + length, message = new $root.dropbox.UserProfile;
          for (;reader.pos < end; ) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
             case 1:
              message.userId = reader.int32();
              break;

             case 2:
              message.email = reader.string();
              break;

             case 3:
              message.accountType = reader.string();
              break;

             case 6:
              message.firstName = reader.string();
              break;

             case 7:
              message.lastName = reader.string();
              break;

             case 8:
              message.fullName = reader.string();
              break;

             case 9:
              message.nickname = reader.string();
              break;

             case 10:
              message.avatarUrl = reader.string();
              break;

             case 16:
              message.verified = reader.int32();
              break;

             case 20:
              message.externalId = reader.string();
              break;

             case 23:
              message.flags = reader.int32();
              break;

             case 24:
              message.phoneNumber = reader.int64();
              break;

             case 25:
              message.phoneNumberAlt = reader.int64();
              break;

             case 26:
              message.sessionToken = reader.string();
              break;

             case 31:
              message.permission = reader.string();
              break;

             case 34:
              message.versionId = reader.string();
              break;

             case 35:
              message.statusCode = reader.int32();
              break;

             default:
              reader.skipType(7 & tag);
            }
          }
          return message;
        }, UserProfile.decodeDelimited = function(reader) {
          return reader instanceof $Reader || (reader = new $Reader(reader)), this.decode(reader, reader.uint32());
        }, UserProfile.fromObject = function(object) {
          if (object instanceof $root.dropbox.UserProfile) return object;
          let message = new $root.dropbox.UserProfile;
          return null != object.userId && (message.userId = 0 | object.userId), null != object.email && (message.email = String(object.email)), 
          null != object.accountType && (message.accountType = String(object.accountType)), 
          null != object.firstName && (message.firstName = String(object.firstName)), null != object.lastName && (message.lastName = String(object.lastName)), 
          null != object.fullName && (message.fullName = String(object.fullName)), null != object.nickname && (message.nickname = String(object.nickname)), 
          null != object.avatarUrl && (message.avatarUrl = String(object.avatarUrl)), null != object.verified && (message.verified = 0 | object.verified), 
          null != object.externalId && (message.externalId = String(object.externalId)), null != object.flags && (message.flags = 0 | object.flags), 
          null != object.phoneNumber && ($util.Long ? (message.phoneNumber = $util.Long.fromValue(object.phoneNumber)).unsigned = !1 : "string" == typeof object.phoneNumber ? message.phoneNumber = parseInt(object.phoneNumber, 10) : "number" == typeof object.phoneNumber ? message.phoneNumber = object.phoneNumber : "object" == typeof object.phoneNumber && (message.phoneNumber = new $util.LongBits(object.phoneNumber.low >>> 0, object.phoneNumber.high >>> 0).toNumber())), 
          null != object.phoneNumberAlt && ($util.Long ? (message.phoneNumberAlt = $util.Long.fromValue(object.phoneNumberAlt)).unsigned = !1 : "string" == typeof object.phoneNumberAlt ? message.phoneNumberAlt = parseInt(object.phoneNumberAlt, 10) : "number" == typeof object.phoneNumberAlt ? message.phoneNumberAlt = object.phoneNumberAlt : "object" == typeof object.phoneNumberAlt && (message.phoneNumberAlt = new $util.LongBits(object.phoneNumberAlt.low >>> 0, object.phoneNumberAlt.high >>> 0).toNumber())), 
          null != object.sessionToken && (message.sessionToken = String(object.sessionToken)), 
          null != object.permission && (message.permission = String(object.permission)), null != object.versionId && (message.versionId = String(object.versionId)), 
          null != object.statusCode && (message.statusCode = 0 | object.statusCode), message;
        }, UserProfile.toObject = function(message, options) {
          options || (options = {});
          let object = {};
          if (options.defaults) {
            if (object.userId = 0, object.email = "", object.accountType = "", object.firstName = "", 
            object.lastName = "", object.fullName = "", object.nickname = "", object.avatarUrl = "", 
            object.verified = 0, object.externalId = "", object.flags = 0, $util.Long) {
              let long = new $util.Long(0, 0, !1);
              object.phoneNumber = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else object.phoneNumber = options.longs === String ? "0" : 0;
            if ($util.Long) {
              let long = new $util.Long(0, 0, !1);
              object.phoneNumberAlt = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else object.phoneNumberAlt = options.longs === String ? "0" : 0;
            object.sessionToken = "", object.permission = "", object.versionId = "", object.statusCode = 0;
          }
          return null != message.userId && message.hasOwnProperty("userId") && (object.userId = message.userId), 
          null != message.email && message.hasOwnProperty("email") && (object.email = message.email), 
          null != message.accountType && message.hasOwnProperty("accountType") && (object.accountType = message.accountType), 
          null != message.firstName && message.hasOwnProperty("firstName") && (object.firstName = message.firstName), 
          null != message.lastName && message.hasOwnProperty("lastName") && (object.lastName = message.lastName), 
          null != message.fullName && message.hasOwnProperty("fullName") && (object.fullName = message.fullName), 
          null != message.nickname && message.hasOwnProperty("nickname") && (object.nickname = message.nickname), 
          null != message.avatarUrl && message.hasOwnProperty("avatarUrl") && (object.avatarUrl = message.avatarUrl), 
          null != message.verified && message.hasOwnProperty("verified") && (object.verified = message.verified), 
          null != message.externalId && message.hasOwnProperty("externalId") && (object.externalId = message.externalId), 
          null != message.flags && message.hasOwnProperty("flags") && (object.flags = message.flags), 
          null != message.phoneNumber && message.hasOwnProperty("phoneNumber") && ("number" == typeof message.phoneNumber ? object.phoneNumber = options.longs === String ? String(message.phoneNumber) : message.phoneNumber : object.phoneNumber = options.longs === String ? $util.Long.prototype.toString.call(message.phoneNumber) : options.longs === Number ? new $util.LongBits(message.phoneNumber.low >>> 0, message.phoneNumber.high >>> 0).toNumber() : message.phoneNumber), 
          null != message.phoneNumberAlt && message.hasOwnProperty("phoneNumberAlt") && ("number" == typeof message.phoneNumberAlt ? object.phoneNumberAlt = options.longs === String ? String(message.phoneNumberAlt) : message.phoneNumberAlt : object.phoneNumberAlt = options.longs === String ? $util.Long.prototype.toString.call(message.phoneNumberAlt) : options.longs === Number ? new $util.LongBits(message.phoneNumberAlt.low >>> 0, message.phoneNumberAlt.high >>> 0).toNumber() : message.phoneNumberAlt), 
          null != message.sessionToken && message.hasOwnProperty("sessionToken") && (object.sessionToken = message.sessionToken), 
          null != message.permission && message.hasOwnProperty("permission") && (object.permission = message.permission), 
          null != message.versionId && message.hasOwnProperty("versionId") && (object.versionId = message.versionId), 
          null != message.statusCode && message.hasOwnProperty("statusCode") && (object.statusCode = message.statusCode), 
          object;
        }, UserProfile.prototype.toJSON = function() {
          return this.constructor.toObject(this, minimal_default().util.toJSONOptions);
        }, UserProfile.getTypeUrl = function(typeUrlPrefix) {
          return void 0 === typeUrlPrefix && (typeUrlPrefix = "type.googleapis.com"), typeUrlPrefix + "/dropbox.UserProfile";
        }, UserProfile;
      }(), dropbox;
    })();
    let email;
    var fn;
    fn = async function() {
      let viewerLog;
      try {
        const edisonModule = await window.require("js/edison/edison").Edison;
        if (viewerLog = (edisonModule.getPrefetchLog() || []).find((log => "FetchViewer" === log.edisonRequest.type.value.method)), 
        !viewerLog?.result) return;
        const rawBytes = new Uint8Array(buffer.hp.from(viewerLog.result, "base64")), decoded = dropbox.AccountPage.decode(rawBytes);
        decoded.user?.email && (email = decoded.user.email);
      } catch (error) {
        logError({
          error: "Failed to parse user email from Edison.getPrefetchLog",
          message: getErrorMessage(error),
          viewerLogResult: viewerLog?.result
        });
      }
    }, "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", fn) : fn(), 
    function(fn) {
      isWebPage() && !isContentScript() && listenPageEvent("Cyberhaven_GetAccountData", (async () => {
        try {
          return await fn();
        } catch {}
        return null;
      }));
    }((async () => ({
      email
    })));
  })();
})();