import {bootstrap} from '@angular/platform-browser';
import {Component, Directive, DynamicComponentLoader, ViewContainerRef} from '@angular/core';
import {NgIf, NgFor} from '@angular/common';
import {ApplicationRef} from '@angular/core/src/application_ref';
import {ListWrapper} from '@angular/facade';
import {getIntParameter, bindAction} from '@angular/testing/src/benchmark_util';

var testList = null;

export function main() {
  var size = getIntParameter('size');
  testList = ListWrapper.createFixedSize(size);

  bootstrap(AppComponent)
      .then((ref) => {
        var injector = ref.injector;
        var app: AppComponent = ref.instance;
        var appRef = injector.get(ApplicationRef);

        bindAction('#reset', function() {
          app.reset();
          appRef.tick();
        });

        // Baseline (plain components)
        bindAction('#createPlainComponents', function() {
          app.createPlainComponents();
          appRef.tick();
        });

        // Components with decorators
        bindAction('#createComponentsWithDirectives', function() {
          app.createComponentsWithDirectives();
          appRef.tick();
        });

        // Components with decorators
        bindAction('#createDynamicComponents', function() {
          app.createDynamicComponents();
          appRef.tick();
        });
      });
}


@Component({selector: 'dummy', template: `<div></div>`})
class DummyComponent {
}

@Directive({selector: '[dummy-decorator]'})
class DummyDirective {
}

@Directive({selector: 'dynamic-dummy'})
class DynamicDummy {
  constructor(loader: DynamicComponentLoader, location: ViewContainerRef) {
    loader.loadNextToLocation(DummyComponent, location);
  }
}

@Component({
  selector: 'app',
  directives: [NgIf, NgFor, DummyComponent, DummyDirective, DynamicDummy],
  template: `
    <div *ngIf="testingPlainComponents">
      <dummy *ngFor="let i of list"></dummy>
    </div>

    <div *ngIf="testingWithDirectives">
      <dummy dummy-decorator *ngFor="let i of list"></dummy>
    </div>

    <div *ngIf="testingDynamicComponents">
      <dynamic-dummy *ngFor="let i of list"></dynamic-dummy>
    </div>
  `
})
class AppComponent {
  list: any[];
  testingPlainComponents: boolean;
  testingWithDirectives: boolean;
  testingDynamicComponents: boolean;

  constructor() { this.reset(); }

  reset(): void {
    this.list = [];
    this.testingPlainComponents = false;
    this.testingWithDirectives = false;
    this.testingDynamicComponents = false;
  }

  createPlainComponents(): void {
    this.list = testList;
    this.testingPlainComponents = true;
  }

  createComponentsWithDirectives(): void {
    this.list = testList;
    this.testingWithDirectives = true;
  }

  createDynamicComponents(): void {
    this.list = testList;
    this.testingDynamicComponents = true;
  }
}
