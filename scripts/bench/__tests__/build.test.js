'use strict';

const {executeCommand, getMergeBaseFromLocalGitRepo} = require('../build');
const {existsSync} = require('fs');
const Git = require('nodegit');
const {exec} = require('child_process');

jest.mock('fs');
jest.mock('nodegit');
jest.mock('child_process');

describe('executeCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve with stdout on success', async () => {
    exec.mockImplementation((command, callback) => {
      callback(null, 'success output', '');
    });

    const result = await executeCommand('echo hello');
    expect(result).toBe('success output');
    expect(exec).toHaveBeenCalledWith('echo hello', expect.any(Function));
  });

  it('should reject with detailed error on failure', async () => {
    const error = new Error('Command failed');
    exec.mockImplementation((command, callback) => {
      callback(error, '', 'stderr output');
    });

    await expect(executeCommand('bad command')).rejects.toThrow(
      'Command failed: bad command\nCommand failed\nStderr: stderr output'
    );
  });
});

describe('getMergeBaseFromLocalGitRepo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return merge base when repo exists and operations succeed', async () => {
    existsSync.mockReturnValue(true);
    const mockRepo = {getHeadCommit: jest.fn(), getBranchCommit: jest.fn()};
    const mockHeadCommit = {};
    const mockMainCommit = {};
    const mockMergeBase = 'merge-base-commit';

    Git.Repository.open.mockResolvedValue(mockRepo);
    mockRepo.getHeadCommit.mockResolvedValue(mockHeadCommit);
    mockRepo.getBranchCommit.mockResolvedValue(mockMainCommit);
    Git.Merge.base.mockResolvedValue(mockMergeBase);

    const result = await getMergeBaseFromLocalGitRepo('/fake/repo');
    expect(result).toBe(mockMergeBase);
    expect(existsSync).toHaveBeenCalledWith('/fake/repo');
    expect(Git.Repository.open).toHaveBeenCalledWith('/fake/repo');
  });

  it('should throw error when repo path does not exist', async () => {
    existsSync.mockReturnValue(false);

    await expect(getMergeBaseFromLocalGitRepo('/fake/repo')).rejects.toThrow(
      'Local repo path does not exist: /fake/repo'
    );
    expect(Git.Repository.open).not.toHaveBeenCalled();
  });

  it('should throw error when git operations fail', async () => {
    existsSync.mockReturnValue(true);
    Git.Repository.open.mockRejectedValue(new Error('Git error'));

    await expect(getMergeBaseFromLocalGitRepo('/fake/repo')).rejects.toThrow(
      'Failed to get merge base from local repo: Git error'
    );
  });
});
