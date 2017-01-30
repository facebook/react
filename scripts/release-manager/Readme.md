# react-release-manager

This is a tool that is being used to manage React releases.

## Prerequisites

You should have an existing clone of the React repo. We will call this a **“working copy”**. Ideally this is where you are most comfortable working on React.

Your working copy of React **should be up to date**. Check out the `master` branch in it and run `git pull` just to be sure.

## Cloning the Release Manager

**If this is your first time using the Release Manager**, you need to set it up.
Skip this section if you’ve done this before.

The Release Manager is also located inside the React repository so you need to **clone it to a separate folder**. Call it something other than `react` so that you don’t confuse it with the working copy.

Check it out, install the dependencies, and run the CLI:

  ```
  cd ~/projects # or wherever
  git clone https://github.com/facebook/react.git react-release-manager
  cd react-release-manager/scripts/release-manager
  yarn
  ./cli.js
  ```
  
  You will see a command-line interface that lets you enter commands.
  It will need to learn a few things to work on your machine.
  Type `init` and press Enter. It will ask you a few prompts:
  
  1. `GitHub token? (needs "repo" privs)`
    Follow [these instructions](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) to generate a GitHub token. Make sure to put a checkmark for `repo` privileges. Don’t share it with anyone!

  2. `Location of local React checkout?`
    Enter the local path to your React working copy. For example, it is `~/projects/react` on my machine.
  
Now you should be all set for releasing React on this machine!

## Before You Do Anything Else

You should have two separate React checkouts by now:

* **The Release Manager copy.** The previous section described how to set it up. You will only use this checkout for *running* the Release Manager. Run `git checkout master` and `git pull` to ensure it is up-to-date.

* **Your working copy of React.** The Release Manager will operate on it, and you will fix any merge conflicts inside of it. This should be the folder path you specified when you ran `init` in the previous section. Run `git checkout master` and `git pull` to ensure it is up-to-date.

Both clones clean and up-to-date?
If you aren’t already running it, run the Release Manager CLI:

```
cd react-release-manager/scripts/release-manager
./cli.js
```

Keep your working copy and the running Release Manager in separate terminal tabs.

## Updating the Documentation

When we merge a pull request to the documentation and it is relevant to the current version, we tag it with a `Documentation: needs merge to stable` label. The Release Manager can cherry-pick those commits so that they appear on the website.

The documentation is built from the current stable branch. For example, for React 15.x the branch is called `15-stable`. Switch your working copy to it:

```
cd react
git checkout 15-stable
git pull
```

Then, in the Release Manager, run the command:

```
docs-prs
```

The Release Manager should find the PRs that haven’t been merged yet. Reply with `y` to get them merged and then with `y` to push your changes.

**Tip:** If you see an error like `The previous cherry-pick is now empty, possibly due to conflict resolution` it might mean that there’s a stray PR with a label that has already been merged to the stable branch. In this case you need to remove the label manually and retry the command.

## Cutting a Release

### Verifying Permissions

In the Release Manager, verify you have npm publish permissions:

```
npm-check-access
```

You will need to get all permissions before you can proceed.

### Cherry Picking PRs

If the permissions are cool, run:

```
start-release
```

**Tip:** if you get an error saying `'upstream' does not appear to be a git repository`, run `git remote add upstream https://github.com/facebook/react.git` in your working copy of React and try again.

If everything went well, you should see a green `OK!` in the output.

