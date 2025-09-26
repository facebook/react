'use strict';

const {extractCommitFromVersionNumber, getChecksumForCurrentRevision} = require('../utils');
const {existsSync} = require('fs');
const {hashElement} = require('folder-hash');

jest.mock('fs');
jest.mock('folder-hash');

describe('extractCommitFromVersionNumber', () => {
  it('should extract commit from stable version format', () => {
    const version = '0.0.0-0e526bcec-20210202';
    expect(extractCommitFromVersionNumber(version)).toBe('0e526bcec');
  });

  it('should extract commit from experimental version format', () => {
    const version = '0.0.0-experimental-0e526bcec-20210202';
    expect(extractCommitFromVersionNumber(version)).toBe('0e526bcec');
  });

  it('should throw error for invalid version', () => {
    const version = 'invalid-version';
    expect(() => extractCommitFromVersionNumber(version)).toThrow(
      'Could not extract commit from version "invalid-version": invalid format'
    );
  });

  it('should throw error for empty version', () => {
    expect(() => extractCommitFromVersionNumber('')).toThrow(
      'Invalid version: expected a non-empty string, got ""'
    );
  });

  it('should throw error for non-string version', () => {
    expect(() => extractCommitFromVersionNumber(null)).toThrow(
      'Invalid version: expected a non-empty string, got "null"'
    );
  });

  it('should throw error for invalid commit hash', () => {
    const version = '0.0.0-invalidcommit-20210202';
    expect(() => extractCommitFromVersionNumber(version)).toThrow(
      'Invalid commit hash extracted: "invalidcommit"'
    );
  });
});

describe('getChecksumForCurrentRevision', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return checksum when packages dir exists', async () => {
    existsSync.mockReturnValue(true);
    hashElement.mockResolvedValue({hash: '1234567890abcdef'});

    const result = await getChecksumForCurrentRevision('/fake/cwd');
    expect(result).toBe('1234567');
    expect(existsSync).toHaveBeenCalledWith('/fake/cwd/packages');
    expect(hashElement).toHaveBeenCalledWith('/fake/cwd/packages', {
      encoding: 'hex',
      files: {exclude: ['.DS_Store']},
    });
  });

  it('should throw error when packages dir does not exist', async () => {
    existsSync.mockReturnValue(false);

    await expect(getChecksumForCurrentRevision('/fake/cwd')).rejects.toThrow(
      'Packages directory does not exist: /fake/cwd/packages'
    );
    expect(hashElement).not.toHaveBeenCalled();
  });
});
