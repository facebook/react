interface BroccoliTree {
  /**
   * Contains the fs path for the input tree when the plugin takes only one input tree.
   *
   * For plugins that take multiple trees see the `inputPaths` property.
   *
   * This property is set just before the first rebuild and doesn't change afterwards.
   */
  inputPath: string;

  /**
   * Contains the array of fs paths for input trees.
   *
   * For plugins that take only one input tree, it might be more convenient to use the `inputPath`
   *property instead.
   *
   * This property is set just before the first rebuild and doesn't change afterwards, unless
   * plugins themselves change it.
   *
   * If the inputPath is outside of broccoli's temp directory, then it's lifetime is not managed by
   *the builder.
   * If the inputPath is within broccoli's temp directory it is an outputPath (and output directory)
   *of another plugin.
   * This means that while the `outputPath` doesn't change, the underlying directory is frequently
   *recreated.
   */
  inputPaths?: string[];

  /**
   * Contains the fs paths for the output trees.
   *
   * This property is set just before the first rebuild and doesn't change afterwards, unless the
   * plugins themselves change it.
   *
   * The underlying directory is also created by the builder just before the first rebuild.
   * This directory is destroyed and recreated upon each rebuild.
   */
  outputPath?: string;

  /**
   * Contains the fs paths for a cache directory available to the plugin.
   *
   * This property is set just before the first rebuild and doesn't change afterwards.
   *
   * The underlying directory is also created by the builder just before the first rebuild.
   * The lifetime of the directory is associated with the lifetime of the plugin.
   */
  cachePath?: string;

  inputTree?: BroccoliTree;
  inputTrees?: BroccoliTree[];

  /**
   * Trees which implement the rebuild api are wrapped automatically for api compat,
   * and `newStyleTree` keeps a reference to the original unwrapped tree.
   */
  newStyleTree?: BroccoliTree;

  /**
   * Description or name of the plugin used for reporting.
   *
   * If missing `tree.constructor.name` is usually used instead.
   */
  description?: string;

  rebuild(): (Promise<any>|void);
  cleanup(): void;
}


interface OldBroccoliTree {
  read?(readTree: (tree: BroccoliTree) => Promise<string>): (Promise<string>|string);
}



interface BroccoliBuilder {
  /**
   * Triggers a build and returns a promise for the build result
   */
  build(): Promise<BuildResult>;


  /**
   * Cleans up the whole build tree by calling `.cleanup()` method on all trees that are part of the
   * pipeline.
   */
  cleanup(): Promise<any>;
}


interface BuildResult {
  /**
   * Directory that contains result of the build.
   *
   * This directory will contains symlinks, so it is not safe to just use it as is.
   *
   * Use `copy-dereference` npm package to create a safe-to-use replica of the build artifacts.
   */
  directory: string;


  /**
   * The DAG (graph) of all trees in the build pipeline.
   */
  graph: BroccoliNode;

  /**
   * Total time it took to make the build.
   */
  totalTime: number;
}



interface BroccoliNode {
  ///**
  // * Id of the current node
  // */
  // id: number; //only in master

  /**
   * Time spent processing the current node during a single rebuild.
   */
  selfTime: number;


  /**
   * Time spent processing the current node and its subtrees during a single rebuild.
   */
  totalTime: number;


  /**
   * Tree associated with the current node.
   */
  tree: BroccoliTree;


  /**
   * Child nodes with references to trees that are input for the tree of the current node.
   */
  subtrees: BroccoliNode[];


  /**
   * Parent nodes with references to trees that are consume the output of processing the current
   * tree.
   */
  parents: BroccoliNode[];


  /**
   * Path to the directory containing the output of processing the current tree.
   */
  directory: string;
}
