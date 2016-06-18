import {ElementRef} from '@angular/core';
import {ChangeDetectorRef} from '@angular/core/src/change_detection/change_detection';
import {SpyObject} from '@angular/core/testing/testing_internal';
import {DomAdapter} from '@angular/platform-browser/src/dom/dom_adapter';

export class SpyChangeDetectorRef extends SpyObject {
  constructor() {
    super(ChangeDetectorRef);
    this.spy('detectChanges');
    this.spy('checkNoChanges');
  }
}

export class SpyIterableDifferFactory extends SpyObject {}

export class SpyElementRef extends SpyObject {
  constructor() { super(ElementRef); }
}

export class SpyDomAdapter extends SpyObject {
  constructor() { super(DomAdapter); }
}
