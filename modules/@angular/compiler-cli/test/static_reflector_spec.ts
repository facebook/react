import {StaticReflector, StaticReflectorHost, StaticSymbol} from '@angular/compiler-cli/src/static_reflector';
import {animate, group, keyframes, sequence, state, style, transition, trigger} from '@angular/core';
import {beforeEach, ddescribe, describe, expect, iit, it} from '@angular/core/testing/testing_internal';
import {ListWrapper} from '@angular/facade/src/collection';
import {isBlank} from '@angular/facade/src/lang';
import {MetadataCollector} from '@angular/tsc-wrapped';
import * as ts from 'typescript';


// This matches .ts files but not .d.ts files.
const TS_EXT = /(^.|(?!\.d)..)\.ts$/;

describe('StaticReflector', () => {
  let noContext = new StaticSymbol('', '');
  let host: StaticReflectorHost;
  let reflector: StaticReflector;

  beforeEach(() => {
    host = new MockReflectorHost();
    reflector = new StaticReflector(host);
  });

  function simplify(context: StaticSymbol, value: any) {
    return reflector.simplify(context, value);
  }

  it('should get annotations for NgFor', () => {
    let NgFor = host.findDeclaration('angular2/src/common/directives/ng_for', 'NgFor');
    let annotations = reflector.annotations(NgFor);
    expect(annotations.length).toEqual(1);
    let annotation = annotations[0];
    expect(annotation.selector).toEqual('[ngFor][ngForOf]');
    expect(annotation.inputs).toEqual(['ngForTrackBy', 'ngForOf', 'ngForTemplate']);
  });

  it('should get constructor for NgFor', () => {
    let NgFor = host.findDeclaration('angular2/src/common/directives/ng_for', 'NgFor');
    let ViewContainerRef =
        host.findDeclaration('angular2/src/core/linker/view_container_ref', 'ViewContainerRef');
    let TemplateRef = host.findDeclaration('angular2/src/core/linker/template_ref', 'TemplateRef');
    let IterableDiffers = host.findDeclaration(
        'angular2/src/core/change_detection/differs/iterable_differs', 'IterableDiffers');
    let ChangeDetectorRef = host.findDeclaration(
        'angular2/src/core/change_detection/change_detector_ref', 'ChangeDetectorRef');

    let parameters = reflector.parameters(NgFor);
    expect(parameters).toEqual([
      [ViewContainerRef], [TemplateRef], [IterableDiffers], [ChangeDetectorRef]
    ]);
  });

  it('should get annotations for HeroDetailComponent', () => {
    let HeroDetailComponent =
        host.findDeclaration('src/app/hero-detail.component', 'HeroDetailComponent');
    let annotations = reflector.annotations(HeroDetailComponent);
    expect(annotations.length).toEqual(1);
    let annotation = annotations[0];
    expect(annotation.selector).toEqual('my-hero-detail');
    expect(annotation.directives).toEqual([[host.findDeclaration(
        'angular2/src/common/directives/ng_for', 'NgFor')]]);
    expect(annotation.animations).toEqual([trigger('myAnimation', [
      state('state1', style({'background': 'white'})),
      transition(
          '* => *',
          sequence([group([animate(
              '1s 0.5s',
              keyframes([style({'background': 'blue'}), style({'background': 'red'})]))])]))
    ])]);
  });

  it('should throw and exception for unsupported metadata versions', () => {
    let e = host.findDeclaration('src/version-error', 'e');
    expect(() => reflector.annotations(e))
        .toThrow(new Error(
            'Metadata version mismatch for module /tmp/src/version-error.d.ts, found version 100, expected 1'));
  });

  it('should get and empty annotation list for an unknown class', () => {
    let UnknownClass = host.findDeclaration('src/app/app.component', 'UnknownClass');
    let annotations = reflector.annotations(UnknownClass);
    expect(annotations).toEqual([]);
  });

  it('should get propMetadata for HeroDetailComponent', () => {
    let HeroDetailComponent =
        host.findDeclaration('src/app/hero-detail.component', 'HeroDetailComponent');
    let props = reflector.propMetadata(HeroDetailComponent);
    expect(props['hero']).toBeTruthy();
  });

  it('should get an empty object from propMetadata for an unknown class', () => {
    let UnknownClass = host.findDeclaration('src/app/app.component', 'UnknownClass');
    let properties = reflector.propMetadata(UnknownClass);
    expect(properties).toEqual({});
  });

  it('should get empty parameters list for an unknown class ', () => {
    let UnknownClass = host.findDeclaration('src/app/app.component', 'UnknownClass');
    let parameters = reflector.parameters(UnknownClass);
    expect(parameters).toEqual([]);
  });

  it('should provide context for errors reported by the collector', () => {
    let SomeClass = host.findDeclaration('src/error-reporting', 'SomeClass');
    expect(() => reflector.annotations(SomeClass))
        .toThrow(new Error(
            'Error encountered resolving symbol values statically. A reasonable error message (position 12:33 in the original .ts file), resolving symbol ErrorSym in /tmp/src/error-references.d.ts, resolving symbol Link2 in /tmp/src/error-references.d.ts, resolving symbol Link1 in /tmp/src/error-references.d.ts, resolving symbol SomeClass in /tmp/src/error-reporting.d.ts, resolving symbol SomeClass in /tmp/src/error-reporting.d.ts'));
  });

  it('should simplify primitive into itself', () => {
    expect(simplify(noContext, 1)).toBe(1);
    expect(simplify(noContext, true)).toBe(true);
    expect(simplify(noContext, 'some value')).toBe('some value');
  });

  it('should simplify an array into a copy of the array', () => {
    expect(simplify(noContext, [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('should simplify an object to a copy of the object', () => {
    let expr = {a: 1, b: 2, c: 3};
    expect(simplify(noContext, expr)).toEqual(expr);
  });

  it('should simplify &&', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '&&', left: true, right: true})))
        .toBe(true);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '&&', left: true, right: false})))
        .toBe(false);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '&&', left: false, right: true})))
        .toBe(false);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '&&', left: false, right: false})))
        .toBe(false);
  });

  it('should simplify ||', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '||', left: true, right: true})))
        .toBe(true);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '||', left: true, right: false})))
        .toBe(true);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '||', left: false, right: true})))
        .toBe(true);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '||', left: false, right: false})))
        .toBe(false);
  });

  it('should simplify &', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '&', left: 0x22, right: 0x0F})))
        .toBe(0x22 & 0x0F);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '&', left: 0x22, right: 0xF0})))
        .toBe(0x22 & 0xF0);
  });

  it('should simplify |', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '|', left: 0x22, right: 0x0F})))
        .toBe(0x22 | 0x0F);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '|', left: 0x22, right: 0xF0})))
        .toBe(0x22 | 0xF0);
  });

  it('should simplify ^', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '|', left: 0x22, right: 0x0F})))
        .toBe(0x22 | 0x0F);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '|', left: 0x22, right: 0xF0})))
        .toBe(0x22 | 0xF0);
  });

  it('should simplify ==', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '==', left: 0x22, right: 0x22})))
        .toBe(0x22 == 0x22);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '==', left: 0x22, right: 0xF0})))
        .toBe(0x22 == 0xF0);
  });

  it('should simplify !=', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '!=', left: 0x22, right: 0x22})))
        .toBe(0x22 != 0x22);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '!=', left: 0x22, right: 0xF0})))
        .toBe(0x22 != 0xF0);
  });

  it('should simplify ===', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '===', left: 0x22, right: 0x22})))
        .toBe(0x22 === 0x22);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '===', left: 0x22, right: 0xF0})))
        .toBe(0x22 === 0xF0);
  });

  it('should simplify !==', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '!==', left: 0x22, right: 0x22})))
        .toBe(0x22 !== 0x22);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '!==', left: 0x22, right: 0xF0})))
        .toBe(0x22 !== 0xF0);
  });

  it('should simplify >', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '>', left: 1, right: 1})))
        .toBe(1 > 1);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '>', left: 1, right: 0})))
        .toBe(1 > 0);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '>', left: 0, right: 1})))
        .toBe(0 > 1);
  });

  it('should simplify >=', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '>=', left: 1, right: 1})))
        .toBe(1 >= 1);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '>=', left: 1, right: 0})))
        .toBe(1 >= 0);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '>=', left: 0, right: 1})))
        .toBe(0 >= 1);
  });

  it('should simplify <=', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '<=', left: 1, right: 1})))
        .toBe(1 <= 1);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '<=', left: 1, right: 0})))
        .toBe(1 <= 0);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '<=', left: 0, right: 1})))
        .toBe(0 <= 1);
  });

  it('should simplify <', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '<', left: 1, right: 1})))
        .toBe(1 < 1);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '<', left: 1, right: 0})))
        .toBe(1 < 0);
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '<', left: 0, right: 1})))
        .toBe(0 < 1);
  });

  it('should simplify <<', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '<<', left: 0x55, right: 2})))
        .toBe(0x55 << 2);
  });

  it('should simplify >>', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '>>', left: 0x55, right: 2})))
        .toBe(0x55 >> 2);
  });

  it('should simplify +', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '+', left: 0x55, right: 2})))
        .toBe(0x55 + 2);
  });

  it('should simplify -', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '-', left: 0x55, right: 2})))
        .toBe(0x55 - 2);
  });

  it('should simplify *', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '*', left: 0x55, right: 2})))
        .toBe(0x55 * 2);
  });

  it('should simplify /', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '/', left: 0x55, right: 2})))
        .toBe(0x55 / 2);
  });

  it('should simplify %', () => {
    expect(simplify(noContext, ({__symbolic: 'binop', operator: '%', left: 0x55, right: 2})))
        .toBe(0x55 % 2);
  });

  it('should simplify prefix -', () => {
    expect(simplify(noContext, ({__symbolic: 'pre', operator: '-', operand: 2}))).toBe(-2);
  });

  it('should simplify prefix ~', () => {
    expect(simplify(noContext, ({__symbolic: 'pre', operator: '~', operand: 2}))).toBe(~2);
  });

  it('should simplify prefix !', () => {
    expect(simplify(noContext, ({__symbolic: 'pre', operator: '!', operand: true}))).toBe(!true);
    expect(simplify(noContext, ({__symbolic: 'pre', operator: '!', operand: false}))).toBe(!false);
  });

  it('should simplify an array index', () => {
    expect(simplify(noContext, ({__symbolic: 'index', expression: [1, 2, 3], index: 2}))).toBe(3);
  });

  it('should simplify an object index', () => {
    let expr = {__symbolic: 'select', expression: {a: 1, b: 2, c: 3}, member: 'b'};
    expect(simplify(noContext, expr)).toBe(2);
  });

  it('should simplify a module reference', () => {
    expect(simplify(
               new StaticSymbol('/src/cases', ''),
               ({__symbolic: 'reference', module: './extern', name: 's'})))
        .toEqual('s');
  });

  it('should simplify a non existing reference as a static symbol', () => {
    expect(simplify(
               new StaticSymbol('/src/cases', ''),
               ({__symbolic: 'reference', module: './extern', name: 'nonExisting'})))
        .toEqual(host.getStaticSymbol('/src/extern.d.ts', 'nonExisting'));
  });

  it('should simplify values initialized with a function call', () => {
    expect(simplify(new StaticSymbol('/tmp/src/function-reference.ts', ''), {
      __symbolic: 'reference',
      name: 'one'
    })).toEqual(['some-value']);
    expect(simplify(new StaticSymbol('/tmp/src/function-reference.ts', ''), {
      __symbolic: 'reference',
      name: 'two'
    })).toEqual(2);
  });

  it('should error on direct recursive calls', () => {
    expect(
        () => simplify(
            new StaticSymbol('/tmp/src/function-reference.ts', ''),
            {__symbolic: 'reference', name: 'recursion'}))
        .toThrow(new Error(
            'Recursion not supported, resolving symbol recursion in /tmp/src/function-reference.ts, resolving symbol  in /tmp/src/function-reference.ts'));
  });

  it('should error on indirect recursive calls', () => {
    expect(
        () => simplify(
            new StaticSymbol('/tmp/src/function-reference.ts', ''),
            {__symbolic: 'reference', name: 'indirectRecursion'}))
        .toThrow(new Error(
            'Recursion not supported, resolving symbol indirectRecursion in /tmp/src/function-reference.ts, resolving symbol  in /tmp/src/function-reference.ts'));
  });

  it('should simplify a spread expression', () => {
    expect(simplify(new StaticSymbol('/tmp/src/spread.ts', ''), {
      __symbolic: 'reference',
      name: 'spread'
    })).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should be able to get metadata from a ts file', () => {
    let metadata = reflector.getModuleMetadata('/tmp/src/custom-decorator-reference.ts');
    expect(metadata).toEqual({
      __symbolic: 'module',
      version: 1,
      metadata: {
        Foo: {
          __symbolic: 'class',
          decorators: [{
            __symbolic: 'call',
            expression:
                {__symbolic: 'reference', module: './custom-decorator', name: 'CustomDecorator'}
          }],
          members: {
            foo: [{
              __symbolic: 'property',
              decorators: [{
                __symbolic: 'call',
                expression: {
                  __symbolic: 'reference',
                  module: './custom-decorator',
                  name: 'CustomDecorator'
                }
              }]
            }]
          }
        }
      }
    });
  });

  it('should be able to get metadata for a class containing a custom decorator', () => {
    let props = reflector.propMetadata(
        host.getStaticSymbol('/tmp/src/custom-decorator-reference.ts', 'Foo'));
    expect(props).toEqual({foo: []});
  });

  it('should report an error for invalid function calls', () => {
    expect(
        () =>
            reflector.annotations(host.getStaticSymbol('/tmp/src/invalid-calls.ts', 'MyComponent')))
        .toThrow(new Error(
            `Error encountered resolving symbol values statically. Calling function 'someFunction', function calls are not supported. Consider replacing the function or lambda with a reference to an exported function, resolving symbol MyComponent in /tmp/src/invalid-calls.ts, resolving symbol MyComponent in /tmp/src/invalid-calls.ts`));
  });
});

