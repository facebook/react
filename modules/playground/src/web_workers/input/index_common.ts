import {Component} from '@angular/core';

@Component({
  selector: 'input-app',
  template: `
    <h2>Input App</h2>
    <div id="input-container">
      <input type="text" (input)="inputChanged($event)">
      <textarea (input)="textAreaChanged($event)"></textarea>
      <div class="input-val">Input val is {{inputVal}}.</div>
      <div class="textarea-val">Textarea val is {{textareaVal}}.</div>
    </div>
    <div id="ng-model-container">
    </div>
  `
})
export class InputCmp {
  inputVal = "";
  textareaVal = "";

  inputChanged(e: any /** TODO #9100 */) { this.inputVal = e.target.value; }

  textAreaChanged(e: any /** TODO #9100 */) { this.textareaVal = e.target.value; }
}
