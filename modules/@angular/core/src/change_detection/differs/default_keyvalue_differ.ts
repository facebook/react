import {MapWrapper, StringMapWrapper} from '../../facade/collection';
import {BaseException} from '../../facade/exceptions';
import {isBlank, isJsObject, looseIdentical, stringify} from '../../facade/lang';
import {ChangeDetectorRef} from '../change_detector_ref';

import {KeyValueDiffer, KeyValueDifferFactory} from './keyvalue_differs';


/* @ts2dart_const */
export class DefaultKeyValueDifferFactory implements KeyValueDifferFactory {
  constructor() {}
  supports(obj: any): boolean { return obj instanceof Map || isJsObject(obj); }

  create(cdRef: ChangeDetectorRef): KeyValueDiffer { return new DefaultKeyValueDiffer(); }
}

export class DefaultKeyValueDiffer implements KeyValueDiffer {
  private _records: Map<any, any> = new Map();
  private _mapHead: KeyValueChangeRecord = null;
  private _previousMapHead: KeyValueChangeRecord = null;
  private _changesHead: KeyValueChangeRecord = null;
  private _changesTail: KeyValueChangeRecord = null;
  private _additionsHead: KeyValueChangeRecord = null;
  private _additionsTail: KeyValueChangeRecord = null;
  private _removalsHead: KeyValueChangeRecord = null;
  private _removalsTail: KeyValueChangeRecord = null;

  get isDirty(): boolean {
    return this._additionsHead !== null || this._changesHead !== null ||
        this._removalsHead !== null;
  }

  forEachItem(fn: Function) {
    var record: KeyValueChangeRecord;
    for (record = this._mapHead; record !== null; record = record._next) {
      fn(record);
    }
  }

