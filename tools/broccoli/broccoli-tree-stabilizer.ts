import fs = require('fs');
let symlinkOrCopy = require('symlink-or-copy');


/**
 * Stabilizes the inputPath for the following plugins in the build tree.
 *
 * All broccoli plugins that inherit from `broccoli-writer` or `broccoli-filter` change their
 * outputPath during each rebuild.
 *
 * This means that all following plugins in the build tree can't rely on their inputPath being
 * immutable. This results in breakage of any plugin that is not expecting such behavior.
 *
 * For example all `DiffingBroccoliPlugin`s expect their inputPath to be stable.
 *
 * By inserting this plugin into the tree after any misbehaving plugin, we can stabilize the
 * inputPath for the following plugin in the tree and correct the surprising behavior.
 */
class TreeStabilizer implements BroccoliTree {
  inputPath: string;
  outputPath: string;


  constructor(public inputTree: BroccoliTree) {}


  rebuild() {
    fs.rmdirSync(this.outputPath);

    // TODO: investigate if we can use rename the directory instead to improve performance on
    // Windows
    symlinkOrCopy.sync(this.inputPath, this.outputPath);
  }


  cleanup() {}
}


export default function stabilizeTree(inputTree: BroccoliTree): BroccoliTree {
  return new TreeStabilizer(inputTree);
}
