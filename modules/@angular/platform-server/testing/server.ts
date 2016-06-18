import {MockLocationStrategy} from '@angular/common/testing';
import {COMPILER_PROVIDERS, DirectiveResolver, ViewResolver, XHR} from '@angular/compiler';
import {MockDirectiveResolver, MockViewResolver, TestComponentBuilder, TestComponentRenderer} from '@angular/compiler/testing';
import {APPLICATION_COMMON_PROVIDERS, APP_ID, NgZone, PLATFORM_COMMON_PROVIDERS, PLATFORM_INITIALIZER, RootRenderer} from '@angular/core';
import {BrowserDetection} from '@angular/platform-browser/testing';

import {AnimationDriver, NoOpAnimationDriver} from '../core_private';
import {DOMTestComponentRenderer} from '../platform_browser_dynamic_testing_private';
import {Parse5DomAdapter} from '../src/parse5_adapter';

import {DOCUMENT, BROWSER_SANITIZATION_PROVIDERS, EventManager, EVENT_MANAGER_PLUGINS, ELEMENT_PROBE_PROVIDERS, DomEventsPlugin,} from '@angular/platform-browser';
import {getDOM, DomRootRenderer, DomRootRenderer_, DomSharedStylesHost, SharedStylesHost} from '../platform_browser_private';
import {LocationStrategy} from '@angular/common';
import {Log} from '@angular/core/testing';

function initServerTests() {
  Parse5DomAdapter.makeCurrent();
  BrowserDetection.setup();
}

/**
 * Default platform providers for testing.
 */
export const TEST_SERVER_PLATFORM_PROVIDERS: Array<any /*Type | Provider | any[]*/> =
    /*@ts2dart_const*/[
      PLATFORM_COMMON_PROVIDERS,
      /*@ts2dart_Provider*/ {
        provide: PLATFORM_INITIALIZER,
        useValue: initServerTests,
        multi: true
      }
    ];

function appDoc() {
  try {
    return getDOM().defaultDoc();
  } catch (e) {
    return null;
  }
}


function createNgZone(): NgZone {
  return new NgZone({enableLongStackTrace: true});
}


/**
 * Default application providers for testing.
 */
export const TEST_SERVER_APPLICATION_PROVIDERS: Array<any /*Type | Provider | any[]*/> =
    /*@ts2dart_const*/[
      // TODO(julie: when angular2/platform/server is available, use that instead of making our own
      // list here.
      APPLICATION_COMMON_PROVIDERS, COMPILER_PROVIDERS, BROWSER_SANITIZATION_PROVIDERS,
      /* @ts2dart_Provider */ {provide: DOCUMENT, useFactory: appDoc},
      /* @ts2dart_Provider */ {provide: DomRootRenderer, useClass: DomRootRenderer_},
      /* @ts2dart_Provider */ {provide: RootRenderer, useExisting: DomRootRenderer},
      /* @ts2dart_Provider */ {provide: AnimationDriver, useClass: NoOpAnimationDriver},
      EventManager,
      /* @ts2dart_Provider */ {
        provide: EVENT_MANAGER_PLUGINS,
        useClass: DomEventsPlugin,
        multi: true
      },
      /* @ts2dart_Provider */ {provide: XHR, useClass: XHR},
      /* @ts2dart_Provider */ {provide: APP_ID, useValue: 'a'},
      /* @ts2dart_Provider */ {provide: SharedStylesHost, useExisting: DomSharedStylesHost},
      DomSharedStylesHost, ELEMENT_PROBE_PROVIDERS,
      /* @ts2dart_Provider */ {provide: DirectiveResolver, useClass: MockDirectiveResolver},
      /* @ts2dart_Provider */ {provide: ViewResolver, useClass: MockViewResolver}, Log,
      /* @ts2dart_Provider */ {provide: TestComponentRenderer, useClass: DOMTestComponentRenderer},
      TestComponentBuilder,
      /* @ts2dart_Provider */ {provide: NgZone, useFactory: createNgZone},
      /* @ts2dart_Provider */ {provide: LocationStrategy, useClass: MockLocationStrategy}
    ];
