import {AsyncTestCompleter, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';

import {Tree, TreeNode} from '../src/segments';

export function main() {
  describe('tree', () => {
    it('should return the root of the tree', () => {
      let t = new Tree<any>(new TreeNode<number>(1, []));
      expect(t.root).toEqual(1);
    });

    it('should return the parent of a node', () => {
      let t = new Tree<any>(new TreeNode<number>(1, [new TreeNode<number>(2, [])]));
      expect(t.parent(1)).toEqual(null);
      expect(t.parent(2)).toEqual(1);
    });

    it('should return the children of a node', () => {
      let t = new Tree<any>(new TreeNode<number>(1, [new TreeNode<number>(2, [])]));
      expect(t.children(1)).toEqual([2]);
      expect(t.children(2)).toEqual([]);
    });

    it('should return the first child of a node', () => {
      let t = new Tree<any>(new TreeNode<number>(1, [new TreeNode<number>(2, [])]));
      expect(t.firstChild(1)).toEqual(2);
      expect(t.firstChild(2)).toEqual(null);
    });

    it('should return the path to the root', () => {
      let t = new Tree<any>(new TreeNode<number>(1, [new TreeNode<number>(2, [])]));
      expect(t.pathFromRoot(2)).toEqual([1, 2]);
    });

    describe('contains', () => {
      it('should work', () => {
        let tree = new Tree<any>(
            new TreeNode<number>(1, [new TreeNode<number>(2, []), new TreeNode<number>(3, [])]));
        let subtree1 = new Tree<any>(new TreeNode<number>(1, []));
        let subtree2 = new Tree<any>(new TreeNode<number>(1, [new TreeNode<number>(2, [])]));
        let subtree3 = new Tree<any>(new TreeNode<number>(1, [new TreeNode<number>(3, [])]));
        let notSubtree1 = new Tree<any>(new TreeNode<number>(1, [new TreeNode<number>(4, [])]));
        let notSubtree2 = new Tree<any>(
            new TreeNode<number>(1, [new TreeNode<number>(2, [new TreeNode<number>(4, [])])]));

        expect(tree.contains(subtree1)).toEqual(true);
        expect(tree.contains(subtree2)).toEqual(true);
        expect(tree.contains(subtree3)).toEqual(true);
        expect(tree.contains(notSubtree1)).toEqual(false);
        expect(tree.contains(notSubtree2)).toEqual(false);
      });
    });
  });
}
