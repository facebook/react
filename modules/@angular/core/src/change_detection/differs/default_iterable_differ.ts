import {isListLikeIterable, iterateListLike} from '../../facade/collection';
import {BaseException} from '../../facade/exceptions';
import {getMapKey, isArray, isBlank, isPresent, looseIdentical, stringify} from '../../facade/lang';
import {ChangeDetectorRef} from '../change_detector_ref';

import {IterableDiffer, IterableDifferFactory, TrackByFn} from './iterable_differs';


/* @ts2dart_const */
export class DefaultIterableDifferFactory implements IterableDifferFactory {
  constructor() {}
  supports(obj: Object): boolean { return isListLikeIterable(obj); }
  create(cdRef: ChangeDetectorRef, trackByFn?: TrackByFn): DefaultIterableDiffer {
    return new DefaultIterableDiffer(trackByFn);
  }
}

var trackByIdentity = (index: number, item: any) => item;

/**
 * @stable
 */
export class DefaultIterableDiffer implements IterableDiffer {
  private _length: number = null;
  private _collection: any /** TODO #9100 */ = null;
  // Keeps track of the used records at any point in time (during & across `_check()` calls)
  private _linkedRecords: _DuplicateMap = null;
  // Keeps track of the removed records at any point in time during `_check()` calls.
  private _unlinkedRecords: _DuplicateMap = null;
  private _previousItHead: CollectionChangeRecord = null;
  private _itHead: CollectionChangeRecord = null;
  private _itTail: CollectionChangeRecord = null;
  private _additionsHead: CollectionChangeRecord = null;
  private _additionsTail: CollectionChangeRecord = null;
  private _movesHead: CollectionChangeRecord = null;
  private _movesTail: CollectionChangeRecord = null;
  private _removalsHead: CollectionChangeRecord = null;
  private _removalsTail: CollectionChangeRecord = null;
  // Keeps track of records where custom track by is the same, but item identity has changed
  private _identityChangesHead: CollectionChangeRecord = null;
  private _identityChangesTail: CollectionChangeRecord = null;

  constructor(private _trackByFn?: TrackByFn) {
    this._trackByFn = isPresent(this._trackByFn) ? this._trackByFn : trackByIdentity;
  }

  get collection() { return this._collection; }

  get length(): number { return this._length; }

  forEachItem(fn: Function) {
    var record: CollectionChangeRecord;
    for (record = this._itHead; record !== null; record = record._next) {
      fn(record);
    }
  }

  forEachPreviousItem(fn: Function) {
    var record: CollectionChangeRecord;
    for (record = this._previousItHead; record !== null; record = record._nextPrevious) {
      fn(record);
    }
  }

  forEachAddedItem(fn: Function) {
    var record: CollectionChangeRecord;
    for (record = this._additionsHead; record !== null; record = record._nextAdded) {
      fn(record);
    }
  }

  forEachMovedItem(fn: Function) {
    var record: CollectionChangeRecord;
    for (record = this._movesHead; record !== null; record = record._nextMoved) {
      fn(record);
    }
  }

