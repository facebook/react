library facade.collection;

import 'dart:collection' show IterableBase;
import 'dart:convert' show JsonEncoder;
export 'dart:core' show Iterator, Map, List, Set;
import 'dart:math' show max, min;

var jsonEncoder = new JsonEncoder();

class MapIterator extends Iterator<List> {
  final Iterator _iterator;
  final Map _map;

  MapIterator(Map map)
      : _map = map,
        _iterator = map.keys.iterator;

  bool moveNext() => _iterator.moveNext();

  List get current {
    return _iterator.current != null
        ? [_iterator.current, _map[_iterator.current]]
        : null;
  }
}

class IterableMap extends IterableBase<List> {
  final Map _map;

  IterableMap(Map map) : _map = map;

  Iterator<List> get iterator => new MapIterator(_map);
}

class MapWrapper {
  static Map/*<K,V>*/ clone/*<K,V>*/(Map/*<K,V>*/ m) => new Map.from(m);

  // in opposite to JS, Dart does not create a new map
  static Map/*<K,V>*/ createFromStringMap/*<K,V>*/(Map/*<K,V>*/ m) => m;

  // in opposite to JS, Dart does not create a new map
  static Map/*<K,V>*/ toStringMap/*<K,V>*/(Map/*<K,V>*/ m) => m;

  static Map/*<K,V>*/ createFromPairs/*<K,V>*/(List pairs) => pairs.fold(/*<K,V>*/{}, (m, p) {
        m[p[0]] = p[1];
        return m;
      });

  static void clearValues(Map m) {
    for (var k in m.keys) {
      m[k] = null;
    }
  }

  static Iterable/*<List<dynamic>>*/ iterable/*<K,V>*/(Map/*<K,V>*/ m) => new IterableMap(m);
  static List/*<K>*/ keys/*<K,V>*/(Map/*<K,V>*/ m) => m.keys.toList();
  static List/*<V>*/ values/*<K,V>*/(Map/*<K,V>*/ m) => m.values.toList();
}

class StringMapWrapper {
  static Map/*<String,V>*/ create/*<V>*/() => {};
  static bool contains/*<V>*/(Map/*<String,V>*/ map, String key) => map.containsKey(key);
  static get/*<V>*/(Map/*<String,V>*/ map, String key) => map[key];
  static void set/*<V>*/(Map/*<String,V>*/ map, String key, /*=V*/value) {
    map[key] = value;
  }

  static void delete/*<V>*/(Map/*<String,V>*/ m, String k) {
    m.remove(k);
  }

  static void forEach/*<V>*/(Map/*<String,V>*/ m, fn(/*=V*/ v, String k)) {
    m.forEach((k, v) => fn(v, k));
  }

  static Map/*<String,V>*/ merge/*<V>*/(Map/*<String,V>*/ a, Map/*<String,V>*/ b) {
    var m = new Map/*<String,V>*/.from(a);
    if (b != null) {
      b.forEach((k, v) => m[k] = v);
    }
    return m;
  }

  static List<String> keys(Map<String, dynamic> a) {
    return a.keys.toList();
  }

  static List values(Map<String, dynamic> a) {
    return a.values.toList();
  }

  static bool isEmpty(Map m) => m.isEmpty;
  static bool equals/*<V>*/(Map/*<String,V>*/ m1, Map/*<String,V>*/ m2) {
    if (m1.length != m2.length) {
      return false;
    }
    for (var key in m1.keys) {
      if (m1[key] != m2[key]) {
        return false;
      }
    }
    return true;
  }
}

typedef bool Predicate<T>(T item);

class ListWrapper {
  static List/*<T>*/ clone/*<T>*/(Iterable/*<T>*/ l) => new List.from(l);
  static List/*<T>*/ createFixedSize/*<T>*/(int size) => new List(size);
  static List/*<T>*/ createGrowableSize/*<T>*/(int size) =>
      new List.generate(size, (_) => null, growable: true);

  static bool contains(List m, k) => m.contains(k);
  static int indexOf(List list, value, [int startIndex = 0]) =>
      list.indexOf(value, startIndex);
  static int lastIndexOf(List list, value, [int startIndex = null]) =>
      list.lastIndexOf(value, startIndex == null ? list.length : startIndex);

  static void forEachWithIndex/*<T>*/(List/*<T>*/ list, fn(/*=T*/ item, int index)) {
    for (var i = 0; i < list.length; ++i) {
      fn(list[i], i);
    }
  }
  static /*=T*/ first/*<T>*/(List/*<T>*/ list) => list.isEmpty ? null : list.first;
  static /*=T*/ last/*<T>*/(List/*<T>*/ list) => list.isEmpty ? null : list.last;
  static List/*<T>*/ reversed/*<T>*/(List/*<T>*/ list) => list.reversed.toList();
  static List/*<T>*/ concat/*<T>*/(List/*<T>*/ a, List/*<T>*/ b) {
    return new List()
      ..length = a.length + b.length
      ..setRange(0, a.length, a)
      ..setRange(a.length, a.length + b.length, b);
  }

