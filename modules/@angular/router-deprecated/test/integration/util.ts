import {Location} from '@angular/common';
import {SpyLocation} from '@angular/common/testing';
import {ComponentFixture, TestComponentBuilder} from '@angular/compiler/testing';
import {Component, provide} from '@angular/core';
import {beforeEach, beforeEachProviders, ddescribe, describe, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {ROUTER_DIRECTIVES, ROUTER_PRIMARY_COMPONENT, Router} from '@angular/router-deprecated';
import {RouteRegistry} from '@angular/router-deprecated/src/route_registry';
import {RootRouter} from '@angular/router-deprecated/src/router';

import {BaseException} from '../../src/facade/exceptions';
import {isBlank} from '../../src/facade/lang';


/**
 * Router test helpers and fixtures
 */

@Component({
  selector: 'root-comp',
  template: `<router-outlet></router-outlet>`,
  directives: [ROUTER_DIRECTIVES]
})
export class RootCmp {
  name: string;
  activatedCmp: any;
}

export function compile(
    tcb: TestComponentBuilder,
    template: string = '<router-outlet></router-outlet>'): Promise<ComponentFixture<RootCmp>> {
  return tcb.overrideTemplate(RootCmp, ('<div>' + template + '</div>')).createAsync(RootCmp);
}

export var TEST_ROUTER_PROVIDERS: any[] = [
  RouteRegistry, {provide: Location, useClass: SpyLocation},
  {provide: ROUTER_PRIMARY_COMPONENT, useValue: RootCmp}, {provide: Router, useClass: RootRouter}
];

export function clickOnElement(anchorEl: any /** TODO #9100 */) {
  var dispatchedEvent = getDOM().createMouseEvent('click');
  getDOM().dispatchEvent(anchorEl, dispatchedEvent);
  return dispatchedEvent;
}

export function getHref(elt: any /** TODO #9100 */) {
  return getDOM().getAttribute(elt, 'href');
}


/**
 * Router integration suite DSL
 */

var specNameBuilder: any[] /** TODO #9100 */ = [];

// we add the specs themselves onto this map
export var specs = {};

export function describeRouter(description: string, fn: Function, exclusive = false): void {
  var specName = descriptionToSpecName(description);
  specNameBuilder.push(specName);
  if (exclusive) {
    ddescribe(description, fn);
  } else {
    describe(description, fn);
  }
  specNameBuilder.pop();
}

export function ddescribeRouter(description: string, fn: Function, exclusive = false): void {
  describeRouter(description, fn, true);
}

export function describeWithAndWithout(description: string, fn: Function): void {
  // the "without" case is usually simpler, so we opt to run this spec first
  describeWithout(description, fn);
  describeWith(description, fn);
}

export function describeWith(description: string, fn: Function): void {
  var specName = 'with ' + description;
  specNameBuilder.push(specName);
  describe(specName, fn);
  specNameBuilder.pop();
}

export function describeWithout(description: string, fn: Function): void {
  var specName = 'without ' + description;
  specNameBuilder.push(specName);
  describe(specName, fn);
  specNameBuilder.pop();
}

function descriptionToSpecName(description: string): string {
  return spaceCaseToCamelCase(description);
}

// this helper looks up the suite registered from the "impl" folder in this directory
export function itShouldRoute() {
  var specSuiteName = spaceCaseToCamelCase(specNameBuilder.join(' '));

  var spec = (specs as any /** TODO #9100 */)[specSuiteName];
  if (isBlank(spec)) {
    throw new BaseException(`Router integration spec suite "${specSuiteName}" was not found.`);
  } else {
    // todo: remove spec from map, throw if there are extra left over??
    spec();
  }
}

function spaceCaseToCamelCase(str: string): string {
  var words = str.split(' ');
  var first = words.shift();
  return first + words.map(title).join('');
}

function title(str: string): string {
  return str[0].toUpperCase() + str.substring(1);
}
