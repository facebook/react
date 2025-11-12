# React Benchmarking

## Commands

In most cases, the only two commands you might want to use are:

- `yarn start`
- `yarn --cwd=../../ build react/index,react-dom/index --type=UMD_PROD && yarn start --skip-build`

The first command will run benchmarks with all the default settings. A local and remote build will occur on React and ReactDOM UMD bundles, and both local and remote repositories will be run against all benchmarks.

The second command will run all benchmarks but skip the build process. This is useful for local performance tweaking when the remote repository has already had its bundles built. Both local and remote repositories will be run against all benchmarks with this command as well.

The other commands are as follows:

```bash
# Compare local repo vs remote merge base repo
yarn start

# Compare local repo vs remote merge base repo
# This can significantly improve benchmark times due to no build
yarn start --skip-build

# Build and run local repo against benchmarks (no remote values will be shown)
yarn start --local

# Build and run remote merge base repo against benchmarks (no local values will be shown)
yarn start --remote

# Build and run remote main repo against benchmarks
yarn start --remote=main

# Same as "yarn start"
yarn start --remote --local

# Run benchmarks with Chrome in headless mode
yarn start --headless

# Run only specific string matching benchmarks
yarn start --benchmark=hacker
```
