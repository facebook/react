library angular2.test.core.compiler.directive_lifecycle_spec;

import 'package:angular2/testing_internal.dart';
import 'package:angular2/src/compiler/directive_lifecycle_reflector.dart';
import 'package:angular2/src/core/metadata/lifecycle_hooks.dart';

main() {
  describe('Create DirectiveMetadata', () {
    describe('lifecycle', () {
      describe("ngOnChanges", () {
        it("should be true when the directive has the ngOnChanges method", () {
          expect(hasLifecycleHook(
                  LifecycleHooks.OnChanges, DirectiveImplementingOnChanges))
              .toBe(true);
        });

        it("should be false otherwise", () {
          expect(hasLifecycleHook(LifecycleHooks.OnChanges, DirectiveNoHooks))
              .toBe(false);
        });
      });

      describe("ngOnDestroy", () {
        it("should be true when the directive has the ngOnDestroy method", () {
          expect(hasLifecycleHook(
                  LifecycleHooks.OnDestroy, DirectiveImplementingOnDestroy))
              .toBe(true);
        });

        it("should be false otherwise", () {
          expect(hasLifecycleHook(LifecycleHooks.OnDestroy, DirectiveNoHooks))
              .toBe(false);
        });
      });

      describe("ngOnInit", () {
        it("should be true when the directive has the ngOnInit method", () {
          expect(hasLifecycleHook(
              LifecycleHooks.OnInit, DirectiveImplementingOnInit)).toBe(true);
        });

        it("should be false otherwise", () {
          expect(hasLifecycleHook(LifecycleHooks.OnInit, DirectiveNoHooks))
              .toBe(false);
        });
      });

      describe("ngDoCheck", () {
        it("should be true when the directive has the ngDoCheck method", () {
          expect(hasLifecycleHook(
              LifecycleHooks.DoCheck, DirectiveImplementingOnCheck)).toBe(true);
        });

        it("should be false otherwise", () {
          expect(hasLifecycleHook(LifecycleHooks.DoCheck, DirectiveNoHooks))
              .toBe(false);
        });
      });

      describe("ngAfterContentInit", () {
        it("should be true when the directive has the ngAfterContentInit method",
            () {
          expect(hasLifecycleHook(LifecycleHooks.AfterContentInit,
              DirectiveImplementingAfterContentInit)).toBe(true);
        });

        it("should be false otherwise", () {
          expect(hasLifecycleHook(
              LifecycleHooks.AfterContentInit, DirectiveNoHooks)).toBe(false);
        });
      });

      describe("ngAfterContentChecked", () {
        it("should be true when the directive has the ngAfterContentChecked method",
            () {
          expect(hasLifecycleHook(LifecycleHooks.AfterContentChecked,
              DirectiveImplementingAfterContentChecked)).toBe(true);
        });

        it("should be false otherwise", () {
          expect(hasLifecycleHook(
                  LifecycleHooks.AfterContentChecked, DirectiveNoHooks))
              .toBe(false);
        });
      });

      describe("ngAfterViewInit", () {
        it("should be true when the directive has the ngAfterViewInit method",
            () {
          expect(hasLifecycleHook(LifecycleHooks.AfterViewInit,
              DirectiveImplementingAfterViewInit)).toBe(true);
        });

        it("should be false otherwise", () {
          expect(hasLifecycleHook(
              LifecycleHooks.AfterViewInit, DirectiveNoHooks)).toBe(false);
        });
      });

      describe("ngAfterViewChecked", () {
        it("should be true when the directive has the ngAfterViewChecked method",
            () {
          expect(hasLifecycleHook(LifecycleHooks.AfterViewChecked,
              DirectiveImplementingAfterViewChecked)).toBe(true);
        });

        it("should be false otherwise", () {
          expect(hasLifecycleHook(
              LifecycleHooks.AfterViewChecked, DirectiveNoHooks)).toBe(false);
        });
      });
    });
  });
}

class DirectiveNoHooks {}

class DirectiveImplementingOnChanges implements OnChanges {
  ngOnChanges(_) {}
}

class DirectiveImplementingOnCheck implements DoCheck {
  ngDoCheck() {}
}

class DirectiveImplementingOnInit implements OnInit {
  ngOnInit() {}
}

class DirectiveImplementingOnDestroy implements OnDestroy {
  ngOnDestroy() {}
}

class DirectiveImplementingAfterContentInit implements AfterContentInit {
  ngAfterContentInit() {}
}

class DirectiveImplementingAfterContentChecked implements AfterContentChecked {
  ngAfterContentChecked() {}
}

class DirectiveImplementingAfterViewInit implements AfterViewInit {
  ngAfterViewInit() {}
}

class DirectiveImplementingAfterViewChecked implements AfterViewChecked {
  ngAfterViewChecked() {}
}
