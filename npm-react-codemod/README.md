## react-codemod

This repository contains a collection of codemod scripts based on
[JSCodeshift](https://github.com/facebook/jscodeshift) that help update React
APIs.

### Setup & Run

  * `npm install -g react-codemod`
  * `react-codemod <codemod-script> <file>`
  * Use the `-d` option for a dry-run and use `-p` to print the output
    for comparison

### Recast Options

Options to [recast](https://github.com/benjamn/recast)'s printer can be provided
through the `printOptions` command line argument

 * `react-codemod class <file> --printOptions='{"quote":"double"}'`
