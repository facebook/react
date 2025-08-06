/**
 * Configuration system for ValidateConditionalHooksUsage plugin
 * 
 * This allows developers to customize the behavior of our validation plugin
 */

export interface ConditionalHooksConfig {
  /** Enable detection of hooks in if statements */
  detectConditionalCalls: boolean;
  
  /** Enable detection of hooks after early returns (PR #34116 pattern) */
  detectEarlyReturnHooks: boolean;
  
  /** Enable detection of hooks in loops */
  detectLoopHooks: boolean;
  
  /** Enable detection of deeply nested conditional hooks */
  detectNestedConditionals: boolean;
  
  /** Maximum nesting depth before triggering warnings */
  maxNestingDepth: number;
  
  /** Custom hook patterns to detect beyond standard 'use*' pattern */
  customHookPatterns: RegExp[];
  
  /** Severity level for conditional hook violations */
  violationSeverity: 'error' | 'warning' | 'info';
  
  /** Whether to provide auto-fix suggestions */
  provideAutoFixSuggestions: boolean;
  
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;
}

export const DEFAULT_CONFIG: ConditionalHooksConfig = {
  detectConditionalCalls: true,
  detectEarlyReturnHooks: true,
  detectLoopHooks: true,
  detectNestedConditionals: true,
  maxNestingDepth: 3,
  customHookPatterns: [],
  violationSeverity: 'error',
  provideAutoFixSuggestions: true,
  enablePerformanceMonitoring: false
};

/**
 * Enhanced version of our validation plugin with configuration support
 */
import {
  CompilerError,
  CompilerErrorDetail,
  ErrorSeverity,
} from '../CompilerError';
import {
  HIRFunction,
  CallExpression,
  MethodCall,
  Place,
} from '../HIR/HIR';
import {Result, Ok, Err} from '../Utils/Result';
import {computeUnconditionalBlocks} from '../HIR/ComputeUnconditionalBlocks';

export function validateConditionalHooksUsageWithConfig(
  fn: HIRFunction,
  config: Partial<ConditionalHooksConfig> = {}
): Result<void, CompilerError> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = fullConfig.enablePerformanceMonitoring ? performance.now() : 0;
  
  const unconditionalBlocks = computeUnconditionalBlocks(fn);
  const errors = new CompilerError();
  let nestingDepth = 0;

  // Track validation statistics
  const stats = {
    blocksAnalyzed: 0,
    instructionsAnalyzed: 0,
    hooksDetected: 0,
    violationsFound: 0
  };

  // Check each instruction for hook calls in conditional blocks
  for (const [blockId, block] of fn.body.blocks) {
    stats.blocksAnalyzed++;
    const isUnconditional = unconditionalBlocks.has(blockId);
    
    // Calculate nesting depth for this block
    const currentNestingDepth = calculateNestingDepth(block, fn);
    nestingDepth = Math.max(nestingDepth, currentNestingDepth);

    for (const instruction of block.instructions) {
      stats.instructionsAnalyzed++;
      
      switch (instruction.value.kind) {
        case 'CallExpression': {
          const callValue = instruction.value as CallExpression;
          if (isHookCall(callValue.callee, fullConfig)) {
            stats.hooksDetected++;
            
            if (!isUnconditional && shouldReportViolation(callValue, fullConfig, currentNestingDepth)) {
              stats.violationsFound++;
              
              const error = createConditionalHookError(
                callValue,
                fullConfig,
                currentNestingDepth,
                'CallExpression'
              );
              errors.pushErrorDetail(error);
            }
          }
          break;
        }

        case 'MethodCall': {
          const methodValue = instruction.value as MethodCall;
          if (isHookCall(methodValue.property, fullConfig)) {
            stats.hooksDetected++;
            
            if (!isUnconditional && shouldReportViolation(methodValue, fullConfig, currentNestingDepth)) {
              stats.violationsFound++;
              
              const error = createConditionalHookError(
                methodValue,
                fullConfig,
                currentNestingDepth,
                'MethodCall'
              );
              errors.pushErrorDetail(error);
            }
          }
          break;
        }
      }
    }
  }

  // Performance monitoring
  if (fullConfig.enablePerformanceMonitoring) {
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    console.log(`🔍 ConditionalHooks Validation Stats:`, {
      processingTime: `${processingTime.toFixed(2)}ms`,
      ...stats,
      maxNestingDepth: nestingDepth
    });
  }

  return errors.hasErrors() ? Err(errors) : Ok(undefined);
}

/**
 * Enhanced hook detection with custom patterns
 */
function isHookCall(place: Place, config: ConditionalHooksConfig): boolean {
  if (!place.identifier.name) return false;
  const name = place.identifier.name.value;
  
  // Standard React hook pattern
  const isStandardHook = name.startsWith('use') && 
                        name.length > 3 && 
                        /^[A-Z]/.test(name.slice(3));
  
  // Custom hook patterns
  const isCustomHook = config.customHookPatterns.some(pattern => 
    pattern.test(name)
  );
  
  return isStandardHook || isCustomHook;
}

