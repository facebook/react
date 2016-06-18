import {beforeEach, ddescribe, xdescribe, describe, expect, iit, inject, beforeEachProviders, it, xit,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';

import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {bind, provide, forwardRef, Component, Directive, ElementRef, TemplateRef, ViewContainerRef, ViewEncapsulation, ViewMetadata} from '@angular/core';
import {By,} from '@angular/platform-browser/src/dom/debug/by';
import {getAllDebugNodes} from '@angular/core/src/debug/debug_node';

export function main() {
  describe('projection', () => {
    it('should support simple components',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: '<simple>' +
                                    '<div>A</div>' +
                                    '</simple>',
                                directives: [Simple]
                              }))
                 .createAsync(MainComp)
                 .then((main) => {
                   expect(main.debugElement.nativeElement).toHaveText('SIMPLE(A)');
                   async.done();
                 });
           }));

    it('should support simple components with text interpolation as direct children',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: '{{\'START(\'}}<simple>' +
                                    '{{text}}' +
                                    '</simple>{{\')END\'}}',
                                directives: [Simple]
                              }))
                 .createAsync(MainComp)
                 .then((main) => {

                   main.debugElement.componentInstance.text = 'A';
                   main.detectChanges();
                   expect(main.debugElement.nativeElement).toHaveText('START(SIMPLE(A))END');
                   async.done();
                 });
           }));

    it('should support projecting text interpolation to a non bound element',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    Simple,
                    new ViewMetadata(
                        {template: 'SIMPLE(<div><ng-content></ng-content></div>)', directives: []}))
                 .overrideView(
                     MainComp, new ViewMetadata(
                                   {template: '<simple>{{text}}</simple>', directives: [Simple]}))
                 .createAsync(MainComp)
                 .then((main) => {

                   main.debugElement.componentInstance.text = 'A';
                   main.detectChanges();
                   expect(main.debugElement.nativeElement).toHaveText('SIMPLE(A)');
                   async.done();
                 });
           }));


    it('should support projecting text interpolation to a non bound element with other bound elements after it',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    Simple, new ViewMetadata({
                      template:
                          'SIMPLE(<div><ng-content></ng-content></div><div [tabIndex]="0">EL</div>)',
                      directives: []
                    }))
                 .overrideView(
                     MainComp, new ViewMetadata(
                                   {template: '<simple>{{text}}</simple>', directives: [Simple]}))
                 .createAsync(MainComp)
                 .then((main) => {

                   main.debugElement.componentInstance.text = 'A';
                   main.detectChanges();
                   expect(main.debugElement.nativeElement).toHaveText('SIMPLE(AEL)');
                   async.done();
                 });
           }));

    it('should project content components',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(Simple, new ViewMetadata({
                                template: 'SIMPLE({{0}}|<ng-content></ng-content>|{{2}})',
                                directives: []
                              }))
                 .overrideView(OtherComp, new ViewMetadata({template: '{{1}}', directives: []}))
                 .overrideView(MainComp, new ViewMetadata({
                                 template: '<simple><other></other></simple>',
                                 directives: [Simple, OtherComp]
                               }))
                 .createAsync(MainComp)
                 .then((main) => {

                   main.detectChanges();
                   expect(main.debugElement.nativeElement).toHaveText('SIMPLE(0|1|2)');
                   async.done();
                 });
           }));

    it('should not show the light dom even if there is no content tag',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    MainComp, new ViewMetadata({template: '<empty>A</empty>', directives: [Empty]}))
                 .createAsync(MainComp)
                 .then((main) => {

                   expect(main.debugElement.nativeElement).toHaveText('');
                   async.done();
                 });
           }));

    it('should support multiple content tags',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: '<multiple-content-tags>' +
                                    '<div>B</div>' +
                                    '<div>C</div>' +
                                    '<div class="left">A</div>' +
                                    '</multiple-content-tags>',
                                directives: [MultipleContentTagsComponent]
                              }))
                 .createAsync(MainComp)
                 .then((main) => {

                   expect(main.debugElement.nativeElement).toHaveText('(A, BC)');
                   async.done();
                 });
           }));

    it('should redistribute only direct children',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: '<multiple-content-tags>' +
                                    '<div>B<div class="left">A</div></div>' +
                                    '<div>C</div>' +
                                    '</multiple-content-tags>',
                                directives: [MultipleContentTagsComponent]
                              }))
                 .createAsync(MainComp)
                 .then((main) => {

                   expect(main.debugElement.nativeElement).toHaveText('(, BAC)');
                   async.done();
                 });
           }));

    it('should redistribute direct child viewcontainers when the light dom changes',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    MainComp, new ViewMetadata({
                      template: '<multiple-content-tags>' +
                          '<template manual class="left"><div>A1</div></template>' +
                          '<div>B</div>' +
                          '</multiple-content-tags>',
                      directives: [MultipleContentTagsComponent, ManualViewportDirective]
                    }))
                 .createAsync(MainComp)
                 .then((main) => {

                   var viewportDirectives =
                       main.debugElement.children[0]
                           .childNodes.filter(By.directive(ManualViewportDirective))
                           .map(de => de.injector.get(ManualViewportDirective));

                   expect(main.debugElement.nativeElement).toHaveText('(, B)');
                   viewportDirectives.forEach(d => d.show());
                   expect(main.debugElement.nativeElement).toHaveText('(A1, B)');

                   viewportDirectives.forEach(d => d.hide());

                   expect(main.debugElement.nativeElement).toHaveText('(, B)');
                   async.done();
                 });
           }));

    it('should support nested components',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: '<outer-with-indirect-nested>' +
                                    '<div>A</div>' +
                                    '<div>B</div>' +
                                    '</outer-with-indirect-nested>',
                                directives: [OuterWithIndirectNestedComponent]
                              }))
                 .createAsync(MainComp)
                 .then((main) => {

                   expect(main.debugElement.nativeElement).toHaveText('OUTER(SIMPLE(AB))');
                   async.done();
                 });
           }));

    it('should support nesting with content being direct child of a nested component',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: '<outer>' +
                                    '<template manual class="left"><div>A</div></template>' +
                                    '<div>B</div>' +
                                    '<div>C</div>' +
                                    '</outer>',
                                directives: [OuterComponent, ManualViewportDirective],
                              }))
                 .createAsync(MainComp)
                 .then((main) => {

                   var viewportDirective =
                       main.debugElement.queryAllNodes(By.directive(ManualViewportDirective))[0]
                           .injector.get(ManualViewportDirective);

                   expect(main.debugElement.nativeElement)
                       .toHaveText('OUTER(INNER(INNERINNER(,BC)))');
                   viewportDirective.show();

                   expect(main.debugElement.nativeElement)
                       .toHaveText('OUTER(INNER(INNERINNER(A,BC)))');
                   async.done();
                 });
           }));

    it('should redistribute when the shadow dom changes',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: '<conditional-content>' +
                                    '<div class="left">A</div>' +
                                    '<div>B</div>' +
                                    '<div>C</div>' +
                                    '</conditional-content>',
                                directives: [ConditionalContentComponent]
                              }))
                 .createAsync(MainComp)
                 .then((main) => {

                   var viewportDirective =
                       main.debugElement.queryAllNodes(By.directive(ManualViewportDirective))[0]
                           .injector.get(ManualViewportDirective);

                   expect(main.debugElement.nativeElement).toHaveText('(, BC)');

                   viewportDirective.show();
                   expect(main.debugElement.nativeElement).toHaveText('(A, BC)');

                   viewportDirective.hide();

                   expect(main.debugElement.nativeElement).toHaveText('(, BC)');
                   async.done();
                 });
           }));

    // GH-2095 - https://github.com/angular/angular/issues/2095
    // important as we are removing the ng-content element during compilation,
    // which could skrew up text node indices.
    it('should support text nodes after content tags',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

             tcb.overrideView(
                    MainComp,
                    new ViewMetadata(
                        {template: '<simple stringProp="text"></simple>', directives: [Simple]}))
                 .overrideTemplate(Simple, '<ng-content></ng-content><p>P,</p>{{stringProp}}')
                 .createAsync(MainComp)
                 .then((main: ComponentFixture<any>) => {

                   main.detectChanges();

                   expect(main.debugElement.nativeElement).toHaveText('P,text');
                   async.done();
                 });

           }));

    // important as we are moving style tags around during compilation,
    // which could skrew up text node indices.
    it('should support text nodes after style tags',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

             tcb.overrideView(
                    MainComp,
                    new ViewMetadata(
                        {template: '<simple stringProp="text"></simple>', directives: [Simple]}))
                 .overrideTemplate(Simple, '<style></style><p>P,</p>{{stringProp}}')
                 .createAsync(MainComp)
                 .then((main: ComponentFixture<any>) => {

                   main.detectChanges();
                   expect(main.debugElement.nativeElement).toHaveText('P,text');
                   async.done();
                 });
           }));

    it('should support moving non projected light dom around',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: '<empty>' +
                                    '  <template manual><div>A</div></template>' +
                                    '</empty>' +
                                    'START(<div project></div>)END',
                                directives: [Empty, ProjectDirective, ManualViewportDirective],
                              }))
                 .createAsync(MainComp)
                 .then((main) => {
                   var sourceDirective: any /** TODO #9100 */;

                   // We can't use the child nodes to get a hold of this because it's not in the dom
                   // at
                   // all.
                   getAllDebugNodes().forEach((debug) => {
                     if (debug.providerTokens.indexOf(ManualViewportDirective) !== -1) {
                       sourceDirective = debug.injector.get(ManualViewportDirective);
                     }
                   });

                   var projectDirective: ProjectDirective =
                       main.debugElement.queryAllNodes(By.directive(ProjectDirective))[0]
                           .injector.get(ProjectDirective);

                   expect(main.debugElement.nativeElement).toHaveText('START()END');

                   projectDirective.show(sourceDirective.templateRef);
                   expect(main.debugElement.nativeElement).toHaveText('START(A)END');
                   async.done();
                 });
           }));

    it('should support moving projected light dom around',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    MainComp, new ViewMetadata({
                      template: '<simple><template manual><div>A</div></template></simple>' +
                          'START(<div project></div>)END',
                      directives: [Simple, ProjectDirective, ManualViewportDirective],
                    }))
                 .createAsync(MainComp)
                 .then((main) => {

                   var sourceDirective: ManualViewportDirective =
                       main.debugElement.queryAllNodes(By.directive(ManualViewportDirective))[0]
                           .injector.get(ManualViewportDirective);
                   var projectDirective: ProjectDirective =
                       main.debugElement.queryAllNodes(By.directive(ProjectDirective))[0]
                           .injector.get(ProjectDirective);
                   expect(main.debugElement.nativeElement).toHaveText('SIMPLE()START()END');

                   projectDirective.show(sourceDirective.templateRef);
                   expect(main.debugElement.nativeElement).toHaveText('SIMPLE()START(A)END');
                   async.done();
                 });
           }));

    it('should support moving ng-content around',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    MainComp, new ViewMetadata({
                      template: '<conditional-content>' +
                          '<div class="left">A</div>' +
                          '<div>B</div>' +
                          '</conditional-content>' +
                          'START(<div project></div>)END',
                      directives: [
                        ConditionalContentComponent, ProjectDirective, ManualViewportDirective
                      ]
                    }))
                 .createAsync(MainComp)
                 .then((main) => {

                   var sourceDirective: ManualViewportDirective =
                       main.debugElement.queryAllNodes(By.directive(ManualViewportDirective))[0]
                           .injector.get(ManualViewportDirective);
                   var projectDirective: ProjectDirective =
                       main.debugElement.queryAllNodes(By.directive(ProjectDirective))[0]
                           .injector.get(ProjectDirective);
                   expect(main.debugElement.nativeElement).toHaveText('(, B)START()END');

                   projectDirective.show(sourceDirective.templateRef);
                   expect(main.debugElement.nativeElement).toHaveText('(, B)START(A)END');

                   // Stamping ng-content multiple times should not produce the content multiple
                   // times...
                   projectDirective.show(sourceDirective.templateRef);
                   expect(main.debugElement.nativeElement).toHaveText('(, B)START(A)END');
                   async.done();
                 });
           }));


    // Note: This does not use a ng-content element, but
    // is still important as we are merging proto views independent of
    // the presence of ng-content elements!
    it('should still allow to implement a recursive trees',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    MainComp, new ViewMetadata({template: '<tree></tree>', directives: [Tree]}))
                 .createAsync(MainComp)
                 .then((main) => {

                   main.detectChanges();
                   var manualDirective: ManualViewportDirective =
                       main.debugElement.queryAllNodes(By.directive(ManualViewportDirective))[0]
                           .injector.get(ManualViewportDirective);
                   expect(main.debugElement.nativeElement).toHaveText('TREE(0:)');
                   manualDirective.show();
                   main.detectChanges();
                   expect(main.debugElement.nativeElement).toHaveText('TREE(0:TREE(1:))');
                   async.done();
                 });
           }));

    // Note: This does not use a ng-content element, but
    // is still important as we are merging proto views independent of
    // the presence of ng-content elements!
    it('should still allow to implement a recursive trees via multiple components',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    MainComp, new ViewMetadata({template: '<tree></tree>', directives: [Tree]}))
                 .overrideView(
                     Tree, new ViewMetadata({
                       template: 'TREE({{depth}}:<tree2 *manual [depth]="depth+1"></tree2>)',
                       directives: [Tree2, ManualViewportDirective]
                     }))
                 .createAsync(MainComp)
                 .then((main) => {

                   main.detectChanges();

                   expect(main.debugElement.nativeElement).toHaveText('TREE(0:)');

                   var tree = main.debugElement.query(By.directive(Tree));
                   var manualDirective: ManualViewportDirective = tree.queryAllNodes(By.directive(
                       ManualViewportDirective))[0].injector.get(ManualViewportDirective);
                   manualDirective.show();
                   main.detectChanges();
                   expect(main.debugElement.nativeElement).toHaveText('TREE(0:TREE2(1:))');

                   var tree2 = main.debugElement.query(By.directive(Tree2));
                   manualDirective =
                       tree2.queryAllNodes(By.directive(ManualViewportDirective))[0].injector.get(
                           ManualViewportDirective);
                   manualDirective.show();
                   main.detectChanges();
                   expect(main.debugElement.nativeElement).toHaveText('TREE(0:TREE2(1:TREE(2:)))');

                   async.done();
                 });
           }));

    if (getDOM().supportsNativeShadowDOM()) {
      it('should support native content projection and isolate styles per component',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MainComp, new ViewMetadata({
                                  template: '<simple-native1><div>A</div></simple-native1>' +
                                      '<simple-native2><div>B</div></simple-native2>',
                                  directives: [SimpleNative1, SimpleNative2]
                                }))
                   .createAsync(MainComp)
                   .then((main) => {
                     var childNodes = getDOM().childNodes(main.debugElement.nativeElement);
                     expect(childNodes[0]).toHaveText('div {color: red}SIMPLE1(A)');
                     expect(childNodes[1]).toHaveText('div {color: blue}SIMPLE2(B)');
                     main.destroy();
                     async.done();
                   });
             }));
    }

    if (getDOM().supportsDOMEvents()) {
      it('should support non emulated styles',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MainComp, new ViewMetadata({
                                  template: '<div class="redStyle"></div>',
                                  styles: ['.redStyle { color: red}'],
                                  encapsulation: ViewEncapsulation.None,
                                  directives: [OtherComp]
                                }))
                   .createAsync(MainComp)
                   .then((main) => {
                     var mainEl = main.debugElement.nativeElement;
                     var div1 = getDOM().firstChild(mainEl);
                     var div2 = getDOM().createElement('div');
                     getDOM().setAttribute(div2, 'class', 'redStyle');
                     getDOM().appendChild(mainEl, div2);
                     expect(getDOM().getComputedStyle(div1).color).toEqual('rgb(255, 0, 0)');
                     expect(getDOM().getComputedStyle(div2).color).toEqual('rgb(255, 0, 0)');
                     async.done();
                   });
             }));

      it('should support emulated style encapsulation',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MainComp, new ViewMetadata({
                                  template: '<div></div>',
                                  styles: ['div { color: red}'],
                                  encapsulation: ViewEncapsulation.Emulated
                                }))
                   .createAsync(MainComp)
                   .then((main) => {
                     var mainEl = main.debugElement.nativeElement;
                     var div1 = getDOM().firstChild(mainEl);
                     var div2 = getDOM().createElement('div');
                     getDOM().appendChild(mainEl, div2);
                     expect(getDOM().getComputedStyle(div1).color).toEqual('rgb(255, 0, 0)');
                     expect(getDOM().getComputedStyle(div2).color).toEqual('rgb(0, 0, 0)');
                     async.done();
                   });
             }));
    }

    it('should support nested conditionals that contain ng-contents',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: `<conditional-text>a</conditional-text>`,
                                directives: [ConditionalTextComponent]
                              }))
                 .createAsync(MainComp)
                 .then((main) => {
                   expect(main.debugElement.nativeElement).toHaveText('MAIN()');

                   var viewportElement =
                       main.debugElement.queryAllNodes(By.directive(ManualViewportDirective))[0];
                   viewportElement.injector.get(ManualViewportDirective).show();
                   expect(main.debugElement.nativeElement).toHaveText('MAIN(FIRST())');

                   viewportElement =
                       main.debugElement.queryAllNodes(By.directive(ManualViewportDirective))[1];
                   viewportElement.injector.get(ManualViewportDirective).show();
                   expect(main.debugElement.nativeElement).toHaveText('MAIN(FIRST(SECOND(a)))');

                   async.done();
                 });
           }));

    it('should allow to switch the order of nested components via ng-content',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: `<cmp-a><cmp-b></cmp-b></cmp-a>`,
                                directives: [CmpA, CmpB],
                              }))
                 .createAsync(MainComp)
                 .then((main) => {
                   main.detectChanges();
                   expect(getDOM().getInnerHTML(main.debugElement.nativeElement))
                       .toEqual(
                           '<cmp-a><cmp-b><cmp-d><d>cmp-d</d></cmp-d></cmp-b>' +
                           '<cmp-c><c>cmp-c</c></cmp-c></cmp-a>');
                   async.done();
                 });
           }));

    it('should create nested components in the right order',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MainComp, new ViewMetadata({
                                template: `<cmp-a1></cmp-a1><cmp-a2></cmp-a2>`,
                                directives: [CmpA1, CmpA2],
                              }))
                 .createAsync(MainComp)
                 .then((main) => {
                   main.detectChanges();
                   expect(getDOM().getInnerHTML(main.debugElement.nativeElement))
                       .toEqual(
                           '<cmp-a1>a1<cmp-b11>b11</cmp-b11><cmp-b12>b12</cmp-b12></cmp-a1>' +
                           '<cmp-a2>a2<cmp-b21>b21</cmp-b21><cmp-b22>b22</cmp-b22></cmp-a2>');
                   async.done();
                 });
           }));

    it('should project filled view containers into a view container',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    MainComp, new ViewMetadata({
                      template: '<conditional-content>' +
                          '<div class="left">A</div>' +
                          '<template manual class="left">B</template>' +
                          '<div class="left">C</div>' +
                          '<div>D</div>' +
                          '</conditional-content>',
                      directives: [ConditionalContentComponent, ManualViewportDirective]
                    }))
                 .createAsync(MainComp)
                 .then((main) => {
                   var conditionalComp =
                       main.debugElement.query(By.directive(ConditionalContentComponent));

                   var viewViewportDir =
                       conditionalComp.queryAllNodes(By.directive(ManualViewportDirective))[0]
                           .injector.get(ManualViewportDirective);

                   expect(main.debugElement.nativeElement).toHaveText('(, D)');
                   expect(main.debugElement.nativeElement).toHaveText('(, D)');

                   viewViewportDir.show();

                   expect(main.debugElement.nativeElement).toHaveText('(AC, D)');

                   var contentViewportDir =
                       conditionalComp.queryAllNodes(By.directive(ManualViewportDirective))[1]
                           .inject(ManualViewportDirective);

                   contentViewportDir.show();

                   expect(main.debugElement.nativeElement).toHaveText('(ABC, D)');

                   // hide view viewport, and test that it also hides
                   // the content viewport's views
                   viewViewportDir.hide();
                   expect(main.debugElement.nativeElement).toHaveText('(, D)');

                   async.done();
                 });
           }));

  });
}

