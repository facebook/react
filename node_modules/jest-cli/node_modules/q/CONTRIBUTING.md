
For pull requests:

-   Be consistent with prevalent style and design decisions.
-   Add a Jasmine spec to `specs/q-spec.js`.
-   Use `npm test` to avoid regressions.
-   Run tests in `q-spec/run.html` in as many supported browsers as you
    can find the will to deal with.
-   Do not build minified versions; we do this each release.
-   If you would be so kind, add a note to `CHANGES.md` in an
    appropriate section:

    -   `Next Major Version` if it introduces backward incompatibilities
        to code in the wild using documented features.
    -   `Next Minor Version` if it adds a new feature.
    -   `Next Patch Version` if it fixes a bug.

For releases:

-   Run `npm test`.
-   Run tests in `q-spec/run.html` in a representative sample of every
    browser under the sun.
-   Run `npm run cover` and make sure you're happy with the results.
-   Run `npm run minify` and be sure to commit the resulting `q.min.js`.
-   Note the Gzipped size output by the previous command, and update
    `README.md` if it has changed to 1 significant digit.
-   Stash any local changes.
-   Update `CHANGES.md` to reflect all changes in the differences
    between `HEAD` and the previous tagged version.  Give credit where
    credit is due.
-   Update `README.md` to address all new, non-experimental features.
-   Update the API reference on the Wiki to reflect all non-experimental
    features.
-   Use `npm version major|minor|patch` to update `package.json`,
    commit, and tag the new version.
-   Use `npm publish` to send up a new release.
-   Send an email to the q-continuum mailing list announcing the new
    release and the notes from the change log.  This helps folks
    maintaining other package ecosystems.

