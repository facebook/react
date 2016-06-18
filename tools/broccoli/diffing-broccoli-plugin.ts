/// <reference path="broccoli.d.ts" />

import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import {TreeDiffer, DiffResult} from './tree-differ';
import stabilizeTree from './broccoli-tree-stabilizer';
let symlinkOrCopy = require('symlink-or-copy');

export {DiffResult} from './tree-differ';

export type PluginClass = any;

/**
 * Makes writing diffing plugins easy.
 *
 * Factory method that takes a class that implements the DiffingBroccoliPlugin interface and returns
 * an instance of BroccoliTree.
 */
export function wrapDiffingPlugin(pluginClass: PluginClass): DiffingPluginWrapperFactory {
  return function() { return new DiffingPluginWrapper(pluginClass, arguments) };
}


export interface DiffingBroccoliPlugin {
  rebuild(diff: (DiffResult|DiffResult[])): (Promise<DiffResult|void>|DiffResult|void);
  cleanup?(): void;
}


export type DiffingPluginWrapperFactory =
    (inputTrees: (BroccoliTree | BroccoliTree[]), options?: any) => BroccoliTree;


class DiffingPluginWrapper implements BroccoliTree {
  treeDiffer: TreeDiffer = null;
  treeDiffers: TreeDiffer[] = null;
  initialized = false;
  wrappedPlugin: DiffingBroccoliPlugin = null;
  inputTree: BroccoliTree = null;
  inputTrees: BroccoliTree[] = null;
  description: string = null;

  // props monkey-patched by broccoli builder:
  inputPath: string = null;
  inputPaths: string[] = null;
  cachePath: string = null;
  outputPath: string = null;

  private diffResult: DiffResult = null;

  constructor(private pluginClass: PluginClass, private wrappedPluginArguments: IArguments) {
    if (Array.isArray(wrappedPluginArguments[0])) {
      this.inputTrees = this.stabilizeTrees(wrappedPluginArguments[0]);
    } else {
      this.inputTree = this.stabilizeTree(wrappedPluginArguments[0]);
    }

    this.description = this.pluginClass.name;
  }

  private getDiffResult(): (DiffResult|DiffResult[]) {
    let returnOrCalculateDiffResult = (tree: BroccoliTree, index: number) => {
      // returnOrCalculateDiffResult will do one of two things:
      //
      // If `this.diffResult` is null, calculate a DiffResult using TreeDiffer
      // for the input tree.
      //
      // Otherwise, `this.diffResult` was produced from the output of the
      // inputTree's rebuild() method, and can be used without being checked.
      // Set `this.diffResult` to null and return the previously stored value.
      let diffResult = this.diffResult;
      if (diffResult) return diffResult;
      let differ = index === -1 ? this.treeDiffer : this.treeDiffers[index];
      return differ.diffTree();
    };

    if (this.inputTrees) {
      return this.inputTrees.map(returnOrCalculateDiffResult);
    } else if (this.inputTree) {
      return returnOrCalculateDiffResult(this.inputTree, -1);
    } else {
      throw new Error('Missing TreeDiffer');
    }
  }

  private maybeStoreDiffResult(value: (DiffResult|void)) {
    if (!(value instanceof DiffResult)) value = null;
    this.diffResult = <DiffResult>(value);
  }

  rebuild(): (Promise<any>|void) {
    try {
      let firstRun = !this.initialized;
      this.init();

      let diffResult = this.getDiffResult();

      let result = this.wrappedPlugin.rebuild(diffResult);

      if (result) {
        let resultPromise = <Promise<DiffResult|void>>(result);
        if (resultPromise.then) {
          // rebuild() -> Promise<>
          return resultPromise.then((result: (DiffResult | void)) => {
            this.maybeStoreDiffResult(result);
            this.relinkOutputAndCachePaths();
          });
        }
      }

      this.maybeStoreDiffResult(<(DiffResult | void)>(result));
      this.relinkOutputAndCachePaths();
    } catch (e) {
      e.message = `[${this.description}]: ${e.message}`;
      throw e;
    }
  }


  cleanup() {
    if (this.wrappedPlugin && this.wrappedPlugin.cleanup) {
      this.wrappedPlugin.cleanup();
    }
  }


  private relinkOutputAndCachePaths() {
    // just symlink the cache and output tree
    fs.rmdirSync(this.outputPath);
    symlinkOrCopy.sync(this.cachePath, this.outputPath);
  }


  private init() {
    if (!this.initialized) {
      let includeExtensions = this.pluginClass.includeExtensions || [];
      let excludeExtensions = this.pluginClass.excludeExtensions || [];
      let description = this.description;
      this.initialized = true;
      if (this.inputPaths) {
        this.treeDiffers = this.inputPaths.map(
            (inputPath) =>
                new TreeDiffer(description, inputPath, includeExtensions, excludeExtensions));
      } else if (this.inputPath) {
        this.treeDiffer =
            new TreeDiffer(description, this.inputPath, includeExtensions, excludeExtensions);
      }
      this.wrappedPlugin = new this.pluginClass(
          this.inputPaths || this.inputPath, this.cachePath, this.wrappedPluginArguments[1]);
    }
  }


  private stabilizeTrees(trees: BroccoliTree[]) {
    // Prevent extensions to prevent array from being mutated from the outside.
    // For-loop used to avoid re-allocating a new array.
    var stableTrees: BroccoliTree[] = [];
    for (let i = 0; i < trees.length; ++i) {
      // ignore null/undefined input tries in order to support conditional build pipelines
      if (trees[i]) {
        stableTrees.push(this.stabilizeTree(trees[i]));
      }
    }

    if (stableTrees.length === 0) {
      throw new Error('No input trees provided!');
    }

    return Object.freeze(stableTrees);
  }


  private stabilizeTree(tree: BroccoliTree) {
    // Ignore all DiffingPlugins as they are already stable, for others we don't know for sure
    // so we need to stabilize them.
    // Since it's not safe to use instanceof operator in node, we are checking the constructor.name.
    //
    // New-style/rebuild trees should always be stable.
    let isNewStyleTree =
        !!(tree['newStyleTree'] || typeof tree.rebuild === 'function' ||
           (<any>tree)['isReadAPICompatTree'] || (<any>tree).constructor['name'] === 'Funnel');

    return isNewStyleTree ? tree : stabilizeTree(tree);
  }
}
