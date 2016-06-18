library angular2.dom.html5lib_adapter.test;

import 'package:guinness2/guinness2.dart';
import 'package:test/test.dart' hide expect;
import 'package:angular2/src/platform/server/html_adapter.dart';

// A smoke-test of the adapter. It is primarily tested by the compiler.
main() {
  describe('Html5Lib DOM Adapter', () {
    Html5LibDomAdapter subject;

    beforeEach(() {
      subject = new Html5LibDomAdapter();
    });

    it('should parse HTML', () {
      expect(subject.parse('<div>hi</div>'), isNotNull);
    });

    it('implements hasAttribute', () {
      var div = subject.querySelector(
          subject.parse('<div foo="bar"></div>'), ('div'));
      expect(subject.hasAttribute(div, 'foo')).toBeTrue();
      expect(subject.hasAttribute(div, 'bar')).toBeFalse();
    });

    it('implements getAttribute', () {
      var div = subject.querySelector(
          subject.parse('<div foo="bar"></div>'), ('div'));
      expect(subject.getAttribute(div, 'foo')).toEqual('bar');
      expect(subject.getAttribute(div, 'bar')).toBe(null);
    });
  });
}
