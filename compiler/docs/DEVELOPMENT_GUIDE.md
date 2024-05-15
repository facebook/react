# React Compiler Development Guide

Note: for general notes about contributing, see the [CONTRIBUTING.md](../CONTRIBUTING.md).

## Compiler Development

For general compiler development we recommend the following workflow:

```sh
# Install dependencies
yarn

# build the custom test runner
yarn snap:build

# Run the primary tests in watch mode
yarn snap --watch
```

`snap` is our custom test runner, which creates "golden" test files that have the expected output for each input fixture, as well as the results of executing a specific input (or sequence of inputs) in both the uncompiled and compiler versions of the input. 

When contributing changes, we prefer to:
* Add one or more fixtures that demonstrate the current compiled output for a particular combination of input and configuration. Send this as a first PR.
* Then, make changes to the compiler that achieve the desired output for those examples. Commit both the output changes and the corresponding compiler changes in a second PR.

## (WIP) Rust Development

We have a work-in-progress Rust port of React Compiler. The code here is unused, and was developed to help understand the feasibility and path to porting to Rust and integrating with various Rust or non-JS build systems, such as SWC, OXC, ESBuild, etc. We are currently in the process of changing the data representation used in parts of the compiler to both improve compilation, which will also have the side benefit of making it even easier to port to Rust. We will re-evaluate where to go with the Rust port once that refactoring is complete.

### First-Time Setup

1. Install Rust using `rustup`. See the guide at https://www.rust-lang.org/tools/install.
2. Install Visual Studio Code from https://code.visualstudio.com/.
   Note to Meta employees: install the stock version from that website, not the pre-installed version.
3. Install the Rust Analyzer VSCode extension through the VSCode marketplace. See instructions at https://rust-analyzer.github.io/manual.html#vs-code.
4. Install `cargo edit` which extends cargo with commands to manage dependencies. See https://github.com/killercup/cargo-edit#installation
5. Install `cargo insta` which extens cargo with a command to manage snapshots. See https://insta.rs/docs/cli/

### Workspace Hygiene

#### Adding Dependencies

To add a dependency, add it to the top-level `Cargo.toml`

```
// Cargo.toml
[workspace.dependencies]
...
new_dep = { version = "x.y.z" }
...
```

Then reference it from your crate as follows:

```
// crates/react_foo/Cargo.toml
[dependencies]
...
new_dep = { workspace = true }
...
```

#### Adding new crates

Rust's compilation strategy is largely based on parallelizing at the granularity of crates, so builds can be faster when projects
have more but smaller crates. Where possible it helps to structure crates to minimize dependencies. For example, our various compiler
passes depend on each other in the sense that they often must run in a certain order. However, they often don't need to call each other,
so they can generally be split into crates of similar types of passes, so that those crates can compile in parallel.

As a rule of thumb, add crates at roughly the granularity of our existing top-level folds. If you have some one-off utility code that
doesn't fit neatly in a crate, add it to `react_utils` rather than add a one-off crate for it.

### Running Tests

Run all tests with the following from the root directory:

```
cargo test
```

The majority of our tests will (should) live in the `react_fixtures` crate, which is a test-only crate that runs compilation end-to-end with snapshot
tests. To run just these tests use:

```
# quiet version
cargo test -p react_fixtures

# without suppressing stdout/stderr output
cargo test -p react_fixtures -- --nocapture
```

Another hint is that VSCode will show a "Run test" option if you hover over a test in the source code, this lets you run a single test easily.
The command line will also give you the CLI command to run just that one test.

### Updating Snapshots

The above tests make frequent use of snapshot tests. If snapshots do not match the tests will fail with a diff, if the new output is correct you
can accept the changes with:

```
cargo insta accept
```

If this command fails, see the note in "first-time setup" about installing `cargo insta`.

### CI Configuration

GitHub CI is configured in `.github/workflows/rust.yml`.