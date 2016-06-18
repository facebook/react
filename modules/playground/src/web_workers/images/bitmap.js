/*
    Copyright 2011 Andrey Zholos

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be included
    in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function Bitmap(width, height) {
  this.width = width;
  this.height = height;
  this.pixel = new Array(width);
  for (var x = 0; x < width; x++) {
    this.pixel[x] = new Array(height);
    for (var y = 0; y < height; y++) this.pixel[x][y] = [0, 0, 0, 0];
  }
}

Bitmap.prototype.subsample =
    function(n) {
  var width = ~~(this.width / n);
  var height = ~~(this.height / n);
  var pixel = new Array(width);
  for (var x = 0; x < width; x++) {
    pixel[x] = new Array(height);
    for (var y = 0; y < height; y++) {
      var q = [0, 0, 0, 0];
      for (var i = 0; i < n; i++)
        for (var j = 0; j < n; j++) {
          var r = this.pixel[x * n + i][y * n + j];
          q[0] += r[3] * r[0];
          q[1] += r[3] * r[1];
          q[2] += r[3] * r[2];
          q[3] += r[3];
        }
      if (q[3]) {
        q[0] /= q[3];
        q[1] /= q[3];
        q[2] /= q[3];
        q[3] /= n * n;
      }
      pixel[x][y] = q;
    }
  }
  this.width = width;
  this.height = height;
  this.pixel = pixel;
}

    Bitmap.prototype.dataURL = function() {
  function sample(v) { return ~~(Math.max(0, Math.min(1, v)) * 255); }

  function gamma(v) { return sample(Math.pow(v, .45455)); }

  function row(pixel, width, y) {
    var data = "\0";
    for (var x = 0; x < width; x++) {
      var r = pixel[x][y];
      data += String.fromCharCode(gamma(r[0]), gamma(r[1]), gamma(r[2]), sample(r[3]));
    }
    return data;
  }

  function rows(pixel, width, height) {
    var data = "";
    for (var y = 0; y < height; y++) data += row(pixel, width, y);
    return data;
  }

  function adler(data) {
    var s1 = 1, s2 = 0;
    for (var i = 0; i < data.length; i++) {
      s1 = (s1 + data.charCodeAt(i)) % 65521;
      s2 = (s2 + s1) % 65521;
    }
    return s2 << 16 | s1;
  }

  function hton(i) { return String.fromCharCode(i >>> 24, i >>> 16 & 255, i >>> 8 & 255, i & 255); }

  function deflate(data) {
    var len = data.length;
    return "\170\1\1" + String.fromCharCode(len & 255, len >>> 8, ~len & 255, (~len >>> 8) & 255) +
           data + hton(adler(data));
  }

  function crc32(data) {
    var c = ~0;
    for (var i = 0; i < data.length; i++)
      for (var b = data.charCodeAt(i) | 0x100; b != 1; b >>>= 1)
        c = (c >>> 1) ^ ((c ^ b) & 1 ? 0xedb88320 : 0);
    return ~c;
  }

  function chunk(type, data) { return hton(data.length) + type + data + hton(crc32(type + data)); }

  function base64(data) {
    enc = "";
    for (var i = 5, n = data.length * 8 + 5; i < n; i += 6)
      enc += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
          [(data.charCodeAt(~~(i / 8) - 1) << 8 | data.charCodeAt(~~(i / 8))) >> 7 - i % 8 & 63];
    for (; enc.length % 4; enc += "=")
      ;
    return enc;
  }

  var png = "\211PNG\r\n\32\n" +
            chunk("IHDR", hton(this.width) + hton(this.height) + "\10\6\0\0\0") +
            chunk("IDAT", deflate(rows(this.pixel, this.width, this.height))) + chunk("IEND", "");

  return "data:image/png;base64," + base64(png);
}
