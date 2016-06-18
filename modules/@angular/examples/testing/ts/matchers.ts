import {expect} from '@angular/core/testing';

var value: any;
var element: any;
var exception: any;

abstract class OtherClass {}
class SomeClass {}

// #docregion toBePromise
expect(value).toBePromise();
// #enddocregion

// #docregion toBeAnInstanceOf
expect(value).toBeAnInstanceOf(SomeClass);
// #enddocregion

// #docregion toHaveText
expect(element).toHaveText('Hello world!');
// #enddocregion

// #docregion toHaveCssClass
expect(element).toHaveCssClass('current');
// #enddocregion

// #docregion toHaveCssStyle
expect(element).toHaveCssStyle({width: '100px', height: 'auto'});
// #enddocregion

// #docregion toContainError
expect(exception).toContainError('Failed to load');
// #enddocregion

// #docregion toThrowErrorWith
expect(() => { throw 'Failed to load'; }).toThrowErrorWith('Failed to load');
// #enddocregion

// #docregion toImplement
expect(SomeClass).toImplement(OtherClass);
// #enddocregion
