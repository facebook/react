var broccoli = require('broccoli');
var fs = require('fs');
var makeBrowserTree = require('./trees/browser_tree');
var makeNodeTree = require('./trees/node_tree');
var path = require('path');
var printSlowTrees = require('broccoli-slow-trees');
var Q = require('q');

export type ProjectMap = {
  [key: string]: boolean
};

export type Options = {
  projects: ProjectMap; noTypeChecks: boolean; generateEs6: boolean; useBundles: boolean;
};

export interface AngularBuilderOptions {
  outputPath: string;
  dartSDK?: any;
  logs?: any;
}

/**
 * BroccoliBuilder facade for all of our build pipelines.
 */
export class AngularBuilder {
  private nodeBuilder: BroccoliBuilder;
  private browserDevBuilder: BroccoliBuilder;
  private browserProdBuilder: BroccoliBuilder;
  private dartBuilder: BroccoliBuilder;
  private outputPath: string;
  private firstResult: BuildResult;

  constructor(public options: AngularBuilderOptions) { this.outputPath = options.outputPath; }


  public rebuildBrowserDevTree(opts: Options): Promise<BuildResult> {
    this.browserDevBuilder = this.browserDevBuilder || this.makeBrowserDevBuilder(opts);
    return this.rebuild(this.browserDevBuilder, 'js.dev');
  }


  public rebuildBrowserProdTree(opts: Options): Promise<BuildResult> {
    this.browserProdBuilder = this.browserProdBuilder || this.makeBrowserProdBuilder(opts);
    return this.rebuild(this.browserProdBuilder, 'js.prod');
  }


  public rebuildNodeTree(opts: Options): Promise<BuildResult> {
    this.nodeBuilder = this.nodeBuilder || this.makeNodeBuilder(opts.projects);
    return this.rebuild(this.nodeBuilder, 'js.cjs');
  }


  public rebuildDartTree(projects: ProjectMap): Promise<BuildResult> {
    this.dartBuilder = this.dartBuilder || this.makeDartBuilder(projects);
    return this.rebuild(this.dartBuilder, 'dart');
  }


  cleanup(): Promise<any> {
    return Q.all([
      this.nodeBuilder && this.nodeBuilder.cleanup(),
      this.browserDevBuilder && this.browserDevBuilder.cleanup(),
      this.browserProdBuilder && this.browserProdBuilder.cleanup()
    ]);
  }


  private makeBrowserDevBuilder(opts: Options): BroccoliBuilder {
    let tree = makeBrowserTree(
        {
          name: 'dev',
          typeAssertions: true,
          sourceMaps: true,
          projects: opts.projects,
          noTypeChecks: opts.noTypeChecks,
          generateEs6: opts.generateEs6,
          useBundles: opts.useBundles
        },
        path.join(this.outputPath, 'js', 'dev'));
    return new broccoli.Builder(tree);
  }


  private makeBrowserProdBuilder(opts: Options): BroccoliBuilder {
    let tree = makeBrowserTree(
        {
          name: 'prod',
          typeAssertions: false,
          sourceMaps: false,
          projects: opts.projects,
          noTypeChecks: opts.noTypeChecks,
          generateEs6: opts.generateEs6,
          useBundles: opts.useBundles
        },
        path.join(this.outputPath, 'js', 'prod'));
    return new broccoli.Builder(tree);
  }


  private makeNodeBuilder(projects: ProjectMap): BroccoliBuilder {
    let tree = makeNodeTree(projects, path.join(this.outputPath, 'js', 'cjs'));
    return new broccoli.Builder(tree);
  }


  private makeDartBuilder(projects: ProjectMap): BroccoliBuilder {
    let options = {
      outputPath: path.join(this.outputPath, 'dart'),
      dartSDK: this.options.dartSDK,
      logs: this.options.logs,
      projects: projects
    };
    // Workaround for https://github.com/dart-lang/dart_style/issues/493
    var makeDartTree = require('./trees/dart_tree');
    let tree = makeDartTree(options);
    return new broccoli.Builder(tree);
  }


  private rebuild(builder: BroccoliBuilder, name: string): Promise<BuildResult> {
    return builder.build().then<BuildResult>(
        (result) => {
          if (!this.firstResult) {
            this.firstResult = result;
          }

          printSlowTrees(result.graph);
          writeBuildLog(result, name);
          return result;
        },
        (error):
            any => {
              // the build tree is the same during rebuilds, only leaf properties of the nodes
              // change
              // so let's traverse it and get updated values for input/cache/output paths
              if (this.firstResult) {
                writeBuildLog(this.firstResult, name);
              }
              throw error;
            });
  }
}


function writeBuildLog(result: BuildResult, name: string) {
  let logPath = `tmp/build.${name}.log`;
  let prevLogPath = logPath + '.previous';
  let formattedLogContent = JSON.stringify(broccoliNodeToBuildNode(result.graph), null, 2);

  if (fs.existsSync(prevLogPath)) fs.unlinkSync(prevLogPath);
  if (fs.existsSync(logPath)) fs.renameSync(logPath, prevLogPath);
  fs.writeFileSync(logPath, formattedLogContent, {encoding: 'utf-8'});
}


function broccoliNodeToBuildNode(broccoliNode: BroccoliNode): BuildNode {
  let tree = broccoliNode.tree.newStyleTree || broccoliNode.tree;

  return new BuildNode(
      tree.description || (<any>tree.constructor).name,
      tree.inputPath ? [tree.inputPath] : tree.inputPaths, tree.cachePath, tree.outputPath,
      broccoliNode.selfTime / (1000 * 1000 * 1000), broccoliNode.totalTime / (1000 * 1000 * 1000),
      broccoliNode.subtrees.map(broccoliNodeToBuildNode));
}


class BuildNode {
  constructor(
      public pluginName: string, public inputPaths: string[], public cachePath: string,
      public outputPath: string, public selfTime: number, public totalTime: number,
      public inputNodes: BuildNode[]) {}
}
