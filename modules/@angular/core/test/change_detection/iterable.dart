import 'dart:collection';

class TestIterable extends IterableBase<int> {
  List<int> list = [];
  Iterator<int> get iterator => list.iterator;
}
