import {UrlResolver, createOfflineCompileUrlResolver} from '@angular/compiler/src/url_resolver';
import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';

import {IS_DART} from '../src/facade/lang';

export function main() {
  describe('UrlResolver', () => {
    var resolver = new UrlResolver();

    describe('absolute base url', () => {
      it('should add a relative path to the base url', () => {
        expect(resolver.resolve('http://www.foo.com', 'bar')).toEqual('http://www.foo.com/bar');
        expect(resolver.resolve('http://www.foo.com/', 'bar')).toEqual('http://www.foo.com/bar');
        expect(resolver.resolve('http://www.foo.com', './bar')).toEqual('http://www.foo.com/bar');
        expect(resolver.resolve('http://www.foo.com/', './bar')).toEqual('http://www.foo.com/bar');
      });

      it('should replace the base path', () => {
        expect(resolver.resolve('http://www.foo.com/baz', 'bar')).toEqual('http://www.foo.com/bar');
        expect(resolver.resolve('http://www.foo.com/baz', './bar'))
            .toEqual('http://www.foo.com/bar');
      });

      it('should append to the base path', () => {
        expect(resolver.resolve('http://www.foo.com/baz/', 'bar'))
            .toEqual('http://www.foo.com/baz/bar');
        expect(resolver.resolve('http://www.foo.com/baz/', './bar'))
            .toEqual('http://www.foo.com/baz/bar');
      });

      it('should support ".." in the path', () => {
        expect(resolver.resolve('http://www.foo.com/baz/', '../bar'))
            .toEqual('http://www.foo.com/bar');
        expect(resolver.resolve('http://www.foo.com/1/2/3/', '../../bar'))
            .toEqual('http://www.foo.com/1/bar');
        expect(resolver.resolve('http://www.foo.com/1/2/3/', '../biz/bar'))
            .toEqual('http://www.foo.com/1/2/biz/bar');
        expect(resolver.resolve('http://www.foo.com/1/2/baz', '../../bar'))
            .toEqual('http://www.foo.com/bar');
      });

      it('should ignore the base path when the url has a scheme', () => {
        expect(resolver.resolve('http://www.foo.com', 'http://www.bar.com'))
            .toEqual('http://www.bar.com');
      });

      it('should support absolute urls', () => {
        expect(resolver.resolve('http://www.foo.com', '/bar')).toEqual('http://www.foo.com/bar');
        expect(resolver.resolve('http://www.foo.com/', '/bar')).toEqual('http://www.foo.com/bar');
        expect(resolver.resolve('http://www.foo.com/baz', '/bar'))
            .toEqual('http://www.foo.com/bar');
        expect(resolver.resolve('http://www.foo.com/baz/', '/bar'))
            .toEqual('http://www.foo.com/bar');
      });
    });

    describe('relative base url', () => {
      it('should add a relative path to the base url', () => {
        expect(resolver.resolve('foo/', './bar')).toEqual('foo/bar');
        expect(resolver.resolve('foo/baz', './bar')).toEqual('foo/bar');
        expect(resolver.resolve('foo/baz', 'bar')).toEqual('foo/bar');

      });

      it('should support ".." in the path', () => {
        expect(resolver.resolve('foo/baz', '../bar')).toEqual('bar');
        expect(resolver.resolve('foo/baz', '../biz/bar')).toEqual('biz/bar');
      });

      it('should support absolute urls', () => {
        expect(resolver.resolve('foo/baz', '/bar')).toEqual('/bar');
        expect(resolver.resolve('foo/baz/', '/bar')).toEqual('/bar');
      });

      it('should not resolve urls against the baseUrl when the url contains a scheme', () => {
        resolver = new UrlResolver('my_packages_dir');
        expect(resolver.resolve('base/', 'package:file')).toEqual('my_packages_dir/file');
        expect(resolver.resolve('base/', 'http:super_file')).toEqual('http:super_file');
        expect(resolver.resolve('base/', './mega_file')).toEqual('base/mega_file');
      });
    });

    describe('packages', () => {
      it('should resolve a url based on the application package', () => {
        resolver = new UrlResolver('my_packages_dir');
        expect(resolver.resolve(null, 'package:some/dir/file.txt'))
            .toEqual('my_packages_dir/some/dir/file.txt');
        expect(resolver.resolve(null, 'some/dir/file.txt')).toEqual('some/dir/file.txt');
      });

      it('should contain a default value of "/packages" when nothing is provided for DART',
         inject([UrlResolver], (resolver: UrlResolver) => {
           if (IS_DART) {
             expect(resolver.resolve(null, 'package:file')).toEqual('/packages/file');
           }
         }));

      it('should contain a default value of "/" when nothing is provided for TS/ESM',
         inject([UrlResolver], (resolver: UrlResolver) => {
           if (!IS_DART) {
             expect(resolver.resolve(null, 'package:file')).toEqual('/file');
           }
         }));

      it('should resolve a package value when present within the baseurl', () => {
        resolver = new UrlResolver('/my_special_dir');
        expect(resolver.resolve('package:some_dir/', 'matias.html'))
            .toEqual('/my_special_dir/some_dir/matias.html');
      });
    });

    describe('asset urls', () => {
      var resolver: UrlResolver;
      beforeEach(() => { resolver = createOfflineCompileUrlResolver(); });

      it('should resolve package: urls into asset: urls', () => {
        expect(resolver.resolve(null, 'package:somePkg/somePath'))
            .toEqual('asset:somePkg/lib/somePath');
      });
    });

    describe('corner and error cases', () => {
      it('should encode URLs before resolving',
         () => {
           expect(resolver.resolve('foo/baz', `<p #p>Hello
        </p>`)).toEqual('foo/%3Cp%20#p%3EHello%0A%20%20%20%20%20%20%20%20%3C/p%3E');
         });
    });
  });
}
