# React Forget

React Forget is an experimental Babel plugin to automatically memoize React Hooks and Components.

## Development

```sh
# tsc --watch
$ yarn dev

# in another terminal window
$ yarn test --watch
```

## Notes

An overview of the implementation can be found in the [Architecture Overview](./ARCHITECTURE.md).

This transform

- needs [plugin-syntax-jsx](https://babeljs.io/docs/en/babel-plugin-syntax-jsx) as a dependency to inherit the syntax from.
- should be run before [plugin-transform-react-jsx](https://github.com/babel/babel/tree/main/packages/babel-plugin-transform-react-jsx)
- assume the enforcement of [rules of hooks](https://reactjs.org/docs/hooks-rules.html), i.e.
  - only call hooks from React functions
  - only call hooks at the top level
  - <https://www.npmjs.com/package/eslint-plugin-react-hooks>

Scaffolding

- <https://github.com/facebook/flow/tree/master/packages/babel-plugin-transform-flow-enums>
- <https://github.com/babel/babel/blob/main/packages/babel-plugin-transform-react-jsx/src/create-plugin.ts>

Reference

- [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)

## Rust Development

## First-Time Setup

1. Install Rust using `rustup`. See the guide at https://www.rust-lang.org/tools/install.
2. Install Visual Studio Code from https://code.visualstudio.com/. 
   Note to Meta employees: install the stock version from that website, not the pre-installed version.
3. Install the Rust Analyzer VSCode extension through the VSCode marketplace. See instructions at https://rust-analyzer.github.io/manual.html#vs-code.
4. Install `cargo edit` which extends cargo with commands to manage dependencies. See https://github.com/killercup/cargo-edit#installation
5. Install `cargo insta` which extens cargo with a command to manage snapshots. See https://insta.rs/docs/cli/

## Workspace Hygiene

### Adding Dependencies 

To add a dependency, add it to the top-level `Cargo.toml`

```
// forget/Cargo.toml
[workspace.dependencies]
...
new_dep = { version = "x.y.z" }
...
```

Then reference it from your crate as follows:

```
// forget/crates/forget_foo/Cargo.toml
[dependencies]
...
new_dep = { workspace = true }
...
```

### Adding new crates

Rust's compilation strategy is largely based on parallelizing at the granularity of crates, so builds can be faster when projects
have more but smaller crates. Where possible it helps to structure crates to minimize dependencies. For example, our various compiler
passes depend on each other in the sense that they often must run in a certain order. However, they often don't need to call each other,
so they can generally be split into crates of similar types of passes, so that those crates can compile in parallel.

As a rule of thumb, add crates at roughly the granularity of our existing top-level folds. If you have some one-off utility code that 
doesn't fit neatly in a crate, add it to `forget_utils` rather than add a one-off crate for it.

## Running Tests

Run all tests with the following from the root directory:

```
cargo test
```

The majority of our tests will (should) live in the `forget_fixtures` crate, which is a test-only crate that runs compilation end-to-end with snapshot
tests. To run just these tests use:

```
# quiet version
cargo test -p forget_fixtures 

# without suppressing stdout/stderr output
cargo test -p forget_fixtures -- --nocapture
```

Another hint is that VSCode will show a "Run test" option if you hover over a test in the source code, this lets you run a single test easily.
The command line will also give you the CLI command to run just that one test.

## Updating Snapshots

The above tests make frequent use of snapshot tests. If snapshots do not match the tests will fail with a diff, if the new output is correct you
can accept the changes with:

```
cargo insta accept
```

If this command fails, see the note in "first-time setup" about installing `cargo insta`.

## CI Configuration

GitHub CI is configured in `.github/workflows/rust.yml`.