  forEachRemovedItem(fn: Function) {
    var record: CollectionChangeRecord;
    for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
      fn(record);
    }
  }

  forEachIdentityChange(fn: Function) {
    var record: CollectionChangeRecord;
    for (record = this._identityChangesHead; record !== null; record = record._nextIdentityChange) {
      fn(record);
    }
  }

  diff(collection: any): DefaultIterableDiffer {
    if (isBlank(collection)) collection = [];
    if (!isListLikeIterable(collection)) {
      throw new BaseException(`Error trying to diff '${collection}'`);
    }

    if (this.check(collection)) {
      return this;
    } else {
      return null;
    }
  }

  onDestroy() {}

  // todo(vicb): optim for UnmodifiableListView (frozen arrays)
  check(collection: any): boolean {
    this._reset();

    var record: CollectionChangeRecord = this._itHead;
    var mayBeDirty: boolean = false;
    var index: number;
    var item: any /** TODO #9100 */;
    var itemTrackBy: any /** TODO #9100 */;
    if (isArray(collection)) {
      var list = collection;
      this._length = collection.length;

      for (index = 0; index < this._length; index++) {
        item = list[index];
        itemTrackBy = this._trackByFn(index, item);
        if (record === null || !looseIdentical(record.trackById, itemTrackBy)) {
          record = this._mismatch(record, item, itemTrackBy, index);
          mayBeDirty = true;
        } else {
          if (mayBeDirty) {
            // TODO(misko): can we limit this to duplicates only?
            record = this._verifyReinsertion(record, item, itemTrackBy, index);
          }
          if (!looseIdentical(record.item, item)) this._addIdentityChange(record, item);
        }

        record = record._next;
      }
    } else {
      index = 0;
      iterateListLike(collection, (item: any /** TODO #9100 */) => {
        itemTrackBy = this._trackByFn(index, item);
        if (record === null || !looseIdentical(record.trackById, itemTrackBy)) {
          record = this._mismatch(record, item, itemTrackBy, index);
          mayBeDirty = true;
        } else {
          if (mayBeDirty) {
            // TODO(misko): can we limit this to duplicates only?
            record = this._verifyReinsertion(record, item, itemTrackBy, index);
          }
          if (!looseIdentical(record.item, item)) this._addIdentityChange(record, item);
        }
        record = record._next;
        index++;
      });
      this._length = index;
    }

    this._truncate(record);
    this._collection = collection;
    return this.isDirty;
  }

  /* CollectionChanges is considered dirty if it has any additions, moves, removals, or identity
   * changes.
   */
  get isDirty(): boolean {
    return this._additionsHead !== null || this._movesHead !== null ||
        this._removalsHead !== null || this._identityChangesHead !== null;
  }

  /**
   * Reset the state of the change objects to show no changes. This means set previousKey to
   * currentKey, and clear all of the queues (additions, moves, removals).
   * Set the previousIndexes of moved and added items to their currentIndexes
   * Reset the list of additions, moves and removals
   *
   * @internal
   */
  _reset() {
    if (this.isDirty) {
      var record: CollectionChangeRecord;
      var nextRecord: CollectionChangeRecord;

      for (record = this._previousItHead = this._itHead; record !== null; record = record._next) {
        record._nextPrevious = record._next;
      }

      for (record = this._additionsHead; record !== null; record = record._nextAdded) {
        record.previousIndex = record.currentIndex;
      }
      this._additionsHead = this._additionsTail = null;

      for (record = this._movesHead; record !== null; record = nextRecord) {
        record.previousIndex = record.currentIndex;
        nextRecord = record._nextMoved;
      }
      this._movesHead = this._movesTail = null;
      this._removalsHead = this._removalsTail = null;
      this._identityChangesHead = this._identityChangesTail = null;

      // todo(vicb) when assert gets supported
      // assert(!this.isDirty);
    }
  }

  /**
   * This is the core function which handles differences between collections.
   *
   * - `record` is the record which we saw at this position last time. If null then it is a new
   *   item.
   * - `item` is the current item in the collection
   * - `index` is the position of the item in the collection
   *
   * @internal
   */
  _mismatch(record: CollectionChangeRecord, item: any, itemTrackBy: any, index: number):
      CollectionChangeRecord {
    // The previous record after which we will append the current one.
    var previousRecord: CollectionChangeRecord;

    if (record === null) {
      previousRecord = this._itTail;
    } else {
      previousRecord = record._prev;
      // Remove the record from the collection since we know it does not match the item.
      this._remove(record);
    }

    // Attempt to see if we have seen the item before.
    record = this._linkedRecords === null ? null : this._linkedRecords.get(itemTrackBy, index);
    if (record !== null) {
      // We have seen this before, we need to move it forward in the collection.
      // But first we need to check if identity changed, so we can update in view if necessary
      if (!looseIdentical(record.item, item)) this._addIdentityChange(record, item);

      this._moveAfter(record, previousRecord, index);
    } else {
      // Never seen it, check evicted list.
      record = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy);
      if (record !== null) {
        // It is an item which we have evicted earlier: reinsert it back into the list.
        // But first we need to check if identity changed, so we can update in view if necessary
        if (!looseIdentical(record.item, item)) this._addIdentityChange(record, item);

        this._reinsertAfter(record, previousRecord, index);
      } else {
        // It is a new item: add it.
        record =
            this._addAfter(new CollectionChangeRecord(item, itemTrackBy), previousRecord, index);
      }
    }
    return record;
  }

  /**
   * This check is only needed if an array contains duplicates. (Short circuit of nothing dirty)
   *
   * Use case: `[a, a]` => `[b, a, a]`
   *
   * If we did not have this check then the insertion of `b` would:
   *   1) evict first `a`
   *   2) insert `b` at `0` index.
   *   3) leave `a` at index `1` as is. <-- this is wrong!
   *   3) reinsert `a` at index 2. <-- this is wrong!
   *
   * The correct behavior is:
   *   1) evict first `a`
   *   2) insert `b` at `0` index.
   *   3) reinsert `a` at index 1.
   *   3) move `a` at from `1` to `2`.
   *
   *
   * Double check that we have not evicted a duplicate item. We need to check if the item type may
   * have already been removed:
   * The insertion of b will evict the first 'a'. If we don't reinsert it now it will be reinserted
   * at the end. Which will show up as the two 'a's switching position. This is incorrect, since a
   * better way to think of it is as insert of 'b' rather then switch 'a' with 'b' and then add 'a'
   * at the end.
   *
   * @internal
   */
  _verifyReinsertion(record: CollectionChangeRecord, item: any, itemTrackBy: any, index: number):
      CollectionChangeRecord {
    var reinsertRecord: CollectionChangeRecord =
        this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy);
    if (reinsertRecord !== null) {
      record = this._reinsertAfter(reinsertRecord, record._prev, index);
    } else if (record.currentIndex != index) {
      record.currentIndex = index;
      this._addToMoves(record, index);
    }
    return record;
  }

  /**
   * Get rid of any excess {@link CollectionChangeRecord}s from the previous collection
   *
   * - `record` The first excess {@link CollectionChangeRecord}.
   *
   * @internal
   */
  _truncate(record: CollectionChangeRecord) {
    // Anything after that needs to be removed;
    while (record !== null) {
      var nextRecord: CollectionChangeRecord = record._next;
      this._addToRemovals(this._unlink(record));
      record = nextRecord;
    }
    if (this._unlinkedRecords !== null) {
      this._unlinkedRecords.clear();
    }

    if (this._additionsTail !== null) {
      this._additionsTail._nextAdded = null;
    }
    if (this._movesTail !== null) {
      this._movesTail._nextMoved = null;
    }
    if (this._itTail !== null) {
      this._itTail._next = null;
    }
    if (this._removalsTail !== null) {
      this._removalsTail._nextRemoved = null;
    }
    if (this._identityChangesTail !== null) {
      this._identityChangesTail._nextIdentityChange = null;
    }
  }

  /** @internal */
  _reinsertAfter(record: CollectionChangeRecord, prevRecord: CollectionChangeRecord, index: number):
      CollectionChangeRecord {
    if (this._unlinkedRecords !== null) {
      this._unlinkedRecords.remove(record);
    }
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

    this._insertAfter(record, prevRecord, index);
    this._addToMoves(record, index);
    return record;
  }

  /** @internal */
  _moveAfter(record: CollectionChangeRecord, prevRecord: CollectionChangeRecord, index: number):
      CollectionChangeRecord {
    this._unlink(record);
    this._insertAfter(record, prevRecord, index);
    this._addToMoves(record, index);
    return record;
  }

  /** @internal */
  _addAfter(record: CollectionChangeRecord, prevRecord: CollectionChangeRecord, index: number):
      CollectionChangeRecord {
    this._insertAfter(record, prevRecord, index);

    if (this._additionsTail === null) {
      // todo(vicb)
      // assert(this._additionsHead === null);
      this._additionsTail = this._additionsHead = record;
    } else {
      // todo(vicb)
      // assert(_additionsTail._nextAdded === null);
      // assert(record._nextAdded === null);
      this._additionsTail = this._additionsTail._nextAdded = record;
    }
    return record;
  }

  /** @internal */
  _insertAfter(record: CollectionChangeRecord, prevRecord: CollectionChangeRecord, index: number):
      CollectionChangeRecord {
    // todo(vicb)
    // assert(record != prevRecord);
    // assert(record._next === null);
    // assert(record._prev === null);

    var next: CollectionChangeRecord = prevRecord === null ? this._itHead : prevRecord._next;
    // todo(vicb)
    // assert(next != record);
    // assert(prevRecord != record);
    record._next = next;
    record._prev = prevRecord;
    if (next === null) {
      this._itTail = record;
    } else {
      next._prev = record;
    }
    if (prevRecord === null) {
      this._itHead = record;
    } else {
      prevRecord._next = record;
    }

    if (this._linkedRecords === null) {
      this._linkedRecords = new _DuplicateMap();
    }
    this._linkedRecords.put(record);

    record.currentIndex = index;
    return record;
  }

  /** @internal */
  _remove(record: CollectionChangeRecord): CollectionChangeRecord {
    return this._addToRemovals(this._unlink(record));
  }

  /** @internal */
  _unlink(record: CollectionChangeRecord): CollectionChangeRecord {
    if (this._linkedRecords !== null) {
      this._linkedRecords.remove(record);
    }

    var prev = record._prev;
    var next = record._next;

    // todo(vicb)
    // assert((record._prev = null) === null);
    // assert((record._next = null) === null);

    if (prev === null) {
      this._itHead = next;
    } else {
      prev._next = next;
    }
    if (next === null) {
      this._itTail = prev;
    } else {
      next._prev = prev;
    }

    return record;
  }

  /** @internal */
  _addToMoves(record: CollectionChangeRecord, toIndex: number): CollectionChangeRecord {
    // todo(vicb)
    // assert(record._nextMoved === null);

    if (record.previousIndex === toIndex) {
      return record;
    }

    if (this._movesTail === null) {
      // todo(vicb)
      // assert(_movesHead === null);
      this._movesTail = this._movesHead = record;
    } else {
      // todo(vicb)
      // assert(_movesTail._nextMoved === null);
      this._movesTail = this._movesTail._nextMoved = record;
    }

    return record;
  }

  /** @internal */
  _addToRemovals(record: CollectionChangeRecord): CollectionChangeRecord {
    if (this._unlinkedRecords === null) {
      this._unlinkedRecords = new _DuplicateMap();
    }
    this._unlinkedRecords.put(record);
    record.currentIndex = null;
    record._nextRemoved = null;

    if (this._removalsTail === null) {
      // todo(vicb)
      // assert(_removalsHead === null);
      this._removalsTail = this._removalsHead = record;
      record._prevRemoved = null;
    } else {
      // todo(vicb)
      // assert(_removalsTail._nextRemoved === null);
      // assert(record._nextRemoved === null);
      record._prevRemoved = this._removalsTail;
      this._removalsTail = this._removalsTail._nextRemoved = record;
    }
    return record;
  }

  /** @internal */
  _addIdentityChange(record: CollectionChangeRecord, item: any) {
    record.item = item;
    if (this._identityChangesTail === null) {
      this._identityChangesTail = this._identityChangesHead = record;
    } else {
      this._identityChangesTail = this._identityChangesTail._nextIdentityChange = record;
    }
    return record;
  }


  toString(): string {
    var list: any[] /** TODO #9100 */ = [];
    this.forEachItem((record: any /** TODO #9100 */) => list.push(record));

    var previous: any[] /** TODO #9100 */ = [];
    this.forEachPreviousItem((record: any /** TODO #9100 */) => previous.push(record));

    var additions: any[] /** TODO #9100 */ = [];
    this.forEachAddedItem((record: any /** TODO #9100 */) => additions.push(record));

    var moves: any[] /** TODO #9100 */ = [];
    this.forEachMovedItem((record: any /** TODO #9100 */) => moves.push(record));

    var removals: any[] /** TODO #9100 */ = [];
    this.forEachRemovedItem((record: any /** TODO #9100 */) => removals.push(record));

    var identityChanges: any[] /** TODO #9100 */ = [];
    this.forEachIdentityChange((record: any /** TODO #9100 */) => identityChanges.push(record));

    return 'collection: ' + list.join(', ') + '\n' +
        'previous: ' + previous.join(', ') + '\n' +
        'additions: ' + additions.join(', ') + '\n' +
        'moves: ' + moves.join(', ') + '\n' +
        'removals: ' + removals.join(', ') + '\n' +
        'identityChanges: ' + identityChanges.join(', ') + '\n';
  }
}