class MockReflectorHost implements StaticReflectorHost {
  private staticTypeCache = new Map<string, StaticSymbol>();
  private collector = new MetadataCollector();

  constructor() {}

  angularImportLocations() {
    return {
      coreDecorators: 'angular2/src/core/metadata',
      diDecorators: 'angular2/src/core/di/decorators',
      diMetadata: 'angular2/src/core/di/metadata',
      diOpaqueToken: 'angular2/src/core/di/opaque_token',
      animationMetadata: 'angular2/src/core/animation/metadata',
      provider: 'angular2/src/core/di/provider'
    };
  }
  getStaticSymbol(declarationFile: string, name: string): StaticSymbol {
    var cacheKey = `${declarationFile}:${name}`;
    var result = this.staticTypeCache.get(cacheKey);
    if (isBlank(result)) {
      result = new StaticSymbol(declarationFile, name);
      this.staticTypeCache.set(cacheKey, result);
    }
    return result;
  }

  // In tests, assume that symbols are not re-exported
  findDeclaration(modulePath: string, symbolName: string, containingFile?: string): StaticSymbol {
    function splitPath(path: string): string[] { return path.split(/\/|\\/g); }

    function resolvePath(pathParts: string[]): string {
      let result: string[] = [];
      ListWrapper.forEachWithIndex(pathParts, (part, index) => {
        switch (part) {
          case '':
          case '.':
            if (index > 0) return;
            break;
          case '..':
            if (index > 0 && result.length != 0) result.pop();
            return;
        }
        result.push(part);
      });
      return result.join('/');
    }

    function pathTo(from: string, to: string): string {
      let result = to;
      if (to.startsWith('.')) {
        let fromParts = splitPath(from);
        fromParts.pop();  // remove the file name.
        let toParts = splitPath(to);
        result = resolvePath(fromParts.concat(toParts));
      }
      return result;
    }

    if (modulePath.indexOf('.') === 0) {
      return this.getStaticSymbol(pathTo(containingFile, modulePath) + '.d.ts', symbolName);
    }
    return this.getStaticSymbol('/tmp/' + modulePath + '.d.ts', symbolName);
  }

