import {ListWrapper, StringMapWrapper} from './facade/collection';
import {BaseException} from './facade/exceptions';
import {isBlank, isPresent, isString, isStringMap} from './facade/lang';
import {RouteSegment, RouteTree, Tree, TreeNode, UrlSegment, UrlTree, rootNode} from './segments';

export function link(
    segment: RouteSegment, routeTree: RouteTree, urlTree: UrlTree, commands: any[]): UrlTree {
  if (commands.length === 0) return urlTree;

  let normalizedCommands = _normalizeCommands(commands);
  if (_navigateToRoot(normalizedCommands)) {
    return new UrlTree(new TreeNode<UrlSegment>(urlTree.root, []));
  }

  let startingNode = _findStartingNode(normalizedCommands, urlTree, segment, routeTree);
  let updated = normalizedCommands.commands.length > 0 ?
      _updateMany(ListWrapper.clone(startingNode.children), normalizedCommands.commands) :
      [];
  let newRoot = _constructNewTree(rootNode(urlTree), startingNode, updated);

  return new UrlTree(newRoot);
}

function _navigateToRoot(normalizedChange: _NormalizedNavigationCommands): boolean {
  return normalizedChange.isAbsolute && normalizedChange.commands.length === 1 &&
      normalizedChange.commands[0] == '/';
}

class _NormalizedNavigationCommands {
  constructor(
      public isAbsolute: boolean, public numberOfDoubleDots: number, public commands: any[]) {}
}

function _normalizeCommands(commands: any[]): _NormalizedNavigationCommands {
  if (isString(commands[0]) && commands.length === 1 && commands[0] == '/') {
    return new _NormalizedNavigationCommands(true, 0, commands);
  }

  let numberOfDoubleDots = 0;
  let isAbsolute = false;
  let res: any[] /** TODO #9100 */ = [];

  for (let i = 0; i < commands.length; ++i) {
    let c = commands[i];

    if (!isString(c)) {
      res.push(c);
      continue;
    }

    let parts = c.split('/');
    for (let j = 0; j < parts.length; ++j) {
      let cc = parts[j];

      // first exp is treated in a special way
      if (i == 0) {
        if (j == 0 && cc == '.') {  //  './a'
          // skip it
        } else if (j == 0 && cc == '') {  //  '/a'
          isAbsolute = true;
        } else if (cc == '..') {  //  '../a'
          numberOfDoubleDots++;
        } else if (cc != '') {
          res.push(cc);
        }

      } else {
        if (cc != '') {
          res.push(cc);
        }
      }
    }
  }

  return new _NormalizedNavigationCommands(isAbsolute, numberOfDoubleDots, res);
}

function _findUrlSegment(
    segment: RouteSegment, routeTree: RouteTree, urlTree: UrlTree,
    numberOfDoubleDots: number): UrlSegment {
  let s = segment;
  while (s.urlSegments.length === 0) {
    s = routeTree.parent(s);
  }
  let urlSegment = ListWrapper.last(s.urlSegments);
  let path = urlTree.pathFromRoot(urlSegment);
  if (path.length <= numberOfDoubleDots) {
    throw new BaseException('Invalid number of \'../\'');
  }
  return path[path.length - 1 - numberOfDoubleDots];
}

function _findStartingNode(
    normalizedChange: _NormalizedNavigationCommands, urlTree: UrlTree, segment: RouteSegment,
    routeTree: RouteTree): TreeNode<UrlSegment> {
  if (normalizedChange.isAbsolute) {
    return rootNode(urlTree);
  } else {
    let urlSegment =
        _findUrlSegment(segment, routeTree, urlTree, normalizedChange.numberOfDoubleDots);
    return _findMatchingNode(urlSegment, rootNode(urlTree));
  }
}

function _findMatchingNode(segment: UrlSegment, node: TreeNode<UrlSegment>): TreeNode<UrlSegment> {
  if (node.value === segment) return node;
  for (var c of node.children) {
    let r = _findMatchingNode(segment, c);
    if (isPresent(r)) return r;
  }
  return null;
}

