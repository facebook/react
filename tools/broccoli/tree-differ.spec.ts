let mockfs = require('mock-fs');
import fs = require('fs');
import path = require('path');
import {TreeDiffer} from './tree-differ';


describe('TreeDiffer', () => {

  afterEach(() => mockfs.restore());


  describe('diff of added and changed files', () => {

    it('should list all files (but no directories) during the first diff', () => {
      let testDir = {
        'dir1': {
          'file-1.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)}),
          'file-2.txt': mockfs.file({content: 'file-2.txt content', mtime: new Date(1000)}),
          'subdir-1': {
            'file-1.1.txt': mockfs.file({content: 'file-1.1.txt content', mtime: new Date(1000)})
          },
          'empty-dir': {}
        }
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1');

      let diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual([
        'file-1.txt', 'file-2.txt', 'subdir-1' + path.sep + 'file-1.1.txt'
      ]);

      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual([]);
    });


    it('should return empty diff if nothing has changed', () => {
      let testDir = {
        'dir1': {
          'file-1.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)}),
          'file-2.txt': mockfs.file({content: 'file-2.txt content', mtime: new Date(1000)}),
          'subdir-1': {
            'file-1.1.txt': mockfs.file({content: 'file-1.1.txt content', mtime: new Date(1000)})
          },
        }
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1');

      let diffResult = differ.diffTree();

      expect(diffResult.addedPaths).not.toEqual([]);
      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual([]);

      diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual([]);
      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual([]);
    });


    it('should list only changed files during the subsequent diffs', () => {
      let testDir = {
        'dir1': {
          'file-1.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)}),
          'file-2.txt': mockfs.file({content: 'file-2.txt content', mtime: new Date(1000)}),
          'subdir-1': {
            'file-1.1.txt':
                mockfs.file({content: 'file-1.1.txt content', mtime: new Date(1000)})
          }
        }
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1');

      let diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual([
        'file-1.txt', 'file-2.txt', 'subdir-1' + path.sep + 'file-1.1.txt'
      ]);

      // change two files
      testDir['dir1']['file-1.txt'] = mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['dir1']['subdir-1']['file-1.1.txt'] =
          mockfs.file({content: 'file-1.1.txt content', mtime: new Date(9999)});
      mockfs(testDir);

      diffResult = differ.diffTree();

      expect(diffResult.changedPaths).toEqual([
        'file-1.txt', 'subdir-1' + path.sep + 'file-1.1.txt'
      ]);

      expect(diffResult.removedPaths).toEqual([]);

      // change one file
      testDir['dir1']['file-1.txt'] = mockfs.file({content: 'super new', mtime: new Date(1000)});
      mockfs(testDir);

      diffResult = differ.diffTree();
      expect(diffResult.changedPaths).toEqual(['file-1.txt']);
    });


    it('should handle changes via symbolic links', () => {
      let testDir = {
        'orig_path': {
          'file-1.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)}),
          'file-2.txt': mockfs.file({content: 'file-2.txt content', mtime: new Date(1000)}),
          'subdir-1': {
            'file-1.1.txt': mockfs.file({content: 'file-1.1.txt content', mtime: new Date(1000)})
          }
        },
        'symlinks': {
          'file-1.txt': mockfs.symlink({path: '../orig_path/file-1.txt'}),
          'file-2.txt': mockfs.symlink({path: '../orig_path/file-2.txt'}),
          'subdir-1':
              {'file-1.1.txt': mockfs.symlink({path: '../../orig_path/subdir-1/file-1.1.txt'})}
        }
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'symlinks');

      let diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual([
        'file-1.txt', 'file-2.txt', 'subdir-1' + path.sep + 'file-1.1.txt'
      ]);

      // change two files
      testDir['orig_path']['file-1.txt'] =
          mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['orig_path']['subdir-1']['file-1.1.txt'] =
          mockfs.file({content: 'file-1.1.txt content', mtime: new Date(9999)});
      mockfs(testDir);

      diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual([]);
      expect(diffResult.changedPaths).toEqual([
        'file-1.txt', 'subdir-1' + path.sep + 'file-1.1.txt'
      ]);
      expect(diffResult.removedPaths).toEqual([]);

      // change one file
      testDir['orig_path']['file-1.txt'] =
          mockfs.file({content: 'super new', mtime: new Date(1000)});
      mockfs(testDir);

      diffResult = differ.diffTree();
      expect(diffResult.changedPaths).toEqual(['file-1.txt']);

      // remove a link
      delete testDir['orig_path']['file-1.txt'];
      mockfs(testDir);

      diffResult = differ.diffTree();
      expect(diffResult.addedPaths).toEqual([]);
      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual(['file-1.txt']);

      // don't report it as a removal twice
      mockfs(testDir);

      diffResult = differ.diffTree();
      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual([]);

      // re-add it.
      testDir['orig_path']['file-1.txt'] =
          mockfs.file({content: 'super new', mtime: new Date(1000)});
      mockfs(testDir);

      diffResult = differ.diffTree();
      expect(diffResult.addedPaths).toEqual(['file-1.txt']);
      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual([]);
    });


    it('should throw an error if an extension isn\'t prefixed with doc', () => {
      // includeExtensions
      expect(() => new TreeDiffer('testLabel', 'dir1', ['js']))
          .toThrowError('Extension must begin with \'.\'. Was: \'js\'');

      // excludeExtentions
      expect(() => new TreeDiffer('testLabel', 'dir1', [], ['js']))
          .toThrowError('Extension must begin with \'.\'. Was: \'js\'');
    });


    it('should ignore files with extensions not listed in includeExtensions', () => {
      let testDir = {
        'dir1': {
          'file-1.js': mockfs.file({content: 'file-1.js content', mtime: new Date(1000)}),
          'file-2.md': mockfs.file({content: 'file-2.md content', mtime: new Date(1000)}),
          'file-3.coffee': mockfs.file({content: 'file-3.coffee content', mtime: new Date(1000)}),
          'subdir-1': {
            'file-1.1.cc': mockfs.file({content: 'file-1.1.cc content', mtime: new Date(1000)})
          }
        }
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1', ['.js', '.coffee']);

      let diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual(['file-1.js', 'file-3.coffee']);
      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual([]);

      // change two files
      testDir['dir1']['file-1.js'] = mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['dir1']['file-3.coffee'] =
          mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['dir1']['subdir-1']['file-1.1.cc'] =
          mockfs.file({content: 'file-1.1.cc content', mtime: new Date(9999)});
      mockfs(testDir);

      diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual([]);
      expect(diffResult.changedPaths).toEqual(['file-1.js', 'file-3.coffee']);
      expect(diffResult.removedPaths).toEqual([]);

      // change one file
      testDir['dir1']['file-1.js'] = mockfs.file({content: 'super new', mtime: new Date(1000)});
      mockfs(testDir);

      diffResult = differ.diffTree();
      expect(diffResult.changedPaths).toEqual(['file-1.js']);
    });


    it('should ignore files with extensions listed in excludeExtensions', () => {
      let testDir = {
        'dir1': {
          'file-1.ts': mockfs.file({content: 'file-1.ts content', mtime: new Date(1000)}),
          'file-1.cs': mockfs.file({content: 'file-1.cs content', mtime: new Date(1000)}),
          'file-1d.cs': mockfs.file({content: 'file-1d.cs content', mtime: new Date(1000)}),
          'file-1.d.cs': mockfs.file({content: 'file-1.d.cs content', mtime: new Date(1000)}),
          'file-2.md': mockfs.file({content: 'file-2.md content', mtime: new Date(1000)}),
          'file-3.ts': mockfs.file({content: 'file-3.ts content', mtime: new Date(1000)}),
          'file-4.d.ts': mockfs.file({content: 'file-4.d.ts content', mtime: new Date(1000)}),
          'subdir-1': {
            'file-1.1.cc': mockfs.file({content: 'file-1.1.cc content', mtime: new Date(1000)})
          }
        }
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1', ['.ts', '.cs'], ['.d.ts', '.d.cs']);

      let diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual(['file-1.cs', 'file-1.ts', 'file-1d.cs', 'file-3.ts']);

      // change two files
      testDir['dir1']['file-1.ts'] = mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['dir1']['file-1.cs'] = mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['dir1']['file-1.d.cs'] = mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['dir1']['file-3.ts'] = mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['dir1']['file-4.d.ts'] = mockfs.file({content: 'new content', mtime: new Date(1000)});
      testDir['dir1']['subdir-1']['file-1.1.cc'] =
          mockfs.file({content: 'file-1.1.cc content', mtime: new Date(9999)});
      mockfs(testDir);

      diffResult = differ.diffTree();

      expect(diffResult.addedPaths).toEqual([]);
      expect(diffResult.changedPaths).toEqual(['file-1.cs', 'file-1.ts', 'file-3.ts']);
      expect(diffResult.removedPaths).toEqual([]);

      // change one file
      testDir['dir1']['file-4.d.ts'] = mockfs.file({content: 'super new', mtime: new Date(1000)});
      mockfs(testDir);

      diffResult = differ.diffTree();
      expect(diffResult.changedPaths).toEqual([]);
    });
  });

  describe('diff of new files', () => {

    it('should detect file additions', () => {
      let testDir: any = {
        'dir1':
            {'file-1.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)})}
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1');
      differ.diffTree();

      testDir['dir1']['file-2.txt'] = 'new file';
      mockfs(testDir);

      let diffResult = differ.diffTree();
      expect(diffResult.addedPaths).toEqual(['file-2.txt']);
      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual([]);
    });


    it('should detect file additions mixed with file changes', () => {
      let testDir: any = {
        'dir1':
            {'file-1.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)})}
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1');
      differ.diffTree();

      testDir['dir1']['file-1.txt'] = 'new content';
      testDir['dir1']['file-2.txt'] = 'new file';
      mockfs(testDir);

      let diffResult = differ.diffTree();
      expect(diffResult.addedPaths).toEqual(['file-2.txt']);
      expect(diffResult.changedPaths).toEqual(['file-1.txt']);
    });
  });


  describe('diff of removed files', () => {

    it('should detect file removals and report them as removed files', () => {
      let testDir = {
        'dir1':
            {'file-1.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)})}
      };
      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1');
      differ.diffTree();

      delete testDir['dir1']['file-1.txt'];
      mockfs(testDir);

      let diffResult = differ.diffTree();
      expect(diffResult.changedPaths).toEqual([]);
      expect(diffResult.removedPaths).toEqual(['file-1.txt']);
    });


    it('should detect file removals mixed with file changes and additions', () => {
      let testDir: any = {
        'dir1': {
          'file-1.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)}),
          'file-2.txt': mockfs.file({content: 'file-1.txt content', mtime: new Date(1000)})
        }
      };

      mockfs(testDir);

      let differ = new TreeDiffer('testLabel', 'dir1');
      differ.diffTree();

      testDir['dir1']['file-1.txt'] = 'changed content';
      delete testDir['dir1']['file-2.txt'];
      testDir['dir1']['file-3.txt'] = 'new content';
      mockfs(testDir);

      let diffResult = differ.diffTree();
      expect(diffResult.addedPaths).toEqual(['file-3.txt']);
      expect(diffResult.changedPaths).toEqual(['file-1.txt']);
      expect(diffResult.removedPaths).toEqual(['file-2.txt']);
    });
  });
});
