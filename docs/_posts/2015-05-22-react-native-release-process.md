---
title: "React Native Release Process"
author: vjeux
---

The React Native release process have been a bit chaotic since we open sourced. It was unclear when new code was released, there was no changelog, we bumped the minor and patch version inconsistently and we often had to submit updates right after a release to fix a bad bug. In order to *move fast with stable infra*, we are introducing a real release process with a two-week release schedule.

To explain how it works, let me walk you through an example. Today, Friday, we took the current state of master and put it on the 0.5-stable branch. We [published 0.5.0-rc](https://github.com/facebook/react-native/releases/tag/v0.5.0-rc), an RC (Release Candidate) when we cut the branch. For two weeks, we're going to let it stabilize and only cherry-pick critical bug fixes from master.

Friday in two weeks, we're going to publish the 0.5.0 release, create the 0.6-stable branch and publish 0.6.0-rc as well.

The release process is synchronized with Facebook's mobile release process. This means that everything in the open source release is also being shipped as part of all the Facebook apps that use React Native!

You now have three ways to get React Native. You should chose the one you want based on the amount of risk you tolerate:

- **master**: You have updates as soon as they are committed. This is if you want to live on the bleeding edge or want to submit pull requests.
- **rc**: If you don't want to update every day and deal with many instabilities but want to have recent updates, this is your best shot.
- **release**: This is the most stable version we offer. The trade-off is that it contains commits that are up to a month old.

If you want more details, I highly recommend this video that explains how Facebook mobile release process works and why it was setup this way.

<iframe width="650" height="300" src="https://www.youtube.com/embed/mOyoTUETmSM" frameborder="0" allowfullscreen></iframe>
