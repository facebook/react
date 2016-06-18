import {afterEach, beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';

import {fakeAsync, flushMicrotasks, Log, tick,} from '@angular/core/testing';

import {SpyNgControl, SpyValueAccessor} from './spies';

import {FormGroup, FormControl, FormControlName, FormGroupName, NgModelGroup, FormGroupDirective, ControlValueAccessor, Validators, NgForm, NgModel, FormControlDirective, NgControl, DefaultValueAccessor, CheckboxControlValueAccessor, SelectControlValueAccessor, Validator} from '@angular/forms';

import {selectValueAccessor, composeValidators} from '@angular/forms/src/directives/shared';
import {TimerWrapper} from '../src/facade/async';
import {PromiseWrapper} from '../src/facade/promise';
import {SimpleChange} from '@angular/core/src/change_detection';

class DummyControlValueAccessor implements ControlValueAccessor {
  writtenValue: any;

  registerOnChange(fn: any /** TODO #9100 */) {}
  registerOnTouched(fn: any /** TODO #9100 */) {}

  writeValue(obj: any): void { this.writtenValue = obj; }
}

class CustomValidatorDirective implements Validator {
  validate(c: FormControl): {[key: string]: any} { return {'custom': true}; }
}

function asyncValidator(expected: any /** TODO #9100 */, timeout = 0) {
  return (c: any /** TODO #9100 */) => {
    var completer = PromiseWrapper.completer();
    var res = c.value != expected ? {'async': true} : null;
    if (timeout == 0) {
      completer.resolve(res);
    } else {
      TimerWrapper.setTimeout(() => { completer.resolve(res); }, timeout);
    }
    return completer.promise;
  };
}

export function main() {
  describe('Form Directives', () => {
    var defaultAccessor: DefaultValueAccessor;

    beforeEach(() => { defaultAccessor = new DefaultValueAccessor(null, null); });

    describe('shared', () => {
      describe('selectValueAccessor', () => {
        var dir: NgControl;

        beforeEach(() => { dir = <any>new SpyNgControl(); });

        it('should throw when given an empty array',
           () => { expect(() => selectValueAccessor(dir, [])).toThrowError(); });

        it('should return the default value accessor when no other provided',
           () => { expect(selectValueAccessor(dir, [defaultAccessor])).toEqual(defaultAccessor); });

        it('should return checkbox accessor when provided', () => {
          var checkboxAccessor = new CheckboxControlValueAccessor(null, null);
          expect(selectValueAccessor(dir, [
            defaultAccessor, checkboxAccessor
          ])).toEqual(checkboxAccessor);
        });

        it('should return select accessor when provided', () => {
          var selectAccessor = new SelectControlValueAccessor(null, null);
          expect(selectValueAccessor(dir, [
            defaultAccessor, selectAccessor
          ])).toEqual(selectAccessor);
        });

        it('should throw when more than one build-in accessor is provided', () => {
          var checkboxAccessor = new CheckboxControlValueAccessor(null, null);
          var selectAccessor = new SelectControlValueAccessor(null, null);
          expect(() => selectValueAccessor(dir, [checkboxAccessor, selectAccessor])).toThrowError();
        });

        it('should return custom accessor when provided', () => {
          var customAccessor = new SpyValueAccessor();
          var checkboxAccessor = new CheckboxControlValueAccessor(null, null);
          expect(selectValueAccessor(dir, <any>[defaultAccessor, customAccessor, checkboxAccessor]))
              .toEqual(customAccessor);
        });

        it('should throw when more than one custom accessor is provided', () => {
          var customAccessor: ControlValueAccessor = <any>new SpyValueAccessor();
          expect(() => selectValueAccessor(dir, [customAccessor, customAccessor])).toThrowError();
        });
      });

      describe('composeValidators', () => {
        it('should compose functions', () => {
          var dummy1 = (_: any /** TODO #9100 */) => ({'dummy1': true});
          var dummy2 = (_: any /** TODO #9100 */) => ({'dummy2': true});
          var v = composeValidators([dummy1, dummy2]);
          expect(v(new FormControl(''))).toEqual({'dummy1': true, 'dummy2': true});
        });

        it('should compose validator directives', () => {
          var dummy1 = (_: any /** TODO #9100 */) => ({'dummy1': true});
          var v = composeValidators([dummy1, new CustomValidatorDirective()]);
          expect(v(new FormControl(''))).toEqual({'dummy1': true, 'custom': true});
        });
      });
    });

    describe('formGroup', () => {
      var form: any /** TODO #9100 */;
      var formModel: FormGroup;
      var loginControlDir: any /** TODO #9100 */;

      beforeEach(() => {
        form = new FormGroupDirective([], []);
        formModel = new FormGroup({
          'login': new FormControl(),
          'passwords': new FormGroup(
              {'password': new FormControl(), 'passwordConfirm': new FormControl()})
        });
        form.form = formModel;

        loginControlDir = new FormControlName(
            form, [Validators.required], [asyncValidator('expected')], [defaultAccessor]);
        loginControlDir.name = 'login';
        loginControlDir.valueAccessor = new DummyControlValueAccessor();
      });

      it('should reexport control properties', () => {
        expect(form.control).toBe(formModel);
        expect(form.value).toBe(formModel.value);
        expect(form.valid).toBe(formModel.valid);
        expect(form.errors).toBe(formModel.errors);
        expect(form.pristine).toBe(formModel.pristine);
        expect(form.dirty).toBe(formModel.dirty);
        expect(form.touched).toBe(formModel.touched);
        expect(form.untouched).toBe(formModel.untouched);
      });

      describe('addControl', () => {
        it('should throw when no control found', () => {
          var dir = new FormControlName(form, null, null, [defaultAccessor]);
          dir.name = 'invalidName';

          expect(() => form.addControl(dir))
              .toThrowError(new RegExp('Cannot find control \'invalidName\''));
        });

        it('should throw when no value accessor', () => {
          var dir = new FormControlName(form, null, null, null);
          dir.name = 'login';

          expect(() => form.addControl(dir))
              .toThrowError(new RegExp('No value accessor for \'login\''));
        });

        it('should set up validators', fakeAsync(() => {
             form.addControl(loginControlDir);

             // sync validators are set
             expect(formModel.hasError('required', ['login'])).toBe(true);
             expect(formModel.hasError('async', ['login'])).toBe(false);

             (<FormControl>formModel.find(['login'])).updateValue('invalid value');

             // sync validator passes, running async validators
             expect(formModel.pending).toBe(true);

             tick();

             expect(formModel.hasError('required', ['login'])).toBe(false);
             expect(formModel.hasError('async', ['login'])).toBe(true);
           }));

        it('should write value to the DOM', () => {
          (<FormControl>formModel.find(['login'])).updateValue('initValue');

          form.addControl(loginControlDir);

          expect((<any>loginControlDir.valueAccessor).writtenValue).toEqual('initValue');
        });

        it('should add the directive to the list of directives included in the form', () => {
          form.addControl(loginControlDir);
          expect(form.directives).toEqual([loginControlDir]);
        });
      });

      describe('addFormGroup', () => {
        var matchingPasswordsValidator = (g: any /** TODO #9100 */) => {
          if (g.controls['password'].value != g.controls['passwordConfirm'].value) {
            return {'differentPasswords': true};
          } else {
            return null;
          }
        };

        it('should set up validator', fakeAsync(() => {
             var group = new FormGroupName(
                 form, [matchingPasswordsValidator], [asyncValidator('expected')]);
             group.name = 'passwords';
             form.addFormGroup(group);

             (<FormControl>formModel.find(['passwords', 'password'])).updateValue('somePassword');
             (<FormControl>formModel.find([
               'passwords', 'passwordConfirm'
             ])).updateValue('someOtherPassword');

             // sync validators are set
             expect(formModel.hasError('differentPasswords', ['passwords'])).toEqual(true);

             (<FormControl>formModel.find([
               'passwords', 'passwordConfirm'
             ])).updateValue('somePassword');

             // sync validators pass, running async validators
             expect(formModel.pending).toBe(true);

             tick();

             expect(formModel.hasError('async', ['passwords'])).toBe(true);
           }));
      });

      describe('removeControl', () => {
        it('should remove the directive to the list of directives included in the form', () => {
          form.addControl(loginControlDir);
          form.removeControl(loginControlDir);
          expect(form.directives).toEqual([]);
        });
      });

      describe('ngOnChanges', () => {
        it('should update dom values of all the directives', () => {
          form.addControl(loginControlDir);

          (<FormControl>formModel.find(['login'])).updateValue('new value');

          form.ngOnChanges({});

          expect((<any>loginControlDir.valueAccessor).writtenValue).toEqual('new value');
        });

        it('should set up a sync validator', () => {
          var formValidator = (c: any /** TODO #9100 */) => ({'custom': true});
          var f = new FormGroupDirective([formValidator], []);
          f.form = formModel;
          f.ngOnChanges({'form': new SimpleChange(null, null)});

          expect(formModel.errors).toEqual({'custom': true});
        });

        it('should set up an async validator', fakeAsync(() => {
             var f = new FormGroupDirective([], [asyncValidator('expected')]);
             f.form = formModel;
             f.ngOnChanges({'form': new SimpleChange(null, null)});

             tick();

             expect(formModel.errors).toEqual({'async': true});
           }));
      });
    });

    describe('NgForm', () => {
      var form: any /** TODO #9100 */;
      var formModel: FormGroup;
      var loginControlDir: any /** TODO #9100 */;
      var personControlGroupDir: any /** TODO #9100 */;

      beforeEach(() => {
        form = new NgForm([], []);
        formModel = form.form;

        personControlGroupDir = new NgModelGroup(form, [], []);
        personControlGroupDir.name = 'person';

        loginControlDir = new FormControlName(personControlGroupDir, null, null, [defaultAccessor]);
        loginControlDir.name = 'login';
        loginControlDir.valueAccessor = new DummyControlValueAccessor();
      });

      it('should reexport control properties', () => {
        expect(form.control).toBe(formModel);
        expect(form.value).toBe(formModel.value);
        expect(form.valid).toBe(formModel.valid);
        expect(form.errors).toBe(formModel.errors);
        expect(form.pristine).toBe(formModel.pristine);
        expect(form.dirty).toBe(formModel.dirty);
        expect(form.touched).toBe(formModel.touched);
        expect(form.untouched).toBe(formModel.untouched);
      });

      describe('addControl & addFormGroup', () => {
        it('should create a control with the given name', fakeAsync(() => {
             form.addFormGroup(personControlGroupDir);
             form.addControl(loginControlDir);

             flushMicrotasks();

             expect(formModel.find(['person', 'login'])).not.toBeNull;
           }));

        // should update the form's value and validity
      });

      describe('removeControl & removeFormGroup', () => {
        it('should remove control', fakeAsync(() => {
             form.addFormGroup(personControlGroupDir);
             form.addControl(loginControlDir);

             form.removeFormGroup(personControlGroupDir);
             form.removeControl(loginControlDir);

             flushMicrotasks();

             expect(formModel.find(['person'])).toBeNull();
             expect(formModel.find(['person', 'login'])).toBeNull();
           }));

        // should update the form's value and validity
      });

      it('should set up sync validator', fakeAsync(() => {
           var formValidator = (c: any /** TODO #9100 */) => ({'custom': true});
           var f = new NgForm([formValidator], []);

           tick();

           expect(f.form.errors).toEqual({'custom': true});
         }));

      it('should set up async validator', fakeAsync(() => {
           var f = new NgForm([], [asyncValidator('expected')]);

           tick();

           expect(f.form.errors).toEqual({'async': true});
         }));
    });

    describe('FormGroupName', () => {
      var formModel: any /** TODO #9100 */;
      var controlGroupDir: any /** TODO #9100 */;

      beforeEach(() => {
        formModel = new FormGroup({'login': new FormControl(null)});

        var parent = new FormGroupDirective([], []);
        parent.form = new FormGroup({'group': formModel});
        controlGroupDir = new FormGroupName(parent, [], []);
        controlGroupDir.name = 'group';
      });

      it('should reexport control properties', () => {
        expect(controlGroupDir.control).toBe(formModel);
        expect(controlGroupDir.value).toBe(formModel.value);
        expect(controlGroupDir.valid).toBe(formModel.valid);
        expect(controlGroupDir.errors).toBe(formModel.errors);
        expect(controlGroupDir.pristine).toBe(formModel.pristine);
        expect(controlGroupDir.dirty).toBe(formModel.dirty);
        expect(controlGroupDir.touched).toBe(formModel.touched);
        expect(controlGroupDir.untouched).toBe(formModel.untouched);
      });
    });

    describe('FormControlDirective', () => {
      var controlDir: any /** TODO #9100 */;
      var control: any /** TODO #9100 */;
      var checkProperties = function(control: any /** TODO #9100 */) {
        expect(controlDir.control).toBe(control);
        expect(controlDir.value).toBe(control.value);
        expect(controlDir.valid).toBe(control.valid);
        expect(controlDir.errors).toBe(control.errors);
        expect(controlDir.pristine).toBe(control.pristine);
        expect(controlDir.dirty).toBe(control.dirty);
        expect(controlDir.touched).toBe(control.touched);
        expect(controlDir.untouched).toBe(control.untouched);
      };

      beforeEach(() => {
        controlDir = new FormControlDirective([Validators.required], [], [defaultAccessor]);
        controlDir.valueAccessor = new DummyControlValueAccessor();

        control = new FormControl(null);
        controlDir.form = control;
      });

      it('should reexport control properties', () => { checkProperties(control); });

      it('should reexport new control properties', () => {
        var newControl = new FormControl(null);
        controlDir.form = newControl;
        controlDir.ngOnChanges({'form': new SimpleChange(control, newControl)});

        checkProperties(newControl);
      });

      it('should set up validator', () => {
        expect(control.valid).toBe(true);

        // this will add the required validator and recalculate the validity
        controlDir.ngOnChanges({'form': new SimpleChange(null, control)});

        expect(control.valid).toBe(false);
      });
    });

    describe('NgModel', () => {
      var ngModel: any /** TODO #9100 */;

      beforeEach(() => {
        ngModel = new NgModel(
            null, [Validators.required], [asyncValidator('expected')], [defaultAccessor]);
        ngModel.valueAccessor = new DummyControlValueAccessor();
      });

      it('should reexport control properties', () => {
        var control = ngModel.control;
        expect(ngModel.control).toBe(control);
        expect(ngModel.value).toBe(control.value);
        expect(ngModel.valid).toBe(control.valid);
        expect(ngModel.errors).toBe(control.errors);
        expect(ngModel.pristine).toBe(control.pristine);
        expect(ngModel.dirty).toBe(control.dirty);
        expect(ngModel.touched).toBe(control.touched);
        expect(ngModel.untouched).toBe(control.untouched);
      });

      it('should set up validator', fakeAsync(() => {
           // this will add the required validator and recalculate the validity
           ngModel.ngOnChanges({});
           tick();

           expect(ngModel.control.errors).toEqual({'required': true});

           ngModel.control.updateValue('someValue');
           tick();

           expect(ngModel.control.errors).toEqual({'async': true});
         }));
    });

    describe('FormControlName', () => {
      var formModel: any /** TODO #9100 */;
      var controlNameDir: any /** TODO #9100 */;

      beforeEach(() => {
        formModel = new FormControl('name');

        var parent = new FormGroupDirective([], []);
        parent.form = new FormGroup({'name': formModel});
        controlNameDir = new FormControlName(parent, [], [], [defaultAccessor]);
        controlNameDir.name = 'name';
      });

      it('should reexport control properties', () => {
        expect(controlNameDir.control).toBe(formModel);
        expect(controlNameDir.value).toBe(formModel.value);
        expect(controlNameDir.valid).toBe(formModel.valid);
        expect(controlNameDir.errors).toBe(formModel.errors);
        expect(controlNameDir.pristine).toBe(formModel.pristine);
        expect(controlNameDir.dirty).toBe(formModel.dirty);
        expect(controlNameDir.touched).toBe(formModel.touched);
        expect(controlNameDir.untouched).toBe(formModel.untouched);
      });
    });
  });
}