  getMetadataFor(moduleId: string): any {
    let data: {[key: string]: any} = {
      '/tmp/angular2/src/common/forms-deprecated/directives.d.ts': [{
        '__symbolic': 'module',
        'version': 1,
        'metadata': {
          'FORM_DIRECTIVES': [
            {
              '__symbolic': 'reference',
              'name': 'NgFor',
              'module': 'angular2/src/common/directives/ng_for'
            }
          ]
        }
      }],
      '/tmp/angular2/src/common/directives/ng_for.d.ts': {
        '__symbolic': 'module',
        'version': 1,
        'metadata': {
          'NgFor': {
            '__symbolic': 'class',
            'decorators': [
              {
                '__symbolic': 'call',
                'expression': {
                  '__symbolic': 'reference',
                  'name': 'Directive',
                  'module': '../../core/metadata'
                },
                'arguments': [
                  {
                    'selector': '[ngFor][ngForOf]',
                    'inputs': ['ngForTrackBy', 'ngForOf', 'ngForTemplate']
                  }
                ]
              }
            ],
            'members': {
              '__ctor__': [
                {
                  '__symbolic': 'constructor',
                  'parameters': [
                    {
                      '__symbolic': 'reference',
                      'module': '../../core/linker/view_container_ref',
                      'name': 'ViewContainerRef'
                    },
                    {
                      '__symbolic': 'reference',
                      'module': '../../core/linker/template_ref',
                      'name': 'TemplateRef'
                    },
                    {
                      '__symbolic': 'reference',
                      'module': '../../core/change_detection/differs/iterable_differs',
                      'name': 'IterableDiffers'
                    },
                    {
                      '__symbolic': 'reference',
                      'module': '../../core/change_detection/change_detector_ref',
                      'name': 'ChangeDetectorRef'
                    }
                  ]
                }
              ]
            }
          }
        }
      },
      '/tmp/angular2/src/core/linker/view_container_ref.d.ts':
          {version: 1, 'metadata': {'ViewContainerRef': {'__symbolic': 'class'}}},
      '/tmp/angular2/src/core/linker/template_ref.d.ts':
          {version: 1, 'module': './template_ref', 'metadata': {'TemplateRef': {'__symbolic': 'class'}}},
      '/tmp/angular2/src/core/change_detection/differs/iterable_differs.d.ts':
          {version: 1, 'metadata': {'IterableDiffers': {'__symbolic': 'class'}}},
      '/tmp/angular2/src/core/change_detection/change_detector_ref.d.ts':
          {version: 1, 'metadata': {'ChangeDetectorRef': {'__symbolic': 'class'}}},
      '/tmp/src/app/hero-detail.component.d.ts': {
        '__symbolic': 'module',
        'version': 1,
        'metadata': {
          'HeroDetailComponent': {
            '__symbolic': 'class',
            'decorators': [
              {
                '__symbolic': 'call',
                'expression': {
                  '__symbolic': 'reference',
                  'name': 'Component',
                  'module': 'angular2/src/core/metadata'
                },
                'arguments': [
                  {
                    'selector': 'my-hero-detail',
                    'template':
                        '\n  <div *ngIf="hero">\n    <h2>{{hero.name}} details!</h2>\n    <div><label>id: </label>{{hero.id}}</div>\n    <div>\n      <label>name: </label>\n      <input [(ngModel)]="hero.name" placeholder="name"/>\n    </div>\n  </div>\n',
                    'directives': [
                      {
                        '__symbolic': 'reference',
                        'name': 'FORM_DIRECTIVES',
                        'module': 'angular2/src/common/forms-deprecated/directives'
                      }
                    ],
                    'animations': [{
                      '__symbolic': 'call',
                      'expression': {
                        '__symbolic': 'reference',
                        'name': 'trigger',
                        'module': 'angular2/src/core/animation/metadata'
                      },
                      'arguments': [
                        'myAnimation',
                        [{ '__symbolic': 'call',
                           'expression': {
                             '__symbolic': 'reference',
                             'name': 'state',
                             'module': 'angular2/src/core/animation/metadata'
                           },
                           'arguments': [
                             'state1',
                              { '__symbolic': 'call',
                                'expression': {
                                  '__symbolic': 'reference',
                                  'name': 'style',
                                  'module': 'angular2/src/core/animation/metadata'
                                },
                                'arguments': [
                                  { 'background':'white' }
                                ]
                              }
                            ]
                          }, {
                            '__symbolic': 'call',
                            'expression': {
                              '__symbolic':'reference',
                              'name':'transition',
                              'module': 'angular2/src/core/animation/metadata'
                            },
                            'arguments': [
                              '* => *',
                              {
                                '__symbolic':'call',
                                'expression':{
                                  '__symbolic':'reference',
                                  'name':'sequence',
                                  'module': 'angular2/src/core/animation/metadata'
                                },
                                'arguments':[[{ '__symbolic': 'call',
                                  'expression': {
                                    '__symbolic':'reference',
                                    'name':'group',
                                    'module': 'angular2/src/core/animation/metadata'
                                  },
                                  'arguments':[[{
                                    '__symbolic': 'call',
                                    'expression': {
                                      '__symbolic':'reference',
                                      'name':'animate',
                                      'module': 'angular2/src/core/animation/metadata'
                                    },
                                    'arguments':[
                                      '1s 0.5s',
                                      { '__symbolic': 'call',
                                        'expression': {
                                          '__symbolic':'reference',
                                          'name':'keyframes',
                                          'module': 'angular2/src/core/animation/metadata'
                                        },
                                        'arguments':[[{ '__symbolic': 'call',
                                          'expression': {
                                            '__symbolic':'reference',
                                            'name':'style',
                                            'module': 'angular2/src/core/animation/metadata'
                                          },
                                          'arguments':[ { 'background': 'blue'} ]
                                        }, {
                                          '__symbolic': 'call',
                                          'expression': {
                                            '__symbolic':'reference',
                                            'name':'style',
                                            'module': 'angular2/src/core/animation/metadata'
                                          },
                                          'arguments':[ { 'background': 'red'} ]
                                        }]]
                                      }
                                    ]
                                  }]]
                                }]]
                              }
                            ]
                          }
                        ]
                    ]
                  }]
                }]
              }],
            'members': {
              'hero': [
                {
                  '__symbolic': 'property',
                  'decorators': [
                    {
                      '__symbolic': 'call',
                      'expression': {
                        '__symbolic': 'reference',
                        'name': 'Input',
                        'module': 'angular2/src/core/metadata'
                      }
                    }
                  ]
                }
              ]
            }
          }
        }
      },
      '/src/extern.d.ts': {'__symbolic': 'module', 'version': 1, metadata: {s: 's'}},
      '/tmp/src/version-error.d.ts': {'__symbolic': 'module', 'version': 100, metadata: {e: 's'}},
      '/tmp/src/error-reporting.d.ts': {
        __symbolic: 'module',
        version: 1,
        metadata: {
          SomeClass: {
            __symbolic: 'class',
            decorators: [
              {
                __symbolic: 'call',
                expression: {
                  __symbolic: 'reference',
                  name: 'Component',
                  module: 'angular2/src/core/metadata'
                },
                arguments: [
                  {
                    directives: [
                      {
                        __symbolic: 'reference',
                        module: 'src/error-references',
                        name: 'Link1',
                      }
                    ]
                  }
                ]
              }
            ],
          }
        }
      },
      '/tmp/src/error-references.d.ts': {
        __symbolic: 'module',
        version: 1,
        metadata: {
          Link1: {
            __symbolic: 'reference',
            module: 'src/error-references',
            name: 'Link2'
          },
          Link2: {
            __symbolic: 'reference',
            module: 'src/error-references',
            name: 'ErrorSym'
          },
          ErrorSym: {
            __symbolic: 'error',
            message: 'A reasonable error message',
            line: 12,
            character: 33
          }
        }
      },
      '/tmp/src/function-declaration.d.ts': {
        __symbolic: 'module',
        version: 1,
        metadata: {
          one: {
            __symbolic: 'function',
            parameters: ['a'],
            value: [
              {__symbolic: 'reference', name: 'a'}
            ]
          },
          add: {
            __symbolic: 'function',
            parameters: ['a','b'],
            value: {
              __symbolic: 'binop',
              operator: '+',
              left: {__symbolic: 'reference', name: 'a'},
              right: {__symbolic: 'reference', name: 'b'}
            }
          }
        }
      },
      '/tmp/src/function-reference.ts': {
        __symbolic: 'module',
        version: 1,
        metadata: {
          one: {
            __symbolic: 'call',
            expression: {
              __symbolic: 'reference',
              module: './function-declaration',
              name: 'one'
            },
            arguments: ['some-value']
          },
          two: {
            __symbolic: 'call',
            expression: {
              __symbolic: 'reference',
              module: './function-declaration',
              name: 'add'
            },
            arguments: [1, 1]
          },
          recursion: {
            __symbolic: 'call',
            expression: {
              __symbolic: 'reference',
              module: './function-recursive',
              name: 'recursive'
            },
            arguments: [1]
          },
          indirectRecursion: {
            __symbolic: 'call',
            expression: {
              __symbolic: 'reference',
              module: './function-recursive',
              name: 'indirectRecursion1'
            },
            arguments: [1]
          }
        }
      },
      '/tmp/src/function-recursive.d.ts': {
        __symbolic: 'modules',
        version: 1,
        metadata: {
          recursive: {
            __symbolic: 'function',
            parameters: ['a'],
            value: {
              __symbolic: 'call',
              expression: {
                __symbolic: 'reference',
                module: './function-recursive',
                name: 'recursive',
              },
              arguments: [
                {
                  __symbolic: 'reference',
                  name: 'a'
                }
              ]
            }
          },
          indirectRecursion1: {
            __symbolic: 'function',
            parameters: ['a'],
            value: {
              __symbolic: 'call',
              expression: {
                __symbolic: 'reference',
                module: './function-recursive',
                name: 'indirectRecursion2',
              },
              arguments: [
                {
                  __symbolic: 'reference',
                  name: 'a'
                }
              ]
            }
          },
          indirectRecursion2: {
            __symbolic: 'function',
            parameters: ['a'],
            value: {
              __symbolic: 'call',
              expression: {
                __symbolic: 'reference',
                module: './function-recursive',
                name: 'indirectRecursion1',
              },
              arguments: [
                {
                  __symbolic: 'reference',
                  name: 'a'
                }
              ]
            }
          }
        },
      },
      '/tmp/src/spread.ts': {
        __symbolic: 'module',
        version: 1,
        metadata: {
          spread: [0, {__symbolic: 'spread', expression: [1, 2, 3, 4]}, 5]
        }
      },
      '/tmp/src/custom-decorator.ts': `
        export function CustomDecorator(): any {
          return () => {};
        }
      `,
      '/tmp/src/custom-decorator-reference.ts': `
        import {CustomDecorator} from './custom-decorator';

        @CustomDecorator()
        export class Foo {
          @CustomDecorator() get foo(): string { return ''; }
        }
      `,
      '/tmp/src/invalid-calll-definitions.ts': `
        export function someFunction(a: any) {
          if (Array.isArray(a)) {
            return a;
          }
          return undefined;
        }
      `,
      '/tmp/src/invalid-calls.ts': `
        import {someFunction} from './nvalid-calll-definitions.ts';
        import {Component} from 'angular2/src/core/metadata';
        import {NgIf} from 'angular2/common';

        @Component({
          selector: 'my-component',
          directives: [someFunction([NgIf])]
        })
        export class MyComponent {}

        @someFunction()
        @Component({
          selector: 'my-component',
          directives: [NgIf]
        })
        export class MyOtherComponent { }
      `
    };


    if (data[moduleId] && moduleId.match(TS_EXT)) {
      let text = data[moduleId];
      if (typeof text === 'string') {
        let sf = ts.createSourceFile(moduleId, data[moduleId], ts.ScriptTarget.ES5);
        let diagnostics: ts.Diagnostic[] = (<any>sf).parseDiagnostics;
        if (diagnostics && diagnostics.length) {
          throw Error(`Error encountered during parse of file ${moduleId}`);
        }
        return this.collector.getMetadata(sf);
      }
    }
    return data[moduleId];
  }
}