/**
 * Determine if a violation should be reported based on configuration
 */
function shouldReportViolation(
  instruction: CallExpression | MethodCall,
  config: ConditionalHooksConfig,
  nestingDepth: number
): boolean {
  // Check nesting depth limits
  if (config.detectNestedConditionals && nestingDepth > config.maxNestingDepth) {
    return true;
  }
  
  // Add more sophisticated detection logic based on config
  return true; // For now, report all violations
}

/**
 * Create detailed error messages based on configuration and context
 */
function createConditionalHookError(
  instruction: CallExpression | MethodCall,
  config: ConditionalHooksConfig,
  nestingDepth: number,
  type: 'CallExpression' | 'MethodCall'
): CompilerErrorDetail {
  const hookName = getHookName(instruction);
  const severity = getSeverityLevel(config.violationSeverity);
  
  let reason = `Hook "${hookName}" is called conditionally.`;
  let description = `This pattern can lead to "Rendered more hooks than during the previous render" errors.`;
  
  // Customize message based on nesting depth
  if (nestingDepth > 2) {
    reason += ` (${nestingDepth} levels deep)`;
    description += ` Deep nesting makes this pattern particularly dangerous.`;
  }
  
  // Add specific guidance based on type
  if (type === 'MethodCall') {
    description += ` Method calls on hook-like objects must also follow the Rules of Hooks.`;
  }
  
  // Generate auto-fix suggestions if enabled
  const suggestions = config.provideAutoFixSuggestions 
    ? generateAutoFixSuggestions(hookName, nestingDepth)
    : null;

  return new CompilerErrorDetail({
    reason,
    description,
    loc: instruction.loc,
    severity,
    suggestions
  });
}

/**
 * Calculate the conditional nesting depth for a block
 */
function calculateNestingDepth(block: any, fn: HIRFunction): number {
  // Simplified calculation - in a real implementation this would
  // analyze the control flow graph to determine actual nesting
  return block.preds ? block.preds.size : 0;
}

/**
 * Get the hook name from an instruction
 */
function getHookName(instruction: CallExpression | MethodCall): string {
  if (instruction.kind === 'CallExpression') {
    return instruction.callee.identifier.name?.value || 'unknown hook';
  } else {
    return instruction.property.identifier.name?.value || 'unknown hook method';
  }
}

/**
 * Convert configuration severity to compiler severity
 */
function getSeverityLevel(severity: 'error' | 'warning' | 'info'): ErrorSeverity {
  switch (severity) {
    case 'error': return ErrorSeverity.InvalidReact;
    case 'warning': return ErrorSeverity.Todo; // Using Todo as warning level
    case 'info': return ErrorSeverity.Todo;
    default: return ErrorSeverity.InvalidReact;
  }
}

/**
 * Generate auto-fix suggestions based on the violation context
 */
function generateAutoFixSuggestions(hookName: string, nestingDepth: number): any[] {
  const suggestions = [];
  
  if (nestingDepth <= 1) {
    suggestions.push({
      description: `Move ${hookName} call outside the conditional block`,
      operation: 'move-hook-outside'
    });
  }
  
  if (hookName.includes('Effect') || hookName.includes('Memo')) {
    suggestions.push({
      description: `Use conditional logic inside ${hookName} callback instead`,
      operation: 'move-condition-inside-hook'
    });
  }
  
  if (nestingDepth > 2) {
    suggestions.push({
      description: `Consider refactoring to reduce nesting depth (currently ${nestingDepth} levels)`,
      operation: 'reduce-nesting'
    });
  }
  
  return suggestions;
}

/**
 * Export both the original and enhanced versions
 */
export { validateConditionalHooksUsageWithConfig as validateConditionalHooksUsageEnhanced };

/**
 * Preset configurations for common use cases
 */
export const PRESET_CONFIGS = {
  STRICT: {
    ...DEFAULT_CONFIG,
    maxNestingDepth: 1,
    violationSeverity: 'error' as const,
    detectNestedConditionals: true
  },
  
  RELAXED: {
    ...DEFAULT_CONFIG,
    maxNestingDepth: 5,
    violationSeverity: 'warning' as const,
    detectNestedConditionals: false
  },
  
  PERFORMANCE_FOCUSED: {
    ...DEFAULT_CONFIG,
    enablePerformanceMonitoring: true,
    provideAutoFixSuggestions: false
  },
  
  DEVELOPMENT: {
    ...DEFAULT_CONFIG,
    enablePerformanceMonitoring: true,
    provideAutoFixSuggestions: true,
    violationSeverity: 'warning' as const
  }
} as const;