@Component({selector: 'main', template: '', directives: []})
class MainComp {
  text: string = '';
}

@Component({selector: 'other', template: '', directives: []})
class OtherComp {
  text: string = '';
}

@Component({
  selector: 'simple',
  inputs: ['stringProp'],
  template: 'SIMPLE(<ng-content></ng-content>)',
  directives: []
})
class Simple {
  stringProp: string = '';
}

@Component({
  selector: 'simple-native1',
  template: 'SIMPLE1(<content></content>)',
  directives: [],
  encapsulation: ViewEncapsulation.Native,
  styles: ['div {color: red}']
})
class SimpleNative1 {
}

@Component({
  selector: 'simple-native2',
  template: 'SIMPLE2(<content></content>)',
  directives: [],
  encapsulation: ViewEncapsulation.Native,
  styles: ['div {color: blue}']
})
class SimpleNative2 {
}

@Component({selector: 'empty', template: '', directives: []})
class Empty {
}

@Component({
  selector: 'multiple-content-tags',
  template: '(<ng-content SELECT=".left"></ng-content>, <ng-content></ng-content>)',
  directives: []
})
class MultipleContentTagsComponent {
}

@Directive({selector: '[manual]'})
class ManualViewportDirective {
  constructor(public vc: ViewContainerRef, public templateRef: TemplateRef<Object>) {}
  show() { this.vc.createEmbeddedView(this.templateRef); }
  hide() { this.vc.clear(); }
}

