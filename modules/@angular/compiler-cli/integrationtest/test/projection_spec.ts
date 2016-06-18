import {DebugElement, ReflectiveInjector, getDebugNode, lockRunMode} from '@angular/core';
import {BROWSER_APP_PROVIDERS, By, browserPlatform} from '@angular/platform-browser';

import {CompWithProjection} from '../src/projection';
import {MainCompNgFactory} from '../src/projection.ngfactory';

// Need to lock the mode explicitely as this test is not using Angular's testing framework.
lockRunMode();

describe('content projection', () => {
  it('should support basic content projection', () => {
    const appInjector =
        ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
    var mainComp = MainCompNgFactory.create(appInjector);

    var debugElement = <DebugElement>getDebugNode(mainComp.location.nativeElement);
    var compWithProjection = debugElement.query(By.directive(CompWithProjection));
    expect(compWithProjection.children.length).toBe(1);
    expect(compWithProjection.children[0].attributes['greeting']).toEqual('Hello world!');
  });
});
