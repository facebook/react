// @flow

describe('profiling utils', () => {
  let utils;

  beforeEach(() => {
    utils = require('src/devtools/views/Profiler/utils');
  });

  it('should throw if importing older/unsupported data', () => {
    expect(() =>
      utils.prepareProfilingDataFrontendFromExport(
        ({
          version: 0,
          dataForRoots: [],
        }: any)
      )
    ).toThrow('Unsupported profiler export version "0"');
  });
});
