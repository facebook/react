import buildMakeReadOnly from "./makeReadOnly";

describe("makeReadOnly", () => {
  let logger: jest.Func;
  let makeReadOnly: <T>(value: T) => T;

  beforeEach(() => {
    logger = jest.fn();
    makeReadOnly = buildMakeReadOnly(logger, [], () => true);
  });

  describe("Tracking mutations", () => {
    it("can be called with all primitives", () => {
      const a = 5;
      const b = true;
      const c = null;
      expect(makeReadOnly(a)).toBe(a);
      expect(makeReadOnly(b)).toBe(b);
      expect(makeReadOnly(c)).toBe(c);
    });

    it("retains referential equality", () => {
      const valA = {};
      const valB = { a: valA, _: valA };
      const o = { a: valA, b: valB, c: "c" };
      expect(makeReadOnly(o)).toBe(o);
      expect(makeReadOnly(o.a)).toBe(valA);
      expect(makeReadOnly(o.b)).toBe(valB);
      expect(makeReadOnly(o.b.a)).toBe(valA);
      expect(makeReadOnly(o.b._)).toBe(valA);
      expect(makeReadOnly(o.c)).toBe("c");
    });

    it("deals with cyclic references", () => {
      const o: any = {};
      o.self_ref = o;
      expect(makeReadOnly(o)).toBe(o);
      expect(makeReadOnly(o.self_ref)).toBe(o);
    });
    it("logs direct interior mutability", () => {
      const o = { a: 0 };
      makeReadOnly(o);
      o.a = 42;
      expect(logger).toBeCalledWith("FORGET_MUTATE_IMMUT", "a", 42);
    });

    it("tracks changes to known RO properties", () => {
      const o: any = { a: {} };
      makeReadOnly(o);
      o.a = 42;
      expect(logger).toBeCalledWith("FORGET_MUTATE_IMMUT", "a", 42);
      expect(o.a).toBe(42);
      const newVal = { x: 0 };
      o.a = newVal;
      expect(logger).toBeCalledWith("FORGET_MUTATE_IMMUT", "a", newVal);
      expect(o.a).toBe(newVal);
    });

    it("logs aliased mutations", () => {
      const o: any = { a: { x: 4 } };

      const alias = o;
      makeReadOnly(o);
      const newVal = {};
      alias.a = newVal;
      expect(logger).toBeCalledWith("FORGET_MUTATE_IMMUT", "a", newVal);
      expect(o.a).toBe(newVal);
    });

    it("logs transitive interior mutability", () => {
      const o: any = { a: { x: 0 } };
      makeReadOnly(o);
      o.a.x = 42;
      expect(logger).toBeCalledWith("FORGET_MUTATE_IMMUT", "x", 42);
    });

    describe("todo", () => {
      it("does not track newly added or deleted vals if makeReadOnly is only called once", () => {
        // this is a limitation of the current "proxy" approach,
        // which overwrites object properties with getters and setters
        const x: any = { a: {} };
        makeReadOnly(x);

        delete x.a;
        x.b = 0;
        expect(logger).toBeCalledTimes(0);
      });
      it("does not log aliased indirect mutations", () => {
        // this could be easily implemented by making caching eager
        const innerObj = { x: 0 };
        const o = { a: innerObj };
        makeReadOnly(o);
        innerObj.x = 42;
        expect(o.a.x).toBe(42);

        const o1 = { a: { x: 0 } };
        const innerObj1 = o1.a;
        makeReadOnly(o1);
        innerObj1.x = 42;

        expect(o1.a.x).toBe(42);
        expect(logger).toBeCalledTimes(0);
      });
    });
  });

  describe("Tracking adding or deleting properties", () => {
    it("tracks new properties added between calls to makeReadOnly", () => {
      const o: any = {};
      makeReadOnly(o);
      o.a = "new value";
      makeReadOnly(o);
      expect(logger).toBeCalledWith("FORGET_ADD_PROP_IMMUT", "a");
    });
    it("tracks properties deleted between calls to makeReadOnly", () => {
      const o: any = { a: 0 };
      makeReadOnly(o);
      delete o.a;
      makeReadOnly(o);
      expect(logger).toBeCalledWith("FORGET_DELETE_PROP_IMMUT", "a");
    });

    it("tracks properties deleted and re-added between calls to makeReadOnly", () => {
      const o: any = { a: 0 };
      makeReadOnly(o);
      delete o.a;
      o.a = {};
      makeReadOnly(o);
      expect(logger).toBeCalledWith("FORGET_CHANGE_PROP_IMMUT", "a");
    });
  });
});
