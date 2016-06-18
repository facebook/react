import {Component} from '@angular/core';
import {EventListener} from '@angular/core/src/facade/browser';
import {TimerWrapper} from '@angular/core/src/facade/async';
import {BitmapService} from './services/bitmap';
import {FileReader, Uint8ArrayWrapper} from './file_api';


@Component({selector: 'image-demo', viewProviders: [BitmapService], templateUrl: 'image_demo.html'})
export class ImageDemo {
  images: any[] /** TODO #9100 */ = [];
  fileInput: String;

  constructor(private _bitmapService: BitmapService) {}

  uploadFiles(files: any /** TODO #9100 */) {
    for (var i = 0; i < files.length; i++) {
      var reader = new FileReader();
      reader.addEventListener("load", this.handleReaderLoad(reader));
      reader.readAsArrayBuffer(files[i]);
    }
  }

  handleReaderLoad(reader: FileReader): EventListener {
    return (e) => {
      var buffer = reader.result;
      this.images.push({
        src: this._bitmapService.arrayBufferToDataUri(Uint8ArrayWrapper.create(reader.result)),
        buffer: buffer,
        filtering: false
      });
    };
  }

  applyFilters() {
    for (var i = 0; i < this.images.length; i++) {
      this.images[i].filtering = true;

      TimerWrapper.setTimeout(this._filter(i), 0);
    }
  }

  private _filter(i: number): (...args: any[]) => void {
    return () => {
      var imageData = this._bitmapService.convertToImageData(this.images[i].buffer);
      imageData = this._bitmapService.applySepia(imageData);
      this.images[i].src = this._bitmapService.toDataUri(imageData);
      this.images[i].filtering = false;
    };
  }
}
