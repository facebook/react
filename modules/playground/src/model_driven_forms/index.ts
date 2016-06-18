import {bootstrap} from '@angular/platform-browser-dynamic';
import {
  FORM_DIRECTIVES,
  ControlGroup,
  Validators,
  NgFormModel,
  FormBuilder,
  NgIf,
  NgFor
} from '@angular/common';
import {Component, Directive, Host} from '@angular/core';

import {RegExpWrapper, print, isPresent} from '@angular/core/src/facade/lang';
import {AbstractControl} from '@angular/common';

/**
 * Custom validator.
 */
function creditCardValidator(c: AbstractControl): {[key: string]: boolean} {
  if (isPresent(c.value) && RegExpWrapper.test(/^\d{16}$/g, c.value)) {
    return null;
  } else {
    return {"invalidCreditCard": true};
  }
}

/**
 * This is a component that displays an error message.
 *
 * For instance,
 *
 * <show-error control="creditCard" [errors]="['required', 'invalidCreditCard']"></show-error>
 *
 * Will display the "is required" error if the control is empty, and "invalid credit card" if the
 * control is not empty
 * but not valid.
 *
 * In a real application, this component would receive a service that would map an error code to an
 * actual error message.
 * To make it simple, we are using a simple map here.
 */
@Component({
  selector: 'show-error',
  inputs: ['controlPath: control', 'errorTypes: errors'],
  template: `
    <span *ngIf="errorMessage !== null">{{errorMessage}}</span>
  `,
  directives: [NgIf]
})
class ShowError {
  formDir: any /** TODO #9100 */;
  controlPath: string;
  errorTypes: string[];

  constructor(@Host() formDir: NgFormModel) { this.formDir = formDir; }

  get errorMessage(): string {
    var form: ControlGroup = this.formDir.form;
    var control = form.find(this.controlPath);
    if (isPresent(control) && control.touched) {
      for (var i = 0; i < this.errorTypes.length; ++i) {
        if (control.hasError(this.errorTypes[i])) {
          return this._errorMessage(this.errorTypes[i]);
        }
      }
    }
    return null;
  }

  _errorMessage(code: string): string {
    var config = {'required': 'is required', 'invalidCreditCard': 'is invalid credit card number'};
    return (config as any /** TODO #9100 */)[code];
  }
}


@Component({
  selector: 'model-driven-forms',
  viewProviders: [FormBuilder],
  template: `
    <h1>Checkout Form (Model Driven)</h1>

    <form (ngSubmit)="onSubmit()" [ngFormModel]="form" #f="ngForm">
      <p>
        <label for="firstName">First Name</label>
        <input type="text" id="firstName" ngControl="firstName">
        <show-error control="firstName" [errors]="['required']"></show-error>
      </p>

      <p>
        <label for="middleName">Middle Name</label>
        <input type="text" id="middleName" ngControl="middleName">
      </p>

      <p>
        <label for="lastName">Last Name</label>
        <input type="text" id="lastName" ngControl="lastName">
        <show-error control="lastName" [errors]="['required']"></show-error>
      </p>

      <p>
        <label for="country">Country</label>
        <select id="country" ngControl="country">
          <option *ngFor="let c of countries" [value]="c">{{c}}</option>
        </select>
      </p>

      <p>
        <label for="creditCard">Credit Card</label>
        <input type="text" id="creditCard" ngControl="creditCard">
        <show-error control="creditCard" [errors]="['required', 'invalidCreditCard']"></show-error>
      </p>

      <p>
        <label for="amount">Amount</label>
        <input type="number" id="amount" ngControl="amount">
        <show-error control="amount" [errors]="['required']"></show-error>
      </p>

      <p>
        <label for="email">Email</label>
        <input type="email" id="email" ngControl="email">
        <show-error control="email" [errors]="['required']"></show-error>
      </p>

      <p>
        <label for="comments">Comments</label>
        <textarea id="comments" ngControl="comments">
        </textarea>
      </p>

      <button type="submit" [disabled]="!f.form.valid">Submit</button>
    </form>
  `,
  directives: [FORM_DIRECTIVES, NgFor, ShowError]
})
class ModelDrivenForms {
  form: any /** TODO #9100 */;
  countries = ['US', 'Canada'];

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      "firstName": ["", Validators.required],
      "middleName": [""],
      "lastName": ["", Validators.required],
      "country": ["Canada", Validators.required],
      "creditCard": ["", Validators.compose([Validators.required, creditCardValidator])],
      "amount": [0, Validators.required],
      "email": ["", Validators.required],
      "comments": [""]
    });
  }

  onSubmit(): void {
    print("Submitting:");
    print(this.form.value);
  }
}

export function main() {
  bootstrap(ModelDrivenForms);
}
