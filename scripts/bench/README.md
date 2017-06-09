# React Benchmarking

## Commands

In most cases, the only two commands you might want to use are:

- `yarn bench`
- `yarn build -- --type=UMD_PROD && yarn bench -- --skip-build`

The first command will run benchmarks with all the default settings. A local and remote build will occcur on all bundles, both local and remote repos will be run against all benchmarks.

The second command will run all benchmarks but skip the build process. This is useful for when doing local performance tweaking and the remote repo has already had its bundles built. Both local and remote repos will be run against all benchmarks with this command too.

The other commands are as follows:

```bash
# will compare local repo vs remote merge base repo
yarn bench

# will compare local repo vs remote merge base repo
# this can significantly improve bench times due to no build
yarn bench -- --skip-build

# will only build and run local repo against benchmarks (no remote values will be shown)
yarn bench -- --local

# will only build and run remote merge base repo against benchmarks (no local values will be shown)
yarn bench -- --remote

# will only build and run remote master repo against benchmarks
yarn bench -- --remote=master

# same as "yarn bench"
yarn bench -- --remote --local

# runs benchmarks with Chrome in headless mode
yarn bench -- --headless

# runs only specific string matching benchmarks
yarn bench -- --benchmark=hacker
```