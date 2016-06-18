import {describe, it, iit, ddescribe, expect, beforeEach,} from '@angular/core/testing/testing_internal';
import {OnInit} from '@angular/core';
import {Reflector, ReflectionInfo} from '@angular/core/src/reflection/reflection';
import {ReflectionCapabilities} from '@angular/core/src/reflection/reflection_capabilities';
import {ClassDecorator, ParamDecorator, PropDecorator, classDecorator, paramDecorator, propDecorator, HasGetterAndSetterDecorators} from './reflector_common';
import {IS_DART} from '../../src/facade/lang';
import {browserDetection} from '@angular/platform-browser/testing'

class AType {
  value: any /** TODO #9100 */;

  constructor(value: any /** TODO #9100 */) { this.value = value; }
}

@ClassDecorator('class') class ClassWithDecorators {
  @PropDecorator('p1') @PropDecorator('p2') a: any /** TODO #9100 */;
  b: any /** TODO #9100 */;

  @PropDecorator('p3')
  set c(value: any /** TODO #9100 */) {
  }

  constructor(@ParamDecorator('a') a: AType, @ParamDecorator('b') b: AType) {
  this.a = a;
  this.b = b;
  }
}

class ClassWithoutDecorators {
  constructor(a: any /** TODO #9100 */, b: any /** TODO #9100 */) {}
}

class TestObj {
  a: any /** TODO #9100 */;
  b: any /** TODO #9100 */;

  constructor(a: any /** TODO #9100 */, b: any /** TODO #9100 */) {
  this.a = a;
  this.b = b;
  }

  identity(arg: any /** TODO #9100 */) {
  return arg; }
}

class Interface {}

class Interface2 {}

class SuperClassImplementingInterface implements Interface2 {}

class ClassImplementingInterface extends SuperClassImplementingInterface implements Interface {}

// Classes used to test our runtime check for classes that implement lifecycle interfaces but do not
// declare them.
// See https://github.com/angular/angular/pull/6879 and https://goo.gl/b07Kii for details.
class ClassDoesNotDeclareOnInit {
  ngOnInit() {}
}

class SuperClassImplementingOnInit implements OnInit {
  ngOnInit() {}
}

class SubClassDoesNotDeclareOnInit extends SuperClassImplementingOnInit {}

