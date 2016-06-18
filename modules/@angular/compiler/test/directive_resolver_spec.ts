import {DirectiveResolver} from '@angular/compiler/src/directive_resolver';
import {ContentChild, ContentChildMetadata, ContentChildren, ContentChildrenMetadata, Directive, DirectiveMetadata, HostBinding, HostListener, Input, Output, ViewChild, ViewChildMetadata, ViewChildren, ViewChildrenMetadata} from '@angular/core/src/metadata';
import {beforeEach, ddescribe, describe, expect, iit, it} from '@angular/core/testing';

@Directive({selector: 'someDirective'})
class SomeDirective {
}

@Directive({selector: 'someChildDirective'})
class SomeChildDirective extends SomeDirective {
}

@Directive({selector: 'someDirective', inputs: ['c']})
class SomeDirectiveWithInputs {
  @Input() a: any /** TODO #9100 */;
  @Input('renamed') b: any /** TODO #9100 */;
  c: any /** TODO #9100 */;
}

@Directive({selector: 'someDirective', outputs: ['c']})
class SomeDirectiveWithOutputs {
  @Output() a: any /** TODO #9100 */;
  @Output('renamed') b: any /** TODO #9100 */;
  c: any /** TODO #9100 */;
}


@Directive({selector: 'someDirective', outputs: ['a']})
class SomeDirectiveWithDuplicateOutputs {
  @Output() a: any /** TODO #9100 */;
}

@Directive({selector: 'someDirective', properties: ['a']})
class SomeDirectiveWithProperties {
}

@Directive({selector: 'someDirective', events: ['a']})
class SomeDirectiveWithEvents {
}

@Directive({selector: 'someDirective'})
class SomeDirectiveWithSetterProps {
  @Input('renamed')
  set a(value: any /** TODO #9100 */) {}
}

@Directive({selector: 'someDirective'})
class SomeDirectiveWithGetterOutputs {
  @Output('renamed')
  get a(): any /** TODO #9100 */ { return null; }
}

@Directive({selector: 'someDirective', host: {'[c]': 'c'}})
class SomeDirectiveWithHostBindings {
  @HostBinding() a: any /** TODO #9100 */;
  @HostBinding('renamed') b: any /** TODO #9100 */;
  c: any /** TODO #9100 */;
}

@Directive({selector: 'someDirective', host: {'(c)': 'onC()'}})
class SomeDirectiveWithHostListeners {
  @HostListener('a')
  onA() {}
  @HostListener('b', ['$event.value'])
  onB(value: any /** TODO #9100 */) {}
}

@Directive({selector: 'someDirective', queries: {'cs': new ContentChildren('c')}})
class SomeDirectiveWithContentChildren {
  @ContentChildren('a') as: any;
  c: any /** TODO #9100 */;
}

@Directive({selector: 'someDirective', queries: {'cs': new ViewChildren('c')}})
class SomeDirectiveWithViewChildren {
  @ViewChildren('a') as: any;
  c: any /** TODO #9100 */;
}

@Directive({selector: 'someDirective', queries: {'c': new ContentChild('c')}})
class SomeDirectiveWithContentChild {
  @ContentChild('a') a: any;
  c: any /** TODO #9100 */;
}

@Directive({selector: 'someDirective', queries: {'c': new ViewChild('c')}})
class SomeDirectiveWithViewChild {
  @ViewChild('a') a: any;
  c: any /** TODO #9100 */;
}

class SomeDirectiveWithoutMetadata {}

export function main() {
  describe('DirectiveResolver', () => {
    var resolver: DirectiveResolver;

    beforeEach(() => { resolver = new DirectiveResolver(); });

    it('should read out the Directive metadata', () => {
      var directiveMetadata = resolver.resolve(SomeDirective);
      expect(directiveMetadata)
          .toEqual(new DirectiveMetadata(
              {selector: 'someDirective', inputs: [], outputs: [], host: {}, queries: {}}));
    });

    it('should throw if not matching metadata is found', () => {
      expect(() => {
        resolver.resolve(SomeDirectiveWithoutMetadata);
      }).toThrowError('No Directive annotation found on SomeDirectiveWithoutMetadata');
    });

    it('should not read parent class Directive metadata', function() {
      var directiveMetadata = resolver.resolve(SomeChildDirective);
      expect(directiveMetadata)
          .toEqual(new DirectiveMetadata(
              {selector: 'someChildDirective', inputs: [], outputs: [], host: {}, queries: {}}));
    });

    describe('inputs', () => {
      it('should append directive inputs', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithInputs);
        expect(directiveMetadata.inputs).toEqual(['c', 'a', 'b: renamed']);
      });

      it('should work with getters and setters', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithSetterProps);
        expect(directiveMetadata.inputs).toEqual(['a: renamed']);
      });

    });

    describe('outputs', () => {
      it('should append directive outputs', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithOutputs);
        expect(directiveMetadata.outputs).toEqual(['c', 'a', 'b: renamed']);
      });

      it('should work with getters and setters', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithGetterOutputs);
        expect(directiveMetadata.outputs).toEqual(['a: renamed']);
      });

      it('should throw if duplicate outputs', () => {
        expect(() => { resolver.resolve(SomeDirectiveWithDuplicateOutputs); })
            .toThrowError(
                `Output event 'a' defined multiple times in 'SomeDirectiveWithDuplicateOutputs'`);
      });
    });

    describe('host', () => {
      it('should append host bindings', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithHostBindings);
        expect(directiveMetadata.host).toEqual({'[c]': 'c', '[a]': 'a', '[renamed]': 'b'});
      });

      it('should append host listeners', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithHostListeners);
        expect(directiveMetadata.host)
            .toEqual({'(c)': 'onC()', '(a)': 'onA()', '(b)': 'onB($event.value)'});
      });
    });

    describe('queries', () => {
      it('should append ContentChildren', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithContentChildren);
        expect(directiveMetadata.queries)
            .toEqual({'cs': new ContentChildren('c'), 'as': new ContentChildren('a')});
      });

      it('should append ViewChildren', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithViewChildren);
        expect(directiveMetadata.queries)
            .toEqual({'cs': new ViewChildren('c'), 'as': new ViewChildren('a')});
      });

      it('should append ContentChild', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithContentChild);
        expect(directiveMetadata.queries)
            .toEqual({'c': new ContentChild('c'), 'a': new ContentChild('a')});
      });

      it('should append ViewChild', () => {
        var directiveMetadata = resolver.resolve(SomeDirectiveWithViewChild);
        expect(directiveMetadata.queries)
            .toEqual({'c': new ViewChild('c'), 'a': new ViewChild('a')});
      });
    });
  });
}