@Directive({selector: '[project]'})
class ProjectDirective {
  constructor(public vc: ViewContainerRef) {}
  show(templateRef: TemplateRef<Object>) { this.vc.createEmbeddedView(templateRef); }
  hide() { this.vc.clear(); }
}

@Component({
  selector: 'outer-with-indirect-nested',
  template: 'OUTER(<simple><div><ng-content></ng-content></div></simple>)',
  directives: [Simple]
})
class OuterWithIndirectNestedComponent {
}

@Component({
  selector: 'outer',
  template:
      'OUTER(<inner><ng-content select=".left" class="left"></ng-content><ng-content></ng-content></inner>)',
  directives: [forwardRef(() => InnerComponent)]
})
class OuterComponent {
}

@Component({
  selector: 'inner',
  template:
      'INNER(<innerinner><ng-content select=".left" class="left"></ng-content><ng-content></ng-content></innerinner>)',
  directives: [forwardRef(() => InnerInnerComponent)]
})
class InnerComponent {
}

@Component({
  selector: 'innerinner',
  template: 'INNERINNER(<ng-content select=".left"></ng-content>,<ng-content></ng-content>)',
  directives: []
})
class InnerInnerComponent {
}

@Component({
  selector: 'conditional-content',
  template:
      '<div>(<div *manual><ng-content select=".left"></ng-content></div>, <ng-content></ng-content>)</div>',
  directives: [ManualViewportDirective]
})
class ConditionalContentComponent {
}

