# React PR Validation Scripts

This directory contains two Bash scripts for validating React PRs:

## Scripts Overview

### 1. `validate-pr-34116.sh` - General PR Validation
A comprehensive script that automates the complete validation process for any React PR. This script:

- Clones the repository and sets up remotes
- Checks out the specific PR branch
- Installs dependencies and builds the project
- Runs tests and static analysis
- Generates a standardized review comment

### 2. `validate-react-pr.sh` - React-Specific Validation
A specialized script focused on React ecosystem specific validations:

- Analyzes changed files to determine relevant test scope
- Runs multiple build configurations (dev/prod/experimental)
- Validates React DevTools compatibility
- Checks React-specific patterns and best practices
- Performs backward compatibility analysis

## Usage

### Prerequisites
- Git installed and configured
- Node.js (version compatible with React development)
- Yarn package manager
- Bash shell (Git Bash on Windows, Terminal on macOS/Linux)

### Running the Scripts

#### General Validation (Complete Workflow)
```bash
# Navigate to a clean directory
cd /path/to/validation/workspace

# Run the general validation script
./validate-pr-34116.sh
```

#### React-Specific Validation (After General Setup)
```bash
# Run this after the general script, or in an existing React repo
./validate-react-pr.sh
```

### Configuration

Before running, update these variables in the scripts:

#### `validate-pr-34116.sh`:
```bash
PR_NUMBER="34116"                    # The PR number to validate
UPSTREAM_REPO="facebook/react"       # Original repository
FORK_REPO="SaurabhCodesAI/react"    # Contributor's fork (update this)
```

#### `validate-react-pr.sh`:
```bash
PR_NUMBER="34116"                    # Same PR number
UPSTREAM_REPO="facebook/react"       # Original repository
```

## Workflow Steps

### Automated Steps (General Script)
1. **Prerequisites Check**: Verifies Git, Yarn, and Node.js are installed
2. **Repository Setup**: Clones upstream repo and adds fork remote
3. **PR Branch Checkout**: Fetches and checks out the PR branch
4. **Dependency Installation**: Runs `yarn install --frozen-lockfile`
5. **Project Build**: Executes the React build process
6. **Main Branch Comparison**: Optional step to verify bug on main branch
7. **Test Execution**: Runs relevant test suites
8. **Static Analysis**: Performs linting and type checking
9. **Review Generation**: Creates a standardized GitHub review comment

### React-Specific Steps (React Script)
1. **Change Analysis**: Examines modified files to suggest relevant tests
2. **Pattern Validation**: Checks for React-specific coding patterns
3. **Multi-Build Testing**: Tests dev, prod, and experimental builds
4. **DevTools Compatibility**: Validates React DevTools integration
5. **Backward Compatibility**: Checks for breaking changes
6. **Performance Testing**: Optional performance regression tests
7. **Targeted Testing**: Runs tests specific to changed components

## Output Files

Both scripts generate validation reports:

- `pr_validation_comment.txt` - Standard GitHub review comment
- `react_pr_validation.txt` - React-specific validation report
- `pr_validation_failure.txt` - Generated if validation fails

## Test Selection Guide

When prompted for test selection, consider:

- **ReactDOM changes**: Focus on DOM-related tests
- **Core React changes**: Run React core functionality tests
- **Hook changes**: Prioritize hook-specific test suites
- **Concurrent features**: Test concurrent rendering scenarios
- **SSR changes**: Run server-side rendering tests

## Common Test Patterns

```bash
# Specific component tests
yarn test ReactDOM
yarn test React
yarn test Hook

# File-specific tests
yarn test __tests__/ReactDOMComponent-test.js

# Pattern matching
yarn test --testNamePattern="Suspense|concurrent"
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are correctly installed
   - Verify no syntax errors in the PR changes

2. **Test Failures**
   - Determine if failures are related to PR changes
   - Check for flaky tests by running multiple times
   - Compare test results with main branch

3. **Network Issues**
   - Ensure stable internet connection for Git operations
   - Consider using SSH instead of HTTPS for Git remotes
   - Check GitHub access permissions

4. **Permission Issues**
   - Ensure scripts have execute permissions (`chmod +x` on Unix systems)
   - On Windows, run in Git Bash or WSL

### Environment Setup

For optimal results, ensure your environment matches React's development requirements:

```bash
# Check versions
node --version    # Should be LTS version
yarn --version    # Latest stable
git --version     # Recent version with proper configuration
```

## Best Practices

1. **Always validate on a clean environment** to avoid local configuration issues
2. **Run the complete test suite** for critical changes affecting core functionality
3. **Check both development and production builds** to catch build-specific issues
4. **Review the generated comments** before posting to ensure accuracy
5. **Keep validation logs** for reference and debugging

## Security Considerations

- Scripts clone public repositories only
- No sensitive information is stored or transmitted
- All operations are performed in temporary directories
- Cleanup functions ensure no residual files

## Contributing

To improve these scripts:

1. Test with different PR types and scenarios
2. Add support for additional React testing tools
3. Enhance error handling and user guidance
4. Update test patterns based on React's evolving architecture

---

**Note**: These scripts are designed for experienced React contributors familiar with the project's testing and validation workflows. Always review the generated output and use your engineering judgment when providing PR feedback.
