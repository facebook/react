import {describe, it, iit, ddescribe, expect, inject, beforeEach,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {PromiseWrapper} from '../src/facade/async';
import {Type, IS_DART} from '../src/facade/lang';

import {RouteRegistry} from '../src/route_registry';
import {RouteConfig, Route, Redirect, AuxRoute, AsyncRoute} from '../src/route_config/route_config_decorator';


export function main() {
  describe('RouteRegistry', () => {
    var registry: RouteRegistry;

    beforeEach(() => { registry = new RouteRegistry(RootHostCmp); });

    it('should match the full URL', inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/', component: DummyCmpA}));
         registry.config(RootHostCmp, new Route({path: '/test', component: DummyCmpB}));

         registry.recognize('/test', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyCmpB);
           async.done();
         });
       }));

    it('should generate URLs starting at the given component', () => {
      registry.config(
          RootHostCmp,
          new Route({path: '/first/...', component: DummyParentCmp, name: 'FirstCmp'}));

      var instr = registry.generate(['FirstCmp', 'SecondCmp'], []);
      expect(stringifyInstruction(instr)).toEqual('first/second');

      expect(stringifyInstruction(registry.generate(['SecondCmp'], [instr, instr.child])))
          .toEqual('first/second');
      expect(stringifyInstruction(registry.generate(['./SecondCmp'], [instr, instr.child])))
          .toEqual('first/second');
    });

    it('should generate URLs that account for default routes', () => {
      registry.config(
          RootHostCmp,
          new Route({path: '/first/...', component: ParentWithDefaultRouteCmp, name: 'FirstCmp'}));

      var instruction = registry.generate(['FirstCmp'], []);

      expect(instruction.toLinkUrl()).toEqual('first');
      expect(instruction.toRootUrl()).toEqual('first/second');
    });

    it('should generate URLs in a hierarchy of default routes', () => {
      registry.config(
          RootHostCmp,
          new Route({path: '/first/...', component: MultipleDefaultCmp, name: 'FirstCmp'}));

      var instruction = registry.generate(['FirstCmp'], []);

      expect(instruction.toLinkUrl()).toEqual('first');
      expect(instruction.toRootUrl()).toEqual('first/second/third');
    });

    it('should generate URLs with params', () => {
      registry.config(
          RootHostCmp,
          new Route({path: '/first/:param/...', component: DummyParentParamCmp, name: 'FirstCmp'}));

      var url = stringifyInstruction(
          registry.generate(['FirstCmp', {param: 'one'}, 'SecondCmp', {param: 'two'}], []));
      expect(url).toEqual('first/one/second/two');
    });

    it('should generate params as an empty StringMap when no params are given', () => {
      registry.config(RootHostCmp, new Route({path: '/test', component: DummyCmpA, name: 'Test'}));
      var instruction = registry.generate(['Test'], []);
      expect(instruction.component.params).toEqual({});
    });

    it('should generate URLs with extra params in the query', () => {
      registry.config(
          RootHostCmp, new Route({path: '/first/second', component: DummyCmpA, name: 'FirstCmp'}));

      var instruction = registry.generate(['FirstCmp', {a: 'one'}], []);
      expect(instruction.toLinkUrl()).toEqual('first/second?a=one');
    });


    it('should generate URLs of loaded components after they are loaded',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(
             RootHostCmp,
             new AsyncRoute({path: '/first/...', loader: asyncParentLoader, name: 'FirstCmp'}));

         var instruction = registry.generate(['FirstCmp', 'SecondCmp'], []);

         expect(stringifyInstruction(instruction)).toEqual('first');

         registry.recognize('/first/second', []).then((_) => {
           var instruction = registry.generate(['FirstCmp', 'SecondCmp'], []);
           expect(stringifyInstruction(instruction)).toEqual('first/second');
           async.done();
         });
       }));

    it('should throw when generating a url and a parent has no config', () => {
      expect(() => registry.generate(['FirstCmp', 'SecondCmp'], [
      ])).toThrowError('Component "RootHostCmp" has no route config.');
    });

    it('should generate URLs for aux routes', () => {
      registry.config(
          RootHostCmp, new Route({path: '/primary', component: DummyCmpA, name: 'Primary'}));
      registry.config(RootHostCmp, new AuxRoute({path: '/aux', component: DummyCmpB, name: 'Aux'}));

      expect(stringifyInstruction(registry.generate(['Primary', ['Aux']], [
      ]))).toEqual('primary(aux)');
    });

    it('should prefer static segments to dynamic',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/:site', component: DummyCmpB}));
         registry.config(RootHostCmp, new Route({path: '/home', component: DummyCmpA}));

         registry.recognize('/home', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyCmpA);
           async.done();
         });
       }));

    it('should prefer dynamic segments to star',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/:site', component: DummyCmpA}));
         registry.config(RootHostCmp, new Route({path: '/*site', component: DummyCmpB}));

         registry.recognize('/home', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyCmpA);
           async.done();
         });
       }));

    it('should prefer routes with more dynamic segments',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/:first/*rest', component: DummyCmpA}));
         registry.config(RootHostCmp, new Route({path: '/*all', component: DummyCmpB}));

         registry.recognize('/some/path', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyCmpA);
           async.done();
         });
       }));

    it('should prefer routes with more static segments',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/first/:second', component: DummyCmpA}));
         registry.config(RootHostCmp, new Route({path: '/:first/:second', component: DummyCmpB}));

         registry.recognize('/first/second', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyCmpA);
           async.done();
         });
       }));

    it('should prefer routes with static segments before dynamic segments',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(
             RootHostCmp, new Route({path: '/first/second/:third', component: DummyCmpB}));
         registry.config(
             RootHostCmp, new Route({path: '/first/:second/third', component: DummyCmpA}));

         registry.recognize('/first/second/third', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyCmpB);
           async.done();
         });
       }));

    it('should prefer routes with high specificity over routes with children with lower specificity',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/first', component: DummyCmpA}));

         // terminates to DummyCmpB
         registry.config(
             RootHostCmp, new Route({path: '/:second/...', component: SingleSlashChildCmp}));

         registry.recognize('/first', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyCmpA);
           async.done();
         });
       }));

    it('should match the full URL using child components',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/first/...', component: DummyParentCmp}));

         registry.recognize('/first/second', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyParentCmp);
           expect(instruction.child.component.componentType).toBe(DummyCmpB);
           async.done();
         });
       }));

    it('should match the URL using async child components',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/first/...', component: DummyAsyncCmp}));

         registry.recognize('/first/second', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyAsyncCmp);

           instruction.child.resolveComponent().then((childComponentInstruction) => {
             expect(childComponentInstruction.componentType).toBe(DummyCmpB);
             async.done();
           });
         });
       }));

    it('should match the URL using an async parent component',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(
             RootHostCmp, new AsyncRoute({path: '/first/...', loader: asyncParentLoader}));

         registry.recognize('/first/second', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyParentCmp);

           instruction.child.resolveComponent().then((childType) => {
             expect(childType.componentType).toBe(DummyCmpB);
             async.done();
           });
         });
       }));

    it('should throw when a parent config is missing the `...` suffix any of its children add routes',
       () => {
         expect(
             () => registry.config(RootHostCmp, new Route({path: '/', component: DummyParentCmp})))
             .toThrowError(
                 'Child routes are not allowed for "/". Use "..." on the parent\'s route path.');
       });

    it('should throw when a parent config uses `...` suffix before the end of the route', () => {
      expect(
          () => registry.config(
              RootHostCmp, new Route({path: '/home/.../fun/', component: DummyParentCmp})))
          .toThrowError('Unexpected "..." before the end of the path for "home/.../fun/".');
    });


    it('should throw if a config has a component that is not defined', () => {
      expect(() => registry.config(RootHostCmp, new Route({path: '/', component: null})))
          .toThrowError('Component for route "/" is not defined, or is not a class.');
      expect(() => registry.config(RootHostCmp, new AuxRoute({path: '/', component: null})))
          .toThrowError('Component for route "/" is not defined, or is not a class.');

      // This would never happen in Dart
      if (!IS_DART) {
        expect(
            () => registry.config(RootHostCmp, new Route({path: '/', component: <Type>(<any>4)})))
            .toThrowError('Component for route "/" is not defined, or is not a class.');
      }
    });

    it('should throw when linkParams are not terminal', () => {
      registry.config(
          RootHostCmp, new Route({path: '/first/...', component: DummyParentCmp, name: 'First'}));
      expect(() => {
        registry.generate(['First'], []);
      }).toThrowError('Link "["First"]" does not resolve to a terminal instruction.');
    });

    it('should match matrix params on child components and query params on the root component',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(RootHostCmp, new Route({path: '/first/...', component: DummyParentCmp}));

         registry.recognize('/first/second;filter=odd?comments=all', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(DummyParentCmp);
           expect(instruction.component.params).toEqual({'comments': 'all'});

           expect(instruction.child.component.componentType).toBe(DummyCmpB);
           expect(instruction.child.component.params).toEqual({'filter': 'odd'});
           async.done();
         });
       }));

    it('should match query params on the root component even when the next URL segment is null',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         registry.config(
             RootHostCmp, new Route({path: '/first/...', component: SingleSlashChildCmp}));

         registry.recognize('/first?comments=all', []).then((instruction) => {
           expect(instruction.component.componentType).toBe(SingleSlashChildCmp);
           expect(instruction.component.params).toEqual({'comments': 'all'});

           expect(instruction.child.component.componentType).toBe(DummyCmpB);
           expect(instruction.child.component.params).toEqual({});
           async.done();
         });
       }));

    it('should generate URLs with matrix and query params', () => {
      registry.config(
          RootHostCmp,
          new Route({path: '/first/:param/...', component: DummyParentParamCmp, name: 'FirstCmp'}));

      var url = stringifyInstruction(registry.generate(
          [
            'FirstCmp', {param: 'one', query: 'cats'}, 'SecondCmp', {
              param: 'two',
              sort: 'asc',
            }
          ],
          []));
      expect(url).toEqual('first/one/second/two;sort=asc?query=cats');
    });

  });
}

function stringifyInstruction(instruction: any /** TODO #9100 */): string {
  return instruction.toRootUrl();
}