Create a new milestone in the [GitHub web interface](https://github.com/facebook/react/milestones) for the new release. Name it exactly after the version you intend to cut (e.g. `15.4.1`). Then run:

```
stable-prs
```

First, choose the current major “stable” milestone (such as `15-next`). Note that the Release Manager only sees merged PRs that have this milestone.

**Tip:** our 15.x branch has diverged significantly so we are using `15-hipri` for things we really need to get out, and `15-lopri` for everything else. This is a temporary situation that should get better after Fiber is out.

Next, choose the milestone you just created. This one should be specific and correspond to the version you intend to publish (such as `15.4.1`). The Release Manager will re-tag all PRs matching the previous “stable” milestone with this specific milestone after cherry-picking them.

Finally, pick all appropriate labels with a spacebar. For example, a patch release usually contains `exempt` and `patch` PRs, and a minor release contains `minor` PRs in addition to them.

Now the Release Manager will find all relevant PRs and attempt to cherry-pick them. Before agreeing to this, copy the list of PRs it prints out so that you can look them up later when you write the changelog.

It is likely that some PRs won’t get merged cleanly. You’ll need to manually resolve the conflicts in the working copy. If the resolutions are not obvious it might be a sign the branches diverged too much which might be bad. (Talk to the team.)

### Verifying the Changes

Your working copy should now be in a clean state on a development branch. For example, during 15.x the development branch is `15-dev`.

Verify it by running:

```
git status

>On branch 15-dev
>Your branch is ahead of 'origin/15-dev' by 10 commits.
>  (use "git push" to publish your local commits)
>nothing to commit, working directory clean
```

Next, run `npm test`.

If there are any issues you might have introduced mistakes resolving conflicts.
You can fix them in a separate commit.

**Tip:** tests might also be failing if dependency versions are incorrect. You might want to run `yarn` first since sometimes `package.json` on master is different from the stable branches.

### Update the Error Codes

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

Run this so that `scripts/error-codes/codes.json` is up to date:

```
./node_modules/.bin/gulp react:extract-errors
```

Check `git diff`. Do changes, if any, look sensible?

If there are any changes, commit them:

```
git commit -am 'Update error codes'
```

You will see the commit hash. Copy it in your editor. You will need it later to cherry-pick the error codes update to master.

If there were no changes, it’s also fine.

### Push and Choose the Branch

If you followed the guide correctly (and ran `start-release` in the beginning), you should be on a “stable development” branch such as `15-dev`. Now is a good time to push the development branch:

```
git push
```

Then comes the important part.  
**If you plan to cut a stable release, switch the branch to the stable branch now.**

For example, if you plan to cut `15.4.1` (rather than a `15.4.1-0` alpha release), run:

```
git checkout 15-stable
git merge --no-ff 15-dev
```

This will merge the commits you cherry-picked into the stable branch.

However, if you plan to cut an alpha or a beta, you should stay on the “stable development” branch.

### Update the Lockfile

Run this so that the build is reproducible:

```
rm yarn.lock
rm -rf node_modules
yarn cache clean
yarn
```

Check `git diff`. Do changes look sensible?

Commit your changes:

```
git commit -am 'Update Yarn lockfile'
```

If you’re feeling extra careful, you can run `npm test` again.

### Write the Changelog

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

Open `CHANGELOG.md` in the working copy and add release notes in the same format as earlier. It’s usually a good idea to summarize changes in a friendly way instead of using PR titles. While you may skip non-essential changes, it’s still good to give credit to contributors, so maybe group them together. You can verify that you haven’t messed up the markup by previewing them in an online Markdown editor.

Commit your changes, for example:

```
git commit -am 'Add <put the version here> changelog'
```

You will see the commit hash. Copy it in your editor. You will need it later to cherry-pick the changelog update to master.

### Bump the Version

In the Release Manager, run:

```
version
```

It will ask you about the version you want to ship and it will commit the result with a tag.

We’re not pushing anything yet, it will just create a local commit.

### Ensure You Have the Bower Repo

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

There’s another repository you need to clone!  
This time, it should be a sibling of your React working copy.

In the working copy directory, you can run:

```
git clone https://github.com/reactjs/react-bower.git ../react-bower
```

### Build It!

The next step depends on the type of release you want to cut.

For a **stable** release, run in the working copy:

```
./node_modules/.bin/grunt release
```

This will create the build products in the working copy. You won’t see changes in git because the `build` folder is ignored. It will also create a commit and a tag in the `../react-bower` folder. I recommend checking `git log` and running `git show <put last commit hash here>` to verify the changes roughly correspond to what you expect.

For a **pre-release**, run this instead:

```
npm run build
```

### Verify the Build Works

At the very least, open `fixtures/globals.html` in the browser. You should see a “Hello, World!” fading in, and the console should have no errors.

If you changed anything related to how packages are created, I recommend following the instructions in `fixtures/README.md` and verifying that each of those manual tests works. You can skip the “build React” step in it but still need to build the fixtures.

They are manual tests, so the CI wouldn’t have caught errors in them.

### Update the Docs

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

You will see that `docs/js/react-dom.js` and `docs/js/react.js` have changed. This is because the docs are now using a newer version of React. In addition to those changes, bump the version inside `docs/_config.yml`:

```diff
- react_version: 15.4.0
+ react_version: <put the new version here>
```

Now commit the changes:

```
git commit -am 'Update React version in docs'
```

### Push the Working Copy

Now we are ready to push the branch in the working copy:

```
git push
git push --tags
```

### Release on Bower

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

Go to the Bower folder from your working copy and push the new commit and tag:

```
cd ../react-bower
git push
git push --tags
cd ../react
```

### Release on npm

In the Release Manager, run:

```
npm-publish
```

### Cherry-Pick the Changelog

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

Remember how you saved the hash of the commit changelog a few hours before?

Now it’s time to switch our working copy to `master` and cherry-pick it:

```
git checkout master
git pull
git cherry-pick <hash of the changelog commit>
```

Verify you picked the right commit:

```
git diff HEAD~
```

Looks good? Push it.

```
git push
```

### Cherry-Pick the Error Codes

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

If error codes were updated, you were supposed to commit that earlier and record the commit hash.

Did this happen?

If so, cherry-pick it to `master` as well:

```
git cherry-pick <hash of the error codes update commit>
```

Verify you picked the right commit:

```
git diff HEAD~
```

Looks good? Push it.

```
git push
```

### Creating a GitHub Release

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

Copy your new release notes from `CHANGELOG.md` and [create a new Release](https://github.com/facebook/react/releases/new) on GitHub. Choose the tag version you just pushed in the dropdown so that it says “Existing tag”. Paste the release notes and push the button.

### Force-Updating the Website

**This step is only necessary for a stable release.**  
If you’re just cutting an alpha, you should skip it.

Normally the docs should update themselves after CI runs.  
However sometimes our CI might be slow or something might break.

You can rebuild the docs manually if you want to.  
Make sure you have a React copy in a sibling folder called `react-gh-pages`:

```
git clone https://github.com/facebook/react.git ../react-gh-pages
```

Then make sure it’s on `gh-pages` branch and that it’s up-to-date:

```
cd ../react-gh-pages
git checkout gh-pages
git pull
```

Switch back to the working copy and go to the `docs` folder:

```
cd ../react/docs
```

Switch to the stable branch (the one you just spent a lot of time with).  
For example:

```
git checkout 15-stable
```

Build the docs now:

```
bundle install # Might need sudo.
bundle exec rake release
```

If this fails, maybe you’re missing some Ruby dependencies:

```
gem install bundler
```

Install them and try again.

This should not produce any changes in the working copy, but `react-gh-pages` should get some file changes:

```
cd ../../react-gh-pages
git diff
```

If they look alright, commit and push them:

```
git commit -am 'Rebuild the website'
git push
```

Now open https://facebook.github.io/react/, give it a few minutes, refresh, and behold.

Don’t forget to switch to `master` for the future development.

```
git checkout master
```

### Bonus: Trying It Out

Run:

```
npm i -g create-react-app
create-react-app ../my-new-app
cd ../my-new-app
npm start
```

This should use the latest version of React.

