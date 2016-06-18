import {ListWrapper} from '@angular/facade';
import {Math} from '@angular/facade';

import {Component, Directive} from '@angular/core';

import {
  Offering,
  ITEMS,
  ITEM_HEIGHT,
  VISIBLE_ITEMS,
  VIEW_PORT_HEIGHT,
  ROW_WIDTH,
  HEIGHT
} from './common';
import {generateOfferings} from './random_data';
import {ScrollItemComponent} from './scroll_item';
import {NgFor} from '@angular/common';

@Component({
  selector: 'scroll-area',
  directives: [ScrollItemComponent, NgFor],
  template: `
    <div>
        <div id="scrollDiv"
             [style.height.px]="viewPortHeight"
             style="width: 1000px; border: 1px solid #000; overflow: scroll"
             on-scroll="onScroll($event)">
            <div id="padding"></div>
            <div id="inner">
                <scroll-item
                    template="ngFor let item of visibleItems"
                    [offering]="item">
                </scroll-item>
            </div>
        </div>
    </div>`
})
export class ScrollAreaComponent {
  _fullList: Offering[];
  visibleItems: Offering[];

  viewPortHeight: number;
  paddingDiv;
  innerDiv;

  constructor() {
    this._fullList = generateOfferings(ITEMS);
    this.visibleItems = [];
    this.viewPortHeight = VIEW_PORT_HEIGHT;
    this.onScroll(null);
  }

  onScroll(evt) {
    var scrollTop = 0;
    if (evt != null) {
      var scrollDiv = evt.target;
      if (this.paddingDiv == null) {
        this.paddingDiv = scrollDiv.querySelector('#padding');
      }
      if (this.innerDiv == null) {
        this.innerDiv = scrollDiv.querySelector('#inner');
        this.innerDiv.style.setProperty('width', `${ROW_WIDTH}px`);
      }
      scrollTop = scrollDiv.scrollTop;
    }
    var iStart = Math.floor(scrollTop / ITEM_HEIGHT);
    var iEnd = Math.min(iStart + VISIBLE_ITEMS + 1, this._fullList.length);
    var padding = iStart * ITEM_HEIGHT;
    if (this.innerDiv != null) {
      this.innerDiv.style.setProperty('height', `${HEIGHT - padding}px`);
    }
    if (this.paddingDiv != null) {
      this.paddingDiv.style.setProperty('height', `${padding}px`);
    }
    this.visibleItems = ListWrapper.slice(this._fullList, iStart, iEnd);
  }
}