function _constructNewTree(
    node: TreeNode<UrlSegment>, original: TreeNode<UrlSegment>,
    updated: TreeNode<UrlSegment>[]): TreeNode<UrlSegment> {
  if (node === original) {
    return new TreeNode<UrlSegment>(node.value, updated);
  } else {
    return new TreeNode<UrlSegment>(
        node.value, node.children.map(c => _constructNewTree(c, original, updated)));
  }
}

function _update(node: TreeNode<UrlSegment>, commands: any[]): TreeNode<UrlSegment> {
  let rest = commands.slice(1);
  let next = rest.length === 0 ? null : rest[0];
  let outlet = _outlet(commands);
  let segment = _segment(commands);

  // reach the end of the tree => create new tree nodes.
  if (isBlank(node) && !isStringMap(next)) {
    let urlSegment = new UrlSegment(segment, {}, outlet);
    let children = rest.length === 0 ? [] : [_update(null, rest)];
    return new TreeNode<UrlSegment>(urlSegment, children);

  } else if (isBlank(node) && isStringMap(next)) {
    let urlSegment = new UrlSegment(segment, _stringify(next), outlet);
    return _recurse(urlSegment, node, rest.slice(1));

    // different outlet => preserve the subtree
  } else if (outlet != node.value.outlet) {
    return node;

    // params command
  } else if (isStringMap(segment)) {
    let newSegment = new UrlSegment(node.value.segment, _stringify(segment), node.value.outlet);
    return _recurse(newSegment, node, rest);

    // next one is a params command && can reuse the node
  } else if (isStringMap(next) && _compare(segment, _stringify(next), node.value)) {
    return _recurse(node.value, node, rest.slice(1));

    // next one is a params command && cannot reuse the node
  } else if (isStringMap(next)) {
    let urlSegment = new UrlSegment(segment, _stringify(next), outlet);
    return _recurse(urlSegment, node, rest.slice(1));

    // next one is not a params command && can reuse the node
  } else if (_compare(segment, {}, node.value)) {
    return _recurse(node.value, node, rest);

    // next one is not a params command && cannot reuse the node
  } else {
    let urlSegment = new UrlSegment(segment, {}, outlet);
    return _recurse(urlSegment, node, rest);
  }
}

function _stringify(params: {[key: string]: any}): {[key: string]: string} {
  let res = {};
  StringMapWrapper.forEach(
      params, (v: any /** TODO #9100 */, k: any /** TODO #9100 */) =>
                  (res as any /** TODO #9100 */)[k] = v.toString());
  return res;
}

function _compare(path: string, params: {[key: string]: any}, segment: UrlSegment): boolean {
  return path == segment.segment && StringMapWrapper.equals(params, segment.parameters);
}

function _recurse(
    urlSegment: UrlSegment, node: TreeNode<UrlSegment>, rest: any[]): TreeNode<UrlSegment> {
  if (rest.length === 0) {
    return new TreeNode<UrlSegment>(urlSegment, []);
  }
  return new TreeNode<UrlSegment>(urlSegment, _updateMany(ListWrapper.clone(node.children), rest));
}

function _updateMany(nodes: TreeNode<UrlSegment>[], commands: any[]): TreeNode<UrlSegment>[] {
  let outlet = _outlet(commands);
  let nodesInRightOutlet = nodes.filter(c => c.value.outlet == outlet);
  if (nodesInRightOutlet.length > 0) {
    let nodeRightOutlet = nodesInRightOutlet[0];  // there can be only one
    nodes[nodes.indexOf(nodeRightOutlet)] = _update(nodeRightOutlet, commands);
  } else {
    nodes.push(_update(null, commands));
  }

  return nodes;
}

function _segment(commands: any[]): any {
  if (!isString(commands[0])) return commands[0];
  let parts = commands[0].toString().split(':');
  return parts.length > 1 ? parts[1] : commands[0];
}

function _outlet(commands: any[]): string {
  if (!isString(commands[0])) return null;
  let parts = commands[0].toString().split(':');
  return parts.length > 1 ? parts[0] : null;
}
