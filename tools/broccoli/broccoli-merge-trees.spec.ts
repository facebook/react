let mockfs = require('mock-fs');
import fs = require('fs');
import {TreeDiffer, DiffResult} from './tree-differ';
import {MergeTrees} from './broccoli-merge-trees';

describe('MergeTrees', () => {
  afterEach(() => mockfs.restore());

  function mergeTrees(inputPaths: string[], cachePath: string, options: {}) {
    return new MergeTrees(inputPaths, cachePath, options);
  }

  function MakeTreeDiffers(rootDirs: string[]): TreeDiffer[] {
    return rootDirs.map((rootDir) => new TreeDiffer('MergeTrees', rootDir));
  }

  let diffTrees = (differs: TreeDiffer[]): DiffResult[] => differs.map(tree => tree.diffTree());
  function read(path: string) { return fs.readFileSync(path, 'utf-8'); }

  it('should copy the file from the right-most inputTree with overwrite=true', () => {
    let testDir: any = {
      'tree1': {'foo.js': mockfs.file({content: 'tree1/foo.js content', mtime: new Date(1000)})},
      'tree2': {'foo.js': mockfs.file({content: 'tree2/foo.js content', mtime: new Date(1000)})},
      'tree3': {'foo.js': mockfs.file({content: 'tree3/foo.js content', mtime: new Date(1000)})}
    };
    mockfs(testDir);
    let treeDiffer = MakeTreeDiffers(['tree1', 'tree2', 'tree3']);
    let treeMerger = mergeTrees(['tree1', 'tree2', 'tree3'], 'dest', {overwrite: true});
    treeMerger.rebuild(diffTrees(treeDiffer));
    expect(read('dest/foo.js')).toBe('tree3/foo.js content');

    delete testDir.tree2['foo.js'];
    delete testDir.tree3['foo.js'];
    mockfs(testDir);
    treeMerger.rebuild(diffTrees(treeDiffer));
    expect(read('dest/foo.js')).toBe('tree1/foo.js content');

    testDir.tree2['foo.js'] = mockfs.file({content: 'tree2/foo.js content', mtime: new Date(1000)});
    mockfs(testDir);
    treeMerger.rebuild(diffTrees(treeDiffer));
    expect(read('dest/foo.js')).toBe('tree2/foo.js content');
  });

  it('should throw if duplicates are found during the initial build', () => {
    let testDir: any = {
      'tree1': {'foo.js': mockfs.file({content: 'tree1/foo.js content', mtime: new Date(1000)})},
      'tree2': {'foo.js': mockfs.file({content: 'tree2/foo.js content', mtime: new Date(1000)})},
      'tree3': {'foo.js': mockfs.file({content: 'tree3/foo.js content', mtime: new Date(1000)})}
    };
    mockfs(testDir);
    let treeDiffer = MakeTreeDiffers(['tree1', 'tree2', 'tree3']);
    let treeMerger = mergeTrees(['tree1', 'tree2', 'tree3'], 'dest', {});
    expect(() => treeMerger.rebuild(diffTrees(treeDiffer)))
        .toThrowError(
            'Duplicate path found while merging trees. Path: "foo.js".\n' +
            'Either remove the duplicate or enable the "overwrite" option for this merge.');

    testDir = {
      'tree1': {'foo.js': mockfs.file({content: 'tree1/foo.js content', mtime: new Date(1000)})},
      'tree2': {},
      'tree3': {}
    };
    mockfs(testDir);
  });


  it('should throw if duplicates are found during rebuild', () => {
    let testDir: any = {
      'tree1': {'foo.js': mockfs.file({content: 'tree1/foo.js content', mtime: new Date(1000)})},
      'tree2': {},
      'tree3': {}
    };
    mockfs(testDir);

    let treeDiffer = MakeTreeDiffers(['tree1', 'tree2', 'tree3']);
    let treeMerger = mergeTrees(['tree1', 'tree2', 'tree3'], 'dest', {});
    expect(() => treeMerger.rebuild(diffTrees(treeDiffer))).not.toThrow();


    testDir.tree2['foo.js'] = mockfs.file({content: 'tree2/foo.js content', mtime: new Date(1000)});
    mockfs(testDir);
    expect(() => treeMerger.rebuild(diffTrees(treeDiffer)))
        .toThrowError(
            'Duplicate path found while merging trees. Path: "foo.js".\n' +
            'Either remove the duplicate or enable the "overwrite" option for this merge.');
  });
});