@Component({
  selector: 'conditional-text',
  template:
      'MAIN(<template manual>FIRST(<template manual>SECOND(<ng-content></ng-content>)</template>)</template>)',
  directives: [ManualViewportDirective]
})
class ConditionalTextComponent {
}

@Component({
  selector: 'tab',
  template: '<div><div *manual>TAB(<ng-content></ng-content>)</div></div>',
  directives: [ManualViewportDirective]
})
class Tab {
}

@Component({
  selector: 'tree2',
  inputs: ['depth'],
  template: 'TREE2({{depth}}:<tree *manual [depth]="depth+1"></tree>)',
  directives: [ManualViewportDirective, forwardRef(() => Tree)]
})
class Tree2 {
  depth = 0;
}

@Component({
  selector: 'tree',
  inputs: ['depth'],
  template: 'TREE({{depth}}:<tree *manual [depth]="depth+1"></tree>)',
  directives: [ManualViewportDirective, Tree, forwardRef(() => Tree)]
})
class Tree {
  depth = 0;
}


@Component({selector: 'cmp-d', template: `<d>{{tagName}}</d>`})
class CmpD {
  tagName: string;
  constructor(elementRef: ElementRef) {
    this.tagName = getDOM().tagName(elementRef.nativeElement).toLowerCase();
  }
}