/**
 * @stable
 */
export class CollectionChangeRecord {
  currentIndex: number = null;
  previousIndex: number = null;

  /** @internal */
  _nextPrevious: CollectionChangeRecord = null;
  /** @internal */
  _prev: CollectionChangeRecord = null;
  /** @internal */
  _next: CollectionChangeRecord = null;
  /** @internal */
  _prevDup: CollectionChangeRecord = null;
  /** @internal */
  _nextDup: CollectionChangeRecord = null;
  /** @internal */
  _prevRemoved: CollectionChangeRecord = null;
  /** @internal */
  _nextRemoved: CollectionChangeRecord = null;
  /** @internal */
  _nextAdded: CollectionChangeRecord = null;
  /** @internal */
  _nextMoved: CollectionChangeRecord = null;
  /** @internal */
  _nextIdentityChange: CollectionChangeRecord = null;


  constructor(public item: any, public trackById: any) {}

  toString(): string {
    return this.previousIndex === this.currentIndex ? stringify(this.item) :
                                                      stringify(this.item) + '[' +
            stringify(this.previousIndex) + '->' + stringify(this.currentIndex) + ']';
  }
}

// A linked list of CollectionChangeRecords with the same CollectionChangeRecord.item
class _DuplicateItemRecordList {
  /** @internal */
  _head: CollectionChangeRecord = null;
  /** @internal */
  _tail: CollectionChangeRecord = null;

