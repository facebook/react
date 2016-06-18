// Only needed to satisfy the check in core/src/util/decorators.ts
// TODO(alexeagle): maybe remove that check?
require('reflect-metadata');

require('@angular/platform-server/src/parse5_adapter.js').Parse5DomAdapter.makeCurrent();
require('zone.js/dist/zone-node.js');
require('zone.js/dist/long-stack-trace-zone.js');

import * as fs from 'fs';
import * as path from 'path';
import {BasicNgFactory} from '../src/basic.ngfactory';
import {MyComp} from '../src/a/multiple_components';
import {ReflectiveInjector, DebugElement, getDebugNode, lockRunMode} from '@angular/core';
import {browserPlatform, BROWSER_APP_PROVIDERS} from '@angular/platform-browser';

// Need to lock the mode explicitely as this test is not using Angular's testing framework.
lockRunMode();

describe('template codegen output', () => {
  const outDir = 'src';

  it('should lower Decorators without reflect-metadata', () => {
    const jsOutput = path.join(outDir, 'basic.js');
    expect(fs.existsSync(jsOutput)).toBeTruthy();
    expect(fs.readFileSync(jsOutput, {encoding: 'utf-8'})).not.toContain('Reflect.decorate');
  });

  it('should produce metadata.json outputs', () => {
    const metadataOutput = path.join(outDir, 'basic.metadata.json');
    expect(fs.existsSync(metadataOutput)).toBeTruthy();
    const output = fs.readFileSync(metadataOutput, {encoding: 'utf-8'});
    expect(output).toContain('"decorators":');
    expect(output).toContain('"module":"@angular/core","name":"Component"');
  });

  it('should write .d.ts files', () => {
    const dtsOutput = path.join(outDir, 'basic.d.ts');
    expect(fs.existsSync(dtsOutput)).toBeTruthy();
    expect(fs.readFileSync(dtsOutput, {encoding: 'utf-8'})).toContain('Basic');
  });

  it('should be able to create the basic component', () => {
    const appInjector =
        ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
    var comp = BasicNgFactory.create(appInjector);
    expect(comp.instance).toBeTruthy();
  });

  it('should support ngIf', () => {
    const appInjector =
        ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
    var comp = BasicNgFactory.create(appInjector);
    var debugElement = <DebugElement>getDebugNode(comp.location.nativeElement);
    expect(debugElement.children.length).toBe(2);

    comp.instance.ctxBool = true;
    comp.changeDetectorRef.detectChanges();
    expect(debugElement.children.length).toBe(3);
    expect(debugElement.children[2].injector.get(MyComp)).toBeTruthy();
  });

  it('should support ngFor', () => {
    const appInjector =
        ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
    var comp = BasicNgFactory.create(appInjector);
    var debugElement = <DebugElement>getDebugNode(comp.location.nativeElement);
    expect(debugElement.children.length).toBe(2);

    // test NgFor
    comp.instance.ctxArr = [1, 2];
    comp.changeDetectorRef.detectChanges();
    expect(debugElement.children.length).toBe(4);
    expect(debugElement.children[2].attributes['value']).toBe('1');
    expect(debugElement.children[3].attributes['value']).toBe('2');
  });
});
