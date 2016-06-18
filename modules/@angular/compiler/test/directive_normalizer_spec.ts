import {CompileTemplateMetadata, CompileTypeMetadata} from '@angular/compiler/src/compile_metadata';
import {CompilerConfig} from '@angular/compiler/src/config';
import {DirectiveNormalizer} from '@angular/compiler/src/directive_normalizer';
import {XHR} from '@angular/compiler/src/xhr';
import {MockXHR} from '@angular/compiler/testing';
import {ViewEncapsulation} from '@angular/core/src/metadata/view';
import {beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {TEST_PROVIDERS} from './test_bindings';

export function main() {
  describe('DirectiveNormalizer', () => {
    var dirType: CompileTypeMetadata;
    var dirTypeWithHttpUrl: CompileTypeMetadata;

    beforeEachProviders(() => TEST_PROVIDERS);

    beforeEach(() => {
      dirType = new CompileTypeMetadata({moduleUrl: 'package:some/module/a.js', name: 'SomeComp'});
      dirTypeWithHttpUrl =
          new CompileTypeMetadata({moduleUrl: 'http://some/module/a.js', name: 'SomeComp'});
    });

    describe('loadTemplate', () => {
      describe('inline template', () => {
        it('should store the template',
           inject(
               [AsyncTestCompleter, DirectiveNormalizer],
               (async: AsyncTestCompleter, normalizer: DirectiveNormalizer) => {
                 normalizer
                     .normalizeTemplate(dirType, new CompileTemplateMetadata({
                                          encapsulation: null,
                                          template: 'a',
                                          templateUrl: null,
                                          styles: [],
                                          styleUrls: ['test.css']
                                        }))
                     .then((template: CompileTemplateMetadata) => {
                       expect(template.template).toEqual('a');
                       expect(template.templateUrl).toEqual('package:some/module/a.js');
                       async.done();
                     });
               }));

        it('should resolve styles on the annotation against the moduleUrl',
           inject(
               [AsyncTestCompleter, DirectiveNormalizer],
               (async: AsyncTestCompleter, normalizer: DirectiveNormalizer) => {
                 normalizer
                     .normalizeTemplate(dirType, new CompileTemplateMetadata({
                                          encapsulation: null,
                                          template: '',
                                          templateUrl: null,
                                          styles: [],
                                          styleUrls: ['test.css']
                                        }))
                     .then((template: CompileTemplateMetadata) => {
                       expect(template.styleUrls).toEqual(['package:some/module/test.css']);
                       async.done();
                     });
               }));

        it('should resolve styles in the template against the moduleUrl',
           inject(
               [AsyncTestCompleter, DirectiveNormalizer],
               (async: AsyncTestCompleter, normalizer: DirectiveNormalizer) => {
                 normalizer
                     .normalizeTemplate(dirType, new CompileTemplateMetadata({
                                          encapsulation: null,
                                          template: '<style>@import test.css</style>',
                                          templateUrl: null,
                                          styles: [],
                                          styleUrls: []
                                        }))
                     .then((template: CompileTemplateMetadata) => {
                       expect(template.styleUrls).toEqual(['package:some/module/test.css']);
                       async.done();
                     });
               }));

        it('should use ViewEncapsulation.Emulated by default',
           inject(
               [AsyncTestCompleter, DirectiveNormalizer],
               (async: AsyncTestCompleter, normalizer: DirectiveNormalizer) => {
                 normalizer
                     .normalizeTemplate(dirType, new CompileTemplateMetadata({
                                          encapsulation: null,
                                          template: '',
                                          templateUrl: null,
                                          styles: [],
                                          styleUrls: ['test.css']
                                        }))
                     .then((template: CompileTemplateMetadata) => {
                       expect(template.encapsulation).toEqual(ViewEncapsulation.Emulated);
                       async.done();
                     });
               }));

        it('should use default encapsulation provided by CompilerConfig',
           inject(
               [AsyncTestCompleter, CompilerConfig, DirectiveNormalizer],
               (async: AsyncTestCompleter, config: CompilerConfig,
                normalizer: DirectiveNormalizer) => {
                 config.defaultEncapsulation = ViewEncapsulation.None;
                 normalizer
                     .normalizeTemplate(dirType, new CompileTemplateMetadata({
                                          encapsulation: null,
                                          template: '',
                                          templateUrl: null,
                                          styles: [],
                                          styleUrls: ['test.css']
                                        }))
                     .then((template: CompileTemplateMetadata) => {
                       expect(template.encapsulation).toEqual(ViewEncapsulation.None);
                       async.done();
                     });
               }));
      });

      describe('templateUrl', () => {

        it('should load a template from a url that is resolved against moduleUrl',
           inject(
               [AsyncTestCompleter, DirectiveNormalizer, XHR],
               (async: AsyncTestCompleter, normalizer: DirectiveNormalizer, xhr: MockXHR) => {
                 xhr.expect('package:some/module/sometplurl.html', 'a');
                 normalizer
                     .normalizeTemplate(dirType, new CompileTemplateMetadata({
                                          encapsulation: null,
                                          template: null,
                                          templateUrl: 'sometplurl.html',
                                          styles: [],
                                          styleUrls: ['test.css']
                                        }))
                     .then((template: CompileTemplateMetadata) => {
                       expect(template.template).toEqual('a');
                       expect(template.templateUrl).toEqual('package:some/module/sometplurl.html');
                       async.done();
                     });
                 xhr.flush();
               }));

        it('should resolve styles on the annotation against the moduleUrl',
           inject(
               [AsyncTestCompleter, DirectiveNormalizer, XHR],
               (async: AsyncTestCompleter, normalizer: DirectiveNormalizer, xhr: MockXHR) => {
                 xhr.expect('package:some/module/tpl/sometplurl.html', '');
                 normalizer
                     .normalizeTemplate(dirType, new CompileTemplateMetadata({
                                          encapsulation: null,
                                          template: null,
                                          templateUrl: 'tpl/sometplurl.html',
                                          styles: [],
                                          styleUrls: ['test.css']
                                        }))
                     .then((template: CompileTemplateMetadata) => {
                       expect(template.styleUrls).toEqual(['package:some/module/test.css']);
                       async.done();
                     });
                 xhr.flush();
               }));

        it('should resolve styles in the template against the templateUrl',
           inject(
               [AsyncTestCompleter, DirectiveNormalizer, XHR],
               (async: AsyncTestCompleter, normalizer: DirectiveNormalizer, xhr: MockXHR) => {
                 xhr.expect(
                     'package:some/module/tpl/sometplurl.html', '<style>@import test.css</style>');
                 normalizer
                     .normalizeTemplate(dirType, new CompileTemplateMetadata({
                                          encapsulation: null,
                                          template: null,
                                          templateUrl: 'tpl/sometplurl.html',
                                          styles: [],
                                          styleUrls: []
                                        }))
                     .then((template: CompileTemplateMetadata) => {
                       expect(template.styleUrls).toEqual(['package:some/module/tpl/test.css']);
                       async.done();
                     });
                 xhr.flush();
               }));

      });

      it('should throw if no template was specified',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           expect(
               () => normalizer.normalizeTemplate(
                   dirType,
                   new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []})))
               .toThrowError('No template specified for component SomeComp');
         }));

    });

    describe('normalizeLoadedTemplate', () => {
      it('should store the viewEncapsulationin the result',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {

           var viewEncapsulation = ViewEncapsulation.Native;
           var template = normalizer.normalizeLoadedTemplate(
               dirType, new CompileTemplateMetadata(
                            {encapsulation: viewEncapsulation, styles: [], styleUrls: []}),
               '', 'package:some/module/');
           expect(template.encapsulation).toBe(viewEncapsulation);
         }));

      it('should keep the template as html',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}), 'a',
               'package:some/module/');
           expect(template.template).toEqual('a')
         }));

      it('should collect ngContent',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<ng-content select="a"></ng-content>', 'package:some/module/');
           expect(template.ngContentSelectors).toEqual(['a']);
         }));

      it('should normalize ngContent wildcard selector',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<ng-content></ng-content><ng-content select></ng-content><ng-content select="*"></ng-content>',
               'package:some/module/');
           expect(template.ngContentSelectors).toEqual(['*', '*', '*']);
         }));

      it('should collect top level styles in the template',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<style>a</style>', 'package:some/module/');
           expect(template.styles).toEqual(['a']);
         }));

      it('should collect styles inside in elements',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<div><style>a</style></div>', 'package:some/module/');
           expect(template.styles).toEqual(['a']);
         }));

      it('should collect styleUrls in the template',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<link rel="stylesheet" href="aUrl">', 'package:some/module/');
           expect(template.styleUrls).toEqual(['package:some/module/aUrl']);
         }));

      it('should collect styleUrls in elements',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<div><link rel="stylesheet" href="aUrl"></div>', 'package:some/module/');
           expect(template.styleUrls).toEqual(['package:some/module/aUrl']);
         }));

      it('should ignore link elements with non stylesheet rel attribute',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<link href="b" rel="a">', 'package:some/module/');
           expect(template.styleUrls).toEqual([]);
         }));

      it('should ignore link elements with absolute urls but non package: scheme',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<link href="http://some/external.css" rel="stylesheet">', 'package:some/module/');
           expect(template.styleUrls).toEqual([]);
         }));

      it('should extract @import style urls into styleAbsUrl',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType, new CompileTemplateMetadata(
                            {encapsulation: null, styles: ['@import "test.css";'], styleUrls: []}),
               '', 'package:some/module/id');
           expect(template.styles).toEqual(['']);
           expect(template.styleUrls).toEqual(['package:some/module/test.css']);
         }));

      it('should not resolve relative urls in inline styles',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType, new CompileTemplateMetadata({
                 encapsulation: null,
                 styles: ['.foo{background-image: url(\'double.jpg\');'],
                 styleUrls: []
               }),
               '', 'package:some/module/id');
           expect(template.styles).toEqual(['.foo{background-image: url(\'double.jpg\');']);
         }));

      it('should resolve relative style urls in styleUrls',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType, new CompileTemplateMetadata(
                            {encapsulation: null, styles: [], styleUrls: ['test.css']}),
               '', 'package:some/module/id');
           expect(template.styles).toEqual([]);
           expect(template.styleUrls).toEqual(['package:some/module/test.css']);
         }));

      it('should resolve relative style urls in styleUrls with http directive url',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirTypeWithHttpUrl, new CompileTemplateMetadata(
                                       {encapsulation: null, styles: [], styleUrls: ['test.css']}),
               '', 'http://some/module/id');
           expect(template.styles).toEqual([]);
           expect(template.styleUrls).toEqual(['http://some/module/test.css']);
         }));

      it('should normalize ViewEncapsulation.Emulated to ViewEncapsulation.None if there are no styles nor stylesheets',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType, new CompileTemplateMetadata(
                            {encapsulation: ViewEncapsulation.Emulated, styles: [], styleUrls: []}),
               '', 'package:some/module/id');
           expect(template.encapsulation).toEqual(ViewEncapsulation.None);
         }));

      it('should ignore ng-content in elements with ngNonBindable',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<div ngNonBindable><ng-content select="a"></ng-content></div>',
               'package:some/module/');
           expect(template.ngContentSelectors).toEqual([]);
         }));

      it('should still collect <style> in elements with ngNonBindable',
         inject([DirectiveNormalizer], (normalizer: DirectiveNormalizer) => {
           var template = normalizer.normalizeLoadedTemplate(
               dirType,
               new CompileTemplateMetadata({encapsulation: null, styles: [], styleUrls: []}),
               '<div ngNonBindable><style>div {color:red}</style></div>', 'package:some/module/');
           expect(template.styles).toEqual(['div {color:red}']);
         }));
    });
  });
}