  /**
   * Append the record to the list of duplicates.
   *
   * Note: by design all records in the list of duplicates hold the same value in record.item.
   */
  add(record: CollectionChangeRecord): void {
    if (this._head === null) {
      this._head = this._tail = record;
      record._nextDup = null;
      record._prevDup = null;
    } else {
      // todo(vicb)
      // assert(record.item ==  _head.item ||
      //       record.item is num && record.item.isNaN && _head.item is num && _head.item.isNaN);
      this._tail._nextDup = record;
      record._prevDup = this._tail;
      record._nextDup = null;
      this._tail = record;
    }
  }

  // Returns a CollectionChangeRecord having CollectionChangeRecord.trackById == trackById and
  // CollectionChangeRecord.currentIndex >= afterIndex
  get(trackById: any, afterIndex: number): CollectionChangeRecord {
    var record: CollectionChangeRecord;
    for (record = this._head; record !== null; record = record._nextDup) {
      if ((afterIndex === null || afterIndex < record.currentIndex) &&
          looseIdentical(record.trackById, trackById)) {
        return record;
      }
    }
    return null;
  }

  /**
   * Remove one {@link CollectionChangeRecord} from the list of duplicates.
   *
   * Returns whether the list of duplicates is empty.
   */
  remove(record: CollectionChangeRecord): boolean {
    // todo(vicb)
    // assert(() {
    //  // verify that the record being removed is in the list.
    //  for (CollectionChangeRecord cursor = _head; cursor != null; cursor = cursor._nextDup) {
    //    if (identical(cursor, record)) return true;
    //  }
    //  return false;
    //});

    var prev: CollectionChangeRecord = record._prevDup;
    var next: CollectionChangeRecord = record._nextDup;
    if (prev === null) {
      this._head = next;
    } else {
      prev._nextDup = next;
    }
    if (next === null) {
      this._tail = prev;
    } else {
      next._prevDup = prev;
    }
    return this._head === null;
  }
}