export function main() {
  describe('Reflector', () => {
  var reflector: any /** TODO #9100 */;

  beforeEach(() => { reflector = new Reflector(new ReflectionCapabilities()); });

  describe('usage tracking', () => {
    beforeEach(() => { reflector = new Reflector(null); });

    it('should be disabled by default', () => {
      expect(() => reflector.listUnusedKeys()).toThrowError('Usage tracking is disabled');
    });

    it('should report unused keys', () => {
      reflector.trackUsage();
      expect(reflector.listUnusedKeys()).toEqual([]);

      reflector.registerType(AType, new ReflectionInfo(null, null, () => 'AType'));
      reflector.registerType(TestObj, new ReflectionInfo(null, null, () => 'TestObj'));
      expect(reflector.listUnusedKeys()).toEqual([AType, TestObj]);

      reflector.factory(AType);
      expect(reflector.listUnusedKeys()).toEqual([TestObj]);

      reflector.factory(TestObj);
      expect(reflector.listUnusedKeys()).toEqual([]);
    });
  });

  describe('factory', () => {
    it('should create a factory for the given type', () => {
      var obj = reflector.factory(TestObj)(1, 2);

      expect(obj.a).toEqual(1);
      expect(obj.b).toEqual(2);
    });

    // Makes Edge to disconnect when running the full unit test campaign
    // TODO: remove when issue is solved: https://github.com/angular/angular/issues/4756
    if (!browserDetection.isEdge) {
      it('should check args from no to max', () => {
        var f = (t: any /** TODO #9100 */) => reflector.factory(t);
        var checkArgs = (obj: any /** TODO #9100 */, args: any /** TODO #9100 */) =>
            expect(obj.args).toEqual(args);

        // clang-format off
          checkArgs(f(TestObjWith00Args)(), []);
          checkArgs(f(TestObjWith01Args)(1), [1]);
          checkArgs(f(TestObjWith02Args)(1, 2), [1, 2]);
          checkArgs(f(TestObjWith03Args)(1, 2, 3), [1, 2, 3]);
          checkArgs(f(TestObjWith04Args)(1, 2, 3, 4), [1, 2, 3, 4]);
          checkArgs(f(TestObjWith05Args)(1, 2, 3, 4, 5), [1, 2, 3, 4, 5]);
          checkArgs(f(TestObjWith06Args)(1, 2, 3, 4, 5, 6), [1, 2, 3, 4, 5, 6]);
          checkArgs(f(TestObjWith07Args)(1, 2, 3, 4, 5, 6, 7), [1, 2, 3, 4, 5, 6, 7]);
          checkArgs(f(TestObjWith08Args)(1, 2, 3, 4, 5, 6, 7, 8), [1, 2, 3, 4, 5, 6, 7, 8]);
          checkArgs(f(TestObjWith09Args)(1, 2, 3, 4, 5, 6, 7, 8, 9), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
          checkArgs(f(TestObjWith10Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
          checkArgs(f(TestObjWith11Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
          checkArgs(f(TestObjWith12Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
          checkArgs(f(TestObjWith13Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
          checkArgs(f(TestObjWith14Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
          checkArgs(f(TestObjWith15Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
          checkArgs(f(TestObjWith16Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
          checkArgs(f(TestObjWith17Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
          checkArgs(f(TestObjWith18Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
          checkArgs(f(TestObjWith19Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
          checkArgs(f(TestObjWith20Args)(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
        // clang-format on
      });
    }

    it('should throw when more than 20 arguments',
       () => { expect(() => reflector.factory(TestObjWith21Args)).toThrowError(); });

    it('should return a registered factory if available', () => {
      reflector.registerType(TestObj, new ReflectionInfo(null, null, () => 'fake'));
      expect(reflector.factory(TestObj)()).toEqual('fake');
    });
  });

  describe('parameters', () => {
    it('should return an array of parameters for a type', () => {
      var p = reflector.parameters(ClassWithDecorators);
      expect(p).toEqual([[AType, paramDecorator('a')], [AType, paramDecorator('b')]]);
    });

    it('should work for a class without annotations', () => {
      var p = reflector.parameters(ClassWithoutDecorators);
      expect(p.length).toEqual(2);
    });

    it('should return registered parameters if available', () => {
      reflector.registerType(TestObj, new ReflectionInfo(null, [[1], [2]]));
      expect(reflector.parameters(TestObj)).toEqual([[1], [2]]);
    });

    it('should return an empty list when no parameters field in the stored type info', () => {
      reflector.registerType(TestObj, new ReflectionInfo());
      expect(reflector.parameters(TestObj)).toEqual([]);
    });
  });

  describe('propMetadata', () => {
    it('should return a string map of prop metadata for the given class', () => {
      var p = reflector.propMetadata(ClassWithDecorators);
      expect(p['a']).toEqual([propDecorator('p1'), propDecorator('p2')]);
      expect(p['c']).toEqual([propDecorator('p3')]);
    });

    it('should return registered meta if available', () => {
      reflector.registerType(TestObj, new ReflectionInfo(null, null, null, null, {'a': [1, 2]}));
      expect(reflector.propMetadata(TestObj)).toEqual({'a': [1, 2]});
    });

    if (IS_DART) {
      it('should merge metadata from getters and setters', () => {
        var p = reflector.propMetadata(HasGetterAndSetterDecorators);
        expect(p['a']).toEqual([propDecorator('get'), propDecorator('set')]);
      });
    }
  });

  describe('annotations', () => {
    it('should return an array of annotations for a type', () => {
      var p = reflector.annotations(ClassWithDecorators);
      expect(p).toEqual([classDecorator('class')]);
    });

    it('should return registered annotations if available', () => {
      reflector.registerType(TestObj, new ReflectionInfo([1, 2]));
      expect(reflector.annotations(TestObj)).toEqual([1, 2]);
    });

    it('should work for a class without annotations', () => {
      var p = reflector.annotations(ClassWithoutDecorators);
      expect(p).toEqual([]);
    });
  });

  if (IS_DART) {
    describe('interfaces', () => {
      it('should return an array of interfaces for a type', () => {
        var p = reflector.interfaces(ClassImplementingInterface);
        expect(p).toEqual([Interface, Interface2]);
      });

      it('should return an empty array otherwise', () => {
        var p = reflector.interfaces(ClassWithDecorators);
        expect(p).toEqual([]);
      });

      it('should throw for undeclared lifecycle interfaces',
         () => { expect(() => reflector.interfaces(ClassDoesNotDeclareOnInit)).toThrowError(); });

      it('should throw for class inheriting a lifecycle impl and not declaring the interface',
         () => {
           expect(() => reflector.interfaces(SubClassDoesNotDeclareOnInit)).toThrowError();
         });
    });
  }

  describe('getter', () => {
    it('returns a function reading a property', () => {
      var getA = reflector.getter('a');
      expect(getA(new TestObj(1, 2))).toEqual(1);
    });

    it('should return a registered getter if available', () => {
      reflector.registerGetters({'abc': (obj: any /** TODO #9100 */) => 'fake'});
      expect(reflector.getter('abc')('anything')).toEqual('fake');
    });
  });

  describe('setter', () => {
    it('returns a function setting a property', () => {
      var setA = reflector.setter('a');
      var obj = new TestObj(1, 2);
      setA(obj, 100);
      expect(obj.a).toEqual(100);
    });

    it('should return a registered setter if available', () => {
      var updateMe: any /** TODO #9100 */;
      reflector.registerSetters({
        'abc': (obj: any /** TODO #9100 */, value: any /** TODO #9100 */) => { updateMe = value; }
      });
      reflector.setter('abc')('anything', 'fake');

      expect(updateMe).toEqual('fake');
    });
  });

  describe('method', () => {
    it('returns a function invoking a method', () => {
      var func = reflector.method('identity');
      var obj = new TestObj(1, 2);
      expect(func(obj, ['value'])).toEqual('value');
    });

    it('should return a registered method if available', () => {
      reflector.registerMethods(
          {'abc': (obj: any /** TODO #9100 */, args: any /** TODO #9100 */) => args});
      expect(reflector.method('abc')('anything', ['fake'])).toEqual(['fake']);
    });
  });

  if (IS_DART) {
    describe('importUri', () => {
      it('should return the importUri for a type', () => {
        expect(reflector.importUri(TestObjWith00Args)
                   .endsWith('test/core/reflection/reflector_spec.dart'))
            .toBe(true);
      });
    });
  }
  });
}


class TestObjWith00Args {
  args: any[];
  constructor() {
  this.args = []; }
}

class TestObjWith01Args {
  args: any[];
  constructor(a1: any) {
  this.args = [a1]; }
}

class TestObjWith02Args {
  args: any[];
  constructor(a1: any, a2: any) {
  this.args = [a1, a2]; }
}

class TestObjWith03Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any) {
  this.args = [a1, a2, a3]; }
}

class TestObjWith04Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any) {
  this.args = [a1, a2, a3, a4]; }
}

class TestObjWith05Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any) {
  this.args = [a1, a2, a3, a4, a5]; }
}

class TestObjWith06Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any) {
  this.args = [a1, a2, a3, a4, a5, a6];
  }
}

class TestObjWith07Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7];
  }
}

class TestObjWith08Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8];
  }
}

class TestObjWith09Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9];
  }
}

class TestObjWith10Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10];
  }
}

class TestObjWith11Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11];
  }
}

class TestObjWith12Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12];
  }
}

class TestObjWith13Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13];
  }
}

class TestObjWith14Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any, a14: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14];
  }
}

class TestObjWith15Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any, a14: any, a15: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15];
  }
}

class TestObjWith16Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16];
  }
}

class TestObjWith17Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17];
  }
}

class TestObjWith18Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any,
              a18: any) {
  this.args = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18];
  }
}

class TestObjWith19Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any,
              a18: any, a19: any) {
  this.args =
      [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19];
  }
}

class TestObjWith20Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any,
              a18: any, a19: any, a20: any) {
  this.args =
      [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20];
  }
}

class TestObjWith21Args {
  args: any[];
  constructor(a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
              a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any,
              a18: any, a19: any, a20: any, a21: any) {
  this.args = [
    a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21
  ];
  }
}
