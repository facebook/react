import {Component} from '@angular/core';

@Component({selector: 'comp-with-proj', template: '<ng-content></ng-content>'})
export class CompWithProjection {
}

@Component({
  selector: 'main',
  template: '<comp-with-proj><span greeting="Hello world!"></span></comp-with-proj>',
  directives: [CompWithProjection]
})
export class MainComp {
}
