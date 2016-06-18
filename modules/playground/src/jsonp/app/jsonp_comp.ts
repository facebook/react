import {Component} from '@angular/core';
import {Jsonp} from '@angular/http';

@Component({
  selector: 'jsonp-app',
  template: `
    <h1>people</h1>
    <ul class="people">
      <li *ngFor="let person of people">
        hello, {{person['name']}}
      </li>
    </ul>
  `
})
export class JsonpCmp {
  people: Object;
  constructor(jsonp: Jsonp) {
    jsonp.get('./people.json?callback=JSONP_CALLBACK').subscribe(res => this.people = res.json());
  }
}