  static void insert/*<T>*/(List/*<T>*/ l, int index, /*=T*/ value) {
    l.insert(index, value);
  }

  static removeAt(List l, int index) => l.removeAt(index);
  static void removeAll/*<T>*/(List/*<T>*/ list, List/*<T>*/ items) {
    for (var i = 0; i < items.length; ++i) {
      list.remove(items[i]);
    }
  }

  static bool remove/*<T>*/(List/*<T>*/ list, /*=T*/ item) => list.remove(item);
  static void clear(List l) {
    l.clear();
  }

  static bool isEmpty(Iterable list) => list.isEmpty;
  static void fill/*<T>*/(List/*<T>*/ l, /*=T*/ value, [int start = 0, int end]) {
    l.fillRange(_startOffset(l, start), _endOffset(l, end), value);
  }

  static bool equals/*<T>*/(List/*<T>*/ a, List/*<T>*/ b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; ++i) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  static List/*<T>*/ slice/*<T>*/(List/*<T>*/ l, [int from = 0, int to]) {
    from = _startOffset(l, from);
    to = _endOffset(l, to);
    //in JS if from > to an empty array is returned
    if (to != null && from > to) {
      return [];
    }
    return l.sublist(from, to);
  }

  static List/*<T>*/ splice/*<T>*/(List/*<T>*/ l, int from, int length) {
    from = _startOffset(l, from);
    var to = from + length;
    var sub = l.sublist(from, to);
    l.removeRange(from, to);
    return sub;
  }

  static void sort/*<T>*/(List/*<T>*/ l, [int compareFn(/*=T*/a, /*=T*/b) = null]) {
    if (compareFn == null) {
      l.sort();
    } else {
      l.sort(compareFn);
    }
  }

  static String toJSON(List l) {
    return jsonEncoder.convert(l);
  }

  // JS splice, slice, fill functions can take start < 0 which indicates a position relative to
  // the end of the list
  static int _startOffset(List l, int start) {
    int len = l.length;
    return start < 0 ? max(len + start, 0) : min(start, len);
  }

  // JS splice, slice, fill functions can take end < 0 which indicates a position relative to
  // the end of the list
  static int _endOffset(List l, int end) {
    int len = l.length;
    if (end == null) return len;
    return end < 0 ? max(len + end, 0) : min(end, len);
  }

  static maximum(List l, fn(item)) {
    if (l.length == 0) {
      return null;
    }
    var solution = null;
    var maxValue = double.NEGATIVE_INFINITY;
    for (var index = 0; index < l.length; index++) {
      var candidate = l[index];
      if (candidate == null) {
        continue;
      }
      var candidateValue = fn(candidate);
      if (candidateValue > maxValue) {
        solution = candidate;
        maxValue = candidateValue;
      }
    }
    return solution;
  }

  static List flatten(List l) {
    var target = [];
    _flattenArray(l, target);
    return target;
  }

  static addAll(List l, List source) {
    l.addAll(source);
  }
}

List _flattenArray(List source, List target) {
  if (source != null) {
    for (var i = 0; i < source.length; i++) {
      var item = source[i];
      if (item is List) {
        _flattenArray(item, target);
      } else {
        target.add(item);
      }
    }
  }
  return target;
}


bool isListLikeIterable(obj) => obj is Iterable;

bool areIterablesEqual/*<T>*/(
  Iterable/*<T>*/ a,
  Iterable/*<T>*/ b,
  bool comparator(/*=T*/a, /*=T*/b))
{
  var iterator1 = a.iterator;
  var iterator2 = b.iterator;

  while (true) {
    var done1 = !iterator1.moveNext();
    var done2 = !iterator2.moveNext();
    if (done1 && done2) return true;
    if (done1 || done2) return false;
    if (!comparator(iterator1.current, iterator2.current)) return false;
  }
}

void iterateListLike/*<T>*/(Iterable/*<T>*/ iter, fn(/*=T*/item)) {
  assert(iter is Iterable);
  for (var item in iter) {
    fn(item);
  }
}

class SetWrapper {
  static Set/*<T>*/ createFromList/*<T>*/(List/*<T>*/ l) => new Set.from(l);
  static bool has/*<T>*/(Set/*<T>*/ s, /*=T*/key) => s.contains(key);
  static void delete/*<T>*/(Set/*<T>*/ m, /*=T*/k) {
    m.remove(k);
  }
}
