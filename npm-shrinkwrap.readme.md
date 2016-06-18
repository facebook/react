All of our npm dependencies are locked via the `npm-shrinkwrap.json` file for the following reasons:

- our project has lots of dependencies which update at unpredictable times, so it's important that
  we update them explicitly once in a while rather than implicitly when any of us runs npm install
- locked dependencies allow us to do reuse npm cache on travis, significantly speeding up our builds
  (by 5 minutes or more)
- locked dependencies allow us to detect when node_modules folder is out of date after a branch switch
  which allows us to build the project with the correct dependencies every time

We also generate `npm-shrinkwrap.clean.js` file which is used during code reviews or debugging to easily review what has actually changed without extra noise.

To add a new dependency do the following:

1. if you are on linux or windows, then use MacOS or ask someone with MacOS to perform the 
   installation. This is due to an optional `fsevents` dependency that is really required on MacOS 
   to get good performance from file watching.
2. make sure you are in sync with `upstream/master`
3. ensure that your `node_modules` directory is not stale by running `npm install`
4. add a new dependency via `npm install --save-dev <packagename>`
5. run `./tools/npm/reshrinkwrap`
6. these steps should change 3 files: `package.json`, `npm-shrinkwrap.json` and `npm-shrinkwrap.clean.json`
7. commit changes to these three files and you are done


To update existing dependency do the following:

1. if you are on linux or windows, then use MacOS or ask someone with MacOS to perform the 
   installation. This is due to an optional `fsevents` dependency that is really required on MacOS 
   to get good performance from file watching.
2. make sure you are in sync with `upstream/master`: `git fetch upstream && git rebase upstream/master`
3. ensure that your `node_modules` directory is not stale by running `npm install`
4. run `npm install --save-dev <packagename>@<version|latest>` or `npm update <packagename>` to 
   update to the latest version that matches version constraint in `package.json`
5. run `./tools/npm/reshrinkwrap`
6. these steps should change 2 files: `npm-shrinkwrap.json` and `npm-shrinkwrap.clean.json`.
   Optionally if you used `npm install ...` in the first step, `package.json` might be modified as 
   well.
7. commit changes to these three files and you are done


To Remove an existing dependency do the following:

1. if you are on linux or windows, then use MacOS or ask someone with MacOS to perform the 
   installation. This is due to an optional `fsevents` dependency that is really required on MacOS 
   to get good performance from file watching.
2. make sure you are in sync with `upstream/master`: `git fetch upstream && git rebase upstream/master`
3. ensure that your `node_modules` directory is not stale by running `npm install`
4. run `npm uninstall --save-dev <packagename>@<version|latest>`
5. run `./tools/npm/reshrinkwrap`
6. these steps should change 3 files: `npm-shrinkwrap.json` and `npm-shrinkwrap.clean.json`.
7. commit changes to these three files and you are done
