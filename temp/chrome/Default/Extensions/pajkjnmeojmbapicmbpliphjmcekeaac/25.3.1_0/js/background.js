/*! For license information please see background.js.LICENSE.txt */
(() => {
  var __webpack_modules__ = {
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
    1779: module => {
      var clone = function() {
        "use strict";
        function _instanceof(obj, type) {
          return null != type && obj instanceof type;
        }
        var nativeMap, nativeSet, nativePromise;
        try {
          nativeMap = Map;
        } catch (_) {
          nativeMap = function() {};
        }
        try {
          nativeSet = Set;
        } catch (_) {
          nativeSet = function() {};
        }
        try {
          nativePromise = Promise;
        } catch (_) {
          nativePromise = function() {};
        }
        function clone(parent, circular, depth, prototype, includeNonEnumerable) {
          "object" == typeof circular && (depth = circular.depth, prototype = circular.prototype, 
          includeNonEnumerable = circular.includeNonEnumerable, circular = circular.circular);
          var allParents = [], allChildren = [], useBuffer = "undefined" != typeof Buffer;
          return void 0 === circular && (circular = !0), void 0 === depth && (depth = 1 / 0), 
          function _clone(parent, depth) {
            if (null === parent) return null;
            if (0 === depth) return parent;
            var child, proto;
            if ("object" != typeof parent) return parent;
            if (_instanceof(parent, nativeMap)) child = new nativeMap; else if (_instanceof(parent, nativeSet)) child = new nativeSet; else if (_instanceof(parent, nativePromise)) child = new nativePromise((function(resolve, reject) {
              parent.then((function(value) {
                resolve(_clone(value, depth - 1));
              }), (function(err) {
                reject(_clone(err, depth - 1));
              }));
            })); else if (clone.__isArray(parent)) child = []; else if (clone.__isRegExp(parent)) child = new RegExp(parent.source, __getRegExpFlags(parent)), 
            parent.lastIndex && (child.lastIndex = parent.lastIndex); else if (clone.__isDate(parent)) child = new Date(parent.getTime()); else {
              if (useBuffer && Buffer.isBuffer(parent)) return child = Buffer.allocUnsafe ? Buffer.allocUnsafe(parent.length) : new Buffer(parent.length), 
              parent.copy(child), child;
              _instanceof(parent, Error) ? child = Object.create(parent) : void 0 === prototype ? (proto = Object.getPrototypeOf(parent), 
              child = Object.create(proto)) : (child = Object.create(prototype), proto = prototype);
            }
            if (circular) {
              var index = allParents.indexOf(parent);
              if (-1 != index) return allChildren[index];
              allParents.push(parent), allChildren.push(child);
            }
            for (var i in _instanceof(parent, nativeMap) && parent.forEach((function(value, key) {
              var keyChild = _clone(key, depth - 1), valueChild = _clone(value, depth - 1);
              child.set(keyChild, valueChild);
            })), _instanceof(parent, nativeSet) && parent.forEach((function(value) {
              var entryChild = _clone(value, depth - 1);
              child.add(entryChild);
            })), parent) {
              var attrs;
              proto && (attrs = Object.getOwnPropertyDescriptor(proto, i)), attrs && null == attrs.set || (child[i] = _clone(parent[i], depth - 1));
            }
            if (Object.getOwnPropertySymbols) {
              var symbols = Object.getOwnPropertySymbols(parent);
              for (i = 0; i < symbols.length; i++) {
                var symbol = symbols[i];
                (!(descriptor = Object.getOwnPropertyDescriptor(parent, symbol)) || descriptor.enumerable || includeNonEnumerable) && (child[symbol] = _clone(parent[symbol], depth - 1), 
                descriptor.enumerable || Object.defineProperty(child, symbol, {
                  enumerable: !1
                }));
              }
            }
            if (includeNonEnumerable) {
              var allPropertyNames = Object.getOwnPropertyNames(parent);
              for (i = 0; i < allPropertyNames.length; i++) {
                var descriptor, propertyName = allPropertyNames[i];
                (descriptor = Object.getOwnPropertyDescriptor(parent, propertyName)) && descriptor.enumerable || (child[propertyName] = _clone(parent[propertyName], depth - 1), 
                Object.defineProperty(child, propertyName, {
                  enumerable: !1
                }));
              }
            }
            return child;
          }(parent, depth);
        }
        function __objToStr(o) {
          return Object.prototype.toString.call(o);
        }
        function __getRegExpFlags(re) {
          var flags = "";
          return re.global && (flags += "g"), re.ignoreCase && (flags += "i"), re.multiline && (flags += "m"), 
          flags;
        }
        return clone.clonePrototype = function(parent) {
          if (null === parent) return null;
          var c = function() {};
          return c.prototype = parent, new c;
        }, clone.__objToStr = __objToStr, clone.__isDate = function(o) {
          return "object" == typeof o && "[object Date]" === __objToStr(o);
        }, clone.__isArray = function(o) {
          return "object" == typeof o && "[object Array]" === __objToStr(o);
        }, clone.__isRegExp = function(o) {
          return "object" == typeof o && "[object RegExp]" === __objToStr(o);
        }, clone.__getRegExpFlags = __getRegExpFlags, clone;
      }();
      module.exports && (module.exports = clone);
    },
    2834: module => {
      "use strict";
      module.exports = string => {
        if ("string" != typeof string) throw new TypeError("Expected a string");
        return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
      };
    },
    7007: module => {
      "use strict";
      var ReflectOwnKeys, R = "object" == typeof Reflect ? Reflect : null, ReflectApply = R && "function" == typeof R.apply ? R.apply : function(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
      ReflectOwnKeys = R && "function" == typeof R.ownKeys ? R.ownKeys : Object.getOwnPropertySymbols ? function(target) {
        return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
      } : function(target) {
        return Object.getOwnPropertyNames(target);
      };
      var NumberIsNaN = Number.isNaN || function(value) {
        return value != value;
      };
      function EventEmitter() {
        EventEmitter.init.call(this);
      }
      module.exports = EventEmitter, module.exports.once = function(emitter, name) {
        return new Promise((function(resolve, reject) {
          function errorListener(err) {
            emitter.removeListener(name, resolver), reject(err);
          }
          function resolver() {
            "function" == typeof emitter.removeListener && emitter.removeListener("error", errorListener), 
            resolve([].slice.call(arguments));
          }
          eventTargetAgnosticAddListener(emitter, name, resolver, {
            once: !0
          }), "error" !== name && function(emitter, handler, flags) {
            "function" == typeof emitter.on && eventTargetAgnosticAddListener(emitter, "error", handler, flags);
          }(emitter, errorListener, {
            once: !0
          });
        }));
      }, EventEmitter.EventEmitter = EventEmitter, EventEmitter.prototype._events = void 0, 
      EventEmitter.prototype._eventsCount = 0, EventEmitter.prototype._maxListeners = void 0;
      var defaultMaxListeners = 10;
      function checkListener(listener) {
        if ("function" != typeof listener) throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
      function _getMaxListeners(that) {
        return void 0 === that._maxListeners ? EventEmitter.defaultMaxListeners : that._maxListeners;
      }
      function _addListener(target, type, listener, prepend) {
        var m, events, existing, warning;
        if (checkListener(listener), void 0 === (events = target._events) ? (events = target._events = Object.create(null), 
        target._eventsCount = 0) : (void 0 !== events.newListener && (target.emit("newListener", type, listener.listener ? listener.listener : listener), 
        events = target._events), existing = events[type]), void 0 === existing) existing = events[type] = listener, 
        ++target._eventsCount; else if ("function" == typeof existing ? existing = events[type] = prepend ? [ listener, existing ] : [ existing, listener ] : prepend ? existing.unshift(listener) : existing.push(listener), 
        (m = _getMaxListeners(target)) > 0 && existing.length > m && !existing.warned) {
          existing.warned = !0;
          var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
          w.name = "MaxListenersExceededWarning", w.emitter = target, w.type = type, w.count = existing.length, 
          warning = w, console && console.warn && console.warn(warning);
        }
        return target;
      }
      function onceWrapper() {
        if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, 
        0 === arguments.length ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
      }
      function _onceWrap(target, type, listener) {
        var state = {
          fired: !1,
          wrapFn: void 0,
          target,
          type,
          listener
        }, wrapped = onceWrapper.bind(state);
        return wrapped.listener = listener, state.wrapFn = wrapped, wrapped;
      }
      function _listeners(target, type, unwrap) {
        var events = target._events;
        if (void 0 === events) return [];
        var evlistener = events[type];
        return void 0 === evlistener ? [] : "function" == typeof evlistener ? unwrap ? [ evlistener.listener || evlistener ] : [ evlistener ] : unwrap ? function(arr) {
          for (var ret = new Array(arr.length), i = 0; i < ret.length; ++i) ret[i] = arr[i].listener || arr[i];
          return ret;
        }(evlistener) : arrayClone(evlistener, evlistener.length);
      }
      function listenerCount(type) {
        var events = this._events;
        if (void 0 !== events) {
          var evlistener = events[type];
          if ("function" == typeof evlistener) return 1;
          if (void 0 !== evlistener) return evlistener.length;
        }
        return 0;
      }
      function arrayClone(arr, n) {
        for (var copy = new Array(n), i = 0; i < n; ++i) copy[i] = arr[i];
        return copy;
      }
      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
        if ("function" == typeof emitter.on) flags.once ? emitter.once(name, listener) : emitter.on(name, listener); else {
          if ("function" != typeof emitter.addEventListener) throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
          emitter.addEventListener(name, (function wrapListener(arg) {
            flags.once && emitter.removeEventListener(name, wrapListener), listener(arg);
          }));
        }
      }
      Object.defineProperty(EventEmitter, "defaultMaxListeners", {
        enumerable: !0,
        get: function() {
          return defaultMaxListeners;
        },
        set: function(arg) {
          if ("number" != typeof arg || arg < 0 || NumberIsNaN(arg)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
          defaultMaxListeners = arg;
        }
      }), EventEmitter.init = function() {
        void 0 !== this._events && this._events !== Object.getPrototypeOf(this)._events || (this._events = Object.create(null), 
        this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
      }, EventEmitter.prototype.setMaxListeners = function(n) {
        if ("number" != typeof n || n < 0 || NumberIsNaN(n)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
        return this._maxListeners = n, this;
      }, EventEmitter.prototype.getMaxListeners = function() {
        return _getMaxListeners(this);
      }, EventEmitter.prototype.emit = function(type) {
        for (var args = [], i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var doError = "error" === type, events = this._events;
        if (void 0 !== events) doError = doError && void 0 === events.error; else if (!doError) return !1;
        if (doError) {
          var er;
          if (args.length > 0 && (er = args[0]), er instanceof Error) throw er;
          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
          throw err.context = er, err;
        }
        var handler = events[type];
        if (void 0 === handler) return !1;
        if ("function" == typeof handler) ReflectApply(handler, this, args); else {
          var len = handler.length, listeners = arrayClone(handler, len);
          for (i = 0; i < len; ++i) ReflectApply(listeners[i], this, args);
        }
        return !0;
      }, EventEmitter.prototype.addListener = function(type, listener) {
        return _addListener(this, type, listener, !1);
      }, EventEmitter.prototype.on = EventEmitter.prototype.addListener, EventEmitter.prototype.prependListener = function(type, listener) {
        return _addListener(this, type, listener, !0);
      }, EventEmitter.prototype.once = function(type, listener) {
        return checkListener(listener), this.on(type, _onceWrap(this, type, listener)), 
        this;
      }, EventEmitter.prototype.prependOnceListener = function(type, listener) {
        return checkListener(listener), this.prependListener(type, _onceWrap(this, type, listener)), 
        this;
      }, EventEmitter.prototype.removeListener = function(type, listener) {
        var list, events, position, i, originalListener;
        if (checkListener(listener), void 0 === (events = this._events)) return this;
        if (void 0 === (list = events[type])) return this;
        if (list === listener || list.listener === listener) 0 == --this._eventsCount ? this._events = Object.create(null) : (delete events[type], 
        events.removeListener && this.emit("removeListener", type, list.listener || listener)); else if ("function" != typeof list) {
          for (position = -1, i = list.length - 1; i >= 0; i--) if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener, position = i;
            break;
          }
          if (position < 0) return this;
          0 === position ? list.shift() : function(list, index) {
            for (;index + 1 < list.length; index++) list[index] = list[index + 1];
            list.pop();
          }(list, position), 1 === list.length && (events[type] = list[0]), void 0 !== events.removeListener && this.emit("removeListener", type, originalListener || listener);
        }
        return this;
      }, EventEmitter.prototype.off = EventEmitter.prototype.removeListener, EventEmitter.prototype.removeAllListeners = function(type) {
        var listeners, events, i;
        if (void 0 === (events = this._events)) return this;
        if (void 0 === events.removeListener) return 0 === arguments.length ? (this._events = Object.create(null), 
        this._eventsCount = 0) : void 0 !== events[type] && (0 == --this._eventsCount ? this._events = Object.create(null) : delete events[type]), 
        this;
        if (0 === arguments.length) {
          var key, keys = Object.keys(events);
          for (i = 0; i < keys.length; ++i) "removeListener" !== (key = keys[i]) && this.removeAllListeners(key);
          return this.removeAllListeners("removeListener"), this._events = Object.create(null), 
          this._eventsCount = 0, this;
        }
        if ("function" == typeof (listeners = events[type])) this.removeListener(type, listeners); else if (void 0 !== listeners) for (i = listeners.length - 1; i >= 0; i--) this.removeListener(type, listeners[i]);
        return this;
      }, EventEmitter.prototype.listeners = function(type) {
        return _listeners(this, type, !0);
      }, EventEmitter.prototype.rawListeners = function(type) {
        return _listeners(this, type, !1);
      }, EventEmitter.listenerCount = function(emitter, type) {
        return "function" == typeof emitter.listenerCount ? emitter.listenerCount(type) : listenerCount.call(emitter, type);
      }, EventEmitter.prototype.listenerCount = listenerCount, EventEmitter.prototype.eventNames = function() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };
    },
    4406: function(__unused_webpack_module, exports, __webpack_require__) {
      "use strict";
      var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))((function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator.throw(value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            var value;
            result.done ? resolve(result.value) : (value = result.value, value instanceof P ? value : new P((function(resolve) {
              resolve(value);
            }))).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        }));
      }, __generator = this && this.__generator || function(thisArg, body) {
        var f, y, t, g, _ = {
          label: 0,
          sent: function() {
            if (1 & t[0]) throw t[1];
            return t[1];
          },
          trys: [],
          ops: []
        };
        return g = {
          next: verb(0),
          throw: verb(1),
          return: verb(2)
        }, "function" == typeof Symbol && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n) {
          return function(v) {
            return function(op) {
              if (f) throw new TypeError("Generator is already executing.");
              for (;_; ) try {
                if (f = 1, y && (t = 2 & op[0] ? y.return : op[0] ? y.throw || ((t = y.return) && t.call(y), 
                0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                switch (y = 0, t && (op = [ 2 & op[0], t.value ]), op[0]) {
                 case 0:
                 case 1:
                  t = op;
                  break;

                 case 4:
                  return _.label++, {
                    value: op[1],
                    done: !1
                  };

                 case 5:
                  _.label++, y = op[1], op = [ 0 ];
                  continue;

                 case 7:
                  op = _.ops.pop(), _.trys.pop();
                  continue;

                 default:
                  if (!(t = _.trys, (t = t.length > 0 && t[t.length - 1]) || 6 !== op[0] && 2 !== op[0])) {
                    _ = 0;
                    continue;
                  }
                  if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
                    _.label = op[1];
                    break;
                  }
                  if (6 === op[0] && _.label < t[1]) {
                    _.label = t[1], t = op;
                    break;
                  }
                  if (t && _.label < t[2]) {
                    _.label = t[2], _.ops.push(op);
                    break;
                  }
                  t[2] && _.ops.pop(), _.trys.pop();
                  continue;
                }
                op = body.call(thisArg, _);
              } catch (e) {
                op = [ 6, e ], y = 0;
              } finally {
                f = t = 0;
              }
              if (5 & op[0]) throw op[1];
              return {
                value: op[0] ? op[1] : void 0,
                done: !0
              };
            }([ n, v ]);
          };
        }
      };
      Object.defineProperty(exports, "__esModule", {
        value: !0
      });
      var options_1 = __webpack_require__(784), delay_factory_1 = __webpack_require__(5757);
      exports.backOff = function(request, options) {
        return void 0 === options && (options = {}), __awaiter(this, void 0, void 0, (function() {
          var sanitizedOptions;
          return __generator(this, (function(_a) {
            switch (_a.label) {
             case 0:
              return sanitizedOptions = options_1.getSanitizedOptions(options), [ 4, new BackOff(request, sanitizedOptions).execute() ];

             case 1:
              return [ 2, _a.sent() ];
            }
          }));
        }));
      };
      var BackOff = function() {
        function BackOff(request, options) {
          this.request = request, this.options = options, this.attemptNumber = 0;
        }
        return BackOff.prototype.execute = function() {
          return __awaiter(this, void 0, void 0, (function() {
            var e_1;
            return __generator(this, (function(_a) {
              switch (_a.label) {
               case 0:
                if (this.attemptLimitReached) return [ 3, 7 ];
                _a.label = 1;

               case 1:
                return _a.trys.push([ 1, 4, , 6 ]), [ 4, this.applyDelay() ];

               case 2:
                return _a.sent(), [ 4, this.request() ];

               case 3:
                return [ 2, _a.sent() ];

               case 4:
                return e_1 = _a.sent(), this.attemptNumber++, [ 4, this.options.retry(e_1, this.attemptNumber) ];

               case 5:
                if (!_a.sent() || this.attemptLimitReached) throw e_1;
                return [ 3, 6 ];

               case 6:
                return [ 3, 0 ];

               case 7:
                throw new Error("Something went wrong.");
              }
            }));
          }));
        }, Object.defineProperty(BackOff.prototype, "attemptLimitReached", {
          get: function() {
            return this.attemptNumber >= this.options.numOfAttempts;
          },
          enumerable: !0,
          configurable: !0
        }), BackOff.prototype.applyDelay = function() {
          return __awaiter(this, void 0, void 0, (function() {
            return __generator(this, (function(_a) {
              switch (_a.label) {
               case 0:
                return [ 4, delay_factory_1.DelayFactory(this.options, this.attemptNumber).apply() ];

               case 1:
                return _a.sent(), [ 2 ];
              }
            }));
          }));
        }, BackOff;
      }();
    },
    8348: function(__unused_webpack_module, exports, __webpack_require__) {
      "use strict";
      var extendStatics, __extends = this && this.__extends || (extendStatics = function(d, b) {
        return extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        }, extendStatics(d, b);
      }, function(d, b) {
        function __() {
          this.constructor = d;
        }
        extendStatics(d, b), d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, 
        new __);
      });
      Object.defineProperty(exports, "__esModule", {
        value: !0
      });
      var AlwaysDelay = function(_super) {
        function AlwaysDelay() {
          return null !== _super && _super.apply(this, arguments) || this;
        }
        return __extends(AlwaysDelay, _super), AlwaysDelay;
      }(__webpack_require__(6698).Delay);
      exports.AlwaysDelay = AlwaysDelay;
    },
    6698: (__unused_webpack_module, exports, __webpack_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: !0
      });
      var jitter_factory_1 = __webpack_require__(6071), Delay = function() {
        function Delay(options) {
          this.options = options, this.attempt = 0;
        }
        return Delay.prototype.apply = function() {
          var _this = this;
          return new Promise((function(resolve) {
            return setTimeout(resolve, _this.jitteredDelay);
          }));
        }, Delay.prototype.setAttemptNumber = function(attempt) {
          this.attempt = attempt;
        }, Object.defineProperty(Delay.prototype, "jitteredDelay", {
          get: function() {
            return jitter_factory_1.JitterFactory(this.options)(this.delay);
          },
          enumerable: !0,
          configurable: !0
        }), Object.defineProperty(Delay.prototype, "delay", {
          get: function() {
            var constant = this.options.startingDelay, base = this.options.timeMultiple, power = this.numOfDelayedAttempts, delay = constant * Math.pow(base, power);
            return Math.min(delay, this.options.maxDelay);
          },
          enumerable: !0,
          configurable: !0
        }), Object.defineProperty(Delay.prototype, "numOfDelayedAttempts", {
          get: function() {
            return this.attempt;
          },
          enumerable: !0,
          configurable: !0
        }), Delay;
      }();
      exports.Delay = Delay;
    },
    5757: (__unused_webpack_module, exports, __webpack_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: !0
      });
      var skip_first_delay_1 = __webpack_require__(7510), always_delay_1 = __webpack_require__(8348);
      exports.DelayFactory = function(options, attempt) {
        var delay = function(options) {
          if (!options.delayFirstAttempt) return new skip_first_delay_1.SkipFirstDelay(options);
          return new always_delay_1.AlwaysDelay(options);
        }(options);
        return delay.setAttemptNumber(attempt), delay;
      };
    },
    7510: function(__unused_webpack_module, exports, __webpack_require__) {
      "use strict";
      var extendStatics, __extends = this && this.__extends || (extendStatics = function(d, b) {
        return extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
        }, extendStatics(d, b);
      }, function(d, b) {
        function __() {
          this.constructor = d;
        }
        extendStatics(d, b), d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, 
        new __);
      }), __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))((function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator.throw(value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            var value;
            result.done ? resolve(result.value) : (value = result.value, value instanceof P ? value : new P((function(resolve) {
              resolve(value);
            }))).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        }));
      }, __generator = this && this.__generator || function(thisArg, body) {
        var f, y, t, g, _ = {
          label: 0,
          sent: function() {
            if (1 & t[0]) throw t[1];
            return t[1];
          },
          trys: [],
          ops: []
        };
        return g = {
          next: verb(0),
          throw: verb(1),
          return: verb(2)
        }, "function" == typeof Symbol && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n) {
          return function(v) {
            return function(op) {
              if (f) throw new TypeError("Generator is already executing.");
              for (;_; ) try {
                if (f = 1, y && (t = 2 & op[0] ? y.return : op[0] ? y.throw || ((t = y.return) && t.call(y), 
                0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                switch (y = 0, t && (op = [ 2 & op[0], t.value ]), op[0]) {
                 case 0:
                 case 1:
                  t = op;
                  break;

                 case 4:
                  return _.label++, {
                    value: op[1],
                    done: !1
                  };

                 case 5:
                  _.label++, y = op[1], op = [ 0 ];
                  continue;

                 case 7:
                  op = _.ops.pop(), _.trys.pop();
                  continue;

                 default:
                  if (!(t = _.trys, (t = t.length > 0 && t[t.length - 1]) || 6 !== op[0] && 2 !== op[0])) {
                    _ = 0;
                    continue;
                  }
                  if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
                    _.label = op[1];
                    break;
                  }
                  if (6 === op[0] && _.label < t[1]) {
                    _.label = t[1], t = op;
                    break;
                  }
                  if (t && _.label < t[2]) {
                    _.label = t[2], _.ops.push(op);
                    break;
                  }
                  t[2] && _.ops.pop(), _.trys.pop();
                  continue;
                }
                op = body.call(thisArg, _);
              } catch (e) {
                op = [ 6, e ], y = 0;
              } finally {
                f = t = 0;
              }
              if (5 & op[0]) throw op[1];
              return {
                value: op[0] ? op[1] : void 0,
                done: !0
              };
            }([ n, v ]);
          };
        }
      };
      Object.defineProperty(exports, "__esModule", {
        value: !0
      });
      var SkipFirstDelay = function(_super) {
        function SkipFirstDelay() {
          return null !== _super && _super.apply(this, arguments) || this;
        }
        return __extends(SkipFirstDelay, _super), SkipFirstDelay.prototype.apply = function() {
          return __awaiter(this, void 0, void 0, (function() {
            return __generator(this, (function(_a) {
              return [ 2, !!this.isFirstAttempt || _super.prototype.apply.call(this) ];
            }));
          }));
        }, Object.defineProperty(SkipFirstDelay.prototype, "isFirstAttempt", {
          get: function() {
            return 0 === this.attempt;
          },
          enumerable: !0,
          configurable: !0
        }), Object.defineProperty(SkipFirstDelay.prototype, "numOfDelayedAttempts", {
          get: function() {
            return this.attempt - 1;
          },
          enumerable: !0,
          configurable: !0
        }), SkipFirstDelay;
      }(__webpack_require__(6698).Delay);
      exports.SkipFirstDelay = SkipFirstDelay;
    },
    8500: (__unused_webpack_module, exports) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: !0
      }), exports.fullJitter = function(delay) {
        var jitteredDelay = Math.random() * delay;
        return Math.round(jitteredDelay);
      };
    },
    6071: (__unused_webpack_module, exports, __webpack_require__) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: !0
      });
      var full_jitter_1 = __webpack_require__(8500), no_jitter_1 = __webpack_require__(4764);
      exports.JitterFactory = function(options) {
        return "full" === options.jitter ? full_jitter_1.fullJitter : no_jitter_1.noJitter;
      };
    },
    4764: (__unused_webpack_module, exports) => {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: !0
      }), exports.noJitter = function(delay) {
        return delay;
      };
    },
    784: function(__unused_webpack_module, exports) {
      "use strict";
      var __assign = this && this.__assign || function() {
        return __assign = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) for (var p in s = arguments[i]) Object.prototype.hasOwnProperty.call(s, p) && (t[p] = s[p]);
          return t;
        }, __assign.apply(this, arguments);
      };
      Object.defineProperty(exports, "__esModule", {
        value: !0
      });
      var defaultOptions = {
        delayFirstAttempt: !1,
        jitter: "none",
        maxDelay: 1 / 0,
        numOfAttempts: 10,
        retry: function() {
          return !0;
        },
        startingDelay: 100,
        timeMultiple: 2
      };
      exports.getSanitizedOptions = function(options) {
        var sanitized = __assign(__assign({}, defaultOptions), options);
        return sanitized.numOfAttempts < 1 && (sanitized.numOfAttempts = 1), sanitized;
      };
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
    3342: function(module, __unused_webpack_exports, __webpack_require__) {
      (function() {
        (module.exports = __webpack_require__(3321)).version = "5.1.2";
      }).call(this);
    },
    3321: function(module, __unused_webpack_exports, __webpack_require__) {
      (function() {
        var EventEmitter, clone, splice = [].splice, boundMethodCheck = function(instance, Constructor) {
          if (!(instance instanceof Constructor)) throw new Error("Bound instance method accessed before binding");
        }, indexOf = [].indexOf;
        clone = __webpack_require__(1779), EventEmitter = __webpack_require__(7007).EventEmitter, 
        module.exports = function() {
          class NodeCache extends EventEmitter {
            constructor(options = {}) {
              super(), this.get = this.get.bind(this), this.mget = this.mget.bind(this), this.set = this.set.bind(this), 
              this.mset = this.mset.bind(this), this.del = this.del.bind(this), this.take = this.take.bind(this), 
              this.ttl = this.ttl.bind(this), this.getTtl = this.getTtl.bind(this), this.keys = this.keys.bind(this), 
              this.has = this.has.bind(this), this.getStats = this.getStats.bind(this), this.flushAll = this.flushAll.bind(this), 
              this.flushStats = this.flushStats.bind(this), this.close = this.close.bind(this), 
              this._checkData = this._checkData.bind(this), this._check = this._check.bind(this), 
              this._isInvalidKey = this._isInvalidKey.bind(this), this._wrap = this._wrap.bind(this), 
              this._getValLength = this._getValLength.bind(this), this._error = this._error.bind(this), 
              this._initErrors = this._initErrors.bind(this), this.options = options, this._initErrors(), 
              this.data = {}, this.options = Object.assign({
                forceString: !1,
                objectValueSize: 80,
                promiseValueSize: 80,
                arrayValueSize: 40,
                stdTTL: 0,
                checkperiod: 600,
                useClones: !0,
                deleteOnExpire: !0,
                enableLegacyCallbacks: !1,
                maxKeys: -1
              }, this.options), this.options.enableLegacyCallbacks && (console.warn("WARNING! node-cache legacy callback support will drop in v6.x"), 
              [ "get", "mget", "set", "del", "ttl", "getTtl", "keys", "has" ].forEach((methodKey => {
                var oldMethod;
                oldMethod = this[methodKey], this[methodKey] = function(...args) {
                  var cb, ref;
                  if (ref = args, [...args] = ref, [cb] = splice.call(args, -1), "function" != typeof cb) return oldMethod(...args, cb);
                  try {
                    cb(null, oldMethod(...args));
                  } catch (error1) {
                    cb(error1);
                  }
                };
              }))), this.stats = {
                hits: 0,
                misses: 0,
                keys: 0,
                ksize: 0,
                vsize: 0
              }, this.validKeyTypes = [ "string", "number" ], this._checkData();
            }
            get(key) {
              var err;
              if (boundMethodCheck(this, NodeCache), null != (err = this._isInvalidKey(key))) throw err;
              return null != this.data[key] && this._check(key, this.data[key]) ? (this.stats.hits++, 
              this._unwrap(this.data[key])) : void this.stats.misses++;
            }
            mget(keys) {
              var err, i, key, len, oRet;
              if (boundMethodCheck(this, NodeCache), !Array.isArray(keys)) throw this._error("EKEYSTYPE");
              for (oRet = {}, i = 0, len = keys.length; i < len; i++) {
                if (key = keys[i], null != (err = this._isInvalidKey(key))) throw err;
                null != this.data[key] && this._check(key, this.data[key]) ? (this.stats.hits++, 
                oRet[key] = this._unwrap(this.data[key])) : this.stats.misses++;
              }
              return oRet;
            }
            set(key, value, ttl) {
              var err, existent;
              if (boundMethodCheck(this, NodeCache), this.options.maxKeys > -1 && this.stats.keys >= this.options.maxKeys) throw this._error("ECACHEFULL");
              if (this.options.forceString, null == ttl && (ttl = this.options.stdTTL), null != (err = this._isInvalidKey(key))) throw err;
              return existent = !1, this.data[key] && (existent = !0, this.stats.vsize -= this._getValLength(this._unwrap(this.data[key], !1))), 
              this.data[key] = this._wrap(value, ttl), this.stats.vsize += this._getValLength(value), 
              existent || (this.stats.ksize += this._getKeyLength(key), this.stats.keys++), this.emit("set", key, value), 
              !0;
            }
            mset(keyValueSet) {
              var err, i, j, key, keyValuePair, len, len1, ttl, val;
              if (boundMethodCheck(this, NodeCache), this.options.maxKeys > -1 && this.stats.keys + keyValueSet.length >= this.options.maxKeys) throw this._error("ECACHEFULL");
              for (i = 0, len = keyValueSet.length; i < len; i++) {
                if (keyValuePair = keyValueSet[i], ({key, val, ttl} = keyValuePair), ttl && "number" != typeof ttl) throw this._error("ETTLTYPE");
                if (null != (err = this._isInvalidKey(key))) throw err;
              }
              for (j = 0, len1 = keyValueSet.length; j < len1; j++) keyValuePair = keyValueSet[j], 
              ({key, val, ttl} = keyValuePair), this.set(key, val, ttl);
              return !0;
            }
            del(keys) {
              var delCount, err, i, key, len, oldVal;
              for (boundMethodCheck(this, NodeCache), Array.isArray(keys) || (keys = [ keys ]), 
              delCount = 0, i = 0, len = keys.length; i < len; i++) {
                if (key = keys[i], null != (err = this._isInvalidKey(key))) throw err;
                null != this.data[key] && (this.stats.vsize -= this._getValLength(this._unwrap(this.data[key], !1)), 
                this.stats.ksize -= this._getKeyLength(key), this.stats.keys--, delCount++, oldVal = this.data[key], 
                delete this.data[key], this.emit("del", key, oldVal.v));
              }
              return delCount;
            }
            take(key) {
              var _ret;
              return boundMethodCheck(this, NodeCache), null != (_ret = this.get(key)) && this.del(key), 
              _ret;
            }
            ttl(key, ttl) {
              var err;
              if (boundMethodCheck(this, NodeCache), ttl || (ttl = this.options.stdTTL), !key) return !1;
              if (null != (err = this._isInvalidKey(key))) throw err;
              return !(null == this.data[key] || !this._check(key, this.data[key])) && (ttl >= 0 ? this.data[key] = this._wrap(this.data[key].v, ttl, !1) : this.del(key), 
              !0);
            }
            getTtl(key) {
              var err;
              if (boundMethodCheck(this, NodeCache), key) {
                if (null != (err = this._isInvalidKey(key))) throw err;
                return null != this.data[key] && this._check(key, this.data[key]) ? this.data[key].t : void 0;
              }
            }
            keys() {
              return boundMethodCheck(this, NodeCache), Object.keys(this.data);
            }
            has(key) {
              return boundMethodCheck(this, NodeCache), null != this.data[key] && this._check(key, this.data[key]);
            }
            getStats() {
              return boundMethodCheck(this, NodeCache), this.stats;
            }
            flushAll(_startPeriod = !0) {
              boundMethodCheck(this, NodeCache), this.data = {}, this.stats = {
                hits: 0,
                misses: 0,
                keys: 0,
                ksize: 0,
                vsize: 0
              }, this._killCheckPeriod(), this._checkData(_startPeriod), this.emit("flush");
            }
            flushStats() {
              boundMethodCheck(this, NodeCache), this.stats = {
                hits: 0,
                misses: 0,
                keys: 0,
                ksize: 0,
                vsize: 0
              }, this.emit("flush_stats");
            }
            close() {
              boundMethodCheck(this, NodeCache), this._killCheckPeriod();
            }
            _checkData(startPeriod = !0) {
              var key, ref, value;
              for (key in boundMethodCheck(this, NodeCache), ref = this.data) value = ref[key], 
              this._check(key, value);
              startPeriod && this.options.checkperiod > 0 && (this.checkTimeout = setTimeout(this._checkData, 1e3 * this.options.checkperiod, startPeriod), 
              null != this.checkTimeout && null != this.checkTimeout.unref && this.checkTimeout.unref());
            }
            _killCheckPeriod() {
              if (null != this.checkTimeout) return clearTimeout(this.checkTimeout);
            }
            _check(key, data) {
              var _retval;
              return boundMethodCheck(this, NodeCache), _retval = !0, 0 !== data.t && data.t < Date.now() && (this.options.deleteOnExpire && (_retval = !1, 
              this.del(key)), this.emit("expired", key, this._unwrap(data))), _retval;
            }
            _isInvalidKey(key) {
              var ref;
              if (boundMethodCheck(this, NodeCache), ref = typeof key, indexOf.call(this.validKeyTypes, ref) < 0) return this._error("EKEYTYPE", {
                type: typeof key
              });
            }
            _wrap(value, ttl, asClone = !0) {
              var now;
              return boundMethodCheck(this, NodeCache), this.options.useClones || (asClone = !1), 
              now = Date.now(), {
                t: 0 === ttl ? 0 : ttl ? now + 1e3 * ttl : 0 === this.options.stdTTL ? this.options.stdTTL : now + 1e3 * this.options.stdTTL,
                v: asClone ? clone(value) : value
              };
            }
            _unwrap(value, asClone = !0) {
              return this.options.useClones || (asClone = !1), null != value.v ? asClone ? clone(value.v) : value.v : null;
            }
            _getKeyLength(key) {
              return key.toString().length;
            }
            _getValLength(value) {
              return boundMethodCheck(this, NodeCache), "string" == typeof value ? value.length : this.options.forceString ? JSON.stringify(value).length : Array.isArray(value) ? this.options.arrayValueSize * value.length : "number" == typeof value ? 8 : "function" == typeof (null != value ? value.then : void 0) ? this.options.promiseValueSize : ("undefined" != typeof Buffer && null !== Buffer ? Buffer.isBuffer(value) : void 0) ? value.length : null != value && "object" == typeof value ? this.options.objectValueSize * Object.keys(value).length : "boolean" == typeof value ? 8 : 0;
            }
            _error(type, data = {}) {
              var error;
              return boundMethodCheck(this, NodeCache), (error = new Error).name = type, error.errorcode = type, 
              error.message = null != this.ERRORS[type] ? this.ERRORS[type](data) : "-", error.data = data, 
              error;
            }
            _initErrors() {
              var _errMsg, _errT, ref;
              for (_errT in boundMethodCheck(this, NodeCache), this.ERRORS = {}, ref = this._ERRORS) _errMsg = ref[_errT], 
              this.ERRORS[_errT] = this.createErrorMessage(_errMsg);
            }
            createErrorMessage(errMsg) {
              return function(args) {
                return errMsg.replace("__key", args.type);
              };
            }
          }
          return NodeCache.prototype._ERRORS = {
            ENOTFOUND: "Key `__key` not found",
            ECACHEFULL: "Cache max keys amount exceeded",
            EKEYTYPE: "The key argument has to be of type `string` or `number`. Found: `__key`",
            EKEYSTYPE: "The keys argument has to be an array.",
            ETTLTYPE: "The ttl argument has to be a number."
          }, NodeCache;
        }.call(this);
      }).call(this);
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
  }(), __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop), 
  (() => {
    "use strict";
    new AbortController;
    const service_communication_browser = __webpack_require__.g.browser || __webpack_require__.g.chrome;
    function getExtVersion() {
      return service_communication_browser.runtime.getManifest().version;
    }
    function onMessage(destination, callback) {
      service_communication_browser.runtime.onMessage.addListener(((msg, sender) => {
        if (msg.destination === destination && msg.extVersion === getExtVersion()) return Promise.resolve(callback({
          tab: sender?.tab,
          data: msg.data
        }));
      }));
    }
    function sendMessageToTab(tabId, destination, data, options) {
      return service_communication_browser.tabs.sendMessage(tabId, {
        destination,
        data,
        extVersion: getExtVersion()
      }, options);
    }
    var backoff = __webpack_require__(4406), events = __webpack_require__(7007);
    const events_events = new (__webpack_require__.n(events)());
    function validateEventName(eventName) {
      if (eventName.endsWith("-async")) throw new Error("Don't name events with -async postfix, use onAsync, emitAsync instead");
    }
    const wrappedEvents = {
      emit: function(event, ...data) {
        validateEventName(event), events_events.emit(event, ...data);
      },
      on: function(event, listener) {
        return validateEventName(event), events_events.on(event, listener);
      },
      emitAsync: function(event, ...data) {
        return new Promise((resolve => {
          const id = Symbol();
          events_events.once(id, resolve);
          const eventData = {
            id,
            data
          };
          events_events.emit(`${event}-async`, eventData);
        }));
      },
      onAsync: function(event, listener) {
        events_events.on(`${event}-async`, (async message => {
          const result = await listener(...message.data);
          events_events.emit(message.id, result);
        })), events_events.on(event, listener);
      },
      _events: events_events
    }, RESERVED_PORTS = [ 10584, 23647, 39826, 18571, 21995, 46585, 14543, 34444, 17638, 35778 ], AVAILABLE_PROTOCOLS = [ "https", "http" ];
    class HttpHost {
      protocol;
      hostname;
      port;
      cached_pid;
      manifest=browser.runtime.getManifest();
      constructor() {
        this.protocol = AVAILABLE_PROTOCOLS[0], this.hostname = "localhost", this.port = RESERVED_PORTS[0], 
        this.cached_pid = "";
      }
      getPID() {
        return this.cached_pid || "";
      }
      getHeaders() {
        return {
          "Content-Type": "application/json",
          "Cached-Pid": this.getPID()
        };
      }
      getRequestUrl() {
        return `${this.protocol}://${this.hostname}:${this.port}/api`;
      }
      getMessageRoute(messageType) {
        return {
          download: "/notify/download",
          download_start: "/notify/download_start",
          download_remove: "/notify/download_remove",
          url: "/notify/url",
          upload: "/notify/upload",
          active_tab_change: "/notify/active_tab_change",
          supported_features: "/supported_features",
          version: "/version",
          log: "/log",
          process_event: "/notify/process_event",
          process_events_batch: "/notify/process_events_batch",
          copy_paste: "/notify/copy_paste",
          check_paste: "/check_paste",
          telemetry: "/telemetry"
        }[messageType] ?? "";
      }
      getMessageRequestOptions(message) {
        return {
          method: "POST",
          headers: this.getHeaders(),
          body: "string" == typeof message ? message : JSON.stringify(message ?? {})
        };
      }
      handleResponse(url, response) {
        if (response.ok) {
          const contentType = response.headers?.get("content-type");
          return this.cached_pid = response.headers?.get("Cached-Pid") ?? "", contentType && -1 !== contentType.indexOf("application/json") ? response.json() : response.text();
        }
        console.log("Request failed: ", "url: ", url, response.status);
      }
      async ask(message, signal) {
        const url = this.getRequestUrl() + this.getMessageRoute(message.type);
        message.extension_version = this.manifest.version;
        try {
          const response = await fetch(url, {
            ...this.getMessageRequestOptions(message),
            signal
          });
          return this.handleResponse(url, response);
        } catch (err) {
          return await this.handleFetchError(err, message);
        }
      }
      handleFetchError(err, message) {
        if (String(err).startsWith("AbortError")) throw err;
        if ("supported_features" !== message.type) throw wrappedEvents.emit("reset-features"), 
        this.cached_pid = "", err;
        if (this.useNextProtocol() || this.useNextPort()) return this.ask(message);
        throw err;
      }
      notify(message) {
        return this.ask(message);
      }
      getSupportedFeatures() {
        return this.ask({
          type: "supported_features"
        });
      }
      useNextPort() {
        const currentPortIndex = RESERVED_PORTS.findIndex((el => el == this.port)), nextPortIndex = (currentPortIndex + 1) % RESERVED_PORTS.length;
        return this.port = RESERVED_PORTS[nextPortIndex], nextPortIndex > currentPortIndex;
      }
      useNextProtocol() {
        const currentIndex = AVAILABLE_PROTOCOLS.findIndex((el => el == this.protocol)), nextIndex = (currentIndex + 1) % AVAILABLE_PROTOCOLS.length;
        return this.protocol = AVAILABLE_PROTOCOLS[nextIndex], nextIndex > currentIndex;
      }
    }
    class PromiseMap {
      map;
      constructor() {
        this.map = new Map;
      }
      has(key) {
        return this.map.has(key);
      }
      get(key) {
        return this.map.get(key);
      }
      create(key) {
        const [promise, resolve, reject] = function() {
          let res, err;
          return [ new Promise(((resolve, reject) => {
            res = resolve, err = reject;
          })), res, err ];
        }();
        return this.map.set(key, {
          promise,
          resolve,
          reject
        }), promise;
      }
      resolve(key, v) {
        this.finalize(key, v, !1);
      }
      resolveAll(v) {
        for (const key of this.map.keys()) this.resolve(key, v);
      }
      reject(key, rejectError) {
        this.finalize(key, rejectError, !0);
      }
      rejectAll(rejectError) {
        for (const key of this.map.keys()) this.reject(key, rejectError);
      }
      size() {
        return this.map.size;
      }
      finalize(key, v, fail) {
        const value = this.map.get(key);
        value && (this.map.delete(key), fail ? value.reject(v) : value.resolve(v));
      }
    }
    let hostInstance = null;
    function getHost() {
      return hostInstance || (navigator.userAgent.includes("Mac") || navigator.userAgent.includes("Linux"), 
      hostInstance = new HttpHost), hostInstance;
    }
    const host = getHost();
    async function getFeatures() {
      const response = await host.getSupportedFeatures();
      if ("success" !== response.status) throw new Error("Invalid connection status");
      return response;
    }
    const awaitTimeout = (delay, reason, defaultResolve = void 0) => new Promise(((resolve, reject) => setTimeout((() => void 0 === reason ? resolve(defaultResolve) : reject(reason)), delay)));
    let hostSupportedFeatures, hostSupportedFeaturesResolver;
    function waitForFeaturesData() {
      return !hostSupportedFeatures && hostSupportedFeaturesResolver ? hostSupportedFeaturesResolver : Promise.resolve(hostSupportedFeatures);
    }
    function isExtensionDisabled() {
      return hostSupportedFeatures && "enabled" in hostSupportedFeatures && !hostSupportedFeatures.enabled;
    }
    function getValue(obj, path) {
      return path.split(".").reduce(((acc, part) => acc && acc[part]), obj);
    }
    function isFeatureEnabled(featureName) {
      return "enabled" === featureName ? !isExtensionDisabled() : !isExtensionDisabled() && (!!hostSupportedFeatures && !!getValue(hostSupportedFeatures, featureName));
    }
    function isWebAppEnabled(webAppName) {
      return !isExtensionDisabled() && (hostSupportedFeatures?.web_apps ? !!hostSupportedFeatures.process_events && hostSupportedFeatures.web_apps?.[webAppName] : "google_workspace" === webAppName && !!hostSupportedFeatures?.process_events);
    }
    async function connect() {
      console.group("Connect to host"), hostSupportedFeaturesResolver = async function() {
        return await (0, backoff.backOff)(getFeatures, {
          startingDelay: 3e3,
          maxDelay: 3e4,
          numOfAttempts: 1e6,
          jitter: "full",
          retry: (_, attempt) => (console.log("Attempt to retrieve supported features #" + attempt), 
          !0)
        });
      }(), hostSupportedFeatures = await hostSupportedFeaturesResolver, console.log("Supported features:"), 
      console.log(JSON.stringify(hostSupportedFeatures, null, 2)), console.groupEnd();
    }
    async function initFeatureFlags() {
      await connect(), async function() {
        const minutes = hostSupportedFeatures?.update_features_interval_minutes;
        console.log("Update features interval:", minutes, "minutes"), minutes && Number.isInteger(minutes) && minutes > 0 ? await browser.alarms.get("update_features") || (console.log("Create update alarm, minutes: ", minutes), 
        browser.alarms.create("update_features", {
          periodInMinutes: minutes
        })) : (console.log(`Update interval minutes: ${minutes}. Clearing update alarm...`), 
        browser.alarms.clear("update_features"));
      }(), wrappedEvents.emit("report-version");
    }
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
    const getFormattedPageData = pageData => {
      const email = pageData.metadata?.email, pageDataLog = pageData;
      return delete pageDataLog.metadata?.email, delete pageDataLog.default_object_type, 
      pageDataLog.cloud_account_len10 = !!email && email.length > 10, pageDataLog.url = pageDataLog.url?.substring(0, 100), 
      pageDataLog.title = pageDataLog.title?.substring(0, 100), pageDataLog;
    };
    let loggers = null;
    function getLoggers() {
      return loggers || (loggers = new Map), loggers;
    }
    class Logger {
      host;
      domain;
      manifest;
      constructor(host, domain) {
        this.host = host, this.domain = domain, this.manifest = browser.runtime.getManifest();
      }
      info(data) {
        console.log(data.event || data.fn || data.type || "info", data), this.send("info", data);
      }
      debug(data) {
        console.debug(data), this.send("debug", data);
      }
      error(data, {pageData} = {}) {
        console.error(data);
        try {
          if (!data.error) return void this.send("error", {
            error: "Error message is empty",
            data
          });
          const sendErrorWithPageData = (data, pageData) => {
            this.send("error", {
              ...data,
              page_data: getFormattedPageData(pageData),
              error: `(${pageData.cloud_provider}) ${getErrorMessage(data.error).toString()}`
            });
          };
          pageData ? sendErrorWithPageData(data, pageData) : this.send("error", data);
        } catch (e) {
          this.send("error", data), this.send("error", {
            error: getErrorMessage(e),
            domain: "logging"
          });
        }
      }
      success(backendEvent, pageData) {
        this.send("info", {
          event_type: backendEvent.sensor_data.event_type,
          page_data: getFormattedPageData(pageData)
        });
      }
      warning(data) {
        console.warn(data), this.send("warning", data);
      }
      send(level, logData) {
        isFeatureEnabled("logging") && this.host.notify({
          browser: "chrome",
          version: this.manifest.version,
          manifest_version: this.manifest.manifest_version,
          domain: this.domain,
          type: "log",
          level,
          log_data: logData
        });
      }
    }
    function getLogger(host, domain) {
      const loggers = getLoggers();
      return loggers.has(domain) || loggers.set(domain, new Logger(host, domain)), loggers.get(domain);
    }
    const logger = getLogger(getHost(), "storage"), STORAGE = {}, saveToTempStorage = async (key, value) => STORAGE[key] = value, cleanupStorage = async () => {
      await browser.storage.local.clear();
      const storageSettings = {
        lastTimeCleaned: Date.now()
      };
      await saveToPermStorage("storage_settings", storageSettings);
    }, checkStorageSize = async () => {
      const data = await browser.storage.local.get(null), size = JSON.stringify(data)?.length;
      if (size > 7340032) {
        const lastTimeCleaned = data.storage_settings?.lastTimeCleaned, currentTime = Date.now();
        logger.error({
          error: "Clearing permanent storage as it exceeds DEFAULT_CLEANUP_SIZE MB",
          size,
          lastTimeCleaned,
          currentTime
        }), cleanupStorage();
      }
    }, app_storage_getWebAppKey = key => `webapp-${key}`, saveToPermStorage = async (key, value) => {
      try {
        if (JSON.stringify(value).length > 1048576) return void logger.error({
          error: "Value size exceeds 1 MB",
          key
        });
        const result = await browser.storage.local.set({
          [key]: value
        });
        return checkStorageSize(), result;
      } catch (error) {
        logger.error({
          errorMessage: getErrorMessage(error),
          error: "Failed to save to permanent storage",
          key
        }), error.message.includes("QUOTA_BYTES") && cleanupStorage();
      }
    }, deleteFromPermStorage = async key => await browser.storage.local.remove(key), app_storage_getFromPermStorage = async key => {
      const result = await browser.storage.local.get(key);
      return result?.[key];
    };
    const getFromStorage = async (keyS, storageType = "permanent") => {
      const key = app_storage_getWebAppKey(keyS);
      let result = (key => STORAGE[key])(key);
      return result || "permanent" !== storageType || (result = await app_storage_getFromPermStorage(key), 
      saveToTempStorage(key, result)), result;
    }, saveToStorage = async (keyS, storageType = "permanent", value) => {
      const key = app_storage_getWebAppKey(keyS);
      saveToTempStorage(key, value), "permanent" === storageType && saveToPermStorage(key, value);
    };
    function setupWebAppStorage() {
      checkStorageSize(), onMessage("webapp-storage", (async ({data}) => {
        if ("get" === data.type) return getFromStorage(data.key, data.storage);
        "set" === data.type && saveToStorage(data.key, data.storage, data.value);
      }));
      const getCookie = async (url, name) => (await browser.cookies.get({
        name,
        url
      }))?.value;
      onMessage("webapp-cookies", (async ({tab}) => {
        switch (new URL(tab?.url + "").hostname) {
         case "github.dev":
          return await getCookie("https://github.com/", "dotcom_user");

         case "www.reddit.com":
          return await getCookie("https://www.reddit.com/", "token_v2");
        }
      }));
    }
    var node_cache = __webpack_require__(3342), node_cache_default = __webpack_require__.n(node_cache);
    function getFilename(dispositionHeader) {
      if (dispositionHeader?.startsWith("attachment")) return function(header) {
        const filenameRegex = /filename\*?=([^']*'')?([^;]*)/;
        let matches;
        try {
          matches = filenameRegex.exec(decodeURI(header));
        } catch {
          matches = /filename=([^']*'')?([^;]*)/.exec(header);
        }
        if (null != matches && matches[2]) return matches[2].replace(/['"]/g, "");
      }(dispositionHeader);
    }
    const group = class {
      host;
      feature;
      logger;
      RESOURCE_TYPES_DOWNLOAD=[ "main_frame", "sub_frame" ];
      constructor(feature, domain) {
        this.host = getHost(), this.feature = feature, this.logger = getLogger(this.host, domain);
      }
      wrapCallbackWithTryCatch(callback) {
        const callbackName = callback.name || "anonymous";
        return async (...args) => {
          try {
            return await callback(...args);
          } catch (err) {
            return void this.logger.error({
              error: `Error in callback: ${callbackName}`,
              errorMessage: getErrorMessage(err)
            });
          }
        };
      }
      listen(context, callback, extras) {
        const proxy = function(callback, features, defaultReturnValue) {
          return async (...args) => (await Promise.any([ waitForFeaturesData(), awaitTimeout(1e3) ]), 
          "string" == typeof features && (features = [ features ]), features.map(isFeatureEnabled).some(Boolean) ? callback(...args) : defaultReturnValue || void 0);
        }(this.wrapCallbackWithTryCatch(callback), this.feature);
        context.addListener(proxy, ...extras || []);
      }
      isWebAppOn(webAppName) {
        return isWebAppEnabled(webAppName);
      }
      isFeatureOn(featureName) {
        return isFeatureEnabled(featureName);
      }
    };
    const omitByUndefined = obj => Object.fromEntries(Object.entries(obj).filter((([_, value]) => void 0 !== value)));
    async function getPageData(tabId) {
      try {
        const pageData = await sendMessageToTab(tabId, "get-page-data", null);
        return pageData.metadata || (pageData.metadata = {}), (pageData => {
          return {
            ...pageData,
            ...pageData.metadata ? {
              metadata: (obj = pageData.metadata, Object.fromEntries(Object.entries(obj).map((([key, value]) => [ key, null === value ? "" : value ]))))
            } : {}
          };
          var obj;
        })(pageData);
      } catch {
        try {
          const tab = await browser.tabs.get(tabId);
          return {
            url: tab.url,
            title: tab.title,
            metadata: {}
          };
        } catch (error) {
          if (error.message.startsWith("No tab with id")) throw new Error("Failed to get page data and tab by id, no tab with such id");
          throw error;
        }
      }
    }
    async function getAllPageDataFormats(tabId) {
      const {metadata, ...extraMetadata} = await getPageData(tabId), cloud_account = metadata?.email, cloud_provider = extraMetadata?.cloud_provider, cloud_app = "gsuite" === metadata?.account_type ? "gdrive" : metadata?.account_type, object_type = extraMetadata.default_object_type;
      let extras = {};
      return [ "notion_page", "cloud_file_notion" ].includes(object_type) && (extras = {
        page_id: metadata?.notion_page_id,
        page_name: metadata?.notion_page_name,
        page_full_path: metadata?.notion_page_full_path,
        account_id: metadata?.notion_account_id,
        account_name: metadata?.notion_account_name,
        url: extraMetadata.url,
        title: extraMetadata.title
      }), {
        pageData: {
          metadata,
          ...extraMetadata
        },
        backendObjectPageData: omitByUndefined({
          cloud_account,
          cloud_app,
          cloud_provider,
          object_type,
          ...extras
        })
      };
    }
    async function getObjectPageDataForBackendEvent(tabId = 0) {
      return (await getAllPageDataFormats(tabId))?.backendObjectPageData;
    }
    function getFullPathFromMessageData({pathComponents, pathIds}) {
      return omitByUndefined({
        file_path_components: pathComponents,
        file_path_ids: pathIds
      });
    }
    const getFullPath = async (tabId, fileId) => {
      try {
        const timeout = awaitTimeout(2e3, void 0, {});
        return getFullPathFromMessageData(await Promise.race([ sendMessageToTab(tabId, "get-fullpath", {
          fileId
        }), timeout ]) || {});
      } catch (error) {
        return console.log("Failed to get full pat for", tabId, fileId), null;
      }
    };
    class GoogleWorkspaceIntegration extends group {
      requestToFieldId;
      onFieldIdExtracted;
      apps=[ "document", "spreadsheets", "presentation", "videos", "forms", "drawings" ];
      downloadsPromiseMap=new PromiseMap;
      navTargetsTabIds=new Set;
      navigationData=new (node_cache_default())({
        useClones: !1,
        deleteOnExpire: !0,
        stdTTL: 60
      });
      constructor(requestToFieldId, onFieldIdExtracted) {
        super("process_events", "google_workspace"), this.requestToFieldId = requestToFieldId, 
        this.onFieldIdExtracted = onFieldIdExtracted;
      }
      async handleConvertToGoogleFormat(tabId, url) {
        const objectUrl = new URL(url);
        if (objectUrl.hostname.endsWith(".google.com") && objectUrl.pathname.endsWith("/sdconvert")) {
          if (this.downloadsPromiseMap.has(url)) return;
          try {
            const sourceId = objectUrl.searchParams.get("copySourceId");
            if (sourceId) {
              this.downloadsPromiseMap.create(url);
              let tab = await browser.tabs.get(tabId);
              if (tab) {
                for (;"complete" !== tab.status; ) tab = await browser.tabs.get(tabId), await awaitTimeout(500);
                const dIndex = tab.url?.indexOf("/d/");
                if (dIndex) {
                  const destId = tab.url?.substring(dIndex + 3, tab.url.indexOf("/", dIndex + 3));
                  if (!destId) return void this.logger.error({
                    domain: "google_workspace",
                    error: "missing destination id",
                    sourceUrl: url,
                    destUrl: tab.url
                  });
                  const destTitle = await sendMessageToTab(tab.id, "get-document-title", null);
                  if (!destTitle) return void this.logger.error({
                    domain: "google_workspace",
                    error: "missing destination title",
                    sourceUrl: url,
                    destUrl: tab.url
                  });
                  const [sourceTab] = await browser.tabs.query({
                    url: `https://*.google.com/*/d/${sourceId}/*`,
                    active: !1,
                    status: "complete"
                  });
                  if (!sourceTab) return void this.logger.error({
                    error: "missing source tab",
                    domain: "google_workspace",
                    sourceUrl: url,
                    destUrl: tab.url
                  });
                  const sourceTitle = sourceTab.title?.substring(0, sourceTab.title?.lastIndexOf("-") - 1);
                  if (!sourceTitle) return void this.logger.error({
                    domain: "google_workspace",
                    error: "missing source title",
                    sourceUrl: url,
                    destUrl: tab.url
                  });
                  const backendObjectPageData = await getObjectPageDataForBackendEvent(tab?.id);
                  wrappedEvents.emit("process-events", {
                    event_type: "save_as",
                    source: {
                      ...backendObjectPageData,
                      file_id: sourceId,
                      file_name: sourceTitle,
                      file_path: sourceTitle
                    },
                    destination: {
                      ...backendObjectPageData,
                      file_id: destId,
                      file_name: destTitle,
                      file_path: destTitle
                    }
                  });
                }
              }
            }
          } catch (err) {
            this.logger.error({
              event: "convert to google format",
              error: getErrorMessage(err)
            });
          } finally {
            this.downloadsPromiseMap.resolve(url);
          }
        }
      }
      handleDownloadAs(requestId, url) {
        const objectUrl = new URL(url);
        if (objectUrl.searchParams.has("id")) if (objectUrl.pathname.includes("export")) {
          const id = objectUrl.searchParams.get("id");
          this.requestToFieldId.set(requestId, id);
        } else if (objectUrl.pathname.endsWith("pdf")) {
          const id = objectUrl.searchParams.get("id");
          this.requestToFieldId.set(requestId, id);
        }
        if (this.requestToFieldId.has(requestId) && objectUrl.hostname.endsWith(".googleusercontent.com") && (objectUrl.pathname.startsWith("/export") || objectUrl.pathname.startsWith("/pdf"))) {
          const fileId = this.requestToFieldId.get(requestId);
          this.onFieldIdExtracted(url, fileId);
        }
      }
      async getCloudFileMetadata(tabId, url) {
        const {backendObjectPageData, pageData} = await getAllPageDataFormats(tabId), {cloud_file_id, cloud_file_name} = pageData.metadata || {};
        if (cloud_file_id && cloud_file_name) return {
          ...backendObjectPageData,
          file_id: cloud_file_id,
          file_name: cloud_file_name,
          file_path: cloud_file_name,
          file_url: url
        };
        this.logger.error({
          error: "No cloud_file_id or cloud_file_name in metadata",
          url
        });
      }
      async handleCreateEvent(navItem, tabId, url) {
        try {
          const fileMetadata = await this.getCloudFileMetadata(tabId, url);
          if ("google_cloud" !== fileMetadata?.cloud_provider) throw new Error("Not a google cloud file");
          let fullPath = navItem.fullPath;
          if (fullPath) fullPath.file_path_components?.push(fileMetadata.file_name), fullPath.file_path_ids?.push(fileMetadata.file_id); else {
            const pageDataTabId = navItem.sourceTabId || tabId;
            pageDataTabId && (fullPath = await getFullPath(pageDataTabId, fileMetadata.file_id));
          }
          wrappedEvents.emit("process-events", {
            event_type: "create",
            source: {
              ...fileMetadata,
              ...fullPath,
              file_url: navItem.sourceTabUrl || fileMetadata.file_url
            },
            destination: {
              ...fileMetadata,
              ...fullPath,
              file_url: url
            }
          });
        } catch (error) {
          this.logger.error({
            error: getErrorMessage(error) || "An error occurred during handleCreateEvent",
            url
          });
        }
      }
      async handleOpenEvent(navItem, tabId, url) {
        try {
          const fileMetadata = await this.getCloudFileMetadata(tabId, url);
          if ("google_cloud" !== fileMetadata?.cloud_provider) throw new Error("Not a google cloud file");
          const fullPath = navItem.sourceTabId ? await getFullPath(navItem.sourceTabId, fileMetadata.file_id) : await getFullPath(tabId, fileMetadata.file_id);
          wrappedEvents.emit("process-events", {
            event_type: "app_access",
            source: {
              ...fileMetadata,
              ...fullPath
            },
            destination: {
              ...fileMetadata,
              ...fullPath,
              file_url: url
            }
          });
        } catch (error) {
          this.logger.error({
            error: getErrorMessage(error) || "An error occurred during handleOpenEvent",
            url
          });
        }
      }
      registerOpenCreateEventListeners() {
        "onCreatedNavigationTarget" in browser.webNavigation && browser.webNavigation.onCreatedNavigationTarget.addListener((async ({sourceTabId, tabId, url}) => {
          this.navTargetsTabIds.add(tabId), this.navigationData.set(tabId, {
            sourceTabId,
            url,
            timestamp: Date.now()
          });
          const sourceFolderId = new URL(url).searchParams.get("folder"), documentId = /\/d\/([a-zA-Z0-9_-]+)/.exec(url)?.[1], parent = sourceFolderId || documentId;
          if (parent) {
            const [pageData, fullPath] = await Promise.all([ await getPageData(sourceTabId), getFullPath(sourceTabId, parent) ]), navigationItem = this.navigationData.get(tabId);
            this.navigationData.set(tabId, {
              ...navigationItem,
              fullPath,
              sourceTabUrl: pageData.url
            });
          }
        }), {
          url: [ {
            originAndPathMatches: `docs.google.com/(${this.apps.join("|")})/create`
          }, {
            originAndPathMatches: `docs.google.com/(${this.apps.join("|")})/d/`
          } ]
        }), browser.webNavigation.onCompleted.addListener((event => {
          const {url, tabId, timeStamp} = event;
          if (this.navTargetsTabIds.has(tabId)) {
            const navItem = this.navigationData.get(tabId);
            if (this.navTargetsTabIds.delete(tabId), this.navigationData.del(tabId), Date.now() - navItem.timestamp > 3e4) return void this.logger.error({
              error: "Create/Open document event handler took too long",
              url,
              durationAfterNavTargetCreated: Date.now() - navItem.timestamp
            });
            navItem.url.includes("/create") ? this.handleCreateEvent(navItem, tabId, url) : this.handleOpenEvent(navItem, tabId, url);
          } else this.handleOpenEvent({
            url,
            timestamp: timeStamp
          }, tabId, url);
        }), {
          url: [ {
            originAndPathMatches: `docs.google.com/(${this.apps.join("|")})/d/`
          } ]
        }), browser.webRequest.onHeadersReceived.addListener((event => {
          200 === event.statusCode && (this.navTargetsTabIds.add(event.tabId), this.navigationData.set(event.tabId, {
            url: event.url,
            timestamp: Date.now()
          }));
        }), {
          urls: this.apps.map((app => `https://docs.google.com/${app}/u/*/createfromtemplate?*`)),
          types: [ "xmlhttprequest" ]
        });
      }
      registerDownloadAsConvertListeners() {
        const filterUrls = [ "https://*.google.com/*/export?*", "https://*.google.com/*/pdf?*", "https://*.googleusercontent.com/export/*", "https://*.googleusercontent.com/pdf/*", "https://mail-attachment.googleusercontent.com/attachment/*", "https://*.google.com/*/sdconvert?*" ];
        this.listen(browser.webRequest.onBeforeRequest, (event => {
          try {
            const {url, requestId} = event;
            if (this.handleDownloadAs(requestId, url), this.handleConvertToGoogleFormat(event.tabId, url), 
            url.includes("/attachment")) {
              const id = new URL(url).searchParams.get("realattid");
              id && this.onFieldIdExtracted(url, id);
            }
          } catch (error) {
            this.logger.error({
              event: "unable to extract google external file id on export",
              error: getErrorMessage(error),
              url: event.url
            });
          }
        }), [ {
          urls: filterUrls,
          types: this.RESOURCE_TYPES_DOWNLOAD
        } ]);
      }
      setup() {
        this.registerOpenCreateEventListeners(), this.registerDownloadAsConvertListeners();
      }
    }
    class BoxDownloads extends group {
      requestToFieldId;
      onFieldIdExtracted;
      constructor(requestToFieldId, onFieldIdExtracted) {
        super("process_events", "box"), this.requestToFieldId = requestToFieldId, this.onFieldIdExtracted = onFieldIdExtracted;
      }
      webRequest_onBeforeRequest=event => {
        try {
          if (this.isWebAppOn("box")) {
            const {url, requestId} = event, objectUrl = new URL(url);
            if ("https://app.box.com" === objectUrl.origin) {
              if ("box_v2_download_file" === objectUrl.searchParams.get("rm")) {
                const fileId = objectUrl.searchParams.get("file_id")?.substring(2) ?? void 0;
                fileId ? this.requestToFieldId.set(requestId, fileId) : this.logger.error({
                  error: "missing file id in download request url",
                  url
                });
              }
            } else if (objectUrl.hostname.endsWith(".boxcloud.com") && this.requestToFieldId.has(requestId)) {
              const fileId = this.requestToFieldId.get(requestId);
              fileId ? this.onFieldIdExtracted(url, fileId) : this.logger.error({
                error: "missing file id in downloads requestToFileId map",
                url
              });
            }
          }
        } catch (error) {
          this.logger.error({
            error: "unable to extract box external file id on download",
            errorMessage: getErrorMessage(error),
            url: event.url
          });
        }
      };
      setup() {
        browser.webRequest.onBeforeRequest.addListener(this.webRequest_onBeforeRequest, {
          urls: [ "https://app.box.com/*", "https://*.boxcloud.com/*" ],
          types: this.RESOURCE_TYPES_DOWNLOAD
        });
      }
    }
    const delay = ms => new Promise((r => setTimeout(r, ms))), retryWithDelay = async (fn, retries = 3, interval = 50, isValid = result => !!result) => {
      try {
        const result = await fn();
        if (!isValid(result)) throw Error("Empty result");
        return result;
      } catch (err) {
        return retries <= 0 ? Promise.reject(err) : (await delay(interval), retryWithDelay(fn, retries - 1, interval, isValid));
      }
    };
    class SalesforceDownloads extends group {
      constructor() {
        super("process_events", "salesforce");
      }
      async getReportMetadata(tabId, reportId) {
        try {
          return await Promise.any([ sendMessageToTab(tabId, "get-report-metadata", {
            reportId
          }), awaitTimeout(500, "get-report-metadata timeoiut error") ]);
        } catch (error) {
          this.logger.error({
            error: "failed to get report metadata",
            errorMessage: getErrorMessage(error)
          });
        }
        return null;
      }
      webRequest_onBeforeRequest=async event => {
        try {
          const url = event.url;
          let reportId;
          if (url.includes("/servlet/PrintableViewDownloadServlet")) {
            reportId = new URLSearchParams(url).get("reportId");
          } else /my\.salesforce\.com\/[A-Za-z0-9]{18}\?.*isdtp=p1/.test(url) && (reportId = new URL(url).pathname.substring(1));
          if (reportId) {
            const tabId = (await browser.tabs.get(event.tabId)).openerTabId ?? event.tabId;
            wrappedEvents.emit("download-metadata", url, {
              salesforce_report_id: reportId
            });
            const metadata = await this.getReportMetadata(tabId, reportId);
            metadata && wrappedEvents.emit("download-metadata", url, metadata);
          }
        } catch (error) {
          this.logger.error({
            error: "error occured in download salesforce report onBeforeRequest",
            errorMessage: getErrorMessage(error)
          });
        }
      };
      setup() {
        this.listen(browser.webRequest.onBeforeRequest, (details => {
          this.webRequest_onBeforeRequest(details);
        }), [ {
          urls: [ "https://*.my.salesforce.com/*" ],
          types: this.RESOURCE_TYPES_DOWNLOAD
        } ]);
      }
    }
    const tabInfoKey = url => `download:${url}:tabInfo`, downloadPageDataKey = id => `download:${id}:pageData`, downloadFileIdKey = id => `download:${id}:fileId`, requestIdKey = id => `download:${id}:requestId`, downloadFileFullPath = id => `download:${id}:fullpath`, isBase64Url = /^data:(.*?);base64,/, skipFileNames = new Set([ ".DS_Store", "Thumbs.db", "unspecified", "response.bin", "response.txt", "MeControlMediumUserTile", "json.txt", "f.txt", "font.woff2" ]), downloadAllowedUrls = {
      dropbox: new Set([ "dropboxusercontent" ])
    };
    const downloads = class extends group {
      ALL_URLS={
        urls: [ "<all_urls>" ]
      };
      TAB_INFO_TTL=40;
      requestUrlToTab;
      requestIdToFileId;
      downloadSuggestions;
      downloadMetadataExtras;
      downloadsPromiseMap;
      constructor() {
        super("download_notification", "downloads"), this.requestUrlToTab = new (node_cache_default())({
          checkperiod: 10,
          useClones: !1,
          deleteOnExpire: !0
        }), this.requestIdToFileId = new (node_cache_default())({
          checkperiod: 7,
          useClones: !1,
          deleteOnExpire: !0
        }), this.downloadSuggestions = new (node_cache_default())({
          checkperiod: 10,
          useClones: !1,
          deleteOnExpire: !0
        }), this.downloadMetadataExtras = new (node_cache_default())({
          checkperiod: 60,
          useClones: !1,
          deleteOnExpire: !0
        }), this.downloadsPromiseMap = new PromiseMap, new GoogleWorkspaceIntegration(this.requestIdToFileId, this.handleDownloadExternalFieldId).setup(), 
        new BoxDownloads(this.requestIdToFileId, this.handleDownloadExternalFieldId).setup(), 
        (new SalesforceDownloads).setup(), wrappedEvents.on("download-metadata", ((url, metadata) => {
          this.downloadMetadataExtras.set(url, metadata, 300);
        }));
      }
      handleDownloadExternalFieldId=(url, fileId) => {
        this.updateRequestToUrlStorage(url, {
          fileId
        });
      };
      getFileIdFromUrl(url) {
        const urlObject = new URL(url);
        if (urlObject.hostname.endsWith("sharepoint.com")) {
          const params = new URLSearchParams(urlObject.search);
          return params.get("UniqueId")?.replace("{", "")?.replace("}", "") || void 0;
        }
        if (urlObject.hostname.includes("drive.usercontent.google.com")) {
          return new URLSearchParams(urlObject.search).get("id") || void 0;
        }
        if (urlObject.hostname.includes("google.com") && urlObject.pathname.includes("/d/")) return urlObject.pathname.split("/")[3];
        if (urlObject.hostname.endsWith("lightning.force.com") && /.*\/document\/download\/[0-9a-zA-Z]{18}$/.test(urlObject.pathname)) {
          const parts = urlObject.pathname.split("/");
          return parts[parts.length - 1];
        }
        if (urlObject.hostname.endsWith("notion.so") && urlObject.pathname.startsWith("/signed/")) {
          return new URLSearchParams(urlObject.search).get("id") || void 0;
        }
      }
      getFileIdFromPageData(pageData) {
        if (!pageData.url) return;
        const urlObject = new URL(pageData.url);
        if (urlObject.hostname.endsWith("sharepoint.com") && isWebAppEnabled("office_365")) {
          const params = new URLSearchParams(urlObject.search);
          let fileId = params.get("sourcedoc")?.replace("{", "")?.replace("}", "") || void 0;
          return fileId || (fileId = pageData.metadata?.fileId), fileId;
        }
      }
      downloads_onCreated=async item => {
        if ("in_progress" !== item.state) return;
        let tabId, fileId, requestId;
        if (this.downloadsPromiseMap.create(item.id), isBase64Url.test(item.url || item.finalUrl)) {
          const active = await browser.tabs.query({
            active: !0,
            currentWindow: !0
          });
          tabId = active[0]?.id;
        } else if (item.url.startsWith("blob:")) {
          const [activeTab] = await browser.tabs.query({
            active: !0,
            currentWindow: !0
          });
          tabId = activeTab.id;
        } else try {
          const tabInfo = await retryWithDelay((() => this.getDownloadTabInfo(item)), 3, 100);
          tabId = "sourceTabId" in tabInfo ? tabInfo.sourceTabId : tabInfo.tabId, fileId = tabInfo.fileId || this.getFileIdFromUrl(item.url || item.finalUrl), 
          requestId = tabInfo.requestId;
        } catch (error) {
          if ("Retry failed" === error.message) return this.logger.error({
            fn: "downloads_onCreated",
            error: "missing tab info",
            downloadItem: item
          }), void this.downloadsPromiseMap.reject(item.id, new Error("downloads_onCreated: missing tab info"));
          throw error;
        }
        if (!tabId) {
          const active = await browser.tabs.query({
            active: !0,
            currentWindow: !0
          });
          tabId = active[0]?.id;
        }
        if (tabId) {
          const pageData = await getPageData(tabId);
          if (await this.setDownloadPageData(item, pageData), fileId || (fileId = this.getFileIdFromPageData(pageData)), 
          fileId) {
            await this.setDownloadFileID(item, fileId);
            const fullPath = await getFullPath(tabId, fileId);
            fullPath && this.setDownloadFullPath(item, fullPath);
          }
          return requestId && await this.setRequestId(item, requestId), void this.downloadsPromiseMap.resolve(item.id);
        }
        this.logger.error({
          fn: "downloads_onCreated",
          error: "missing tab id",
          item
        }), this.downloadsPromiseMap.reject(item.id, new Error("missing tab id"));
      };
      downloads_onChanged=async delta => {
        if ("complete" === delta.state?.current) try {
          const [item] = await browser.downloads.search({
            id: delta.id
          });
          this.downloadsPromiseMap.has(item.id) && await this.downloadsPromiseMap.get(item.id).promise;
          const pageData = await this.getDownloadPageData(delta.id);
          pageData || this.logger.error({
            fn: "downloads_onChanged",
            error: "missing page data",
            downloadItem: item
          });
          const fileId = await this.getDownloadFileID(delta.id), requestId = await this.getRequestId(delta.id), fullPath = await this.getDownloadFileFullPath(delta.id);
          await this.sendDownloadEvent(item, pageData, "download", fileId, fullPath, requestId);
        } catch (error) {
          this.logger.error({
            fn: "downloads_onChanged",
            error: "download event error",
            errorMessage: getErrorMessage(error),
            downloadItem: delta
          });
        }
        [ "complete", "interrupted" ].includes(delta.state?.current) && (deleteFromPermStorage(downloadPageDataKey(delta.id)), 
        deleteFromPermStorage(downloadFileIdKey(delta.id)), deleteFromPermStorage(downloadFileFullPath(delta.id)));
      };
      webRequest_onResponseStarted=async details => {
        if (function(requestUrl) {
          const url = new URL(requestUrl);
          return RESERVED_PORTS.includes(parseInt(url.port));
        }(details.url)) return;
        const contentDisposition = details.responseHeaders?.find((({name}) => "Content-Disposition" === name));
        if (contentDisposition) {
          const filename = getFilename(contentDisposition.value);
          if (filename && !skipFileNames.has(filename)) {
            let pageData;
            const tabInfo = await retryWithDelay((() => this.getDownloadTabInfo({
              finalUrl: details.url
            })), 1, 100);
            if (tabInfo) {
              const sourceTabId = "sourceTabId" in tabInfo ? tabInfo?.sourceTabId : tabInfo?.tabId;
              sourceTabId && (pageData = await getPageData(sourceTabId));
            }
            if (!pageData) {
              const tabId = details.tabId;
              pageData = await getPageData(tabId);
            }
            if (!pageData || !pageData.metadata) return;
            if ((pageData.metadata.account_type || "") in downloadAllowedUrls) {
              const accountType = pageData.metadata?.account_type, allowedUrls = downloadAllowedUrls[accountType], url = new URL(details.url);
              if (![ ...allowedUrls.entries() ].find((([_, urlFilter]) => url.hostname.includes(urlFilter)))) return void console.log("webRequest_onResponseStarted", "not allowed", url.hostname);
              console.log("filtered by allowed url list", details.url);
            }
            const fileId = this.requestIdToFileId.get(details.requestId) || this.getFileIdFromUrl(details.url) || this.getFileIdFromPageData(pageData), contentLength = details.responseHeaders?.find((({name}) => "Content-Length" === name))?.value;
            await this.sendDownloadEvent({
              filename,
              fileSize: contentLength ? parseInt(contentLength) : void 0,
              url: details.url
            }, pageData, "download_start", fileId);
          }
        }
      };
      webRequest_onBeforeRequest=event => {
        const {tabId, url} = event;
        tabId && -1 !== tabId && this.updateRequestToUrlStorage(url, {
          tabId
        });
      };
      webRequest_onBeforeRedirect=event => {
        const key = tabInfoKey(event.url);
        if (this.requestUrlToTab.has(key)) {
          const data = this.requestUrlToTab.get(key), newKey = tabInfoKey(event.redirectUrl);
          this.requestUrlToTab.set(newKey, data), this.requestUrlToTab.del(key);
        }
      };
      webNavigation_onCreatedNavigationTarget=({url, sourceTabId}) => {
        this.updateRequestToUrlStorage(url, {
          sourceTabId
        });
      };
      updateRequestToUrlStorage=(url, data) => {
        const key = tabInfoKey(url), updated = {
          ...this.requestUrlToTab.get(key),
          ...data
        };
        this.requestUrlToTab.set(key, updated, this.TAB_INFO_TTL);
      };
      notifyDownloadRemove(item, success) {
        this.host.notify({
          type: "download_remove",
          success,
          download_id: item.id,
          filename: item.filename
        });
      }
      findDownloadSuggestion(filename) {
        const key = function(names, filename) {
          const dotIndex = filename.lastIndexOf("."), ext = dotIndex > 0 ? filename.substring(dotIndex + 1) : "", suggestionMatch = names.map((key => {
            const regex = new RegExp(`(?<name>.*?)(?<number>\\s\\(\\d+\\))?(?<ext>\\.${ext}?)?$`), namePrefix = key.match(regex);
            return [ key, namePrefix?.groups?.name ];
          })).find((([_, name]) => filename?.includes(name)));
          return suggestionMatch ? suggestionMatch[0] : null;
        }(this.downloadSuggestions.keys(), filename);
        return key ? this.downloadSuggestions.get(key) : void 0;
      }
      async sendDownloadEvent(item, pageData, eventType, fileId, fullPath, requestId) {
        const timestamp = item.endTime ?? (new Date).toISOString(), host_url = String(item.url?.startsWith("blob:") ? pageData?.url : item.finalUrl || item.url), event = {
          type: eventType,
          host_url,
          timestamp,
          filename: item.filename,
          content_length: item.fileSize,
          download_id: item.id,
          referrer: "",
          page_url: pageData?.url ?? "",
          page_title: pageData?.title ?? "",
          page_metadata: pageData?.metadata ?? {},
          ...fullPath || {}
        };
        var url;
        if (requestId && (event.page_metadata.request_id = requestId), this.downloadMetadataExtras.has(host_url) && (event.page_metadata = {
          ...this.downloadMetadataExtras.get(host_url),
          ...event.page_metadata
        }), (url = String(event.host_url)).includes("mail-attachment.googleusercontent.com") || /^https:\/\/mail\.google\.com\/mail\/.*\?.*realattid=.*/.test(String(url)) ? event.page_metadata.attachment_id = fileId ?? function(url) {
          return new URL(url).searchParams.get("realattid");
        }(String(event.host_url)) ?? "" : fileId && (event.file_id = fileId), !fileId && item.url?.startsWith("blob:") && host_url?.includes("mail.google.com")) {
          const suggestion = this.findDownloadSuggestion(item.filename || "");
          suggestion && (event.file_id = suggestion.fileId, event.host_url = suggestion.downloadUrl || event.host_url);
        }
        isBase64Url.test(String(event.host_url)) && (event.host_url = event.page_url);
        const promise = this.host.ask(event);
        if (isFeatureEnabled("download_blocking")) {
          const response = await promise;
          if ("success" === response.status && !response.allowed && item.id) {
            console.log(`Removing download with id = ${item.id}`);
            try {
              await browser.downloads.removeFile(item.id), this.notifyDownloadRemove(item, !0);
            } catch (error) {
              this.logger.error({
                type: "download",
                error: "cannot remove download",
                errorMessage: getErrorMessage(error),
                downloadItem: item
              }), this.notifyDownloadRemove(item, !1);
            }
          }
        }
        console.info("Download", event);
      }
      setDownloadPageData(item, pageData) {
        const key = downloadPageDataKey(item.id);
        return saveToPermStorage(key, pageData);
      }
      setDownloadFileID(item, fileId) {
        const key = downloadFileIdKey(item.id);
        return saveToPermStorage(key, fileId);
      }
      setRequestId(item, requestId) {
        const key = requestIdKey(item.id);
        return saveToPermStorage(key, requestId);
      }
      setDownloadFullPath(item, fullPath) {
        const key = downloadFileFullPath(item.id);
        return saveToPermStorage(key, fullPath);
      }
      async getDownloadFileID(id) {
        const key = downloadFileIdKey(id);
        return await app_storage_getFromPermStorage(key);
      }
      async getRequestId(id) {
        const key = requestIdKey(id);
        return await app_storage_getFromPermStorage(key);
      }
      async getDownloadPageData(id) {
        const key = downloadPageDataKey(id);
        return await app_storage_getFromPermStorage(key);
      }
      async getDownloadFileFullPath(id) {
        const key = downloadFileFullPath(id);
        return await app_storage_getFromPermStorage(key);
      }
      getDownloadTabInfo(item) {
        const storageKeys = [ tabInfoKey(item.finalUrl), tabInfoKey(item.url) ], tabInfo = this.requestUrlToTab.mget(storageKeys);
        return {
          ...tabInfo[storageKeys[0]],
          ...tabInfo[storageKeys[1]]
        };
      }
      setup() {
        this.listen(browser.webRequest.onBeforeRequest, this.webRequest_onBeforeRequest, [ {
          ...this.ALL_URLS,
          types: this.RESOURCE_TYPES_DOWNLOAD
        } ]), "downloads" in browser ? (this.listen(browser.downloads.onCreated, this.downloads_onCreated), 
        this.listen(browser.downloads.onChanged, this.downloads_onChanged)) : this.listen(browser.webRequest.onResponseStarted, this.webRequest_onResponseStarted, [ this.ALL_URLS ]), 
        "onCreatedNavigationTarget" in browser.webNavigation ? this.listen(browser.webNavigation.onCreatedNavigationTarget, this.webNavigation_onCreatedNavigationTarget) : wrappedEvents.on("request-url-to-tab-info", (({url, tabId}) => {
          this.updateRequestToUrlStorage(url, {
            sourceTabId: tabId
          });
        })), onMessage("download-cloud-file", (async message => {
          {
            const {fileName, ...rest} = message.data;
            this.downloadSuggestions.set(fileName, rest);
          }
        }));
      }
    };
    var k = class {
      type=3;
      name="";
      prefix="";
      value="";
      suffix="";
      modifier=3;
      constructor(t, r, n, o, c, l) {
        this.type = t, this.name = r, this.prefix = n, this.value = o, this.suffix = c, 
        this.modifier = l;
      }
      hasCustomName() {
        return "" !== this.name && "number" != typeof this.name;
      }
    }, Pe = /[$_\p{ID_Start}]/u, Se = /[$_\u200C\u200D\p{ID_Continue}]/u, M = ".*";
    function ke(e, t) {
      return (t ? /^[\x00-\xFF]*$/ : /^[\x00-\x7F]*$/).test(e);
    }
    function v(e, t = !1) {
      let r = [], n = 0;
      for (;n < e.length; ) {
        let o = e[n], c = function(l) {
          if (!t) throw new TypeError(l);
          r.push({
            type: "INVALID_CHAR",
            index: n,
            value: e[n++]
          });
        };
        if ("*" !== o) if ("+" !== o && "?" !== o) if ("\\" !== o) if ("{" !== o) if ("}" !== o) if (":" !== o) if ("(" !== o) r.push({
          type: "CHAR",
          index: n,
          value: e[n++]
        }); else {
          let l = 1, s = "", i = n + 1, a = !1;
          if ("?" === e[i]) {
            c(`Pattern cannot start with "?" at ${i}`);
            continue;
          }
          for (;i < e.length; ) {
            if (!ke(e[i], !1)) {
              c(`Invalid character '${e[i]}' at ${i}.`), a = !0;
              break;
            }
            if ("\\" !== e[i]) {
              if (")" === e[i]) {
                if (l--, 0 === l) {
                  i++;
                  break;
                }
              } else if ("(" === e[i] && (l++, "?" !== e[i + 1])) {
                c(`Capturing groups are not allowed at ${i}`), a = !0;
                break;
              }
              s += e[i++];
            } else s += e[i++] + e[i++];
          }
          if (a) continue;
          if (l) {
            c(`Unbalanced pattern at ${n}`);
            continue;
          }
          if (!s) {
            c(`Missing pattern at ${n}`);
            continue;
          }
          r.push({
            type: "REGEX",
            index: n,
            value: s
          }), n = i;
        } else {
          let l = "", s = n + 1;
          for (;s < e.length; ) {
            let i = e.substr(s, 1);
            if (!(s === n + 1 && Pe.test(i) || s !== n + 1 && Se.test(i))) break;
            l += e[s++];
          }
          if (!l) {
            c(`Missing parameter name at ${n}`);
            continue;
          }
          r.push({
            type: "NAME",
            index: n,
            value: l
          }), n = s;
        } else r.push({
          type: "CLOSE",
          index: n,
          value: e[n++]
        }); else r.push({
          type: "OPEN",
          index: n,
          value: e[n++]
        }); else r.push({
          type: "ESCAPED_CHAR",
          index: n++,
          value: e[n++]
        }); else r.push({
          type: "OTHER_MODIFIER",
          index: n,
          value: e[n++]
        }); else r.push({
          type: "ASTERISK",
          index: n,
          value: e[n++]
        });
      }
      return r.push({
        type: "END",
        index: n,
        value: ""
      }), r;
    }
    function D(e, t = {}) {
      let r = v(e);
      t.delimiter ??= "/#?", t.prefixes ??= "./";
      let n = `[^${x(t.delimiter)}]+?`, o = [], c = 0, l = 0, i = new Set, a = f => {
        if (l < r.length && r[l].type === f) return r[l++].value;
      }, h = () => a("OTHER_MODIFIER") ?? a("ASTERISK"), p = f => {
        let u = a(f);
        if (void 0 !== u) return u;
        let {type: d, index: T} = r[l];
        throw new TypeError(`Unexpected ${d} at ${T}, expected ${f}`);
      }, O = () => {
        let u, f = "";
        for (;u = a("CHAR") ?? a("ESCAPED_CHAR"); ) f += u;
        return f;
      }, L = t.encodePart || (f => f), I = "", H = f => {
        I += f;
      }, $ = () => {
        I.length && (o.push(new k(3, "", "", L(I), "", 3)), I = "");
      }, G = (f, u, d, T, Y) => {
        let m, g = 3;
        switch (Y) {
         case "?":
          g = 1;
          break;

         case "*":
          g = 0;
          break;

         case "+":
          g = 2;
        }
        if (!u && !d && 3 === g) return void H(f);
        if ($(), !u && !d) {
          if (!f) return;
          return void o.push(new k(3, "", "", L(f), "", g));
        }
        m = d ? "*" === d ? M : d : n;
        let S, R = 2;
        if (m === n ? (R = 1, m = "") : m === M && (R = 0, m = ""), u ? S = u : d && (S = c++), 
        i.has(S)) throw new TypeError(`Duplicate name '${S}'.`);
        i.add(S), o.push(new k(R, S, L(f), m, L(T), g));
      };
      for (;l < r.length; ) {
        let f = a("CHAR"), u = a("NAME"), d = a("REGEX");
        if (!u && !d && (d = a("ASTERISK")), u || d) {
          let g = f ?? "";
          -1 === t.prefixes.indexOf(g) && (H(g), g = ""), $(), G(g, u, d, "", h());
          continue;
        }
        let T = f ?? a("ESCAPED_CHAR");
        if (T) H(T); else if (a("OPEN")) {
          let g = O(), m = a("NAME"), R = a("REGEX");
          !m && !R && (R = a("ASTERISK"));
          let S = O();
          p("CLOSE"), G(g, m, R, S, h());
        } else $(), p("END");
      }
      return o;
    }
    function x(e) {
      return e.replace(/([.+*?^${}()[\]|/\\])/g, "\\$1");
    }
    function X(e) {
      return e && e.ignoreCase ? "ui" : "u";
    }
    function y(e) {
      switch (e) {
       case 0:
        return "*";

       case 1:
        return "?";

       case 2:
        return "+";

       case 3:
        return "";
      }
    }
    function F(e, t, r = {}) {
      r.delimiter ??= "/#?", r.prefixes ??= "./", r.sensitive ??= !1, r.strict ??= !1, 
      r.end ??= !0, r.start ??= !0, r.endsWith = "";
      let n = r.start ? "^" : "";
      for (let s of e) {
        if (3 === s.type) {
          3 === s.modifier ? n += x(s.value) : n += `(?:${x(s.value)})${y(s.modifier)}`;
          continue;
        }
        t && t.push(s.name);
        let i = `[^${x(r.delimiter)}]+?`, a = s.value;
        (1 === s.type ? a = i : 0 === s.type && (a = M), s.prefix.length || s.suffix.length) ? 3 !== s.modifier && 1 !== s.modifier ? (n += `(?:${x(s.prefix)}`, 
        n += `((?:${a})(?:`, n += x(s.suffix), n += x(s.prefix), n += `(?:${a}))*)${x(s.suffix)})`, 
        0 === s.modifier && (n += "?")) : (n += `(?:${x(s.prefix)}(${a})${x(s.suffix)})`, 
        n += y(s.modifier)) : 3 === s.modifier || 1 === s.modifier ? n += `(${a})${y(s.modifier)}` : n += `((?:${a})${y(s.modifier)})`;
      }
      let o = `[${x(r.endsWith)}]|$`, c = `[${x(r.delimiter)}]`;
      if (r.end) return r.strict || (n += `${c}?`), r.endsWith.length ? n += `(?=${o})` : n += "$", 
      new RegExp(n, X(r));
      r.strict || (n += `(?:${c}(?=${o}))?`);
      let l = !1;
      if (e.length) {
        let s = e[e.length - 1];
        3 === s.type && 3 === s.modifier && (l = r.delimiter.indexOf(s) > -1);
      }
      return l || (n += `(?=${c}|${o})`), new RegExp(n, X(r));
    }
    var b = {
      delimiter: "",
      prefixes: "",
      sensitive: !0,
      strict: !0
    }, B = {
      delimiter: ".",
      prefixes: "",
      sensitive: !0,
      strict: !0
    }, q = {
      delimiter: "/",
      prefixes: "/",
      sensitive: !0,
      strict: !0
    };
    function Q(e, t) {
      return e.startsWith(t) ? e.substring(t.length, e.length) : e;
    }
    function W(e) {
      return !(!e || e.length < 2) && ("[" === e[0] || ("\\" === e[0] || "{" === e[0]) && "[" === e[1]);
    }
    var ee = [ "ftp", "file", "http", "https", "ws", "wss" ];
    function N(e) {
      if (!e) return !0;
      for (let t of ee) if (e.test(t)) return !0;
      return !1;
    }
    function _(e) {
      switch (e) {
       case "ws":
       case "http":
        return "80";

       case "wws":
       case "https":
        return "443";

       case "ftp":
        return "21";

       default:
        return "";
      }
    }
    function A(e) {
      if ("" === e) return e;
      if (/^[-+.A-Za-z0-9]*$/.test(e)) return e.toLowerCase();
      throw new TypeError(`Invalid protocol '${e}'.`);
    }
    function le(e) {
      if ("" === e) return e;
      let t = new URL("https://example.com");
      return t.username = e, t.username;
    }
    function he(e) {
      if ("" === e) return e;
      let t = new URL("https://example.com");
      return t.password = e, t.password;
    }
    function urlpattern_z(e) {
      if ("" === e) return e;
      if (/[\t\n\r #%/:<>?@[\]^\\|]/g.test(e)) throw new TypeError(`Invalid hostname '${e}'`);
      let t = new URL("https://example.com");
      return t.hostname = e, t.hostname;
    }
    function j(e) {
      if ("" === e) return e;
      if (/[^0-9a-fA-F[\]:]/g.test(e)) throw new TypeError(`Invalid IPv6 hostname '${e}'`);
      return e.toLowerCase();
    }
    function K(e) {
      if ("" === e || /^[0-9]*$/.test(e) && parseInt(e) <= 65535) return e;
      throw new TypeError(`Invalid port '${e}'.`);
    }
    function fe(e) {
      if ("" === e) return e;
      let t = new URL("https://example.com");
      return t.pathname = "/" !== e[0] ? "/-" + e : e, "/" !== e[0] ? t.pathname.substring(2, t.pathname.length) : t.pathname;
    }
    function ue(e) {
      return "" === e ? e : new URL(`data:${e}`).pathname;
    }
    function pe(e) {
      if ("" === e) return e;
      let t = new URL("https://example.com");
      return t.search = e, t.search.substring(1, t.search.length);
    }
    function de(e) {
      if ("" === e) return e;
      let t = new URL("https://example.com");
      return t.hash = e, t.hash.substring(1, t.hash.length);
    }
    var U = class {
      #i;
      #n=[];
      #t={};
      #e=0;
      #s=1;
      #u=0;
      #c=0;
      #p=0;
      #d=0;
      #g=!1;
      constructor(t) {
        this.#i = t;
      }
      get result() {
        return this.#t;
      }
      parse() {
        for (this.#n = v(this.#i, !0); this.#e < this.#n.length; this.#e += this.#s) {
          if (this.#s = 1, "END" === this.#n[this.#e].type) {
            if (0 === this.#c) {
              this.#P(), this.#l() ? this.#r(9, 1) : this.#h() ? (this.#r(8, 1), this.#t.hash = "") : (this.#r(7, 0), 
              this.#t.search = "", this.#t.hash = "");
              continue;
            }
            if (2 === this.#c) {
              this.#f(5);
              continue;
            }
            this.#r(10, 0);
            break;
          }
          if (this.#p > 0) {
            if (!this.#T()) continue;
            this.#p -= 1;
          }
          if (this.#O()) this.#p += 1; else switch (this.#c) {
           case 0:
            this.#S() && (this.#t.username = "", this.#t.password = "", this.#t.hostname = "", 
            this.#t.port = "", this.#t.pathname = "", this.#t.search = "", this.#t.hash = "", 
            this.#f(1));
            break;

           case 1:
            if (this.#S()) {
              this.#C();
              let t = 7, r = 1;
              this.#g && (this.#t.pathname = "/"), this.#E() ? (t = 2, r = 3) : this.#g && (t = 2), 
              this.#r(t, r);
            }
            break;

           case 2:
            this.#x() ? this.#f(3) : (this.#b() || this.#h() || this.#l()) && this.#f(5);
            break;

           case 3:
            this.#R() ? this.#r(4, 1) : this.#x() && this.#r(5, 1);
            break;

           case 4:
            this.#x() && this.#r(5, 1);
            break;

           case 5:
            this.#A() ? this.#d += 1 : this.#w() && (this.#d -= 1), this.#y() && !this.#d ? this.#r(6, 1) : this.#b() ? this.#r(7, 0) : this.#h() ? this.#r(8, 1) : this.#l() && this.#r(9, 1);
            break;

           case 6:
            this.#b() ? this.#r(7, 0) : this.#h() ? this.#r(8, 1) : this.#l() && this.#r(9, 1);
            break;

           case 7:
            this.#h() ? this.#r(8, 1) : this.#l() && this.#r(9, 1);
            break;

           case 8:
            this.#l() && this.#r(9, 1);
          }
        }
      }
      #r(t, r) {
        switch (this.#c) {
         case 0:
         case 2:
         case 10:
          break;

         case 1:
          this.#t.protocol = this.#o();
          break;

         case 3:
          this.#t.username = this.#o();
          break;

         case 4:
          this.#t.password = this.#o();
          break;

         case 5:
          this.#t.hostname = this.#o();
          break;

         case 6:
          this.#t.port = this.#o();
          break;

         case 7:
          this.#t.pathname = this.#o();
          break;

         case 8:
          this.#t.search = this.#o();
          break;

         case 9:
          this.#t.hash = this.#o();
        }
        this.#k(t, r);
      }
      #k(t, r) {
        this.#c = t, this.#u = this.#e + r, this.#e += r, this.#s = 0;
      }
      #P() {
        this.#e = this.#u, this.#s = 0;
      }
      #f(t) {
        this.#P(), this.#c = t;
      }
      #m(t) {
        return t < 0 && (t = this.#n.length - t), t < this.#n.length ? this.#n[t] : this.#n[this.#n.length - 1];
      }
      #a(t, r) {
        let n = this.#m(t);
        return n.value === r && ("CHAR" === n.type || "ESCAPED_CHAR" === n.type || "INVALID_CHAR" === n.type);
      }
      #S() {
        return this.#a(this.#e, ":");
      }
      #E() {
        return this.#a(this.#e + 1, "/") && this.#a(this.#e + 2, "/");
      }
      #x() {
        return this.#a(this.#e, "@");
      }
      #R() {
        return this.#a(this.#e, ":");
      }
      #y() {
        return this.#a(this.#e, ":");
      }
      #b() {
        return this.#a(this.#e, "/");
      }
      #h() {
        if (this.#a(this.#e, "?")) return !0;
        if ("?" !== this.#n[this.#e].value) return !1;
        let t = this.#m(this.#e - 1);
        return "NAME" !== t.type && "REGEX" !== t.type && "CLOSE" !== t.type && "ASTERISK" !== t.type;
      }
      #l() {
        return this.#a(this.#e, "#");
      }
      #O() {
        return "OPEN" == this.#n[this.#e].type;
      }
      #T() {
        return "CLOSE" == this.#n[this.#e].type;
      }
      #A() {
        return this.#a(this.#e, "[");
      }
      #w() {
        return this.#a(this.#e, "]");
      }
      #o() {
        let t = this.#n[this.#e], r = this.#m(this.#u).index;
        return this.#i.substring(r, t.index);
      }
      #C() {
        let t = {};
        Object.assign(t, b), t.encodePart = A;
        let r = function(e, t, r) {
          return F(D(e, r), t, r);
        }(this.#o(), void 0, t);
        this.#g = N(r);
      }
    }, V = [ "protocol", "username", "password", "hostname", "port", "pathname", "search", "hash" ], E = "*";
    function ge(e, t) {
      if ("string" != typeof e) throw new TypeError("parameter 1 is not of type 'string'.");
      let r = new URL(e, t);
      return {
        protocol: r.protocol.substring(0, r.protocol.length - 1),
        username: r.username,
        password: r.password,
        hostname: r.hostname,
        port: r.port,
        pathname: r.pathname,
        search: "" !== r.search ? r.search.substring(1, r.search.length) : void 0,
        hash: "" !== r.hash ? r.hash.substring(1, r.hash.length) : void 0
      };
    }
    function P(e, t) {
      return t ? C(e) : e;
    }
    function w(e, t, r) {
      let n;
      if ("string" == typeof t.baseURL) try {
        n = new URL(t.baseURL), e.protocol = P(n.protocol.substring(0, n.protocol.length - 1), r), 
        e.username = P(n.username, r), e.password = P(n.password, r), e.hostname = P(n.hostname, r), 
        e.port = P(n.port, r), e.pathname = P(n.pathname, r), e.search = P(n.search.substring(1, n.search.length), r), 
        e.hash = P(n.hash.substring(1, n.hash.length), r);
      } catch {
        throw new TypeError(`invalid baseURL '${t.baseURL}'.`);
      }
      if ("string" == typeof t.protocol && (e.protocol = function(e, t) {
        return e = function(e, t) {
          return e.endsWith(t) ? e.substr(0, e.length - t.length) : e;
        }(e, ":"), t || "" === e ? e : A(e);
      }(t.protocol, r)), "string" == typeof t.username && (e.username = function(e, t) {
        if (t || "" === e) return e;
        let r = new URL("https://example.com");
        return r.username = e, r.username;
      }(t.username, r)), "string" == typeof t.password && (e.password = function(e, t) {
        if (t || "" === e) return e;
        let r = new URL("https://example.com");
        return r.password = e, r.password;
      }(t.password, r)), "string" == typeof t.hostname && (e.hostname = function(e, t) {
        return t || "" === e ? e : W(e) ? j(e) : urlpattern_z(e);
      }(t.hostname, r)), "string" == typeof t.port && (e.port = function(e, t, r) {
        return _(t) === e && (e = ""), r || "" === e ? e : K(e);
      }(t.port, e.protocol, r)), "string" == typeof t.pathname) {
        if (e.pathname = t.pathname, n && !function(e, t) {
          return !(!e.length || "/" !== e[0] && (!t || e.length < 2 || "\\" != e[0] && "{" != e[0] || "/" != e[1]));
        }(e.pathname, r)) {
          let o = n.pathname.lastIndexOf("/");
          o >= 0 && (e.pathname = P(n.pathname.substring(0, o + 1), r) + e.pathname);
        }
        e.pathname = function(e, t, r) {
          if (r || "" === e) return e;
          if (t && !ee.includes(t)) return new URL(`${t}:${e}`).pathname;
          let n = "/" == e[0];
          return e = new URL(n ? e : "/-" + e, "https://example.com").pathname, n || (e = e.substring(2, e.length)), 
          e;
        }(e.pathname, e.protocol, r);
      }
      return "string" == typeof t.search && (e.search = function(e, t) {
        if (e = Q(e, "?"), t || "" === e) return e;
        let r = new URL("https://example.com");
        return r.search = e, r.search ? r.search.substring(1, r.search.length) : "";
      }(t.search, r)), "string" == typeof t.hash && (e.hash = function(e, t) {
        if (e = Q(e, "#"), t || "" === e) return e;
        let r = new URL("https://example.com");
        return r.hash = e, r.hash ? r.hash.substring(1, r.hash.length) : "";
      }(t.hash, r)), e;
    }
    function C(e) {
      return e.replace(/([+*?:{}()\\])/g, "\\$1");
    }
    function ye(e, t) {
      t.delimiter ??= "/#?", t.prefixes ??= "./", t.sensitive ??= !1, t.strict ??= !1, 
      t.end ??= !0, t.start ??= !0, t.endsWith = "";
      let n = `[^${function(e) {
        return e.replace(/([.+*?^${}()[\]|/\\])/g, "\\$1");
      }(t.delimiter)}]+?`, o = /[$_\u200C\u200D\p{ID_Continue}]/u, c = "";
      for (let l = 0; l < e.length; ++l) {
        let s = e[l];
        if (3 === s.type) {
          if (3 === s.modifier) {
            c += C(s.value);
            continue;
          }
          c += `{${C(s.value)}}${y(s.modifier)}`;
          continue;
        }
        let i = s.hasCustomName(), a = !!s.suffix.length || !!s.prefix.length && (1 !== s.prefix.length || !t.prefixes.includes(s.prefix)), h = l > 0 ? e[l - 1] : null, p = l < e.length - 1 ? e[l + 1] : null;
        if (!a && i && 1 === s.type && 3 === s.modifier && p && !p.prefix.length && !p.suffix.length) if (3 === p.type) {
          let O = p.value.length > 0 ? p.value[0] : "";
          a = o.test(O);
        } else a = !p.hasCustomName();
        if (!a && !s.prefix.length && h && 3 === h.type) {
          let O = h.value[h.value.length - 1];
          a = t.prefixes.includes(O);
        }
        a && (c += "{"), c += C(s.prefix), i && (c += `:${s.name}`), 2 === s.type ? c += `(${s.value})` : 1 === s.type ? i || (c += `(${n})`) : 0 === s.type && (i || h && 3 !== h.type && 3 === h.modifier && !a && "" === s.prefix ? c += "(.*)" : c += "*"), 
        1 === s.type && i && s.suffix.length && o.test(s.suffix[0]) && (c += "\\"), c += C(s.suffix), 
        a && (c += "}"), 3 !== s.modifier && (c += y(s.modifier));
      }
      return c;
    }
    globalThis.URLPattern || (globalThis.URLPattern = class {
      #i;
      #n={};
      #t={};
      #e={};
      #s={};
      constructor(t = {}, r, n) {
        try {
          let o;
          if ("string" == typeof r ? o = r : n = r, "string" == typeof t) {
            let i = new U(t);
            if (i.parse(), t = i.result, void 0 === o && "string" != typeof t.protocol) throw new TypeError("A base URL must be provided for a relative constructor string.");
            t.baseURL = o;
          } else {
            if (!t || "object" != typeof t) throw new TypeError("parameter 1 is not of type 'string' and cannot convert to dictionary.");
            if (o) throw new TypeError("parameter 1 is not of type 'string'.");
          }
          typeof n > "u" && (n = {
            ignoreCase: !1
          });
          let s, c = {
            ignoreCase: !0 === n.ignoreCase
          }, l = {
            pathname: E,
            protocol: E,
            username: E,
            password: E,
            hostname: E,
            port: E,
            search: E,
            hash: E
          };
          for (s of (this.#i = w(l, t, !0), _(this.#i.protocol) === this.#i.port && (this.#i.port = ""), 
          V)) {
            if (!(s in this.#i)) continue;
            let i = {}, a = this.#i[s];
            switch (this.#t[s] = [], s) {
             case "protocol":
              Object.assign(i, b), i.encodePart = A;
              break;

             case "username":
              Object.assign(i, b), i.encodePart = le;
              break;

             case "password":
              Object.assign(i, b), i.encodePart = he;
              break;

             case "hostname":
              Object.assign(i, B), W(a) ? i.encodePart = j : i.encodePart = urlpattern_z;
              break;

             case "port":
              Object.assign(i, b), i.encodePart = K;
              break;

             case "pathname":
              N(this.#n.protocol) ? (Object.assign(i, q, c), i.encodePart = fe) : (Object.assign(i, b, c), 
              i.encodePart = ue);
              break;

             case "search":
              Object.assign(i, b, c), i.encodePart = pe;
              break;

             case "hash":
              Object.assign(i, b, c), i.encodePart = de;
            }
            try {
              this.#s[s] = D(a, i), this.#n[s] = F(this.#s[s], this.#t[s], i), this.#e[s] = ye(this.#s[s], i);
            } catch {
              throw new TypeError(`invalid ${s} pattern '${this.#i[s]}'.`);
            }
          }
        } catch (o) {
          throw new TypeError(`Failed to construct 'URLPattern': ${o.message}`);
        }
      }
      test(t = {}, r) {
        let o, n = {
          pathname: "",
          protocol: "",
          username: "",
          password: "",
          hostname: "",
          port: "",
          search: "",
          hash: ""
        };
        if ("string" != typeof t && r) throw new TypeError("parameter 1 is not of type 'string'.");
        if (typeof t > "u") return !1;
        try {
          n = w(n, "object" == typeof t ? t : ge(t, r), !1);
        } catch {
          return !1;
        }
        for (o of V) if (!this.#n[o].exec(n[o])) return !1;
        return !0;
      }
      exec(t = {}, r) {
        let n = {
          pathname: "",
          protocol: "",
          username: "",
          password: "",
          hostname: "",
          port: "",
          search: "",
          hash: ""
        };
        if ("string" != typeof t && r) throw new TypeError("parameter 1 is not of type 'string'.");
        if (typeof t > "u") return;
        try {
          n = w(n, "object" == typeof t ? t : ge(t, r), !1);
        } catch {
          return null;
        }
        let c, o = {};
        for (c of (o.inputs = r ? [ t, r ] : [ t ], V)) {
          let l = this.#n[c].exec(n[c]);
          if (!l) return null;
          let s = {};
          for (let [i, a] of this.#t[c].entries()) if ("string" == typeof a || "number" == typeof a) {
            let h = l[i + 1];
            s[a] = h;
          }
          o[c] = {
            input: n[c] ?? "",
            groups: s
          };
        }
        return o;
      }
      static compareComponent(t, r, n) {
        let o = (i, a) => {
          for (let h of [ "type", "modifier", "prefix", "value", "suffix" ]) {
            if (i[h] < a[h]) return -1;
            if (i[h] !== a[h]) return 1;
          }
          return 0;
        }, c = new k(3, "", "", "", "", 3), l = new k(0, "", "", "", "", 3), s = (i, a) => {
          let h = 0;
          for (;h < Math.min(i.length, a.length); ++h) {
            let p = o(i[h], a[h]);
            if (p) return p;
          }
          return i.length === a.length ? 0 : o(i[h] ?? c, a[h] ?? c);
        };
        return r.#e[t] || n.#e[t] ? r.#e[t] && !n.#e[t] ? s(r.#s[t], [ l ]) : !r.#e[t] && n.#e[t] ? s([ l ], n.#s[t]) : s(r.#s[t], n.#s[t]) : 0;
      }
      get protocol() {
        return this.#e.protocol;
      }
      get username() {
        return this.#e.username;
      }
      get password() {
        return this.#e.password;
      }
      get hostname() {
        return this.#e.hostname;
      }
      get port() {
        return this.#e.port;
      }
      get pathname() {
        return this.#e.pathname;
      }
      get search() {
        return this.#e.search;
      }
      get hash() {
        return this.#e.hash;
      }
    });
    const webext_polyfill_kinda_chromeP = globalThis.chrome && new function NestedProxy(target) {
      return new Proxy(target, {
        get(target, prop) {
          if (target[prop]) return "function" != typeof target[prop] ? new NestedProxy(target[prop]) : (...arguments_) => new Promise(((resolve, reject) => {
            target[prop](...arguments_, (result => {
              chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve(result);
            }));
          }));
        }
      });
    }(globalThis.chrome), webext_polyfill_kinda = webext_polyfill_kinda_chromeP;
    __webpack_require__(2834);
    globalThis.navigator?.userAgent.includes("Firefox/");
    const gotScripting = Boolean(globalThis.chrome?.scripting);
    function castArray(possibleArray) {
      return Array.isArray(possibleArray) ? possibleArray : [ possibleArray ];
    }
    function arrayOrUndefined(value) {
      return void 0 === value ? void 0 : [ value ];
    }
    async function insertCSS({tabId, frameId, files, allFrames, matchAboutBlank, runAt}, {ignoreTargetErrors} = {}) {
      const everyInsertion = Promise.all(files.map((async content => ("string" == typeof content && (content = {
        file: content
      }), gotScripting ? chrome.scripting.insertCSS({
        target: {
          tabId,
          frameIds: arrayOrUndefined(frameId),
          allFrames: void 0 === frameId ? allFrames : void 0
        },
        files: "file" in content ? [ content.file ] : void 0,
        css: "code" in content ? content.code : void 0
      }) : webext_polyfill_kinda.tabs.insertCSS(tabId, {
        ...content,
        matchAboutBlank,
        allFrames,
        frameId,
        runAt: runAt ?? "document_start"
      })))));
      ignoreTargetErrors ? await catchTargetInjectionErrors(everyInsertion) : await everyInsertion;
    }
    async function executeScript({tabId, frameId, files, allFrames, matchAboutBlank, runAt}, {ignoreTargetErrors} = {}) {
      const normalizedFiles = files.map((file => "string" == typeof file ? {
        file
      } : file));
      if (gotScripting) {
        !function(files) {
          if (files.some((content => "code" in content))) throw new Error("chrome.scripting does not support injecting strings of `code`");
        }(normalizedFiles);
        const injection = chrome.scripting.executeScript({
          target: {
            tabId,
            frameIds: arrayOrUndefined(frameId),
            allFrames: void 0 === frameId ? allFrames : void 0
          },
          files: normalizedFiles.map((({file}) => file))
        });
        return void (ignoreTargetErrors ? await catchTargetInjectionErrors(injection) : await injection);
      }
      const executions = [];
      for (const content of normalizedFiles) "code" in content && await executions.at(-1), 
      executions.push(webext_polyfill_kinda.tabs.executeScript(tabId, {
        ...content,
        matchAboutBlank,
        allFrames,
        frameId,
        runAt
      }));
      ignoreTargetErrors ? await catchTargetInjectionErrors(Promise.all(executions)) : await Promise.all(executions);
    }
    async function injectContentScript(where, scripts, options = {}) {
      const targets = castArray(where);
      await Promise.all(targets.map((async target => async function({frameId, tabId, allFrames}, scripts, options = {}) {
        const injections = castArray(scripts).flatMap((script => [ insertCSS({
          tabId,
          frameId,
          allFrames,
          files: script.css ?? [],
          matchAboutBlank: script.matchAboutBlank ?? script.match_about_blank,
          runAt: script.runAt ?? script.run_at
        }, options), executeScript({
          tabId,
          frameId,
          allFrames,
          files: script.js ?? [],
          matchAboutBlank: script.matchAboutBlank ?? script.match_about_blank,
          runAt: script.runAt ?? script.run_at
        }, options) ]));
        await Promise.all(injections);
      }(function(target) {
        return "object" == typeof target ? {
          ...target,
          allFrames: !1
        } : {
          tabId: target,
          frameId: void 0,
          allFrames: !0
        };
      }(target), scripts, options))));
    }
    const blockedPrefixes = [ "chrome.google.com/webstore", "chromewebstore.google.com", "accounts-static.cdn.mozilla.net", "accounts.firefox.com", "addons.cdn.mozilla.net", "addons.mozilla.org", "api.accounts.firefox.com", "content.cdn.mozilla.net", "discovery.addons.mozilla.org", "input.mozilla.org", "install.mozilla.org", "oauth.accounts.firefox.com", "profile.accounts.firefox.com", "support.mozilla.org", "sync.services.mozilla.com", "testpilot.firefox.com" ];
    function isScriptableUrl(url) {
      if (!url?.startsWith("http")) return !1;
      const cleanUrl = url.replace(/^https?:\/\//, "");
      return blockedPrefixes.every((blocked => !cleanUrl.startsWith(blocked)));
    }
    const targetErrors = /^No frame with id \d+ in tab \d+.$|^No tab with id: \d+.$|^The tab was closed.$|^The frame was removed.$/;
    async function catchTargetInjectionErrors(promise) {
      try {
        await promise;
      } catch (error) {
        if (!targetErrors.test(error?.message)) throw error;
      }
    }
    const manifest = browser.runtime.getManifest();
    async function injectIntoTab(tab) {
      try {
        if (tab.id && tab.url) {
          const commonScripts = manifest.content_scripts.filter((script => script.matches.some((pattern => "<all_urls>" === pattern)))), scripts = manifest.content_scripts.filter((script => function(contentScript, tabUrl) {
            const {origin} = new URL(tabUrl);
            return isScriptableUrl(tabUrl) && contentScript.matches.every((pattern => "<all_urls>" !== pattern)) && contentScript.matches.some((pattern => new URLPattern(pattern).test(origin))) && (!contentScript.exclude_matches || contentScript.exclude_matches.every((pattern => !new URLPattern(pattern).test(origin))));
          }(script, tab.url)));
          scripts.length ? await injectContentScript(tab.id, scripts) : isScriptableUrl(tab.url) && await injectContentScript(tab.id, commonScripts);
        }
      } catch (e) {
        console.error(`Failed to reinject content scripts into tab ${tab.url}`, e);
      }
    }
    class TabsGroup extends group {
      updateOnWinFocusTimeoutId=null;
      constructor() {
        super("active_tab_change_notification", "tabs");
      }
      async getMetadata(tab) {
        return (await getPageData(tab.id)).metadata;
      }
      async notifyTabChange(tab) {
        const timestamp = (new Date).toISOString();
        let metadata;
        try {
          metadata = await this.getMetadata(tab);
        } catch {
          metadata = {};
        }
        this.host.notify({
          type: "active_tab_change",
          timestamp,
          url: tab.url,
          title: tab.title,
          metadata
        });
      }
      trackOpenerTabId(tab) {
        tab.id && "loading" === tab?.status && tab.openerTabId && tab.pendingUrl && wrappedEvents.emit("request-url-to-tab-info", {
          url: tab.pendingUrl,
          tabId: tab.openerTabId,
          targetTabId: tab.id
        });
      }
      tabOnUpdated=async (tabId, changeInfo, tab) => {
        tabId && tab.url && sendMessageToTab(tabId, "notify-url-change", {
          url: tab.url
        }).catch((() => {})), tab.active && (this.updateOnWinFocusTimeoutId && (clearTimeout(this.updateOnWinFocusTimeoutId), 
        this.updateOnWinFocusTimeoutId = null), this.trackOpenerTabId(tab), ("complete" === changeInfo.status || changeInfo.url || changeInfo.title) && this.notifyTabChange(tab));
      };
      tabOnActivated=async activeInfo => {
        const tab = await browser.tabs.get(activeInfo.tabId);
        tab.id && this.tabOnUpdated(tab.id, tab, tab);
      };
      onAlarm=async alarm => {
        if ("url_update" === alarm.name) {
          const [activeTab] = await browser.tabs.query({
            active: !0,
            currentWindow: !0
          });
          activeTab?.id && this.tabOnUpdated(activeTab.id, activeTab, activeTab);
        }
      };
      windowOnFocusChanged=async windowId => {
        -1 !== windowId && (this.updateOnWinFocusTimeoutId = setTimeout((async () => {
          const [activeTab] = await browser.tabs.query({
            active: !0,
            currentWindow: !0
          });
          activeTab?.windowId === windowId && activeTab.active && activeTab.id && this.tabOnUpdated(activeTab.id, activeTab, activeTab);
        }), 100));
      };
      listenPageEvents() {
        onMessage("update-current-tab", (message => {
          message.tab?.id && this.notifyTabChange(message.tab);
        })), onMessage("get-tab-data", (async message => ({
          tabId: message.tab?.id
        })));
      }
      async setUrlUpdateAlarm() {
        const alarm = await browser.alarms.get("url_update");
        alarm && .5 === alarm.periodInMinutes || browser.alarms.create("url_update", {
          periodInMinutes: .5
        });
      }
      handleOnInstalled=async details => {
        try {
          browser.storage.local.clear(), await async function() {
            const windows = await browser.windows.getAll({
              populate: !0,
              windowTypes: [ "normal" ]
            });
            for (const window of windows) for (const tab of window.tabs || []) injectIntoTab(tab);
          }();
        } catch (err) {
          this.logger.error({
            error: "error occured in injectIntoAllTabs",
            errorMessage: getErrorMessage(err),
            details
          });
        }
      };
      setup() {
        this.setUrlUpdateAlarm(), this.listen(browser.tabs.onUpdated, this.tabOnUpdated), 
        this.listen(browser.tabs.onActivated, this.tabOnActivated), this.listen(browser.windows.onFocusChanged, this.windowOnFocusChanged), 
        this.listen(browser.alarms.onAlarm, this.onAlarm), browser.runtime.onInstalled.addListener(this.handleOnInstalled), 
        this.listenPageEvents();
      }
    }
    class UploadsGroup extends group {
      lastUploadData={};
      MIN_UPLOAD_INTERVAL_MS=2e3;
      constructor() {
        super("upload_notification", "upload");
      }
      async updateUpload(message, tab) {
        if (await this.ensurePageData(message, tab), this.filterDuplicateUploads(message), 
        0 === message.files.length) return void this.logNoFilesError(message);
        const {uploadFiles, uploadFileIds} = this.extractUploadFiles(message);
        this.updateLastUploadData(message.timestamp, uploadFiles);
        const data = {
          type: "upload",
          timestamp: new Date(message.timestamp).toISOString(),
          url: message.pageData?.url,
          title: message.pageData?.title,
          metadata: message.pageData?.metadata ?? {},
          files: uploadFiles,
          upload_file_ids: uploadFileIds
        };
        console.log("Upload event:", data), this.host.notify(data);
      }
      async ensurePageData(message, tab) {
        message.pageData || (message.pageData = tab?.id ? await getPageData(tab.id) : {});
      }
      filterDuplicateUploads(message) {
        const {timestamp, files: lastFiles} = this.lastUploadData;
        if (timestamp && lastFiles && message.timestamp - timestamp < this.MIN_UPLOAD_INTERVAL_MS) {
          const filteredFiles = message.files.filter((file => !lastFiles.has(file.name)));
          filteredFiles.length !== message.files.length && (message.files = filteredFiles, 
          this.logger.error({
            error: "Duplicate upload detected, filtering files.",
            url: message.pageData?.url
          }));
        }
      }
      logNoFilesError(message) {
        this.logger.error({
          error: "No upload files left after filtering duplicates.",
          url: message.pageData?.url
        });
      }
      extractUploadFiles(message) {
        const uploadRelativePath = this.isFeatureOn("upload_relative_path"), uploadFiles = [], uploadFileIds = [];
        for (const file of message.files) {
          const fileName = uploadRelativePath && file.webkitRelativePath || file.name;
          uploadFiles.push(fileName), uploadFileIds.push(file.upload_id);
        }
        return {
          uploadFiles,
          uploadFileIds
        };
      }
      updateLastUploadData(timestamp, files) {
        this.lastUploadData.timestamp = timestamp, this.lastUploadData.files = new Set(files);
      }
      setup() {
        onMessage("upload", (message => {
          this.isFeatureOn("upload_notification") && this.updateUpload(message.data, message.tab);
        }));
      }
    }
    class VersionGroup extends group {
      manifest=browser.runtime.getManifest();
      versionReportTime;
      constructor() {
        super("version", "version");
      }
      getVersionReportTimeInSeconds() {
        return void 0 === this.versionReportTime ? -1 : ((new Date).getTime() - this.versionReportTime) / 1e3;
      }
      async reportVersion() {
        const message = {
          type: "version",
          extension_version: this.manifest.version
        };
        try {
          await this.host.notify(message), this.versionReportTime = (new Date).getTime();
        } catch (error) {
          console.error("Error occurred while reporting version", error), this.versionReportTime = void 0;
        }
      }
      handleAlarm=event => {
        "version_notification" === event.name && this.reportVersion();
      };
      setPopupCallback() {
        onMessage("check-connection", (() => {
          const timePassed = this.getVersionReportTimeInSeconds();
          return {
            connected: -1 !== timePassed && timePassed < 80,
            enabled: this.isFeatureOn("enabled")
          };
        }));
      }
      printManifest() {
        const manifest = browser.runtime.getManifest();
        console.log(`Running Cyberhaven web extension v${manifest.version} on manifest v${manifest.manifest_version}`);
      }
      async setVersionNotification() {
        await browser.alarms.get("version_notification") || browser.alarms.create("version_notification", {
          periodInMinutes: 1
        });
      }
      setup() {
        this.printManifest(), this.listen(browser.alarms.onAlarm, this.handleAlarm, []), 
        this.setVersionNotification(), wrappedEvents.on("report-version", (() => this.reportVersion())), 
        this.setPopupCallback();
      }
    }
    const extensionHost = getHost(), defaultLogger = getLogger(extensionHost, "logging");
    class TelemetryGroup extends group {
      constructor() {
        super("telemetry", "telemetry");
      }
      setup() {
        onMessage("track-execution-time", (({tab, data: {duration, name}}) => {
          this.isFeatureOn("telemetry") && (duration > 300 && this.logger.error({
            error: "Execution of a function exceeded expected time limit",
            errorMessage: `Execution of "${name}" exceeded expected time limit of ${duration}ms`,
            url: tab?.url
          }), this.host.notify({
            type: "telemetry",
            peak_delay: 0,
            total_delay: 0,
            peak_processing_time: duration,
            total_processing_time: duration
          }));
        })), onMessage("track-user-delay", (({tab, data: {duration, name}}) => {
          this.isFeatureOn("telemetry") && (console.log("track-user-delay", name, duration), 
          duration > 3e3 && this.logger.error({
            error: "User delay exceeded expected time limit",
            errorMessage: `User delay "${name}" exceeded expected time limit of ${duration}ms`,
            url: tab?.url
          }), this.host.notify({
            type: "telemetry",
            peak_delay: duration,
            total_delay: duration,
            peak_processing_time: 0,
            total_processing_time: 0
          }));
        }));
      }
    }
    const copy_file_host = getHost(), copy_file_logger = new Logger(copy_file_host, "site-events/copy");
    const email_logger = getLogger(getHost(), "site-events/email");
    function debounce(func, delay) {
      let timeoutId = null;
      return function(...args) {
        timeoutId && clearTimeout(timeoutId), timeoutId = setTimeout((() => {
          func(...args);
        }), delay);
      };
    }
    const COPY_PASTE_CHECK_PASTE_INTERVAL_LOADING = 1e3, COPY_PASTE_CHECK_PASTE_INTERVAL_COMPLETE = 5e3, COPY_PASTE_CHECK_PASTE_NAV_CHANGE_DELAY = 100;
    var ClipboardAction;
    !function(ClipboardAction) {
      ClipboardAction[ClipboardAction.Copy = 1] = "Copy", ClipboardAction[ClipboardAction.Paste = 2] = "Paste";
    }(ClipboardAction || (ClipboardAction = {}));
    class ClipboardGroup extends group {
      stopInterval;
      abortController;
      constructor() {
        super("copy_paste_notification", "clipboard");
      }
      setup() {
        this.listenCopyPasteEvents(), this.setupCopyPasteBlocking();
      }
      createCopyPasteEvent(data) {
        const {action, isBlocked, pageData, timestamp} = data;
        return {
          type: "copy_paste",
          action: "copy" === action ? ClipboardAction.Copy : ClipboardAction.Paste,
          is_blocked: isBlocked,
          timestamp: new Date(timestamp).toISOString(),
          url: pageData?.url ?? "",
          title: pageData?.title ?? "",
          metadata: pageData?.metadata ?? {}
        };
      }
      getPasteStatusForCurrentTab(pageData, signal) {
        return this.host.ask({
          type: "check_paste",
          url: pageData.url,
          title: pageData.title,
          metadata: pageData.metadata,
          timestamp: (new Date).toISOString()
        }, signal);
      }
      setNextPasteAllowed(tabId, allowed, pageData) {
        return sendMessageToTab(tabId, "set-paste-status", {
          allowed,
          validUntil: Date.now() + 2 * COPY_PASTE_CHECK_PASTE_INTERVAL_COMPLETE,
          pageData
        });
      }
      async checkIfNextPasteAllowed(tabId) {
        try {
          this.abortController = new AbortController;
          const pageData = await getPageData(tabId);
          if (this.abortController.signal.aborted) return !1;
          const result = await this.getPasteStatusForCurrentTab(pageData, this.abortController.signal);
          if ("success" === result.status) return await this.setNextPasteAllowed(tabId, result.allowed, pageData), 
          !0;
        } catch {}
        return !1;
      }
      runCheckPaste(tabId, interval) {
        this.stopInterval = function(task, interval) {
          let timeoutId = null, isCancelled = !1;
          const runTask = async () => {
            isCancelled || await task() && !isCancelled && (timeoutId = setTimeout(runTask, interval));
          };
          return runTask(), {
            cancel: () => {
              isCancelled = !0, timeoutId && clearTimeout(timeoutId);
            }
          };
        }((() => this.checkIfNextPasteAllowed(tabId)), interval).cancel;
      }
      handleTabOrWindowChange=async tabChange => {
        if (!this.isFeatureOn("copy_paste_blocking")) return;
        this.stopCheckPasteInterval();
        const statusInterval = tab => "complete" === tab.status ? COPY_PASTE_CHECK_PASTE_INTERVAL_COMPLETE : COPY_PASTE_CHECK_PASTE_INTERVAL_LOADING;
        try {
          if ("tabId" in tabChange) {
            const tab = await browser.tabs.get(tabChange.tabId);
            tab && tab.id === tabChange.tabId && tab.active && this.runCheckPaste(tabChange.tabId, statusInterval(tab));
          } else {
            const windowId = tabChange.windowId, [tab] = await browser.tabs.query({
              active: !0,
              currentWindow: !0
            });
            tab && tab.id && tab.active && windowId === tab.windowId && this.runCheckPaste(tab.id, statusInterval(tab));
          }
        } catch {}
      };
      stopCheckPasteInterval() {
        this.stopInterval && (this.stopInterval(), this.stopInterval = void 0), this.abortController && (this.abortController.abort(), 
        this.abortController = void 0);
      }
      logCopyPasteRequest(copyPasteRequest) {
        console.group(copyPasteRequest.action === ClipboardAction.Copy ? "Copy" : "Paste", copyPasteRequest.url), 
        console.log("Metadata:", copyPasteRequest.metadata), console.log("Time:", copyPasteRequest.timestamp), 
        console.log("Status:", copyPasteRequest.is_blocked ? "Blocked" : "Allowed"), console.groupEnd();
      }
      async handleCopyPaste(tabId, copyPasteData) {
        copyPasteData.pageData || (this.isFeatureOn("copy_paste_blocking") || this.logger.error({
          error: "Missing page data in handle copy/paste event (copy_paste_blocking=false)",
          detail: copyPasteData
        }), copyPasteData.pageData = await getPageData(tabId));
        const copyPasteEvent = this.createCopyPasteEvent(copyPasteData);
        this.host.notify(copyPasteEvent), this.logCopyPasteRequest(copyPasteEvent);
      }
      setupCopyPasteBlocking() {
        const debouceDelay = navigator.hardwareConcurrency < 4 ? 2 : 1, handleTabChangeDebounced = debounce(this.handleTabOrWindowChange, debouceDelay);
        browser.tabs.onActivated.addListener((activeInfo => {
          handleTabChangeDebounced({
            tabId: activeInfo.tabId
          });
        }));
        const webNavTabChange = debounce(this.handleTabOrWindowChange, COPY_PASTE_CHECK_PASTE_NAV_CHANGE_DELAY);
        browser.webNavigation.onCommitted.addListener((details => {
          0 === details.frameId && (this.stopCheckPasteInterval(), setTimeout((async () => {
            const [tab] = await browser.tabs.query({
              active: !0
            });
            tab && tab.id === details.tabId && webNavTabChange({
              tabId: details.tabId
            });
          }), COPY_PASTE_CHECK_PASTE_NAV_CHANGE_DELAY));
        })), browser.webNavigation.onCompleted.addListener((async details => {
          0 === details.frameId && (this.stopCheckPasteInterval(), webNavTabChange({
            tabId: details.tabId
          }));
        })), browser.windows.onFocusChanged.addListener((windowId => {
          -1 !== windowId ? handleTabChangeDebounced({
            windowId
          }) : this.stopCheckPasteInterval();
        }));
      }
      listenCopyPasteEvents() {
        onMessage("copy-paste", (async event => {
          this.isFeatureOn("copy_paste_notification") && (event.tab?.id ? this.handleCopyPaste(event.tab.id, event.data) : this.logger.error({
            error: "Missing tab id in copy-paste",
            detail: event.data
          }));
        }));
      }
    }
    class BackendEvent {
      data;
      blockable;
      sensorName="BrowserExtensionSensor";
      sensorProtocolVersion="2018 September 28";
      constructor(data, blockable = !1) {
        this.data = data, this.blockable = blockable, data.timestamp || (data.timestamp = (new Date).toISOString());
      }
      toJSON() {
        const {timestamp, event_type} = this.data, extras = "sourceDest" in this.data ? this.data.sourceDest : {};
        return {
          sensor_data: {
            event_type,
            source: {
              ...extras,
              ...this.data.source
            },
            destination: {
              ...extras,
              ...this.data.destination
            },
            timestamp
          },
          sensor_name: this.sensorName,
          sensor_protocol_version: this.sensorProtocolVersion
        };
      }
      toHostRequest() {
        return {
          type: "process_event",
          event: this.toJSON(),
          blockable: this.blockable
        };
      }
    }
    class BackendBatchEvent {
      events;
      blockable;
      constructor(events, blockable = !1) {
        this.events = events, this.blockable = blockable;
      }
      mapToHostRequest() {
        return {
          type: "process_events_batch",
          events: this.events.map((event => new BackendEvent(event).toJSON())),
          blockable: this.blockable
        };
      }
    }
    var buffer = __webpack_require__(8287), POSITIONALS_EXP = /(%?)(%([sdijo]))/g;
    function format(message, ...positionals) {
      if (0 === positionals.length) return message;
      let positionalIndex = 0, formattedMessage = message.replace(POSITIONALS_EXP, ((match, isEscaped, _, flag) => {
        const value = function(positional, flag) {
          switch (flag) {
           case "s":
            return positional;

           case "d":
           case "i":
            return Number(positional);

           case "j":
            return JSON.stringify(positional);

           case "o":
            {
              if ("string" == typeof positional) return positional;
              const json = JSON.stringify(positional);
              return "{}" === json || "[]" === json || /^\[object .+?\]$/.test(json) ? positional : json;
            }
          }
        }(positionals[positionalIndex], flag);
        return isEscaped ? match : (positionalIndex++, value);
      }));
      return positionalIndex < positionals.length && (formattedMessage += ` ${positionals.slice(positionalIndex).join(" ")}`), 
      formattedMessage = formattedMessage.replace(/%{2,2}/g, "%"), formattedMessage;
    }
    var InvariantError = class extends Error {
      constructor(message, ...positionals) {
        super(message), this.message = message, this.name = "Invariant Violation", this.message = format(message, ...positionals), 
        function(error) {
          if (!error.stack) return;
          const nextStack = error.stack.split("\n");
          nextStack.splice(1, 2), error.stack = nextStack.join("\n");
        }(this);
      }
    }, invariant = (predicate, message, ...positionals) => {
      if (!predicate) throw new InvariantError(message, ...positionals);
    };
    invariant.as = (ErrorConstructor, predicate, message, ...positionals) => {
      if (!predicate) {
        const formatMessage = 0 === positionals.length ? message : format(message, ...positionals);
        let error;
        try {
          error = Reflect.construct(ErrorConstructor, [ formatMessage ]);
        } catch (err) {
          error = ErrorConstructor(formatMessage);
        }
        throw error;
      }
    };
    class WebappIntegration extends group {
      getFilenameFromUri(uri) {
        const pathname = new URL(uri).pathname, fileName = pathname.substring(pathname.lastIndexOf("/") + 1);
        return decodeURIComponent(fileName);
      }
      extractHeaderValue(headers, headerName) {
        if (!headers) return;
        const header = headers.find((h => h.name.toLowerCase() === headerName.toLowerCase()));
        return header?.value;
      }
      getParentPath(path) {
        const pathParts = path.split("/");
        return pathParts.pop(), pathParts.join("/");
      }
      isTabRequest(details) {
        return "OPTIONS" !== details.method && -1 !== details.tabId;
      }
      isResponseOk(details, statusCode = 200) {
        return details.statusCode === statusCode;
      }
      isTabRequestOk(details, statusCode = 200) {
        return "OPTIONS" !== details.method && (this.isTabRequest(details) && this.isResponseOk(details, statusCode));
      }
      async isFetchOk(resp) {
        invariant(resp.ok, "Fetch error: status: %i. Error: %o", resp.status, resp.ok ? void 0 : await resp.text());
      }
      parseWebRequestJSON(details) {
        const bytes = details.requestBody?.raw?.[0]?.bytes;
        return invariant(bytes, "No request body found"), JSON.parse(buffer.hp.from(bytes).toString("utf-8"));
      }
      handleDownloadRequestId(url, requestId) {
        wrappedEvents.emit("download-metadata", url, {
          request_id: requestId
        });
      }
    }
    const Office365 = {
      ZipUrl: "https://*.svc.ms/transform/zip",
      DownloadUrl: "https://*.sharepoint.com/*/download.aspx",
      SessionUploadUrl: "https://*.sharepoint.com/*/uploadSession",
      MsGraphUrl: "https://graph.microsoft.com/v1.0/*",
      MsGraphContentUploadUrl: "https://graph.microsoft.com/v1.0/me/drive/*/content",
      MsGraphContentUploadSharedDriveUrl: "https://graph.microsoft.com/v1.0/drives/*/root://",
      ConvertToPdfUrl: "https://*.svc.ms/transform/pdf"
    };
    (function(obj) {
      for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const typedKey = key;
        if (obj[typedKey].endsWith("*")) continue;
        obj[typedKey] = obj[typedKey] + "*";
      }
    })(Office365);
    const trimCurlyBrackets = str => {
      const match = str.match(/{(.*?)}/);
      return match ? match[1] : str;
    };
    class Office365Integration extends WebappIntegration {
      requestAuthCache=new (node_cache_default());
      requestBodyCache=new (node_cache_default())({
        stdTTL: 60
      });
      constructor() {
        super("process_events", "office_365");
      }
      async sendZipEvent(details, files) {
        if (!this.isTabRequestOk(details)) return;
        const requestId = this.getRequestId(details.responseHeaders);
        invariant(requestId, "x-correlation-id header not found");
        const {backendObjectPageData} = await getAllPageDataFormats(details.tabId), responses = await Promise.all(files.map((file => fetch(file.docId))));
        await Promise.all(responses.map(this.isFetchOk));
        const documents = await Promise.all(responses.map((r => r.json())));
        wrappedEvents.emit("process-events", documents.map((document => {
          const fileId = trimCurlyBrackets(document.eTag), pathname = new URL(document.webUrl).pathname, quickXorHash = document.file?.hashes?.quickXorHash;
          return {
            event_type: "zip",
            sourceDest: {
              ...backendObjectPageData,
              file_id: fileId.toLowerCase(),
              file_name: document.name,
              file_size: String(document.size),
              quick_xor_hash: quickXorHash,
              file_path: pathname,
              file_url: document.webUrl,
              metadata: {
                request_id: requestId
              }
            }
          };
        })));
      }
      getApiUrl(url) {
        const splitters = [ "/_api/web", "/_api/site", "/_api/v2.0" ];
        for (const splitter of splitters) if (url.includes(splitter)) {
          const objUrl = new URL(url);
          if ("localhost" === objUrl.hostname) {
            const siteUrl = objUrl.searchParams.get("siteUrl");
            return invariant(siteUrl, "site url not found"), siteUrl + splitter;
          }
          return url.split(splitter)[0] + splitter;
        }
        throw new Error("api url not found: " + url);
      }
      handleDownloadRequest=details => {
        if (!this.isTabRequestOk(details)) return;
        const {url, responseHeaders} = details, requestId = this.getRequestId(responseHeaders);
        requestId && this.handleDownloadRequestId(url, requestId);
      };
      handleZipRequest=async details => {
        if (!this.isTabRequest(details)) return;
        const files = details.requestBody?.formData?.files;
        invariant(files, "files not found in form data"), this.requestBodyCache.set(details.requestId, files);
      };
      handleZipResponse=async details => {
        if (!this.isTabRequestOk(details)) return;
        const body = this.requestBodyCache.get(details.requestId);
        invariant(body, "zip request body not found");
        const parsed = JSON.parse(body);
        invariant(parsed.items.length, "unsupported zip request"), await this.sendZipEvent(details, parsed.items);
      };
      handleOfficeUploadSessionResponse=async details => {
        if (!this.isTabRequestOk(details, 201)) return;
        const requestId = this.getRequestId(details.responseHeaders), url = new URL(details.url);
        url.search = "", url.pathname = url.pathname.replace("/uploadSession", ""), url.searchParams.set("select", "id,eTag,name,size,createdDateTime,webUrl,file,listItem"), 
        url.searchParams.set("expand", "listItem");
        const resp = await fetch(url);
        await this.isFetchOk(resp);
        const document = await resp.json();
        let uploadEvent;
        try {
          if (uploadEvent = await sendMessageToTab(details.tabId, "upload-search-and-pop", {
            attrs: {
              name: document.name
            },
            timestamp: details.timeStamp
          }, {
            frameId: details.frameId
          }), !uploadEvent) throw new Error("failed to get recent upload");
        } catch {
          const baseFilename = document.name.match(/^(.+?)(?=\s+(?:\(\d+\)|\d+))\s+(?:\(\d+\)|\d+)(\.[^.]+)?$/);
          invariant(baseFilename?.[1], "failed to get base filename: %s", document.name), 
          uploadEvent = await sendMessageToTab(details.tabId, "upload-search-and-pop", {
            attrs: {
              startsWith: baseFilename[1]
            },
            timestamp: details.timeStamp
          }, {
            frameId: details.frameId
          });
        }
        invariant(uploadEvent, "upload event not found");
        const {backendObjectPageData} = await getAllPageDataFormats(details.tabId), fileUrl = document.listItem?.webUrl || document.webUrl;
        wrappedEvents.emit("process-events", {
          event_type: "create",
          sourceDest: {
            ...backendObjectPageData,
            metadata: {
              request_id: requestId
            },
            file_id: trimCurlyBrackets(document.eTag).toLowerCase(),
            file_name: document.name,
            file_size: String(document.size),
            file_path: decodeURI(new URL(fileUrl).pathname),
            file_url: fileUrl,
            quick_xor_hash: document.file.hashes.quickXorHash
          },
          source: {
            upload_file_id: uploadEvent.upload_id
          }
        });
      };
      handleOfficeContentUploadResponse=async details => {
        if (!this.isTabRequestOk(details, 201)) return;
        const authHeader = this.requestAuthCache.get(String(details.tabId));
        invariant(authHeader, "auth header not found. url: %s", details.url);
        const requestId = this.getRequestId(details.responseHeaders), url = new URL(details.url), filename = decodeURIComponent(url.pathname.substring(url.pathname.indexOf("/drive/root:/") + 13, url.pathname.indexOf(":/content"))), driveRoot = url.pathname.indexOf("/drive/root");
        url.pathname = url.pathname.substring(0, driveRoot + 11) + "/children", url.search = "", 
        url.searchParams.set("$orderby", "lastModifiedDateTime desc"), url.searchParams.set("$top", "1"), 
        url.searchParams.set("expand", "listItem");
        const resp = await fetch(url, {
          headers: {
            Authorization: authHeader
          }
        });
        await this.isFetchOk(resp);
        const files = await resp.json();
        invariant(files.value.length, "file not found");
        const file = files.value[0], uploadEvent = await sendMessageToTab(details.tabId, "upload-search-and-pop", {
          attrs: {
            name: filename
          },
          timestamp: details.timeStamp
        }, {
          frameId: details.frameId
        });
        invariant(uploadEvent, "upload event not found");
        const {backendObjectPageData} = await getAllPageDataFormats(details.tabId);
        wrappedEvents.emit("process-events", {
          event_type: "create",
          sourceDest: {
            ...backendObjectPageData,
            file_id: trimCurlyBrackets(file.eTag).toLowerCase(),
            file_name: file.name,
            file_size: String(file.size),
            file_path: decodeURI(new URL(file.listItem.webUrl).pathname),
            file_url: file.listItem.webUrl,
            quick_xor_hash: file.file.hashes.quickXorHash,
            metadata: {
              request_id: requestId
            }
          },
          source: {
            upload_file_id: uploadEvent.upload_id
          }
        });
      };
      handleConvertToPdfRequest=async details => {
        if (!this.isTabRequestOk(details)) return;
        const url = new URL(details.url), correlationId = url.searchParams.get("correlationId");
        invariant(correlationId, "correlation id not found");
        const docid = url.searchParams.get("docid");
        invariant(docid, "document url not found");
        const sourceRes = await fetch(docid + "&$expand=listItem");
        await this.isFetchOk(sourceRes);
        const document = await sourceRes.json(), newName = document.name.replace(/\.[^/.]+$/, ".pdf"), convertedPdfUrl = `https://graph.microsoft.com/v1.0/${"documentLibrary" === document.parentReference.driveType ? `sites/${document.parentReference.siteId}` : ""}/drives/${`${document.parentReference.driveId}/items/${document.parentReference.id}`}:/${encodeURIComponent(newName)}`, authHeader = this.requestAuthCache.get(String(details.tabId));
        invariant(authHeader, "auth header not found. url: %s", details.url);
        let convertedPdfResp = await fetch(convertedPdfUrl, {
          headers: {
            Authorization: authHeader
          }
        });
        convertedPdfResp.ok || (convertedPdfResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(newName)}`, {
          headers: {
            Authorization: authHeader
          }
        }), await this.isFetchOk(convertedPdfResp));
        const convertedPdf = await convertedPdfResp.json(), {backendObjectPageData} = await getAllPageDataFormats(details.tabId);
        wrappedEvents.emit("process-events", {
          event_type: "save_as",
          source: {
            ...backendObjectPageData,
            file_id: trimCurlyBrackets(document.eTag).toLowerCase(),
            file_name: document.name,
            file_path: decodeURIComponent(new URL(document.listItem.webUrl).pathname),
            file_size: document.listItem.fields.FileSizeDisplay,
            file_url: document.listItem.webUrl,
            quick_xor_hash: document.file.hashes.quickXorHash,
            metadata: {
              request_id: correlationId
            }
          },
          destination: {
            ...backendObjectPageData,
            file_id: trimCurlyBrackets(convertedPdf.eTag).toLowerCase(),
            file_name: convertedPdf.name,
            file_path: decodeURIComponent(new URL(convertedPdf.webUrl).pathname),
            file_url: convertedPdf.webUrl,
            file_size: String(convertedPdf.size),
            quick_xor_hash: convertedPdf.file.hashes.quickXorHash,
            metadata: {
              request_id: correlationId
            }
          }
        });
      };
      getRequestId(headers) {
        invariant(headers, "headers not found");
        const requestId = this.extractHeaderValue(headers, "request-id") || this.extractHeaderValue(headers, "sprequestguid") || this.extractHeaderValue(headers, "x-correlationid");
        return invariant(requestId, "request id not found"), requestId;
      }
      setup() {
        this.listen(browser.webRequest.onHeadersReceived, this.handleDownloadRequest, [ {
          urls: [ Office365.DownloadUrl, Office365.ZipUrl ]
        }, [ "responseHeaders" ] ]), this.listen(browser.webRequest.onBeforeSendHeaders, (async details => {
          if (!this.isTabRequest(details)) return;
          const authHeader = details.requestHeaders?.find((header => "Authorization" === header.name));
          authHeader?.value && this.requestAuthCache.set(String(details.tabId), authHeader.value);
        }), [ {
          urls: [ Office365.MsGraphUrl ],
          types: [ "xmlhttprequest" ]
        }, [ "requestHeaders" ] ]), this.listen(browser.webRequest.onHeadersReceived, this.handleOfficeContentUploadResponse, [ {
          urls: [ Office365.MsGraphContentUploadUrl, Office365.MsGraphContentUploadSharedDriveUrl ],
          types: [ "xmlhttprequest" ]
        }, [ "responseHeaders" ] ]), this.listen(browser.webRequest.onHeadersReceived, this.handleOfficeUploadSessionResponse, [ {
          urls: [ Office365.SessionUploadUrl ],
          types: [ "xmlhttprequest" ]
        }, [ "responseHeaders" ] ]), this.listen(browser.webRequest.onBeforeRequest, this.handleZipRequest, [ {
          urls: [ Office365.ZipUrl ]
        }, [ "requestBody" ] ]), this.listen(browser.webRequest.onHeadersReceived, this.handleZipResponse, [ {
          urls: [ Office365.ZipUrl ]
        }, [ "responseHeaders" ] ]), this.listen(browser.webRequest.onHeadersReceived, this.handleConvertToPdfRequest, [ {
          urls: [ Office365.ConvertToPdfUrl ],
          types: [ "xmlhttprequest" ]
        } ]);
      }
    }
    setupWebAppStorage(), onMessage("get-webapp-status", (async event => (await waitForFeaturesData(), 
    isWebAppEnabled(event.data)))), onMessage("get-feature", (async event => (await waitForFeaturesData(), 
    isFeatureEnabled(event.data)))), wrappedEvents.on("reset-features", (async () => {
      hostSupportedFeatures && (console.log("Reset supported-features"), hostSupportedFeatures = void 0, 
      await connect(), wrappedEvents.emit("report-version"));
    })), browser.alarms.onAlarm.addListener((alarm => {
      if ("update_features" === alarm.name) {
        const minutes = hostSupportedFeatures?.update_features_interval_minutes;
        console.log(`Updating features by alarm (minutes=${minutes})...`), wrappedEvents.emit("reset-features");
      }
    })), onMessage("get-extension-info", (async msg => {
      const {data: extensionId} = msg;
      try {
        if (browser.management) return await browser.management.get(extensionId);
      } catch {}
    })), (new Office365Integration).setup(), function() {
      const host = getHost(), logger = getLogger(host, "process_events");
      wrappedEvents.onAsync("process-events", (async (events, blockable) => {
        if (!isFeatureEnabled("process_events")) return logger.error({
          error: "Feature 'process_events' is disabled",
          events,
          blockable
        }), {
          result: "allow",
          status: "success"
        };
        const blockingEnabled = isFeatureEnabled("blocking"), blockableEvent = blockable && blockingEnabled, isProcessEventBatchSupported = isFeatureEnabled("process_multiple_events_available");
        if (console.log("Process-events:", events), isProcessEventBatchSupported && Array.isArray(events)) {
          const backendEvent = new BackendBatchEvent(events, blockableEvent);
          return await host.ask(backendEvent.mapToHostRequest());
        }
        if (Array.isArray(events)) {
          const promises = events.map((event => {
            const backendEvent = new BackendEvent(event, blockableEvent);
            return host.ask(backendEvent.toHostRequest());
          }));
          if (blockingEnabled) {
            const blockedResponse = (await Promise.all(promises)).find((response => "block" === response.result));
            if (blockedResponse) return blockedResponse;
          }
          return {
            result: "allow",
            status: "success"
          };
        }
        {
          const backendEvent = new BackendEvent(events, blockableEvent);
          return await host.ask(backendEvent.toHostRequest());
        }
      })), onMessage("process-events", (async message => {
        const {events: eventsData, blockable} = message.data;
        return await wrappedEvents.emitAsync("process-events", eventsData, blockable ?? !0);
      }));
    }(), (new downloads).setup(), (new TabsGroup).setup(), (new UploadsGroup).setup(), 
    (new VersionGroup).setup(), onMessage("log", (async message => {
      const {domain, level, ...data} = message.data, logger = getLogger(extensionHost, domain ?? "logging");
      "error" === level ? logger.error(data) : (console.log(level, data), logger.send(level, data));
    })), addEventListener("unhandledrejection", (event => {
      defaultLogger.error({
        error: "unhandledrejection",
        errorMessage: getErrorMessage(event.reason)
      });
    })), async function() {
      onMessage("share-data", (async message => {
        const {requests, blockable} = message.data, backendObjectPageData = await getObjectPageDataForBackendEvent(message.tab?.id), mapped = requests.map((request => {
          const fullPath = getFullPathFromMessageData(request), metadata = request.requestId ? {
            request_id: request.requestId
          } : void 0;
          return {
            event_type: "share",
            sourceDest: {},
            source: omitByUndefined({
              ...backendObjectPageData,
              file_id: request.fileId,
              file_name: request.fileName,
              file_path: request.filePath,
              file_size: request.fileSize,
              file_url: request.fileUrl,
              metadata,
              ...fullPath
            }),
            destination: omitByUndefined({
              ...backendObjectPageData,
              user_ids: request.userIds?.filter((id => id)),
              role: request.role,
              type: request.type,
              file_id: request.fileId,
              file_name: request.fileName,
              file_path: request.filePath,
              file_size: request.fileSize,
              file_url: request.fileUrl,
              metadata,
              ...fullPath
            })
          };
        }));
        return await wrappedEvents.emitAsync("process-events", mapped, blockable ?? !0);
      }));
    }(), onMessage("upload-cloud-data", (async message => {
      if (!message.tab?.id) return;
      const {files, metadata} = message.data, {backendObjectPageData, pageData} = await getAllPageDataFormats(message.tab?.id), mapped = files.map((file => {
        const fullPath = getFullPathFromMessageData(file);
        return {
          event_type: "create",
          source: {
            ...backendObjectPageData,
            ...metadata,
            file_url: pageData.url,
            file_id: file.sourceId || file.id,
            upload_file_id: file.upload_id || "",
            file_name: file.title,
            file_path: file.path || file.title,
            ...fullPath
          },
          destination: {
            ...backendObjectPageData,
            ...metadata,
            file_url: pageData.url,
            file_id: file.id,
            file_name: file.title,
            file_path: file.path || file.title,
            ...fullPath
          }
        };
      }));
      wrappedEvents.emit("process-events", mapped);
    })), onMessage("rename-cloud-file", (async message => {
      if (!message.tab?.id) return;
      const {fileId, oldName, newName} = message.data, {backendObjectPageData, pageData} = await getAllPageDataFormats(message.tab.id), fullPath = getFullPathFromMessageData(message.data);
      wrappedEvents.emit("process-events", {
        event_type: "rename",
        source: {
          ...backendObjectPageData,
          file_id: fileId,
          file_name: oldName,
          file_path: oldName,
          file_url: pageData.url,
          ...fullPath ? {
            ...fullPath,
            file_path_components: [ ...fullPath.file_path_components.slice(0, -1), oldName ].filter(Boolean)
          } : {}
        },
        destination: {
          ...backendObjectPageData,
          file_id: fileId,
          file_name: newName,
          file_path: newName,
          file_url: pageData.url,
          ...fullPath
        }
      });
    })), function() {
      const cache = new (node_cache_default())({
        stdTTL: 30,
        checkperiod: 60
      });
      async function cacheTabData(sourceTabId, tabId) {
        const sourceTitle = await sendMessageToTab(sourceTabId, "get-document-title", null);
        if (!sourceTitle) throw new Error("missing source tab document title");
        const {pageData, backendObjectPageData} = await getAllPageDataFormats(sourceTabId);
        cache.set(tabId, {
          sourceTitle,
          pageData,
          backendObjectPageData
        });
      }
      onMessage("copy-cloud-file", (async message => {
        if (!message.tab?.id) return;
        const {source, destination} = message.data, {backendObjectPageData} = await getAllPageDataFormats(message.tab?.id), sourceFullPath = getFullPathFromMessageData(message.data.source), destinationFullPath = getFullPathFromMessageData(message.data.destination);
        wrappedEvents.emit("process-events", {
          event_type: "copy",
          source: {
            ...backendObjectPageData,
            file_id: source.fileId,
            file_name: source.fileName,
            file_path: source.fileName,
            ...sourceFullPath
          },
          destination: {
            ...backendObjectPageData,
            file_id: destination.fileId,
            file_name: destination.fileName,
            file_path: destination.fileName,
            ...destinationFullPath
          }
        });
      })), "onCreatedNavigationTarget" in browser.webNavigation ? browser.webNavigation.onCreatedNavigationTarget.addListener((async ({sourceTabId, tabId, url}) => {
        if (isWebAppEnabled("google_workspace")) try {
          await cacheTabData(sourceTabId, tabId);
        } catch (err) {
          copy_file_logger.error({
            error: "error occured in site-events/copy-file (onCreatedNavigationTarget)",
            errorMessage: getErrorMessage(err),
            details: {
              sourceTabId,
              tabId,
              url
            }
          });
        }
      }), {
        url: [ {
          hostSuffix: "google.com",
          pathSuffix: "/copy"
        } ]
      }) : wrappedEvents.on("request-url-to-tab-info", (async ({tabId, url: pendingUrl, targetTabId}) => {
        try {
          const url = new URL(pendingUrl);
          if (!url.hostname.endsWith("google.com") || !url.pathname.endsWith("/copy") || !isWebAppEnabled("google_workspace")) return;
          await cacheTabData(tabId, targetTabId);
        } catch (err) {
          copy_file_logger.error({
            error: "error occured in site-events/copy-file (request-url-to-tab-info)",
            errorMessage: getErrorMessage(err),
            details: {
              tabId,
              pendingUrl
            }
          });
        }
      })), browser.webRequest.onBeforeRedirect.addListener((async details => {
        try {
          if (!isWebAppEnabled("google_workspace")) return;
          const url = new URL(details.url);
          if (!url.pathname.endsWith("/copy")) return;
          const sourceId = url.searchParams.get("id") || url.searchParams.get("copySourceId"), destId = function(pathname) {
            const pathnameToCopy = pathname.substring(pathname.indexOf("/d/") + 3, pathname.indexOf("/edit"));
            return pathnameToCopy.substring(pathnameToCopy.lastIndexOf("/"));
          }(new URL(details.redirectUrl).pathname);
          if (!sourceId || !destId) return void copy_file_logger.error({
            error: "Error in site-events/copy-file: missing source or dest file id",
            details
          });
          const {sourceTitle, backendObjectPageData} = cache.get(details.tabId), newTitle = url.searchParams.get("title");
          wrappedEvents.emit("process-events", {
            event_type: "copy",
            source: {
              ...backendObjectPageData,
              file_id: sourceId,
              file_name: sourceTitle,
              file_path: sourceTitle
            },
            destination: {
              ...backendObjectPageData,
              file_id: destId,
              file_name: newTitle,
              file_path: newTitle
            }
          });
        } catch (err) {
          copy_file_logger.error({
            errorMessage: getErrorMessage(err),
            error: "Error in tracing copy event in google docs",
            details
          });
        }
      }), {
        urls: [ "https://*.google.com/*/copy?*" ],
        types: [ "main_frame" ]
      });
    }(), onMessage("save-as", (async message => {
      if (!message.tab?.id) return;
      const {source, destination} = message.data, {backendObjectPageData} = await getAllPageDataFormats(message.tab.id);
      wrappedEvents.emit("process-events", {
        event_type: "save_as",
        source: {
          ...backendObjectPageData,
          file_id: source.fileId,
          file_name: source.fileName,
          file_path: source.fileName
        },
        destination: {
          ...backendObjectPageData,
          file_id: destination.fileId,
          file_name: destination.fileName,
          file_path: destination.fileName
        }
      });
    })), onMessage("email-attachment", (async message => {
      if (!message.tab?.id) return void email_logger.error({
        error: "No tab data found in email-attachment event",
        message
      });
      const {pageData: {metadata, url, cloud_provider}, backendObjectPageData} = await getAllPageDataFormats(message.tab?.id), {name, uploadId, cloudFileId, attachmentId, emailId, size} = message.data;
      let source;
      if (uploadId) source = {
        url: url || message.tab.url,
        file_name: name,
        upload_file_id: uploadId,
        metadata,
        object_type: "webpage"
      }; else {
        if (!cloudFileId) throw new Error("Invalid attachment data");
        source = {
          ...backendObjectPageData,
          file_id: cloudFileId,
          file_name: name,
          file_path: name,
          file_size: String(size)
        };
      }
      wrappedEvents.emit("process-events", {
        event_type: "attachment_add",
        source,
        destination: {
          cloud_provider,
          email: metadata.email,
          email_id: emailId,
          attachment_id: attachmentId,
          file_name: name,
          file_size: String(size),
          object_type: "email_attachment"
        }
      });
    })), onMessage("email-sent", (async message => {
      const {metadata, cloud_provider} = await getPageData(message.tab.id), {requests} = message.data, timestamp = (new Date).toISOString(), mapped = requests.map((request => ({
        event_type: "sent_email",
        source: {
          cloud_provider,
          email_id: request.emailId,
          email: metadata.email,
          attachment_id: request.attachmentId,
          subject: request.subject,
          file_name: request.fileName,
          file_size: request.fileSize,
          object_type: "email_attachment"
        },
        destination: {
          cloud_provider,
          email: request.recipientEmail,
          email_id: request.emailId,
          attachment_id: request.attachmentId,
          subject: request.subject,
          file_name: request.fileName,
          file_size: request.fileSize,
          object_type: "email_attachment"
        },
        timestamp
      })));
      return await wrappedEvents.emitAsync("process-events", mapped, !0);
    })), onMessage("save-attachment", (async message => {
      if (!message.tab?.id) return;
      const {pageData, backendObjectPageData} = await getAllPageDataFormats(message.tab.id), {attachmentId, fileId, fileName, emailId} = message.data;
      wrappedEvents.emit("process-events", {
        event_type: "attachment_save",
        source: {
          cloud_provider: backendObjectPageData.cloud_provider,
          email: pageData.metadata.email,
          email_id: emailId,
          attachment_id: attachmentId,
          file_name: fileName,
          object_type: "email_attachment"
        },
        destination: {
          ...backendObjectPageData,
          file_id: fileId,
          file_name: fileName,
          file_path: fileName
        }
      });
    })), (new ClipboardGroup).setup(), (new TelemetryGroup).setup(), initFeatureFlags();
  })();
})();