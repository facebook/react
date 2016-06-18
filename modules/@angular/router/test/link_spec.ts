import {AsyncTestCompleter, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';

import {link} from '../src/link';
import {DefaultRouterUrlSerializer} from '../src/router_url_serializer';
import {RouteSegment, RouteTree, TreeNode, UrlSegment, UrlTree} from '../src/segments';

export function main() {
  describe('link', () => {
    let parser = new DefaultRouterUrlSerializer();

    it('should return the original tree when given an empty array', () => {
      let p = parser.parse('/');
      let tree = s(p.root);
      let t = link(tree.root, tree, p, []);
      expect(t).toBe(p);
    });

    it('should navigate to the root', () => {
      let p = parser.parse('/');
      let tree = s(p.root);
      let t = link(tree.root, tree, p, ['/']);
      expect(parser.serialize(t)).toEqual('');
    });

    it('should support nested segments', () => {
      let p = parser.parse('/a/b');
      let tree = s(p.firstChild(p.root));
      let t = link(tree.root, tree, p, ['/one', 11, 'two', 22]);
      expect(parser.serialize(t)).toEqual('/one/11/two/22');
    });

    it('should preserve siblings', () => {
      let p = parser.parse('/a/11/b(c)');
      let tree = s(p.root);
      let t = link(tree.root, tree, p, ['/a', 11, 'd']);
      expect(parser.serialize(t)).toEqual('/a/11/d(aux:c)');
    });

    it('should update matrix parameters', () => {
      let p = parser.parse('/a;aa=11');
      let tree = s(p.root);
      let t = link(tree.root, tree, p, ['/a', {aa: 22, bb: 33}]);
      expect(parser.serialize(t)).toEqual('/a;aa=22;bb=33');
    });

    it('should create matrix parameters', () => {
      let p = parser.parse('/a');
      let tree = s(p.root);
      let t = link(tree.root, tree, p, ['/a', {aa: 22, bb: 33}]);
      expect(parser.serialize(t)).toEqual('/a;aa=22;bb=33');
    });

    it('should create matrix parameters together with other segments', () => {
      let p = parser.parse('/a');
      let tree = s(p.root);
      let t = link(tree.root, tree, p, ['/a', '/b', {aa: 22, bb: 33}]);
      expect(parser.serialize(t)).toEqual('/a/b;aa=22;bb=33');
    });

    describe('node reuse', () => {
      it('should reuse nodes when path is the same', () => {
        let p = parser.parse('/a/b');
        let tree = s(p.root);
        let t = link(tree.root, tree, p, ['/a/c']);

        expect(t.root).toBe(p.root);
        expect(t.firstChild(t.root)).toBe(p.firstChild(p.root));
        expect(t.firstChild(t.firstChild(t.root))).not.toBe(p.firstChild(p.firstChild(p.root)));
      });

      it('should create new node when params are the same', () => {
        let p = parser.parse('/a;x=1');
        let tree = s(p.root);
        let t = link(tree.root, tree, p, ['/a', {'x': 1}]);

        expect(t.firstChild(t.root)).toBe(p.firstChild(p.root));
      });

      it('should create new node when params are different', () => {
        let p = parser.parse('/a;x=1');
        let tree = s(p.root);
        let t = link(tree.root, tree, p, ['/a', {'x': 2}]);

        expect(t.firstChild(t.root)).not.toBe(p.firstChild(p.root));
      });
    });

    describe('relative navigation', () => {
      it('should work', () => {
        let p = parser.parse('/a(ap)/c(cp)');
        let c = p.firstChild(p.root);
        let tree = s(c);
        let t = link(tree.root, tree, p, ['c2']);
        expect(parser.serialize(t)).toEqual('/a(aux:ap)/c2(aux:cp)');
      });

      it('should work when the first command starts with a ./', () => {
        let p = parser.parse('/a(ap)/c(cp)');
        let c = p.firstChild(p.root);
        let tree = s(c);
        let t = link(tree.root, tree, p, ['./c2']);
        expect(parser.serialize(t)).toEqual('/a(aux:ap)/c2(aux:cp)');
      });

      it('should work when the first command is ./)', () => {
        let p = parser.parse('/a(ap)/c(cp)');
        let c = p.firstChild(p.root);
        let tree = s(c);
        let t = link(tree.root, tree, p, ['./', 'c2']);
        expect(parser.serialize(t)).toEqual('/a(aux:ap)/c2(aux:cp)');
      });

      it('should work when given params', () => {
        let p = parser.parse('/a(ap)/c(cp)');
        let c = p.firstChild(p.root);
        let tree = s(c);
        let t = link(tree.root, tree, p, [{'x': 99}]);

        expect(parser.serialize(t)).toEqual('/a(aux:ap)/c;x=99(aux:cp)');
      });

      it('should support going to a parent', () => {
        let p = parser.parse('/a(ap)/c(cp)');
        let a = p.firstChild(p.root);
        let tree = s(a);
        let t = link(tree.root, tree, p, ['../a2']);
        expect(parser.serialize(t)).toEqual('/a2(aux:ap)');
      });

      it('should support going to a parent (nested case)', () => {
        let p = parser.parse('/a/c');
        let c = p.firstChild(p.firstChild(p.root));
        let tree = s(c);
        let t = link(tree.root, tree, p, ['../c2']);
        expect(parser.serialize(t)).toEqual('/a/c2');
      });

      it('should work when given ../', () => {
        let p = parser.parse('/a/c');
        let c = p.firstChild(p.firstChild(p.root));
        let tree = s(c);
        let t = link(tree.root, tree, p, ['../']);
        expect(parser.serialize(t)).toEqual('/a');
      });

      it('should navigate to the root', () => {
        let p = parser.parse('/a/c');
        let c = p.firstChild(p.root);
        let tree = s(c);
        let t = link(tree.root, tree, p, ['../']);
        expect(parser.serialize(t)).toEqual('');
      });

      it('should support setting matrix params', () => {
        let p = parser.parse('/a(ap)/c(cp)');
        let c = p.firstChild(p.root);
        let tree = s(c);
        let t = link(tree.root, tree, p, ['../', {'x': 5}]);
        expect(parser.serialize(t)).toEqual('/a;x=5(aux:ap)');
      });

      it('should throw when too many ..', () => {
        let p = parser.parse('/a(ap)/c(cp)');
        let c = p.firstChild(p.root);
        let tree = s(c);

        expect(() => link(tree.root, tree, p, ['../../']))
            .toThrowError('Invalid number of \'../\'');
      });

      it('should work when the provided segment doesn\'t have url segments', () => {
        let p = parser.parse('/a(ap)/c(cp)');
        let c = p.firstChild(p.root);

        let child = new RouteSegment([], {'one': '1'}, null, null, null);
        let root = new TreeNode<RouteSegment>(
            new RouteSegment([c], {}, null, null, null), [new TreeNode<RouteSegment>(child, [])]);
        let tree = new RouteTree(root);

        let t = link(child, tree, p, ['./c2']);
        expect(parser.serialize(t)).toEqual('/a(aux:ap)/c2(aux:cp)');
      });
    });
  });
}

function s(u: UrlSegment): RouteTree {
  let root = new TreeNode<RouteSegment>(new RouteSegment([u], {}, null, null, null), []);
  return new RouteTree(root);
}
