import {NgIf} from '@angular/common';
import {CompilerConfig} from '@angular/compiler';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {Component} from '../../index';
import {DEFAULT_STATE} from '../../src/animation/animation_constants';
import {AnimationDriver} from '../../src/animation/animation_driver';
import {AnimationEntryMetadata, animate, group, keyframes, sequence, state, style, transition, trigger} from '../../src/animation/metadata';
import {AUTO_STYLE} from '../../src/animation/metadata';
import {IS_DART, isArray, isPresent} from '../../src/facade/lang';
import {fakeAsync, flushMicrotasks, tick} from '../../testing';
import {MockAnimationDriver} from '../../testing/animation/mock_animation_driver';
import {AsyncTestCompleter, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '../../testing/testing_internal';

export function main() {
  if (IS_DART) {
    declareTests({useJit: false});
  } else {
    describe('jit', () => { declareTests({useJit: true}); });

    describe('no jit', () => { declareTests({useJit: false}); });
  }
}

function declareTests({useJit}: {useJit: boolean}) {
  describe('animation tests', function() {
    beforeEachProviders(
        () =>
            [{
              provide: CompilerConfig,
              useValue: new CompilerConfig({genDebugInfo: true, useJit: useJit})
            },
             {provide: AnimationDriver, useClass: MockAnimationDriver}]);

    var makeAnimationCmp =
        (tcb: TestComponentBuilder, tpl: string,
         animationEntry: AnimationEntryMetadata | AnimationEntryMetadata[],
         callback: any /** TODO #9100 */ = null) => {
          var entries = isArray(animationEntry) ? <AnimationEntryMetadata[]>animationEntry :
                                                  [<AnimationEntryMetadata>animationEntry];
          tcb = tcb.overrideTemplate(DummyIfCmp, tpl);
          tcb = tcb.overrideAnimations(DummyIfCmp, entries);
          tcb.createAsync(DummyIfCmp).then((root) => { callback(root); });
          tick();
        };

    describe('animation triggers', () => {
      it('should trigger a state change animation from void => state',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div *ngIf="exp" @myAnimation="exp"></div>',
                   trigger(
                       'myAnimation',
                       [transition(
                           'void => *',
                           [style({'opacity': 0}), animate(500, style({'opacity': 1}))])]),
                   (fixture: any /** TODO #9100 */) => {
                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = true;
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.length).toEqual(1);

                     var keyframes2 = driver.log[0]['keyframeLookup'];
                     expect(keyframes2.length).toEqual(2);
                     expect(keyframes2[0]).toEqual([0, {'opacity': 0}]);
                     expect(keyframes2[1]).toEqual([1, {'opacity': 1}]);
                   });
             })));

      it('should trigger a state change animation from state => void',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div *ngIf="exp" @myAnimation="exp"></div>',
                   trigger(
                       'myAnimation',
                       [transition(
                           '* => void',
                           [style({'opacity': 1}), animate(500, style({'opacity': 0}))])]),
                   (fixture: any /** TODO #9100 */) => {
                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = true;
                     fixture.detectChanges();
                     flushMicrotasks();

                     cmp.exp = false;
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.length).toEqual(1);

                     var keyframes2 = driver.log[0]['keyframeLookup'];
                     expect(keyframes2.length).toEqual(2);
                     expect(keyframes2[0]).toEqual([0, {'opacity': 1}]);
                     expect(keyframes2[1]).toEqual([1, {'opacity': 0}]);
                   });
             })));

      it('should animate the element when the expression changes between states',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               tcb.overrideAnimations(
                      DummyIfCmp,
                      [trigger(
                          'myAnimation',
                          [transition(
                              '* => state1',
                              [
                                style({'background': 'red'}),
                                animate('0.5s 1s ease-out', style({'background': 'blue'}))
                              ])])])
                   .createAsync(DummyIfCmp)
                   .then((fixture) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = 'state1';
                     fixture.detectChanges();

                     flushMicrotasks();

                     expect(driver.log.length).toEqual(1);

                     var animation1 = driver.log[0];
                     expect(animation1['duration']).toEqual(500);
                     expect(animation1['delay']).toEqual(1000);
                     expect(animation1['easing']).toEqual('ease-out');

                     var startingStyles = animation1['startingStyles'];
                     expect(startingStyles).toEqual({'background': 'red'});

                     var keyframes = animation1['keyframeLookup'];
                     expect(keyframes[0]).toEqual([0, {'background': 'red'}]);
                     expect(keyframes[1]).toEqual([1, {'background': 'blue'}]);
                   });
             })));

      it('should combine repeated style steps into a single step',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               tcb.overrideAnimations(DummyIfCmp, [
                       trigger('myAnimation', [
                         transition('void => *', [
                            style({'background': 'red'}),
                            style({'width': '100px'}),
                            style({'background': 'gold'}),
                            style({'height': 111}),
                            animate('999ms', style({'width': '200px', 'background': 'blue'})),
                            style({'opacity': '1'}),
                            style({'border-width': '100px'}),
                            animate('999ms', style({'opacity': '0', 'height': '200px', 'border-width': '10px'}))
                         ])
                       ])
                    ])
                   .createAsync(DummyIfCmp)
                   .then((fixture) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = true;
                     fixture.detectChanges();

                     flushMicrotasks();

                     expect(driver.log.length).toEqual(2);

                     var animation1 = driver.log[0];
                     expect(animation1['duration']).toEqual(999);
                     expect(animation1['delay']).toEqual(0);
                     expect(animation1['easing']).toEqual(null);
                     expect(animation1['startingStyles'])
                         .toEqual({'background': 'gold', 'width': '100px', 'height': 111});

                     var keyframes1 = animation1['keyframeLookup'];
                     expect(keyframes1[0]).toEqual([0, {'background': 'gold', 'width': '100px'}]);
                     expect(keyframes1[1]).toEqual([1, {'background': 'blue', 'width': '200px'}]);

                     var animation2 = driver.log[1];
                     expect(animation2['duration']).toEqual(999);
                     expect(animation2['delay']).toEqual(0);
                     expect(animation2['easing']).toEqual(null);
                     expect(animation2['startingStyles'])
                        .toEqual({'opacity': '1', 'border-width': '100px'});

                     var keyframes2 = animation2['keyframeLookup'];
                     expect(keyframes2[0])
                         .toEqual([0, {'opacity': '1', 'height': 111, 'border-width': '100px'}]);
                     expect(keyframes2[1])
                         .toEqual([1, {'opacity': '0', 'height': '200px', 'border-width': '10px'}]);
                   });
             })));

      describe('groups/sequences', () => {
        var assertPlaying =
            (player: MockAnimationDriver, isPlaying: any /** TODO #9100 */) => {
              var method = 'play';
              var lastEntry = player.log.length > 0 ? player.log[player.log.length - 1] : null;
              if (isPresent(lastEntry)) {
                if (isPlaying) {
                  expect(lastEntry).toEqual(method);
                } else {
                  expect(lastEntry).not.toEqual(method);
                }
              }
            }

        it('should run animations in sequence one by one if a top-level array is used',
           inject(
               [TestComponentBuilder, AnimationDriver],
               fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
                 tcb.overrideAnimations(
                        DummyIfCmp,
                        [trigger('myAnimation', [transition(
                                                    'void => *',
                                                    [
                                                      style({'opacity': '0'}),
                                                      animate(1000, style({'opacity': '0.5'})),
                                                      animate('1000ms', style({'opacity': '0.8'})),
                                                      animate('1s', style({'opacity': '1'})),
                                                    ])])])
                     .createAsync(DummyIfCmp)
                     .then((fixture) => {

                       tick();

                       var cmp = fixture.debugElement.componentInstance;
                       cmp.exp = true;
                       fixture.detectChanges();

                       flushMicrotasks();

                       expect(driver.log.length).toEqual(3);

                       var player1 = driver.log[0]['player'];
                       var player2 = driver.log[1]['player'];
                       var player3 = driver.log[2]['player'];

                       assertPlaying(player1, true);
                       assertPlaying(player2, false);
                       assertPlaying(player3, false);

                       player1.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, true);
                       assertPlaying(player3, false);

                       player2.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, false);
                       assertPlaying(player3, true);

                       player3.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, false);
                       assertPlaying(player3, false);
                     });
               })));

        it('should run animations in parallel if a group is used',
           inject(
               [TestComponentBuilder, AnimationDriver],
               fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
                 tcb.overrideAnimations(DummyIfCmp, [
                   trigger('myAnimation', [
                     transition('void => *', [
                            style({'width': 0, 'height': 0}),
                            group([animate(1000, style({'width': 100})), animate(5000, style({'height': 500}))]),
                            group([animate(1000, style({'width': 0})), animate(5000, style({'height': 0}))])
                          ])
                        ])
                 ])
                     .createAsync(DummyIfCmp)
                     .then((fixture) => {

                       tick();

                       var cmp = fixture.debugElement.componentInstance;
                       cmp.exp = true;
                       fixture.detectChanges();

                       flushMicrotasks();

                       expect(driver.log.length).toEqual(5);

                       var player1 = driver.log[0]['player'];
                       var player2 = driver.log[1]['player'];
                       var player3 = driver.log[2]['player'];
                       var player4 = driver.log[3]['player'];
                       var player5 = driver.log[4]['player'];

                       assertPlaying(player1, true);
                       assertPlaying(player2, false);
                       assertPlaying(player3, false);
                       assertPlaying(player4, false);
                       assertPlaying(player5, false);

                       player1.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, true);
                       assertPlaying(player3, true);
                       assertPlaying(player4, false);
                       assertPlaying(player5, false);

                       player2.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, false);
                       assertPlaying(player3, true);
                       assertPlaying(player4, false);
                       assertPlaying(player5, false);

                       player3.finish();

                       assertPlaying(player1, false);
                       assertPlaying(player2, false);
                       assertPlaying(player3, false);
                       assertPlaying(player4, true);
                       assertPlaying(player5, true);
                     });
               })));
      });

      describe('keyframes', () => {
        it(
            'should create an animation step with multiple keyframes',
            inject(
                [TestComponentBuilder, AnimationDriver], fakeAsync(
                                                             (tcb: TestComponentBuilder,
                                                              driver: MockAnimationDriver) => {
                                                               tcb.overrideAnimations(
                                                                      DummyIfCmp,
                                                                      [trigger(
                                                                          'myAnimation',
                                                                          [transition(
                                                                              'void => *',
                                                                              [animate(
                                                                                  1000, keyframes([
                                                                                    style([{
                                                                                      'width': 0,
                                                                                      offset: 0
                                                                                    }]),
                                                                                    style([{
                                                                                      'width': 100,
                                                                                      offset: 0.25
                                                                                    }]),
                                                                                    style([{
                                                                                      'width': 200,
                                                                                      offset: 0.75
                                                                                    }]),
                                                                                    style([{
                                                                                      'width': 300,
                                                                                      offset: 1
                                                                                    }])
                                                                                  ]))])])])
                                                                   .createAsync(DummyIfCmp)
                                                                   .then((fixture) => {

                                                                     tick();

                                                                     var cmp =
                                                                         fixture.debugElement
                                                                             .componentInstance;
                                                                     cmp.exp = true;
                                                                     fixture.detectChanges();
                                                                     flushMicrotasks();

                                                                     var keyframes =
                                                                         driver
                                                                             .log[0]
                                                                                 ['keyframeLookup'];
                                                                     expect(keyframes.length)
                                                                         .toEqual(4);
                                                                     expect(keyframes[0]).toEqual([
                                                                       0, {'width': 0}
                                                                     ]);
                                                                     expect(keyframes[1]).toEqual([
                                                                       0.25, {'width': 100}
                                                                     ]);
                                                                     expect(keyframes[2]).toEqual([
                                                                       0.75, {'width': 200}
                                                                     ]);
                                                                     expect(keyframes[3]).toEqual([
                                                                       1, {'width': 300}
                                                                     ]);
                                                                   });
                                                             })));

        it('should fetch any keyframe styles that are not defined in the first keyframe from the previous entries or getCompuedStyle',
           inject(
               [TestComponentBuilder, AnimationDriver],
               fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
                 tcb.overrideAnimations(DummyIfCmp, [
                   trigger('myAnimation', [
                     transition('void => *', [
                       style({ 'color': 'white' }),
                       animate(1000, style({ 'color': 'silver' })),
                       animate(1000, keyframes([
                         style([{ 'color': 'gold', offset: 0.25 }]),
                         style([{ 'color': 'bronze', 'background-color':'teal', offset: 0.50 }]),
                         style([{ 'color': 'platinum', offset: 0.75 }]),
                         style([{ 'color': 'diamond', offset: 1 }])
                       ]))
                          ])
                        ])
                 ])
                     .createAsync(DummyIfCmp)
                     .then((fixture) => {

                       tick();

                       var cmp = fixture.debugElement.componentInstance;
                       cmp.exp = true;
                       fixture.detectChanges();
                       flushMicrotasks();

                       var keyframes = driver.log[1]['keyframeLookup'];
                       expect(keyframes.length).toEqual(5);
                       expect(keyframes[0]).toEqual([0, {'color': 'silver', 'background-color':AUTO_STYLE }]);
                       expect(keyframes[1]).toEqual([0.25, {'color': 'gold'}]);
                       expect(keyframes[2]).toEqual([0.50, {'color': 'bronze', 'background-color':'teal'}]);
                       expect(keyframes[3]).toEqual([0.75, {'color': 'platinum'}]);
                       expect(keyframes[4]).toEqual([1, {'color': 'diamond', 'background-color':'teal'}]);
                     });
               })));
      });

      it('should cancel the previously running animation active with the same element/animationName pair',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               tcb.overrideAnimations(
                      DummyIfCmp,
                      [trigger(
                          'myAnimation',
                          [transition(
                              '* => *',
                              [style({'opacity': 0}), animate(500, style({'opacity': 1}))])])])
                   .createAsync(DummyIfCmp)
                   .then((fixture) => {

                     tick();

                     var cmp = fixture.debugElement.componentInstance;

                     cmp.exp = 'state1';
                     fixture.detectChanges();
                     flushMicrotasks();

                     var enterCompleted = false;
                     var enterPlayer = driver.log[0]['player'];
                     enterPlayer.onDone(() => enterCompleted = true);

                     expect(enterCompleted).toEqual(false);

                     cmp.exp = 'state2';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(enterCompleted).toEqual(true);
                   });
             })));

      it('should destroy all animation players once the animation is complete',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               tcb.overrideAnimations(DummyIfCmp, [
                        trigger('myAnimation', [
                          transition('void => *', [
                                                 style({'background': 'red', 'opacity': 0.5}),
                                                 animate(500, style({'background': 'black'})),
                                                 group([
                                                   animate(500, style({'background': 'black'})),
                                                   animate(1000, style({'opacity': '0.2'})),
                                                 ]),
                                                 sequence([
                                                   animate(500, style({'opacity': '1'})),
                                                   animate(1000, style({'background': 'white'}))
                                                 ])
                                               ])
                                               ])
                      ]).createAsync(DummyIfCmp)
                          .then((fixture) => {
                            tick();

                            var cmp = fixture.debugElement.componentInstance;
                            cmp.exp = true;
                            fixture.detectChanges();

                            flushMicrotasks();

                            expect(driver.log.length).toEqual(5);

                            driver.log.forEach(entry => entry['player'].finish());
                            driver.log.forEach(entry => {
                              var player = <MockAnimationDriver>entry['player'];
                              expect(player.log[player.log.length - 2]).toEqual('finish');
                              expect(player.log[player.log.length - 1]).toEqual('destroy');
                            });
                          });
             })));

      it('should use first matched animation when multiple animations are registered',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               tcb = tcb.overrideTemplate(DummyIfCmp, `
                      <div @rotate="exp"></div>
                      <div @rotate="exp2"></div>
                    `);
               tcb.overrideAnimations(
                      DummyIfCmp,
                      [
                        trigger(
                            'rotate',
                            [
                              transition(
                                  'start => *',
                                  [
                                    style({'color': 'white'}),
                                    animate(500, style({'color': 'red'}))
                                  ]),
                              transition(
                                  'start => end',
                                  [
                                    style({'color': 'white'}),
                                    animate(500, style({'color': 'pink'}))
                                  ])
                            ]),
                      ])
                   .createAsync(DummyIfCmp)
                   .then((fixture) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = 'start';
                     cmp.exp2 = 'start';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.length).toEqual(0);

                     cmp.exp = 'something';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.length).toEqual(1);

                     var animation1 = driver.log[0];
                     var keyframes1 = animation1['keyframeLookup'];
                     var toStyles1 = keyframes1[1][1];
                     expect(toStyles1['color']).toEqual('red');

                     cmp.exp2 = 'end';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.length).toEqual(2);

                     var animation2 = driver.log[1];
                     var keyframes2 = animation2['keyframeLookup'];
                     var toStyles2 = keyframes2[1][1];
                     expect(toStyles2['color']).toEqual('red');
                   });
             })));

      it('should not remove the element until the void transition animation is complete',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div class="my-if" *ngIf="exp" @myAnimation></div>',
                   trigger(
                       'myAnimation',
                       [transition('* => void', [animate(1000, style({'opacity': 0}))])]),
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = true;
                     fixture.detectChanges();
                     flushMicrotasks();

                     cmp.exp = false;
                     fixture.detectChanges();
                     flushMicrotasks();

                     var player = driver.log[0]['player'];
                     var container = fixture.debugElement.nativeElement;
                     var ifElm = getDOM().querySelector(container, '.my-if');
                     expect(ifElm).toBeTruthy();

                     player.finish();
                     ifElm = getDOM().querySelector(container, '.my-if');
                     expect(ifElm).toBeFalsy();
                   });
             })));

      it('should fill an animation with the missing style values if not defined within an earlier style step',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div @myAnimation="exp"></div>',
                   trigger('myAnimation', [transition(
                                              '* => *',
                                              [
                                                animate(1000, style({'opacity': 0})),
                                                animate(1000, style({'opacity': 1}))
                                              ])]),
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = 'state1';
                     fixture.detectChanges();
                     flushMicrotasks();

                     var animation1 = driver.log[0];
                     var keyframes1 = animation1['keyframeLookup'];
                     expect(keyframes1[0]).toEqual([0, {'opacity': AUTO_STYLE}]);
                     expect(keyframes1[1]).toEqual([1, {'opacity': 0}]);

                     var animation2 = driver.log[1];
                     var keyframes2 = animation2['keyframeLookup'];
                     expect(keyframes2[0]).toEqual([0, {'opacity': 0}]);
                     expect(keyframes2[1]).toEqual([1, {'opacity': 1}]);
                   });
             })));

      it('should perform two transitions in parallel if defined in different state triggers',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div @one="exp" @two="exp2"></div>',
                   [
                     trigger(
                         'one',
                         [transition(
                             'state1 => state2',
                             [style({'opacity': 0}), animate(1000, style({'opacity': 1}))])]),
                     trigger(
                         'two',
                         [transition(
                             'state1 => state2',
                             [style({'width': 100}), animate(1000, style({'width': 1000}))])])
                   ],
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     cmp.exp = 'state1';
                     cmp.exp2 = 'state1';
                     fixture.detectChanges();
                     flushMicrotasks();

                     cmp.exp = 'state2';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.length).toEqual(1);

                     var count = 0;
                     var animation1 = driver.log[0];
                     var player1 = animation1['player'];
                     player1.onDone(() => count++);

                     expect(count).toEqual(0);

                     cmp.exp2 = 'state2';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.length).toEqual(2);
                     expect(count).toEqual(0);

                     var animation2 = driver.log[1];
                     var player2 = animation2['player'];
                     player2.onDone(() => count++);

                     expect(count).toEqual(0);
                     player1.finish();
                     expect(count).toEqual(1);
                     player2.finish();
                     expect(count).toEqual(2);
                   });
             })));
    });

    describe('animation states', () => {
      it('should retain the destination animation state styles once the animation is complete',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div class="target" @status="exp"></div>',
                   [trigger(
                       'status',
                       [
                         state('final', style({'top': '100px'})),
                         transition('* => final', [animate(1000)])
                       ])],
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     var node =
                         getDOM().querySelector(fixture.debugElement.nativeElement, '.target');
                     cmp.exp = 'final';
                     fixture.detectChanges();
                     flushMicrotasks();

                     var animation = driver.log[0];
                     var player = animation['player'];
                     player.finish();

                     expect(getDOM().getStyle(node, 'top')).toEqual('100px');
                   });
             })));

      it('should animate to and retain the default animation state styles once the animation is complete if defined',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div class="target" @status="exp"></div>',
                   [trigger(
                       'status',
                       [
                         state(DEFAULT_STATE, style({'background': 'grey'})),
                         state('green', style({'background': 'green'})),
                         state('red', style({'background': 'red'})),
                         transition('* => *', [animate(1000)])
                       ])],
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     var node =
                         getDOM().querySelector(fixture.debugElement.nativeElement, '.target');
                     cmp.exp = 'green';
                     fixture.detectChanges();
                     flushMicrotasks();

                     var animation = driver.log.pop();
                     var keyframes = animation['keyframeLookup'];
                     expect(keyframes[1]).toEqual([1, {'background': 'green'}]);

                     cmp.exp = 'blue';
                     fixture.detectChanges();
                     flushMicrotasks();

                     animation = driver.log.pop();
                     keyframes = animation['keyframeLookup'];
                     expect(keyframes[0]).toEqual([0, {'background': 'green'}]);
                     expect(keyframes[1]).toEqual([1, {'background': 'grey'}]);

                     cmp.exp = 'red';
                     fixture.detectChanges();
                     flushMicrotasks();

                     animation = driver.log.pop();
                     keyframes = animation['keyframeLookup'];
                     expect(keyframes[0]).toEqual([0, {'background': 'grey'}]);
                     expect(keyframes[1]).toEqual([1, {'background': 'red'}]);

                     cmp.exp = 'orange';
                     fixture.detectChanges();
                     flushMicrotasks();

                     animation = driver.log.pop();
                     keyframes = animation['keyframeLookup'];
                     expect(keyframes[0]).toEqual([0, {'background': 'red'}]);
                     expect(keyframes[1]).toEqual([1, {'background': 'grey'}]);
                   });
             })));

      it('should seed in the origin animation state styles into the first animation step',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div class="target" @status="exp"></div>',
                   [trigger(
                       'status',
                       [
                         state('void', style({'height': '100px'})),
                         transition('* => *', [animate(1000)])
                       ])],
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     var node =
                         getDOM().querySelector(fixture.debugElement.nativeElement, '.target');
                     cmp.exp = 'final';
                     fixture.detectChanges();
                     flushMicrotasks();

                     var animation = driver.log[0];
                     expect(animation['startingStyles']).toEqual({'height': '100px'});
                   });
             })));

      it('should perform a state change even if there is no transition that is found',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div class="target" @status="exp"></div>',
                   [trigger(
                       'status',
                       [
                         state('void', style({'width': '0px'})),
                         state('final', style({'width': '100px'})),
                       ])],
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     var node =
                         getDOM().querySelector(fixture.debugElement.nativeElement, '.target');
                     cmp.exp = 'final';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.length).toEqual(0);
                     flushMicrotasks();

                     expect(getDOM().getStyle(node, 'width')).toEqual('100px');
                   });
             })));

      it('should allow multiple states to be defined with the same styles',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div class="target" @status="exp"></div>',
                   [trigger(
                       'status',
                       [
                         state('a, c', style({'height': '100px'})),
                         state('b, d', style({'width': '100px'})),
                       ])],
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     var node =
                         getDOM().querySelector(fixture.debugElement.nativeElement, '.target');

                     cmp.exp = 'a';
                     fixture.detectChanges();
                     flushMicrotasks();
                     flushMicrotasks();

                     expect(getDOM().getStyle(node, 'height')).toEqual('100px');
                     expect(getDOM().getStyle(node, 'width')).not.toEqual('100px');

                     cmp.exp = 'b';
                     fixture.detectChanges();
                     flushMicrotasks();
                     flushMicrotasks();

                     expect(getDOM().getStyle(node, 'height')).not.toEqual('100px');
                     expect(getDOM().getStyle(node, 'width')).toEqual('100px');

                     cmp.exp = 'c';
                     fixture.detectChanges();
                     flushMicrotasks();
                     flushMicrotasks();

                     expect(getDOM().getStyle(node, 'height')).toEqual('100px');
                     expect(getDOM().getStyle(node, 'width')).not.toEqual('100px');

                     cmp.exp = 'd';
                     fixture.detectChanges();
                     flushMicrotasks();
                     flushMicrotasks();

                     expect(getDOM().getStyle(node, 'height')).not.toEqual('100px');
                     expect(getDOM().getStyle(node, 'width')).toEqual('100px');

                     cmp.exp = 'e';
                     fixture.detectChanges();
                     flushMicrotasks();
                     flushMicrotasks();

                     expect(getDOM().getStyle(node, 'height')).not.toEqual('100px');
                     expect(getDOM().getStyle(node, 'width')).not.toEqual('100px');
                   });
             })));

      it('should allow multiple transitions to be defined with the same sequence',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div class="target" @status="exp"></div>',
                   [trigger(
                       'status',
                       [
                         transition('a => b, b => c', [animate(1000)]),
                         transition('* => *', [animate(300)])
                       ])],
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     var node =
                         getDOM().querySelector(fixture.debugElement.nativeElement, '.target');

                     cmp.exp = 'a';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.pop()['duration']).toEqual(300);

                     cmp.exp = 'b';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.pop()['duration']).toEqual(1000);

                     cmp.exp = 'c';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.pop()['duration']).toEqual(1000);

                     cmp.exp = 'd';
                     fixture.detectChanges();
                     flushMicrotasks();

                     expect(driver.log.pop()['duration']).toEqual(300);
                   });
             })));

      it('should balance the animation with the origin/destination styles as keyframe animation properties',
         inject(
             [TestComponentBuilder, AnimationDriver],
             fakeAsync((tcb: TestComponentBuilder, driver: MockAnimationDriver) => {
               makeAnimationCmp(
                   tcb, '<div class="target" @status="exp"></div>',
                   [trigger(
                       'status',
                       [
                         state('void', style({'height': '100px', 'opacity': 0})),
                         state('final', style({'height': '333px', 'width': '200px'})),
                         transition('void => final', [animate(1000)])
                       ])],
                   (fixture: any /** TODO #9100 */) => {
                     tick();

                     var cmp = fixture.debugElement.componentInstance;
                     var node =
                         getDOM().querySelector(fixture.debugElement.nativeElement, '.target');

                     cmp.exp = 'final';
                     fixture.detectChanges();
                     flushMicrotasks();

                     var animation = driver.log.pop();
                     var keyframes = animation['keyframeLookup'];

                     expect(keyframes[0]).toEqual([
                       0, {'height': '100px', 'opacity': 0, 'width': AUTO_STYLE}
                     ]);

                     expect(keyframes[1]).toEqual([
                       1, {'height': '333px', 'opacity': AUTO_STYLE, 'width': '200px'}
                     ]);
                   });
             })));
    });
  });
}

@Component({
  selector: 'if-cmp',
  directives: [NgIf],
  template: `
    <div *ngIf="exp" @myAnimation="exp"></div>
  `
})
class DummyIfCmp {
  exp = false;
  exp2 = false;
}
