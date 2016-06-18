import {LIFECYCLE_HOOKS_VALUES} from '@angular/core/src/metadata/lifecycle_hooks';
import {afterEach, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';

import {IS_DART, stringify} from '../src/facade/lang';
import {CompileMetadataResolver} from '../src/metadata_resolver';

import {Component, Directive, ViewEncapsulation, ChangeDetectionStrategy, OnChanges, OnInit, DoCheck, OnDestroy, AfterContentInit, AfterContentChecked, AfterViewInit, AfterViewChecked, SimpleChanges,} from '@angular/core';

import {TEST_PROVIDERS} from './test_bindings';
import {CompilerConfig} from '@angular/compiler/src/config';
import {MalformedStylesComponent} from './metadata_resolver_fixture';

export function main() {
  describe('CompileMetadataResolver', () => {
    beforeEachProviders(() => TEST_PROVIDERS);

    describe('getMetadata', () => {
      it('should read metadata',
         inject([CompileMetadataResolver], (resolver: CompileMetadataResolver) => {
           var meta = resolver.getDirectiveMetadata(ComponentWithEverything);
           expect(meta.selector).toEqual('someSelector');
           expect(meta.exportAs).toEqual('someExportAs');
           expect(meta.isComponent).toBe(true);
           expect(meta.type.runtime).toBe(ComponentWithEverything);
           expect(meta.type.name).toEqual(stringify(ComponentWithEverything));
           expect(meta.lifecycleHooks).toEqual(LIFECYCLE_HOOKS_VALUES);
           expect(meta.changeDetection).toBe(ChangeDetectionStrategy.CheckAlways);
           expect(meta.inputs).toEqual({'someProp': 'someProp'});
           expect(meta.outputs).toEqual({'someEvent': 'someEvent'});
           expect(meta.hostListeners).toEqual({'someHostListener': 'someHostListenerExpr'});
           expect(meta.hostProperties).toEqual({'someHostProp': 'someHostPropExpr'});
           expect(meta.hostAttributes).toEqual({'someHostAttr': 'someHostAttrValue'});
           expect(meta.template.encapsulation).toBe(ViewEncapsulation.Emulated);
           expect(meta.template.styles).toEqual(['someStyle']);
           expect(meta.template.styleUrls).toEqual(['someStyleUrl']);
           expect(meta.template.template).toEqual('someTemplate');
           expect(meta.template.templateUrl).toEqual('someTemplateUrl');
         }));

      it('should use the moduleUrl from the reflector if none is given',
         inject([CompileMetadataResolver], (resolver: CompileMetadataResolver) => {
           var value: string =
               resolver.getDirectiveMetadata(ComponentWithoutModuleId).type.moduleUrl;
           var expectedEndValue =
               IS_DART ? 'test/compiler/metadata_resolver_spec.dart' : './ComponentWithoutModuleId';
           expect(value.endsWith(expectedEndValue)).toBe(true);
         }));

      it('should throw when metadata is incorrectly typed',
         inject([CompileMetadataResolver], (resolver: CompileMetadataResolver) => {
           if (!IS_DART) {
             expect(() => resolver.getDirectiveMetadata(MalformedStylesComponent))
                 .toThrowError(`Expected 'styles' to be an array of strings.`);
           }
         }));

      it('should throw with descriptive error message when provider token can not be resolved',
         inject([CompileMetadataResolver], (resolver: CompileMetadataResolver) => {
           if (!IS_DART) {
             expect(() => resolver.getDirectiveMetadata(MyBrokenComp1))
                 .toThrowError(`Can't resolve all parameters for MyBrokenComp1: (?).`);
           }
         }));
    });

    describe('getViewDirectivesMetadata', () => {

      it('should return the directive metadatas',
         inject([CompileMetadataResolver], (resolver: CompileMetadataResolver) => {
           expect(resolver.getViewDirectivesMetadata(ComponentWithEverything))
               .toContain(resolver.getDirectiveMetadata(SomeDirective));
         }));

      describe('platform directives', () => {
        beforeEachProviders(() => [{
                              provide: CompilerConfig,
                              useValue: new CompilerConfig(
                                  {genDebugInfo: true, platformDirectives: [ADirective]})
                            }]);

        it('should include platform directives when available',
           inject([CompileMetadataResolver], (resolver: CompileMetadataResolver) => {
             expect(resolver.getViewDirectivesMetadata(ComponentWithEverything))
                 .toContain(resolver.getDirectiveMetadata(ADirective));
             expect(resolver.getViewDirectivesMetadata(ComponentWithEverything))
                 .toContain(resolver.getDirectiveMetadata(SomeDirective));
           }));
      });
    });

  });
}

@Directive({selector: 'a-directive'})
class ADirective {
}

@Directive({selector: 'someSelector'})
class SomeDirective {
}

@Component({selector: 'someComponent', template: ''})
class ComponentWithoutModuleId {
}

@Component({
  selector: 'someSelector',
  inputs: ['someProp'],
  outputs: ['someEvent'],
  host: {
    '[someHostProp]': 'someHostPropExpr',
    '(someHostListener)': 'someHostListenerExpr',
    'someHostAttr': 'someHostAttrValue'
  },
  exportAs: 'someExportAs',
  moduleId: 'someModuleId',
  changeDetection: ChangeDetectionStrategy.CheckAlways,
  template: 'someTemplate',
  templateUrl: 'someTemplateUrl',
  encapsulation: ViewEncapsulation.Emulated,
  styles: ['someStyle'],
  styleUrls: ['someStyleUrl'],
  directives: [SomeDirective]
})
class ComponentWithEverything implements OnChanges,
    OnInit, DoCheck, OnDestroy, AfterContentInit, AfterContentChecked, AfterViewInit,
    AfterViewChecked {
  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {}
  ngDoCheck(): void {}
  ngOnDestroy(): void {}
  ngAfterContentInit(): void {}
  ngAfterContentChecked(): void {}
  ngAfterViewInit(): void {}
  ngAfterViewChecked(): void {}
}

@Component({selector: 'my-broken-comp', template: ''})
class MyBrokenComp1 {
  constructor(public dependency: any) {}
}