  forEachPreviousItem(fn: Function) {
    var record: KeyValueChangeRecord;
    for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
      fn(record);
    }
  }

  forEachChangedItem(fn: Function) {
    var record: KeyValueChangeRecord;
    for (record = this._changesHead; record !== null; record = record._nextChanged) {
      fn(record);
    }
  }

  forEachAddedItem(fn: Function) {
    var record: KeyValueChangeRecord;
    for (record = this._additionsHead; record !== null; record = record._nextAdded) {
      fn(record);
    }
  }

  forEachRemovedItem(fn: Function) {
    var record: KeyValueChangeRecord;
    for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
      fn(record);
    }
  }

  diff(map: Map<any, any>): any {
    if (isBlank(map)) map = MapWrapper.createFromPairs([]);
    if (!(map instanceof Map || isJsObject(map))) {
      throw new BaseException(`Error trying to diff '${map}'`);
    }

    if (this.check(map)) {
      return this;
    } else {
      return null;
    }
  }

  onDestroy() {}

  check(map: Map<any, any>): boolean {
    this._reset();
    var records = this._records;
    var oldSeqRecord: KeyValueChangeRecord = this._mapHead;
    var lastOldSeqRecord: KeyValueChangeRecord = null;
    var lastNewSeqRecord: KeyValueChangeRecord = null;
    var seqChanged: boolean = false;

    this._forEach(map, (value: any /** TODO #9100 */, key: any /** TODO #9100 */) => {
      var newSeqRecord: any /** TODO #9100 */;
      if (oldSeqRecord !== null && key === oldSeqRecord.key) {
        newSeqRecord = oldSeqRecord;
        if (!looseIdentical(value, oldSeqRecord.currentValue)) {
          oldSeqRecord.previousValue = oldSeqRecord.currentValue;
          oldSeqRecord.currentValue = value;
          this._addToChanges(oldSeqRecord);
        }
      } else {
        seqChanged = true;
        if (oldSeqRecord !== null) {
          oldSeqRecord._next = null;
          this._removeFromSeq(lastOldSeqRecord, oldSeqRecord);
          this._addToRemovals(oldSeqRecord);
        }
        if (records.has(key)) {
          newSeqRecord = records.get(key);
        } else {
          newSeqRecord = new KeyValueChangeRecord(key);
          records.set(key, newSeqRecord);
          newSeqRecord.currentValue = value;
          this._addToAdditions(newSeqRecord);
        }
      }

      if (seqChanged) {
        if (this._isInRemovals(newSeqRecord)) {
          this._removeFromRemovals(newSeqRecord);
        }
        if (lastNewSeqRecord == null) {
          this._mapHead = newSeqRecord;
        } else {
          lastNewSeqRecord._next = newSeqRecord;
        }
      }
      lastOldSeqRecord = oldSeqRecord;
      lastNewSeqRecord = newSeqRecord;
      oldSeqRecord = oldSeqRecord === null ? null : oldSeqRecord._next;
    });
    this._truncate(lastOldSeqRecord, oldSeqRecord);
    return this.isDirty;
  }

  /** @internal */
  _reset() {
    if (this.isDirty) {
      var record: KeyValueChangeRecord;
      // Record the state of the mapping
      for (record = this._previousMapHead = this._mapHead; record !== null; record = record._next) {
        record._nextPrevious = record._next;
      }

      for (record = this._changesHead; record !== null; record = record._nextChanged) {
        record.previousValue = record.currentValue;
      }

      for (record = this._additionsHead; record != null; record = record._nextAdded) {
        record.previousValue = record.currentValue;
      }

      // todo(vicb) once assert is supported
      // assert(() {
      //  var r = _changesHead;
      //  while (r != null) {
      //    var nextRecord = r._nextChanged;
      //    r._nextChanged = null;
      //    r = nextRecord;
      //  }
      //
      //  r = _additionsHead;
      //  while (r != null) {
      //    var nextRecord = r._nextAdded;
      //    r._nextAdded = null;
      //    r = nextRecord;
      //  }
      //
      //  r = _removalsHead;
      //  while (r != null) {
      //    var nextRecord = r._nextRemoved;
      //    r._nextRemoved = null;
      //    r = nextRecord;
      //  }
      //
      //  return true;
      //});
      this._changesHead = this._changesTail = null;
      this._additionsHead = this._additionsTail = null;
      this._removalsHead = this._removalsTail = null;
    }
  }

  /** @internal */
  _truncate(lastRecord: KeyValueChangeRecord, record: KeyValueChangeRecord) {
    while (record !== null) {
      if (lastRecord === null) {
        this._mapHead = null;
      } else {
        lastRecord._next = null;
      }
      var nextRecord = record._next;
      // todo(vicb) assert
      // assert((() {
      //  record._next = null;
      //  return true;
      //}));
      this._addToRemovals(record);
      lastRecord = record;
      record = nextRecord;
    }

    for (var rec: KeyValueChangeRecord = this._removalsHead; rec !== null; rec = rec._nextRemoved) {
      rec.previousValue = rec.currentValue;
      rec.currentValue = null;
      this._records.delete(rec.key);
    }
  }

  /** @internal */
  _isInRemovals(record: KeyValueChangeRecord) {
    return record === this._removalsHead || record._nextRemoved !== null ||
        record._prevRemoved !== null;
  }

  /** @internal */
  _addToRemovals(record: KeyValueChangeRecord) {
    // todo(vicb) assert
    // assert(record._next == null);
    // assert(record._nextAdded == null);
    // assert(record._nextChanged == null);
    // assert(record._nextRemoved == null);
    // assert(record._prevRemoved == null);
    if (this._removalsHead === null) {
      this._removalsHead = this._removalsTail = record;
    } else {
      this._removalsTail._nextRemoved = record;
      record._prevRemoved = this._removalsTail;
      this._removalsTail = record;
    }
  }

  /** @internal */
  _removeFromSeq(prev: KeyValueChangeRecord, record: KeyValueChangeRecord) {
    var next = record._next;
    if (prev === null) {
      this._mapHead = next;
    } else {
      prev._next = next;
    }
    // todo(vicb) assert
    // assert((() {
    //  record._next = null;
    //  return true;
    //})());
  }

  /** @internal */
  _removeFromRemovals(record: KeyValueChangeRecord) {
    // todo(vicb) assert
    // assert(record._next == null);
    // assert(record._nextAdded == null);
    // assert(record._nextChanged == null);

    var prev = record._prevRemoved;
    var next = record._nextRemoved;
    if (prev === null) {
      this._removalsHead = next;
    } else {
      prev._nextRemoved = next;
    }
    if (next === null) {
      this._removalsTail = prev;
    } else {
      next._prevRemoved = prev;
    }
    record._prevRemoved = record._nextRemoved = null;
  }

  /** @internal */
  _addToAdditions(record: KeyValueChangeRecord) {
    // todo(vicb): assert
    // assert(record._next == null);
    // assert(record._nextAdded == null);
    // assert(record._nextChanged == null);
    // assert(record._nextRemoved == null);
    // assert(record._prevRemoved == null);
    if (this._additionsHead === null) {
      this._additionsHead = this._additionsTail = record;
    } else {
      this._additionsTail._nextAdded = record;
      this._additionsTail = record;
    }
  }

  /** @internal */
  _addToChanges(record: KeyValueChangeRecord) {
    // todo(vicb) assert
    // assert(record._nextAdded == null);
    // assert(record._nextChanged == null);
    // assert(record._nextRemoved == null);
    // assert(record._prevRemoved == null);
    if (this._changesHead === null) {
      this._changesHead = this._changesTail = record;
    } else {
      this._changesTail._nextChanged = record;
      this._changesTail = record;
    }
  }

  toString(): string {
    var items: any[] /** TODO #9100 */ = [];
    var previous: any[] /** TODO #9100 */ = [];
    var changes: any[] /** TODO #9100 */ = [];
    var additions: any[] /** TODO #9100 */ = [];
    var removals: any[] /** TODO #9100 */ = [];
    var record: KeyValueChangeRecord;

    for (record = this._mapHead; record !== null; record = record._next) {
      items.push(stringify(record));
    }
    for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
      previous.push(stringify(record));
    }
    for (record = this._changesHead; record !== null; record = record._nextChanged) {
      changes.push(stringify(record));
    }
    for (record = this._additionsHead; record !== null; record = record._nextAdded) {
      additions.push(stringify(record));
    }
    for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
      removals.push(stringify(record));
    }

    return 'map: ' + items.join(', ') + '\n' +
        'previous: ' + previous.join(', ') + '\n' +
        'additions: ' + additions.join(', ') + '\n' +
        'changes: ' + changes.join(', ') + '\n' +
        'removals: ' + removals.join(', ') + '\n';
  }

  /** @internal */
  _forEach(obj: any /** TODO #9100 */, fn: Function) {
    if (obj instanceof Map) {
      (<Map<any, any>>obj).forEach(<any>fn);
    } else {
      StringMapWrapper.forEach(obj, fn);
    }
  }
}


/**
 * @stable
 */
export class KeyValueChangeRecord {
  previousValue: any = null;
  currentValue: any = null;

  /** @internal */
  _nextPrevious: KeyValueChangeRecord = null;
  /** @internal */
  _next: KeyValueChangeRecord = null;
  /** @internal */
  _nextAdded: KeyValueChangeRecord = null;
  /** @internal */
  _nextRemoved: KeyValueChangeRecord = null;
  /** @internal */
  _prevRemoved: KeyValueChangeRecord = null;
  /** @internal */
  _nextChanged: KeyValueChangeRecord = null;

  constructor(public key: any) {}

  toString(): string {
    return looseIdentical(this.previousValue, this.currentValue) ?
        stringify(this.key) :
        (stringify(this.key) + '[' + stringify(this.previousValue) + '->' +
         stringify(this.currentValue) + ']');
  }
}
