/// <reference path="../bitmap.d.ts" /> /// <reference path="../b64.d.ts" />
import {Injectable} from '@angular/core';
declare var base64js: any /** TODO #9100 */;

// Temporary fix for Typescript issue #4220 (https://github.com/Microsoft/TypeScript/issues/4220)
// var _ImageData: (width: number, height: number) => void = <any>postMessage;
var _ImageData: {
  prototype: ImageData, new (width: number, height: number): ImageData;
}
= ImageData;

// This class is based on the Bitmap examples at:
// http://www.i-programmer.info/projects/36-web/6234-reading-a-bmp-file-in-javascript.html
// and
// http://www.worldwidewhat.net/2012/07/how-to-draw-bitmaps-using-javascript/
@Injectable()
export class BitmapService {
  convertToImageData(buffer: ArrayBuffer): ImageData {
    var bmp = this._getBMP(buffer);
    return this._BMPToImageData(bmp);
  }

  applySepia(imageData: ImageData): ImageData {
    var buffer = imageData.data;
    for (var i = 0; i < buffer.length; i += 4) {
      var r = buffer[i];
      var g = buffer[i + 1];
      var b = buffer[i + 2];
      buffer[i] = (r * .393) + (g * .769) + (b * .189);
      buffer[i + 1] = (r * .349) + (g * .686) + (b * .168);
      buffer[i + 2] = (r * .272) + (g * .534) + (b * .131);
    }
    return imageData;
  }

  toDataUri(imageData: ImageData): string {
    var header = this._createBMPHeader(imageData);
    imageData = this._imageDataToBMP(imageData);
    return 'data:image/bmp;base64,' + btoa(header) + base64js.fromByteArray(imageData.data);
  }

  // converts a .bmp file ArrayBuffer to a dataURI
  arrayBufferToDataUri(data: Uint8Array): string {
    return 'data:image/bmp;base64,' + base64js.fromByteArray(data);
  }

  // returns a UInt8Array in BMP order (starting from the bottom)
  private _imageDataToBMP(imageData: ImageData): ImageData {
    var width = imageData.width;
    var height = imageData.height;

    var data = imageData.data;
    for (var y = 0; y < height / 2; ++y) {
      var topIndex = y * width * 4;
      var bottomIndex = (height - y) * width * 4;
      for (var i = 0; i < width * 4; i++) {
        this._swap(data, topIndex, bottomIndex);
        topIndex++;
        bottomIndex++;
      }
    }

    return imageData;
  }

  private _swap(data: Uint8Array | Uint8ClampedArray | number[], index1: number, index2: number) {
    var temp = data[index1];
    data[index1] = data[index2];
    data[index2] = temp;
  }

  // Based on example from
  // http://www.worldwidewhat.net/2012/07/how-to-draw-bitmaps-using-javascript/
  private _createBMPHeader(imageData: ImageData): string {
    var numFileBytes = this._getLittleEndianHex(imageData.width * imageData.height);
    var w = this._getLittleEndianHex(imageData.width);
    var h = this._getLittleEndianHex(imageData.height);
    return 'BM' +                // Signature
           numFileBytes +        // size of the file (bytes)*
           '\x00\x00' +          // reserved
           '\x00\x00' +          // reserved
           '\x36\x00\x00\x00' +  // offset of where BMP data lives (54 bytes)
           '\x28\x00\x00\x00' +  // number of remaining bytes in header from here (40 bytes)
           w +                   // the width of the bitmap in pixels*
           h +                   // the height of the bitmap in pixels*
           '\x01\x00' +          // the number of color planes (1)
           '\x20\x00' +          // 32 bits / pixel
           '\x00\x00\x00\x00' +  // No compression (0)
           '\x00\x00\x00\x00' +  // size of the BMP data (bytes)*
           '\x13\x0B\x00\x00' +  // 2835 pixels/meter - horizontal resolution
           '\x13\x0B\x00\x00' +  // 2835 pixels/meter - the vertical resolution
           '\x00\x00\x00\x00' +  // Number of colors in the palette (keep 0 for 32-bit)
           '\x00\x00\x00\x00';   // 0 important colors (means all colors are important)
  }

  private _BMPToImageData(bmp: BitmapFile): ImageData {
    var width = bmp.infoHeader.biWidth;
    var height = bmp.infoHeader.biHeight;
    var imageData = new _ImageData(width, height);

    var data = imageData.data;
    var bmpData = bmp.pixels;
    var stride = bmp.stride;

    for (var y = 0; y < height; ++y) {
      for (var x = 0; x < width; ++x) {
        var index1 = (x + width * (height - y)) * 4;
        var index2 = x * 3 + stride * y;
        data[index1] = bmpData[index2 + 2];
        data[index1 + 1] = bmpData[index2 + 1];
        data[index1 + 2] = bmpData[index2];
        data[index1 + 3] = 255;
      }
    }
    return imageData;
  }

  private _getBMP(buffer: ArrayBuffer): BitmapFile {
    var datav = new DataView(buffer);
    var bitmap: BitmapFile = {
      fileHeader: {
        bfType: datav.getUint16(0, true),
        bfSize: datav.getUint32(2, true),
        bfReserved1: datav.getUint16(6, true),
        bfReserved2: datav.getUint16(8, true),
        bfOffBits: datav.getUint32(10, true),
      },
      infoHeader: {
        biSize: datav.getUint32(14, true),
        biWidth: datav.getUint32(18, true),
        biHeight: datav.getUint32(22, true),
        biPlanes: datav.getUint16(26, true),
        biBitCount: datav.getUint16(28, true),
        biCompression: datav.getUint32(30, true),
        biSizeImage: datav.getUint32(34, true),
        biXPelsPerMeter: datav.getUint32(38, true),
        biYPelsPerMeter: datav.getUint32(42, true),
        biClrUsed: datav.getUint32(46, true),
        biClrImportant: datav.getUint32(50, true)
      },
      stride: null,
      pixels: null
    };
    var start = bitmap.fileHeader.bfOffBits;
    bitmap.stride =
        Math.floor((bitmap.infoHeader.biBitCount * bitmap.infoHeader.biWidth + 31) / 32) * 4;
    bitmap.pixels = new Uint8Array(datav.buffer, start);
    return bitmap;
  }

  // Based on example from
  // http://www.worldwidewhat.net/2012/07/how-to-draw-bitmaps-using-javascript/
  private _getLittleEndianHex(value: number): string {
    var result: any[] /** TODO #9100 */ = [];

    for (var bytes = 4; bytes > 0; bytes--) {
      result.push(String.fromCharCode(value & 255));
      value >>= 8;
    }

    return result.join('');
  }
}

interface BitmapFile {
  fileHeader: {
    bfType: number;
    bfSize: number;
    bfReserved1: number;
    bfReserved2: number;
    bfOffBits: number;
  };
  infoHeader: {
    biSize: number;
    biWidth: number;
    biHeight: number;
    biPlanes: number;
    biBitCount: number;
    biCompression: number;
    biSizeImage: number;
    biXPelsPerMeter: number;
    biYPelsPerMeter: number;
    biClrUsed: number;
    biClrImportant: number
  };
  stride: number;
  pixels: Uint8Array;
}
