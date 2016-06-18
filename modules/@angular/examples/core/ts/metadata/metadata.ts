import {Attribute, Component, Directive, Pipe} from '@angular/core';

var CustomDirective: Function;

// #docregion component
@Component({selector: 'greet', template: 'Hello {{name}}!', directives: [CustomDirective]})
class Greet {
  name: string = 'World';
}
// #enddocregion

// #docregion attributeFactory
@Component({selector: 'page', template: 'Title: {{title}}'})
class Page {
  title: string;
  constructor(@Attribute('title') title: string) { this.title = title; }
}
// #enddocregion

// #docregion attributeMetadata
@Directive({selector: 'input'})
class InputAttrDirective {
  constructor(@Attribute('type') type: string) {
    // type would be 'text' in this example
  }
}
// #enddocregion

// #docregion directive
@Directive({selector: 'input'})
class InputDirective {
  constructor() {
    // Add some logic.
  }
}
// #enddocregion

// #docregion pipe
@Pipe({name: 'lowercase'})
class Lowercase {
  transform(v: string, args: any[]) { return v.toLowerCase(); }
}
// #enddocregion