class _DuplicateMap {
  map = new Map<any, _DuplicateItemRecordList>();

  put(record: CollectionChangeRecord) {
    // todo(vicb) handle corner cases
    var key = getMapKey(record.trackById);

    var duplicates = this.map.get(key);
    if (!isPresent(duplicates)) {
      duplicates = new _DuplicateItemRecordList();
      this.map.set(key, duplicates);
    }
    duplicates.add(record);
  }

  /**
   * Retrieve the `value` using key. Because the CollectionChangeRecord value may be one which we
   * have already iterated over, we use the afterIndex to pretend it is not there.
   *
   * Use case: `[a, b, c, a, a]` if we are at index `3` which is the second `a` then asking if we
   * have any more `a`s needs to return the last `a` not the first or second.
   */
  get(trackById: any, afterIndex: number = null): CollectionChangeRecord {
    var key = getMapKey(trackById);

    var recordList = this.map.get(key);
    return isBlank(recordList) ? null : recordList.get(trackById, afterIndex);
  }

  /**
   * Removes a {@link CollectionChangeRecord} from the list of duplicates.
   *
   * The list of duplicates also is removed from the map if it gets empty.
   */
  remove(record: CollectionChangeRecord): CollectionChangeRecord {
    var key = getMapKey(record.trackById);
    // todo(vicb)
    // assert(this.map.containsKey(key));
    var recordList: _DuplicateItemRecordList = this.map.get(key);
    // Remove the list of duplicates when it gets empty
    if (recordList.remove(record)) {
      this.map.delete(key);
    }
    return record;
  }

  get isEmpty(): boolean { return this.map.size === 0; }

  clear() { this.map.clear(); }

  toString(): string { return '_DuplicateMap(' + stringify(this.map) + ')'; }
}
