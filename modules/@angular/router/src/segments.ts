import {ComponentFactory, Type} from '@angular/core';

import {DEFAULT_OUTLET_NAME} from './constants';
import {ListWrapper, StringMapWrapper} from './facade/collection';
import {NumberWrapper, isBlank, isPresent, stringify} from './facade/lang';

export class Tree<T> {
  /** @internal */
  _root: TreeNode<T>;

  constructor(root: TreeNode<T>) { this._root = root; }

  get root(): T { return this._root.value; }

  parent(t: T): T {
    let p = this.pathFromRoot(t);
    return p.length > 1 ? p[p.length - 2] : null;
  }

  children(t: T): T[] {
    let n = _findNode(t, this._root);
    return isPresent(n) ? n.children.map(t => t.value) : null;
  }

  firstChild(t: T): T {
    let n = _findNode(t, this._root);
    return isPresent(n) && n.children.length > 0 ? n.children[0].value : null;
  }

  pathFromRoot(t: T): T[] { return _findPath(t, this._root, []).map(s => s.value); }

  contains(tree: Tree<T>): boolean { return _contains(this._root, tree._root); }
}

export class UrlTree extends Tree<UrlSegment> {
  constructor(root: TreeNode<UrlSegment>) { super(root); }
}

export class RouteTree extends Tree<RouteSegment> {
  constructor(root: TreeNode<RouteSegment>) { super(root); }
}

export function rootNode<T>(tree: Tree<T>): TreeNode<T> {
  return tree._root;
}

function _findNode<T>(expected: T, c: TreeNode<T>): TreeNode<T> {
  if (expected === c.value) return c;
  for (let cc of c.children) {
    let r = _findNode(expected, cc);
    if (isPresent(r)) return r;
  }
  return null;
}

function _findPath<T>(expected: T, c: TreeNode<T>, collected: TreeNode<T>[]): TreeNode<T>[] {
  collected.push(c);
  if (expected === c.value) return collected;

  for (let cc of c.children) {
    let r = _findPath(expected, cc, ListWrapper.clone(collected));
    if (isPresent(r)) return r;
  }

  return null;
}

function _contains<T>(tree: TreeNode<T>, subtree: TreeNode<T>): boolean {
  if (tree.value !== subtree.value) return false;

  for (let subtreeNode of subtree.children) {
    let s = tree.children.filter(child => child.value === subtreeNode.value);
    if (s.length === 0) return false;
    if (!_contains(s[0], subtreeNode)) return false;
  }

  return true;
}

export class TreeNode<T> {
  constructor(public value: T, public children: TreeNode<T>[]) {}
}

export class UrlSegment {
  constructor(
      public segment: any, public parameters: {[key: string]: string}, public outlet: string) {}

  toString(): string {
    let outletPrefix = isBlank(this.outlet) ? '' : `${this.outlet}:`;
    return `${outletPrefix}${this.segment}${_serializeParams(this.parameters)}`;
  }
}

function _serializeParams(params: {[key: string]: string}): string {
  let res = '';
  StringMapWrapper.forEach(
      params, (v: any /** TODO #9100 */, k: any /** TODO #9100 */) => res += `;${k}=${v}`);
  return res;
}

export class RouteSegment {
  /** @internal */
  _type: Type;

  /** @internal */
  _componentFactory: ComponentFactory<any>;

  constructor(
      public urlSegments: UrlSegment[], public parameters: {[key: string]: string},
      public outlet: string, type: Type, componentFactory: ComponentFactory<any>) {
    this._type = type;
    this._componentFactory = componentFactory;
  }

  getParam(param: string): string {
    return isPresent(this.parameters) ? this.parameters[param] : null;
  }

  getParamAsNumber(param: string): number {
    return isPresent(this.parameters) ? NumberWrapper.parseFloat(this.parameters[param]) : null;
  }

  get type(): Type { return this._type; }

  get stringifiedUrlSegments(): string { return this.urlSegments.map(s => s.toString()).join('/'); }
}

export function createEmptyRouteTree(type: Type): RouteTree {
  let root = new RouteSegment([new UrlSegment('', {}, null)], {}, DEFAULT_OUTLET_NAME, type, null);
  return new RouteTree(new TreeNode<RouteSegment>(root, []));
}

export function serializeRouteSegmentTree(tree: RouteTree): string {
  return _serializeRouteSegmentTree(tree._root);
}

function _serializeRouteSegmentTree(node: TreeNode<RouteSegment>): string {
  let v = node.value;
  let children = node.children.map(c => _serializeRouteSegmentTree(c)).join(', ');
  return `${v.outlet}:${v.stringifiedUrlSegments}(${stringify(v.type)}) [${children}]`;
}

export function equalUrlSegments(a: UrlSegment[], b: UrlSegment[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i].segment != b[i].segment) return false;
    if (a[i].outlet != b[i].outlet) return false;
    if (!StringMapWrapper.equals(a[i].parameters, b[i].parameters)) return false;
  }

  return true;
}

export function routeSegmentComponentFactory(a: RouteSegment): ComponentFactory<any> {
  return a._componentFactory;
}
