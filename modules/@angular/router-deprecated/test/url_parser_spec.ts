import {describe, it, iit, ddescribe, expect, inject, beforeEach,} from '@angular/core/testing/testing_internal';

import {UrlParser, Url} from '../src/url_parser';


export function main() {
  describe('ParsedUrl', () => {
    var urlParser: UrlParser;

    beforeEach(() => { urlParser = new UrlParser(); });

    it('should work in a simple case', () => {
      var url = urlParser.parse('hello/there');
      expect(url.toString()).toEqual('hello/there');
    });

    it('should remove the leading slash', () => {
      var url = urlParser.parse('/hello/there');
      expect(url.toString()).toEqual('hello/there');
    });

    it('should parse an empty URL', () => {
      var url = urlParser.parse('');
      expect(url.toString()).toEqual('');
    });

    it('should work with a single aux route', () => {
      var url = urlParser.parse('hello/there(a)');
      expect(url.toString()).toEqual('hello/there(a)');
    });

    it('should work with multiple aux routes', () => {
      var url = urlParser.parse('hello/there(a//b)');
      expect(url.toString()).toEqual('hello/there(a//b)');
    });

    it('should work with children after an aux route', () => {
      var url = urlParser.parse('hello/there(a//b)/c/d');
      expect(url.toString()).toEqual('hello/there(a//b)/c/d');
    });

    it('should work when aux routes have children', () => {
      var url = urlParser.parse('hello(aa/bb//bb/cc)');
      expect(url.toString()).toEqual('hello(aa/bb//bb/cc)');
    });

    it('should parse an aux route with an aux route', () => {
      var url = urlParser.parse('hello(aa(bb))');
      expect(url.toString()).toEqual('hello(aa(bb))');
    });

    it('should simplify an empty aux route definition', () => {
      var url = urlParser.parse('hello()/there');
      expect(url.toString()).toEqual('hello/there');
    });

    it('should parse a key-value matrix param', () => {
      var url = urlParser.parse('hello/friend;name=bob');
      expect(url.toString()).toEqual('hello/friend;name=bob');
    });

    it('should parse multiple key-value matrix params', () => {
      var url = urlParser.parse('hello/there;greeting=hi;whats=up');
      expect(url.toString()).toEqual('hello/there;greeting=hi;whats=up');
    });

    it('should ignore matrix params on the first segment', () => {
      var url = urlParser.parse('profile;a=1/hi');
      expect(url.toString()).toEqual('profile/hi');
    });

    it('should parse a key-only matrix param', () => {
      var url = urlParser.parse('hello/there;hi');
      expect(url.toString()).toEqual('hello/there;hi');
    });

    it('should parse a URL with just a query param', () => {
      var url = urlParser.parse('?name=bob');
      expect(url.toString()).toEqual('?name=bob');
    });

    it('should parse a key-value query param', () => {
      var url = urlParser.parse('hello/friend?name=bob');
      expect(url.toString()).toEqual('hello/friend?name=bob');
    });

    it('should parse multiple key-value query params', () => {
      var url = urlParser.parse('hello/there?greeting=hi&whats=up');
      expect(url.params).toEqual({'greeting': 'hi', 'whats': 'up'});
      expect(url.toString()).toEqual('hello/there?greeting=hi&whats=up');
    });

    it('should parse a key-only query param', () => {
      var url = urlParser.parse('hello/there?hi');
      expect(url.toString()).toEqual('hello/there?hi');
    });

    it('should parse a route with matrix and query params', () => {
      var url = urlParser.parse('hello/there;sort=asc;unfiltered?hi&friend=true');
      expect(url.toString()).toEqual('hello/there;sort=asc;unfiltered?hi&friend=true');
    });

    it('should parse a route with matrix params and aux routes', () => {
      var url = urlParser.parse('hello/there;sort=asc(modal)');
      expect(url.toString()).toEqual('hello/there;sort=asc(modal)');
    });

    it('should parse an aux route with matrix params', () => {
      var url = urlParser.parse('hello/there(modal;sort=asc)');
      expect(url.toString()).toEqual('hello/there(modal;sort=asc)');
    });

    it('should parse a route with matrix params, aux routes, and query params', () => {
      var url = urlParser.parse('hello/there;sort=asc(modal)?friend=true');
      expect(url.toString()).toEqual('hello/there;sort=asc(modal)?friend=true');
    });
    it('should allow slashes within query parameters', () => {
      var url = urlParser.parse(
          'hello?code=4/B8o0n_Y7XZTb-pVKBw5daZyGAUbMljyLf7uNgTy6ja8&scope=https://www.googleapis.com/auth/analytics');
      expect(url.toString())
          .toEqual(
              'hello?code=4/B8o0n_Y7XZTb-pVKBw5daZyGAUbMljyLf7uNgTy6ja8&scope=https://www.googleapis.com/auth/analytics');
    });
  });
}
