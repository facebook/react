# This is an OPEN Open Source Project

-----------------------------------------

## What?

Individuals making significant and valuable contributions are given
commit-access to the project to contribute as they see fit. This project is
more like an open wiki than a standard guarded open source project.

## Rules

There are a few basic ground-rules for contributors:

1. **No `--force` pushes** or modifying the Git history in any way.
1. **Non-master branches** ought to be used for ongoing work.
1. **External API changes and significant modifications** ought to be subject
   to an **internal pull-request** to solicit feedback from other contributors.
1. Internal pull-requests to solicit feedback are *encouraged* for any other
   non-trivial contribution but left to the discretion of the contributor.
1. For significant changes wait a full 24 hours before merging so that active
   contributors who are distributed throughout the world have a chance to weigh
   in.
1. Contributors should attempt to adhere to the prevailing code-style.
1. Run `npm test` locally before submitting your PR, to catch any easy to miss
   style & testing issues.  To diagnose test failures, there are two ways to
   run a single test file:
     - `node_modules/.bin/taper tests/test-file.js` - run using the default
       [`taper`](https://github.com/nylen/taper) test reporter.
     - `node tests/test-file.js` - view the raw
       [tap](https://testanything.org/) output.


## Releases

Declaring formal releases remains the prerogative of the project maintainer.

## Changes to this arrangement

This is an experiment and feedback is welcome! This document may also be
subject to pull-requests or changes by contributors where you believe you have
something valuable to add or change.

-----------------------------------------
