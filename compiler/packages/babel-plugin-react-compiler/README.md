# babel-plugin-react-compiler

React Compiler is a compiler that optimizes React applications, ensuring that only the minimal parts of components and hooks will re-render when state changes. The compiler also validates that components and hooks follow the Rules of React.

This package contains the React Compiler Babel plugin use in projects that make use of Babel. You can find instructions for using this plugin here: https://react.dev/learn/react-compiler

## New Features

### New Error Type

The React Compiler now supports a new error type called `NewErrorType`. This error type can be used to handle new types of compiler errors. You can add new error handling logic for `NewErrorType` in the `CompilerErrorDetail` class.

### New Optimization Pass

A new optimization pass has been added to the React Compiler. This optimization pass can be found in the `compiler/packages/babel-plugin-react-compiler/src/Inference/NewOptimizationPass.ts` file. The new optimization logic is implemented in this file.

### Development Guidelines

When contributing to the React Compiler, please follow these guidelines to ensure consistency and quality:

1. **Code Style**: Follow the existing code style and conventions. Use Prettier and ESLint to format and lint your code.
2. **Documentation**: Update or add documentation for any new features or changes. This includes updating the README.md, DEVELOPMENT_GUIDE.md, and any relevant comments in the code.
3. **Testing**: Write tests for any new features or bug fixes. Add new test fixtures in the `compiler/fixtures` directory to cover new features or bug fixes.
4. **Pull Requests**: Ensure all changes are well-documented and tested before making a pull request. Provide a clear description of the changes and the motivation behind them.
5. **Review Process**: Be responsive to feedback during the review process. Address any comments or suggestions from reviewers in a timely manner.

### Examples

Here are some examples of how to follow the new development guidelines:

- **Code Style**: Ensure your code is formatted using Prettier and passes all ESLint checks.
- **Documentation**: Update the README.md to include information about any new features or changes. Add comments in the code to explain complex logic or important details.
- **Testing**: Write tests for new features or bug fixes. Add new test fixtures in the `compiler/fixtures` directory to cover new features or bug fixes.
- **Pull Requests**: Provide a clear description of the changes and the motivation behind them. Ensure all changes are well-documented and tested before making a pull request.
- **Review Process**: Be responsive to feedback during the review process. Address any comments or suggestions from reviewers in a timely manner.
