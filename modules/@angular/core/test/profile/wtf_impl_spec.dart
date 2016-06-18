/// This file contains tests that make sense only in Dart
library angular2.test.core.wtf_impl;

import 'package:@angular/core/testing/testing_internal.dart';
import 'package:angular2/src/core/profile/wtf_impl.dart' as impl;

main() {
  describe('WTF', () {
    describe('getArgSize', () {
      it("should parse args", () {
        expect(impl.getArgSize('foo#bar')).toBe(0);
        expect(impl.getArgSize('foo#bar()')).toBe(0);
        expect(impl.getArgSize('foo#bar(foo bar)')).toBe(1);
        expect(impl.getArgSize('foo#bar(foo bar, baz q)')).toBe(2);
      });
    });
  });
}
