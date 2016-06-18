import {ListWrapper} from '../facade/collection';
import {isPresent} from '../facade/lang';

export class StylesCollectionEntry {
  constructor(public time: number, public value: string|number) {}

  matches(time: number, value: string|number): boolean {
    return time == this.time && value == this.value;
  }
}

export class StylesCollection {
  styles: {[key: string]: StylesCollectionEntry[]} = {};

  insertAtTime(property: string, time: number, value: string|number) {
    var tuple = new StylesCollectionEntry(time, value);
    var entries = this.styles[property];
    if (!isPresent(entries)) {
      entries = this.styles[property] = [];
    }

    // insert this at the right stop in the array
    // this way we can keep it sorted
    var insertionIndex = 0;
    for (var i = entries.length - 1; i >= 0; i--) {
      if (entries[i].time <= time) {
        insertionIndex = i + 1;
        break;
      }
    }

    ListWrapper.insert(entries, insertionIndex, tuple);
  }

  getByIndex(property: string, index: number): StylesCollectionEntry {
    var items = this.styles[property];
    if (isPresent(items)) {
      return index >= items.length ? null : items[index];
    }
    return null;
  }

  indexOfAtOrBeforeTime(property: string, time: number): number {
    var entries = this.styles[property];
    if (isPresent(entries)) {
      for (var i = entries.length - 1; i >= 0; i--) {
        if (entries[i].time <= time) return i;
      }
    }
    return null;
  }
}
