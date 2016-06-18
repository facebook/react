import {Component, Input, Output, EventEmitter} from '@angular/core';
import {UpgradeAdapter} from '@angular/upgrade';
import * as angular from '@angular/upgrade/src/angular_js';

var styles = [
  `
    .border {
      border: solid 2px DodgerBlue;
    }
    .title {
      background-color: LightSkyBlue;
      padding: .2em 1em;
      font-size: 1.2em;
    }
    .content {
      padding: 1em;
    }
  `
];

var adapter: UpgradeAdapter = new UpgradeAdapter();

var ng1module = angular.module('myExample', []);

ng1module.controller('Index', function($scope: any /** TODO #9100 */) { $scope.name = 'World'; });

ng1module.directive('user', function() {
  return {
    scope: {handle: '@', reset: '&'},
    template: `
      User: {{handle}}
      <hr>
      <button ng-click="reset()">clear</button>`
  };
});

@Component({
  selector: 'pane',
  template: `<div class="border">
    <div class="title">{{title}}</div>
    <div class="content"><ng-content></ng-content></div>
    </div>`,
  styles: styles
})
class Pane {
  @Input() title: string;
}


@Component({
  selector: 'upgrade-app',
  template: `<div class="border">
      <pane title="Title: {{user}}">
        <table cellpadding="3">
          <tr>
            <td><ng-content></ng-content></td>
            <td><user [handle]="user" (reset)="reset.emit()"></user></td>
          </tr>
        </table>
      </pane>
    </div>`,
  styles: styles,
  directives: [Pane, adapter.upgradeNg1Component('user')]
})
class UpgradeApp {
  @Input() user: string;
  @Output() reset = new EventEmitter();
  constructor() {}
}

ng1module.directive('upgradeApp', adapter.downgradeNg2Component(UpgradeApp));

export function main() {
  adapter.bootstrap(document.body, ['myExample']);
}
