# React Benchmarking

## Commands

```bash
# will compare local repo vs remote merge base repo
yarn bench

# will comapre local repo vs remote merge base repo
# this can significantly improve bench times due to no build
yarn bench -- --skip-build

# will only build and run local repo against benchmarks
yarn bench -- --local

# will only build and run remote merge base repo against benchmarks
yarn bench -- --remote

# will only build and run remote master repo against benchmarks
yarn bench -- --remote=master

# same as "yarn build"
yarn bench -- --remote --local

# runs benchmarks with Chrome in headless mode
yarn bench -- --headless

# runs only specific string matching benchmarks
yarn bench -- --benchmark=hacker
```