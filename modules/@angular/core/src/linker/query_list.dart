library angular2.src.core.compiler.query_list;

import 'dart:collection';
import 'package:angular2/src/facade/collection.dart';
import 'package:angular2/src/facade/async.dart';

/**
 * See query_list.ts
 */
class QueryList<T> extends Object with IterableMixin<T> {
  bool _dirty = true;
  List<T> _results = [];
  EventEmitter _emitter = new EventEmitter();

  Iterator<T> get iterator => _results.iterator;

  Stream<Iterable<T>> get changes => _emitter;

  int get length => _results.length;
  T get first => _results.length > 0 ? _results.first : null;
  T get last => _results.length > 0 ? _results.last : null;
  String toString() {
    return _results.toString();
  }

  /** @internal */
  void reset(List<T> newList) {
    _results = ListWrapper.flatten(newList);
    _dirty = false;
  }

  /** @internal */
  void notifyOnChanges() {
    _emitter.add(this);
  }

  /** @internal **/
  bool get dirty => _dirty;

  /** @internal **/
  void setDirty() {
    _dirty = true;
  }
}
