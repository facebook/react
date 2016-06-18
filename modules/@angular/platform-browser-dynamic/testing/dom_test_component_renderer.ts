import {TestComponentRenderer} from '@angular/compiler/testing';
import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/platform-browser';
import {el} from '@angular/platform-browser/testing';

import {getDOM} from '../platform_browser_private';



/**
 * A DOM based implementation of the TestComponentRenderer.
 */
@Injectable()
export class DOMTestComponentRenderer extends TestComponentRenderer {
  constructor(@Inject(DOCUMENT) private _doc: any /** TODO #9100 */) { super(); }

  insertRootElement(rootElId: string) {
    let rootEl = el(`<div id="${rootElId}"></div>`);

    // TODO(juliemr): can/should this be optional?
    let oldRoots = getDOM().querySelectorAll(this._doc, '[id^=root]');
    for (let i = 0; i < oldRoots.length; i++) {
      getDOM().remove(oldRoots[i]);
    }
    getDOM().appendChild(this._doc.body, rootEl);
  }
}
