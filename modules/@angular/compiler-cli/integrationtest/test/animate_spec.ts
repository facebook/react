require('reflect-metadata');
require('@angular/platform-server/src/parse5_adapter.js').Parse5DomAdapter.makeCurrent();
require('zone.js/dist/zone-node.js');
require('zone.js/dist/long-stack-trace-zone.js');

import {AnimateCmpNgFactory} from '../src/animate.ngfactory';
import {ReflectiveInjector, DebugElement, getDebugNode, lockRunMode} from '@angular/core';
import {browserPlatform, BROWSER_APP_PROVIDERS} from '@angular/platform-browser';

// Need to lock the mode explicitely as this test is not using Angular's testing framework.
lockRunMode();

describe('template codegen output', () => {
  function findTargetElement(elm: DebugElement): DebugElement {
    // the open-close-container is a child of the main container
    // if the template changes then please update the location below
    return elm.children[4];
  }

  it('should apply the animate states to the element', (done) => {
    const appInjector =
        ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
    var comp = AnimateCmpNgFactory.create(appInjector);
    var debugElement = <DebugElement>getDebugNode(comp.location.nativeElement);

    var targetDebugElement = findTargetElement(<DebugElement>debugElement);

    comp.instance.setAsOpen();
    comp.changeDetectorRef.detectChanges();

    setTimeout(() => {
      expect(targetDebugElement.styles['height']).toEqual(null);
      expect(targetDebugElement.styles['borderColor']).toEqual('green');
      expect(targetDebugElement.styles['color']).toEqual('green');

      comp.instance.setAsClosed();
      comp.changeDetectorRef.detectChanges();

      setTimeout(() => {
        expect(targetDebugElement.styles['height']).toEqual('0px');
        expect(targetDebugElement.styles['borderColor']).toEqual('maroon');
        expect(targetDebugElement.styles['color']).toEqual('maroon');
        done();
      }, 0);
    }, 0);
  });

  it('should apply the default animate state to the element', (done) => {
    const appInjector =
        ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
    var comp = AnimateCmpNgFactory.create(appInjector);
    var debugElement = <DebugElement>getDebugNode(comp.location.nativeElement);

    var targetDebugElement = findTargetElement(<DebugElement>debugElement);

    comp.instance.setAsSomethingElse();
    comp.changeDetectorRef.detectChanges();

    setTimeout(() => {
      expect(targetDebugElement.styles['height']).toEqual(null);
      expect(targetDebugElement.styles['borderColor']).toEqual('black');
      expect(targetDebugElement.styles['color']).toEqual('black');

      comp.instance.setAsClosed();
      comp.changeDetectorRef.detectChanges();

      setTimeout(() => {
        expect(targetDebugElement.styles['height']).not.toEqual(null);
        expect(targetDebugElement.styles['borderColor']).not.toEqual('grey');
        expect(targetDebugElement.styles['color']).not.toEqual('grey');
        done();
      }, 0);
    }, 0);
  });
});
