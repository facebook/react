library angular2.test.directives.observable_list_iterable_diff_spec;

import 'package:angular2/testing_internal.dart';
import 'package:observe/observe.dart' show ObservableList;
import 'package:angular2/core.dart' show ChangeDetectorRef;
import 'package:angular2/common.dart' show ObservableListDiffFactory;

@proxy
class SpyChangeDetectorRef extends SpyObject implements ChangeDetectorRef {}

main() {
  describe('ObservableListDiff', () {
    var factory, changeDetectorRef;

    beforeEach(() {
      factory = const ObservableListDiffFactory();
      changeDetectorRef = new SpyChangeDetectorRef();
    });

    describe("supports", () {
      it("should be true for ObservableList", () {
        expect(factory.supports(new ObservableList())).toBe(true);
      });

      it("should be false otherwise", () {
        expect(factory.supports([1, 2, 3])).toBe(false);
      });
    });

    it("should return itself when called the first time", () {
      final d = factory.create(changeDetectorRef);
      final c = new ObservableList.from([1, 2]);
      expect(d.diff(c)).toBe(d);
    });

    it("should return itself when no changes between the calls", () {
      final d = factory.create(changeDetectorRef);

      final c = new ObservableList.from([1, 2]);

      d.diff(c);

      expect(d.diff(c)).toBe(null);
    });

    it("should return the wrapped value once a change has been triggered",
        fakeAsync(() {
      final d = factory.create(changeDetectorRef);

      final c = new ObservableList.from([1, 2]);

      d.diff(c);

      c.add(3);

      // same value, because we have not detected the change yet
      expect(d.diff(c)).toBe(null);

      // now we detect the change
      flushMicrotasks();
      expect(d.diff(c)).toBe(d);
    }));

    it("should request a change detection check upon receiving a change",
        fakeAsync(() {
      final d = factory.create(changeDetectorRef);

      final c = new ObservableList.from([1, 2]);
      d.diff(c);

      c.add(3);
      flushMicrotasks();

      expect(changeDetectorRef.spy("markForCheck")).toHaveBeenCalledOnce();
    }));

    it("should return the wrapped value after changing a collection", () {
      final d = factory.create(changeDetectorRef);

      final c1 = new ObservableList.from([1, 2]);
      final c2 = new ObservableList.from([3, 4]);

      expect(d.diff(c1)).toBe(d);
      expect(d.diff(c2)).toBe(d);
    });

    it("should not unbsubscribe from the stream of chagnes after changing a collection",
        () {
      final d = factory.create(changeDetectorRef);

      final c1 = new ObservableList.from([1, 2]);
      expect(d.diff(c1)).toBe(d);

      final c2 = new ObservableList.from([3, 4]);
      expect(d.diff(c2)).toBe(d);

      // pushing into the first collection has no effect, and we do not see the change
      c1.add(3);
      expect(d.diff(c2)).toBe(null);
    });
  });
}