@Component({selector: 'cmp-c', template: `<c>{{tagName}}</c>`})
class CmpC {
  tagName: string;
  constructor(elementRef: ElementRef) {
    this.tagName = getDOM().tagName(elementRef.nativeElement).toLowerCase();
  }
}


@Component(
    {selector: 'cmp-b', template: `<ng-content></ng-content><cmp-d></cmp-d>`, directives: [CmpD]})
class CmpB {
}


@Component(
    {selector: 'cmp-a', template: `<ng-content></ng-content><cmp-c></cmp-c>`, directives: [CmpC]})
class CmpA {
}

@Component({selector: 'cmp-b11', template: `{{'b11'}}`, directives: []})
class CmpB11 {
}

@Component({selector: 'cmp-b12', template: `{{'b12'}}`, directives: []})
class CmpB12 {
}

@Component({selector: 'cmp-b21', template: `{{'b21'}}`, directives: []})
class CmpB21 {
}

@Component({selector: 'cmp-b22', template: `{{'b22'}}`, directives: []})
class CmpB22 {
}

@Component({
  selector: 'cmp-a1',
  template: `{{'a1'}}<cmp-b11></cmp-b11><cmp-b12></cmp-b12>`,
  directives: [CmpB11, CmpB12]
})
class CmpA1 {
}

@Component({
  selector: 'cmp-a2',
  template: `{{'a2'}}<cmp-b21></cmp-b21><cmp-b22></cmp-b22>`,
  directives: [CmpB21, CmpB22]
})
class CmpA2 {
}
