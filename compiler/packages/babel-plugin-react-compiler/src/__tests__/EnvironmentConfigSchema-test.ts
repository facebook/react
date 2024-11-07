import {validateEnvironmentConfig} from '../HIR/Environment';
import {CompilerError} from '../CompilerError';

describe('EnvironmentConfigSchema', () => {
  it('should throw a CompilerError for unknown properties', () => {
    const invalidConfig = {
      unknownProperty: true,
    };

    expect(() => {
      validateEnvironmentConfig(invalidConfig);
    }).toThrow(CompilerError);
  });

  it('should parse valid config without errors', () => {
    const validConfig = {
      customHooks: new Map(),
      moduleTypeProvider: null,
      customMacros: null,
      enableResetCacheOnSourceFileChanges: false,
      enablePreserveExistingMemoizationGuarantees: false,
      validatePreserveExistingMemoizationGuarantees: true,
      enablePreserveExistingManualUseMemo: false,
      enableForest: false,
      enableUseTypeAnnotations: false,
    };

    expect(() => {
      validateEnvironmentConfig(validConfig);
    }).not.toThrow();
  });
});
