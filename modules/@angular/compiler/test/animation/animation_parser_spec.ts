import {AnimationAnimateMetadata, AnimationGroupMetadata, AnimationMetadata, AnimationSequenceMetadata, AnimationStyleMetadata, AnimationWithStepsMetadata, animate, group, keyframes, sequence, state, style, transition, trigger} from '@angular/core';
import {AsyncTestCompleter, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';

import {FILL_STYLE_FLAG, flattenStyles} from '../../core_private';
import {AnimationAst, AnimationEntryAst, AnimationGroupAst, AnimationKeyframeAst, AnimationSequenceAst, AnimationStateTransitionAst, AnimationStepAst, AnimationStylesAst} from '../../src/animation/animation_ast';
import {parseAnimationEntry} from '../../src/animation/animation_parser';
import {StringMapWrapper} from '../../src/facade/collection';
import {CompileMetadataResolver} from '../../src/metadata_resolver';

export function main() {
  describe('parseAnimationEntry', () => {
    var combineStyles = (styles: AnimationStylesAst): {[key: string]: string | number} => {
      var flatStyles: {[key: string]: string | number} = {};
      styles.styles.forEach(
          entry => StringMapWrapper.forEach(
              entry, (val: any /** TODO #9100 */, prop: any /** TODO #9100 */) => {
                flatStyles[prop] = val;
              }));
      return flatStyles;
    };

    var collectKeyframeStyles = (keyframe: AnimationKeyframeAst):
        {[key: string]: string | number} => { return combineStyles(keyframe.styles); };

    var collectStepStyles = (step: AnimationStepAst): Array<{[key: string]: string | number}> => {
      var keyframes = step.keyframes;
      var styles: any[] /** TODO #9100 */ = [];
      if (step.startingStyles.styles.length > 0) {
        styles.push(combineStyles(step.startingStyles));
      }
      keyframes.forEach(keyframe => styles.push(collectKeyframeStyles(keyframe)));
      return styles;
    };

    var resolver: any /** TODO #9100 */;
    beforeEach(
        inject([CompileMetadataResolver], (res: CompileMetadataResolver) => { resolver = res; }));

    var parseAnimation = (data: AnimationMetadata[]) => {
      var entry = trigger('myAnimation', [transition('state1 => state2', sequence(data))]);
      var compiledAnimationEntry = resolver.getAnimationEntryMetadata(entry);
      return parseAnimationEntry(compiledAnimationEntry);
    };

    var getAnimationAstFromEntryAst =
        (ast: AnimationEntryAst) => { return ast.stateTransitions[0].animation; }

    var parseAnimationAst = (data: AnimationMetadata[]) => {
      return getAnimationAstFromEntryAst(parseAnimation(data).ast);
    };

    var parseAnimationAndGetErrors = (data: AnimationMetadata[]) => parseAnimation(data).errors;

    it('should merge repeated style steps into a single style ast step entry', () => {
      var ast = parseAnimationAst([
        style({'color': 'black'}), style({'background': 'red'}), style({'opacity': 0}),
        animate(1000, style({'color': 'white', 'background': 'black', 'opacity': 1}))
      ]);

      expect(ast.steps.length).toEqual(1);

      var step = <AnimationStepAst>ast.steps[0];
      expect(step.startingStyles.styles[0])
          .toEqual({'color': 'black', 'background': 'red', 'opacity': 0});

      expect(step.keyframes[0].styles.styles[0])
          .toEqual({'color': 'black', 'background': 'red', 'opacity': 0});

      expect(step.keyframes[1].styles.styles[0])
          .toEqual({'color': 'white', 'background': 'black', 'opacity': 1});
    });

    it('should animate only the styles requested within an animation step', () => {
      var ast = parseAnimationAst([
        style({'color': 'black', 'background': 'blue'}),
        animate(1000, style({'background': 'orange'}))
      ]);

      expect(ast.steps.length).toEqual(1);

      var animateStep = <AnimationStepAst>ast.steps[0];
      var fromKeyframe = animateStep.keyframes[0].styles.styles[0];
      var toKeyframe = animateStep.keyframes[1].styles.styles[0];
      expect(fromKeyframe).toEqual({'background': 'blue'});
      expect(toKeyframe).toEqual({'background': 'orange'});
    });

    it('should populate the starting and duration times propertly', () => {
      var ast = parseAnimationAst([
        style({'color': 'black', 'opacity': 1}),
        animate(1000, style({'color': 'red'})),
        animate(4000, style({'color': 'yellow'})),
        sequence(
            [animate(1000, style({'color': 'blue'})), animate(1000, style({'color': 'grey'}))]),
        group([animate(500, style({'color': 'pink'})), animate(1000, style({'opacity': '0.5'}))]),
        animate(300, style({'color': 'black'})),
      ]);

      expect(ast.steps.length).toEqual(5);

      var step1 = <AnimationStepAst>ast.steps[0];
      expect(step1.playTime).toEqual(1000);
      expect(step1.startTime).toEqual(0);

      var step2 = <AnimationStepAst>ast.steps[1];
      expect(step2.playTime).toEqual(4000);
      expect(step2.startTime).toEqual(1000);

      var seq = <AnimationSequenceAst>ast.steps[2];
      expect(seq.playTime).toEqual(2000);
      expect(seq.startTime).toEqual(5000);

      var step4 = <AnimationStepAst>seq.steps[0];
      expect(step4.playTime).toEqual(1000);
      expect(step4.startTime).toEqual(5000);

      var step5 = <AnimationStepAst>seq.steps[1];
      expect(step5.playTime).toEqual(1000);
      expect(step5.startTime).toEqual(6000);

      var grp = <AnimationGroupAst>ast.steps[3];
      expect(grp.playTime).toEqual(1000);
      expect(grp.startTime).toEqual(7000);

      var step6 = <AnimationStepAst>grp.steps[0];
      expect(step6.playTime).toEqual(500);
      expect(step6.startTime).toEqual(7000);

      var step7 = <AnimationStepAst>grp.steps[1];
      expect(step7.playTime).toEqual(1000);
      expect(step7.startTime).toEqual(7000);

      var step8 = <AnimationStepAst>ast.steps[4];
      expect(step8.playTime).toEqual(300);
      expect(step8.startTime).toEqual(8000);
    });

    it('should apply the correct animate() styles when parallel animations are active and use the same properties',
       () => {
         var details = parseAnimation([
           style({'opacity': 0, 'color': 'red'}), group([
             sequence([
               animate(2000, style({'color': 'black'})),
               animate(2000, style({'opacity': 0.5})),
             ]),
             sequence([
               animate(2000, style({'opacity': 0.8})),
               animate(2000, style({'color': 'blue'}))
             ])
           ])
         ]);

         var errors = details.errors;
         expect(errors.length).toEqual(0);

         var ast = <AnimationSequenceAst>getAnimationAstFromEntryAst(details.ast);
         var g1 = <AnimationGroupAst>ast.steps[1];

         var sq1 = <AnimationSequenceAst>g1.steps[0];
         var sq2 = <AnimationSequenceAst>g1.steps[1];

         var sq1a1 = <AnimationStepAst>sq1.steps[0];
         expect(collectStepStyles(sq1a1)).toEqual([{'color': 'red'}, {'color': 'black'}]);

         var sq1a2 = <AnimationStepAst>sq1.steps[1];
         expect(collectStepStyles(sq1a2)).toEqual([{'opacity': 0.8}, {'opacity': 0.5}]);

         var sq2a1 = <AnimationStepAst>sq2.steps[0];
         expect(collectStepStyles(sq2a1)).toEqual([{'opacity': 0}, {'opacity': 0.8}]);

         var sq2a2 = <AnimationStepAst>sq2.steps[1];
         expect(collectStepStyles(sq2a2)).toEqual([{'color': 'black'}, {'color': 'blue'}]);
       });

    it('should throw errors when animations animate a CSS property at the same time', () => {
      var animation1 = parseAnimation([
        style({'opacity': 0}),
        group([animate(1000, style({'opacity': 1})), animate(2000, style({'opacity': 0.5}))])
      ]);

      var errors1 = animation1.errors;
      expect(errors1.length).toEqual(1);
      expect(errors1[0].msg)
          .toContainError(
              'The animated CSS property "opacity" unexpectedly changes between steps "0ms" and "2000ms" at "1000ms"');

      var animation2 = parseAnimation([
        style({'color': 'red'}),
        group(
            [animate(5000, style({'color': 'blue'})), animate(2500, style({'color': 'black'}))])
      ]);

      var errors2 = animation2.errors;
      expect(errors2.length).toEqual(1);
      expect(errors2[0].msg)
          .toContainError(
              'The animated CSS property "color" unexpectedly changes between steps "0ms" and "5000ms" at "2500ms"');
    });

    it('should return an error when an animation style contains an invalid timing value', () => {
      var errors = parseAnimationAndGetErrors(
          [style({'opacity': 0}), animate('one second', style({'opacity': 1}))]);
      expect(errors[0].msg).toContainError(`The provided timing value "one second" is invalid.`);
    });

    it('should collect and return any errors collected when parsing the metadata', () => {
      var errors = parseAnimationAndGetErrors([
        style({'opacity': 0}), animate('one second', style({'opacity': 1})), style({'opacity': 0}),
        animate('one second', null), style({'background': 'red'})
      ]);
      expect(errors.length).toBeGreaterThan(1);
    });

    it('should normalize a series of keyframe styles into a list of offset steps', () => {
      var ast = parseAnimationAst([animate(1000, keyframes([
                                             style({'width': 0}), style({'width': 25}),
                                             style({'width': 50}), style({'width': 75})
                                           ]))]);

      var step = <AnimationStepAst>ast.steps[0];
      expect(step.keyframes.length).toEqual(4);

      expect(step.keyframes[0].offset).toEqual(0);
      expect(step.keyframes[1].offset).toMatchPattern(/^0\.33/);
      expect(step.keyframes[2].offset).toMatchPattern(/^0\.66/);
      expect(step.keyframes[3].offset).toEqual(1);
    });

    it('should use an existing collection of offset steps if provided', () => {
      var ast = parseAnimationAst(
          [animate(1000, keyframes([
                     style({'height': 0, 'offset': 0}), style({'height': 25, 'offset': 0.6}),
                     style({'height': 50, 'offset': 0.7}), style({'height': 75, 'offset': 1})
                   ]))]);

      var step = <AnimationStepAst>ast.steps[0];
      expect(step.keyframes.length).toEqual(4);

      expect(step.keyframes[0].offset).toEqual(0);
      expect(step.keyframes[1].offset).toEqual(0.6);
      expect(step.keyframes[2].offset).toEqual(0.7);
      expect(step.keyframes[3].offset).toEqual(1);
    });

    it('should sort the provided collection of steps that contain offsets', () => {
      var ast = parseAnimationAst([animate(
          1000, keyframes([
            style({'opacity': 0, 'offset': 0.9}), style({'opacity': .25, 'offset': 0}),
            style({'opacity': .50, 'offset': 1}), style({'opacity': .75, 'offset': 0.91})
          ]))]);

      var step = <AnimationStepAst>ast.steps[0];
      expect(step.keyframes.length).toEqual(4);

      expect(step.keyframes[0].offset).toEqual(0);
      expect(step.keyframes[0].styles.styles[0]['opacity']).toEqual(.25);

      expect(step.keyframes[1].offset).toEqual(0.9);
      expect(step.keyframes[1].styles.styles[0]['opacity']).toEqual(0);

      expect(step.keyframes[2].offset).toEqual(0.91);
      expect(step.keyframes[2].styles.styles[0]['opacity']).toEqual(.75);

      expect(step.keyframes[3].offset).toEqual(1);
      expect(step.keyframes[3].styles.styles[0]['opacity']).toEqual(.50);
    });

    it('should throw an error if a partial amount of keyframes contain an offset', () => {
      var errors = parseAnimationAndGetErrors(
          [animate(1000, keyframes([
                     style({'z-index': 0, 'offset': 0}), style({'z-index': 1}),
                     style({'z-index': 2, 'offset': 1})
                   ]))]);

      expect(errors.length).toEqual(1);
      var error = errors[0];

      expect(error.msg).toMatchPattern(/Not all style\(\) entries contain an offset/);
    });

    it('should use an existing style used earlier in the animation sequence if not defined in the first keyframe',
       () => {
         var ast = parseAnimationAst([animate(
             1000,
             keyframes(
                 [style({'color': 'red'}), style({'background': 'blue', 'color': 'white'})]))]);

         var keyframesStep = <AnimationStepAst>ast.steps[0];
         var kf1 = keyframesStep.keyframes[0];
         var kf2 = keyframesStep.keyframes[1];

         expect(flattenStyles(kf1.styles.styles))
             .toEqual({'color': 'red', 'background': FILL_STYLE_FLAG});
       });

    it('should copy over any missing styles to the final keyframe if not already defined', () => {
      var ast = parseAnimationAst([animate(
          1000, keyframes([
            style({'color': 'white', 'border-color': 'white'}),
            style({'color': 'red', 'background': 'blue'}), style({'background': 'blue'})
          ]))]);

      var keyframesStep = <AnimationStepAst>ast.steps[0];
      var kf1 = keyframesStep.keyframes[0];
      var kf2 = keyframesStep.keyframes[1];
      var kf3 = keyframesStep.keyframes[2];

      expect(flattenStyles(kf3.styles.styles))
          .toEqual({'background': 'blue', 'color': 'red', 'border-color': 'white'});
    });

    it('should create an initial keyframe if not detected and place all keyframes styles there',
       () => {
         var ast = parseAnimationAst(
             [animate(1000, keyframes([
                        style({'color': 'white', 'background': 'black', 'offset': 0.5}), style({
                          'color': 'orange',
                          'background': 'red',
                          'font-size': '100px',
                          'offset': 1
                        })
                      ]))]);

         var keyframesStep = <AnimationStepAst>ast.steps[0];
         expect(keyframesStep.keyframes.length).toEqual(3);
         var kf1 = keyframesStep.keyframes[0];
         var kf2 = keyframesStep.keyframes[1];
         var kf3 = keyframesStep.keyframes[2];

         expect(kf1.offset).toEqual(0);
         expect(flattenStyles(kf1.styles.styles)).toEqual({
           'font-size': FILL_STYLE_FLAG,
           'background': FILL_STYLE_FLAG,
           'color': FILL_STYLE_FLAG
         });
       });

    it('should create an destination keyframe if not detected and place all keyframes styles there',
       () => {
         var ast = parseAnimationAst([animate(1000, keyframes([
                                                style({
                                                  'color': 'white',
                                                  'background': 'black',
                                                  'transform': 'rotate(360deg)',
                                                  'offset': 0
                                                }),
                                                style({
                                                  'color': 'orange',
                                                  'background': 'red',
                                                  'font-size': '100px',
                                                  'offset': 0.5
                                                })
                                              ]))]);

         var keyframesStep = <AnimationStepAst>ast.steps[0];
         expect(keyframesStep.keyframes.length).toEqual(3);
         var kf1 = keyframesStep.keyframes[0];
         var kf2 = keyframesStep.keyframes[1];
         var kf3 = keyframesStep.keyframes[2];

         expect(kf3.offset).toEqual(1);
         expect(flattenStyles(kf3.styles.styles)).toEqual({
           'color': 'orange',
           'background': 'red',
           'transform': 'rotate(360deg)',
           'font-size': '100px'
         });
       });

    describe('easing / duration / delay', () => {
      it('should parse simple string-based values', () => {
        var ast = parseAnimationAst([animate('1s .5s ease-out', style({'opacity': 1}))]);

        var step = <AnimationStepAst>ast.steps[0];
        expect(step.duration).toEqual(1000);
        expect(step.delay).toEqual(500);
        expect(step.easing).toEqual('ease-out');
      });

      it('should parse a numeric duration value', () => {
        var ast = parseAnimationAst([animate(666, style({'opacity': 1}))]);

        var step = <AnimationStepAst>ast.steps[0];
        expect(step.duration).toEqual(666);
        expect(step.delay).toEqual(0);
        expect(step.easing).toBeFalsy();
      });

      it('should parse an easing value without a delay', () => {
        var ast = parseAnimationAst([animate('5s linear', style({'opacity': 1}))]);

        var step = <AnimationStepAst>ast.steps[0];
        expect(step.duration).toEqual(5000);
        expect(step.delay).toEqual(0);
        expect(step.easing).toEqual('linear');
      });

      it('should parse a complex easing value', () => {
        var ast =
            parseAnimationAst([animate('30ms cubic-bezier(0, 0,0, .69)', style({'opacity': 1}))]);

        var step = <AnimationStepAst>ast.steps[0];
        expect(step.duration).toEqual(30);
        expect(step.delay).toEqual(0);
        expect(step.easing).toEqual('cubic-bezier(0, 0,0, .69)');
      });
    });
  });
}