function asyncParentLoader() {
  return PromiseWrapper.resolve(DummyParentCmp);
}

function asyncChildLoader() {
  return PromiseWrapper.resolve(DummyCmpB);
}

class RootHostCmp {}

@RouteConfig([new AsyncRoute({path: '/second', loader: asyncChildLoader})])
class DummyAsyncCmp {
}

class DummyCmpA {}
class DummyCmpB {}

@RouteConfig(
    [new Route({path: '/third', component: DummyCmpB, name: 'ThirdCmp', useAsDefault: true})])
class DefaultRouteCmp {
}

@RouteConfig([new Route({path: '/', component: DummyCmpB, name: 'ThirdCmp'})])
class SingleSlashChildCmp {
}


@RouteConfig([new Route(
    {path: '/second/...', component: DefaultRouteCmp, name: 'SecondCmp', useAsDefault: true})])
class MultipleDefaultCmp {
}

@RouteConfig(
    [new Route({path: '/second', component: DummyCmpB, name: 'SecondCmp', useAsDefault: true})])
class ParentWithDefaultRouteCmp {
}

@RouteConfig([new Route({path: '/second', component: DummyCmpB, name: 'SecondCmp'})])
class DummyParentCmp {
}


@RouteConfig([new Route({path: '/second/:param', component: DummyCmpB, name: 'SecondCmp'})])
class DummyParentParamCmp {
}
