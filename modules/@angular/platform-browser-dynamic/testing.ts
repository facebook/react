import {DirectiveResolver, ViewResolver} from '@angular/compiler';
import {MockDirectiveResolver, MockViewResolver, TestComponentBuilder, TestComponentRenderer} from '@angular/compiler/testing';
import {TEST_BROWSER_APPLICATION_PROVIDERS, TEST_BROWSER_PLATFORM_PROVIDERS} from '@angular/platform-browser/testing';

import {BROWSER_APP_COMPILER_PROVIDERS} from './index';
import {DOMTestComponentRenderer} from './testing/dom_test_component_renderer';

export * from './private_export_testing'

/**
 * Default platform providers for testing.
 */
export const TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS: Array<any /*Type | Provider | any[]*/> =
    [TEST_BROWSER_PLATFORM_PROVIDERS];

/**
 * Default application providers for testing.
 */
export const TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS: Array<any /*Type | Provider | any[]*/> = [
  TEST_BROWSER_APPLICATION_PROVIDERS, BROWSER_APP_COMPILER_PROVIDERS,
  [
    {provide: DirectiveResolver, useClass: MockDirectiveResolver},
    {provide: ViewResolver, useClass: MockViewResolver},
    TestComponentBuilder,
    {provide: TestComponentRenderer, useClass: DOMTestComponentRenderer},
  ]
];
