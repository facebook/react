# Contributing to React

Thank you for your interest in contributing to React! This guide will help you get started with the contribution process.

## Code of Conduct

Facebook has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as its Code of Conduct. We expect all project participants to adhere to it. Please read the [full text](https://www.contributor-covenant.org/version/2/0/code_of_conduct/) to understand what actions will and will not be tolerated.

## Open Development

All work on React happens directly on GitHub. Both core team members and external contributors send pull requests which go through the same review process.

## Semantic Versioning

React follows [semantic versioning](https://semver.org/). We release patch versions for critical bugfixes, minor versions for new features or non-essential changes, and major versions for breaking changes. When we make breaking changes, we also introduce deprecation warnings in a minor version to help users migrate their code in advance.

## How to Contribute

### Reporting Bugs

- **Where to Find Known Issues**: Check [GitHub Issues](https://github.com/facebook/react/issues) for existing problems before filing a new issue.
- **Reporting New Issues**: Provide a reduced test case when possible. This [JSFiddle template](https://jsfiddle.net/Luktwrdm/) is a great starting point.
- **Security Bugs**: Please do not file public issues for security bugs. Follow the process outlined on the [Facebook Bug Bounty](https://www.facebook.com/whitehat/) page.

### Proposing a Change

1. For significant changes, open an issue to discuss your proposal before putting in substantial effort.
2. For bug fixes, feel free to submit a pull request right away.

### Your First Pull Request

- Check out the list of [good first issues](https://github.com/facebook/react/issues?q=is:open+is:issue+label:"good+first+issue") to get started.
- Learn how to contribute with this free video series: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

### Sending a Pull Request

1. Fork the repository and create your branch from `main`.
2. Run `yarn` in the repository root.
3. Add tests if you've fixed a bug or added code.
4. Ensure the test suite passes (`yarn test`).
5. Run `yarn test --prod` to test in the production environment.
6. Format your code with prettier (`yarn prettier`).
7. Make sure your code lints (`yarn lint`).
8. Run the Flow typechecks (`yarn flow`).
9. Complete the Contributor License Agreement (CLA) if you haven't already.

### Contribution Prerequisites

- Node (LTS version) and Yarn (v1.2.0+)
- JDK
- gcc (or a compatible compiler)
- Familiarity with Git

### Development Workflow

After cloning React, run `yarn` to fetch dependencies. Then you can run several commands:

- `yarn lint`: Checks code style
- `yarn test`: Runs the complete test suite
- `yarn flow`: Runs Flow typechecks
- `yarn build`: Creates a build folder with all packages

For more detailed information on the development workflow and how to test your changes, please refer to the full [contribution guide](https://reactjs.org/docs/how-to-contribute.html).

## Style Guide

We use [Prettier](https://prettier.io/) for automatic code formatting and a linter to catch styling issues. Run `yarn prettier` after making changes, and `yarn linc` to check your code styling.

## License

By contributing to React, you agree that your contributions will be licensed under its MIT license.

## Additional Resources

- [How to Contribute](https://reactjs.org/docs/how-to-contribute.html)
- [Codebase Overview](https://reactjs.org/docs/codebase-overview.html)
- [React RFC Process](https://github.com/reactjs/rfcs)

Thank you for contributing to React!
