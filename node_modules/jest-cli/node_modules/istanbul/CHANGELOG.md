Changelog
---------

<table>
<tr>
<td>v0.3.15</td>
<td>
    <ul>
        <li>Fix #375: add nodir option to exclude directory for *.js matcher thanks to @yurenju</li>
        <li>Fix #362: When setting up the `reportDir` add it to `reporter.dir`</li>
        <li>Fixes #238 (added a poorman's clone)</li>
        <li>Incrementing hits on ignored statements implemented</li>
        <li>`a:visited color: #777` (a nice gray color)</li>
    </ul>
</td>
</tr>
<tr>
<td>v0.3.14</td>
<td>
    Add text-lcov report format to emit lcov to console, thanks to @bcoe
</td>
</tr>
<tr>
<td>v0.3.13</td>
<td>
    Fix #339
</td>
</tr>
<tr>
<td>v0.3.12</td>
<td>
    Allow other-than-dot-js files to be hooked, thanks to @sethpollack
</td>
</tr>
<tr>
<td>v0.3.11</td>
<td>
    Avoid modification of global objects, thanks to @dominykas
</td>
</tr>
<tr>
<td>v0.3.10</td>
<td>
    Update escodegen to 1.6.x and add browser download script
</td>
</tr>
<tr>
<td>v0.3.9</td>
<td>
    <ul>
        <li>Merge harmony branch and start adding ES6 features to istanbul</li>
        <li>Arrow functions are the only feature of interest now</li>
        <li>`for-of` and `yield` support exist but not present in mainline esprima yet</li>
    </ul>
</td>
</tr>
<tr>
<td>v0.3.8</td>
<td>
    <ul>
        <li>Fail check coverage command when no coverage files found, thanks to @nexus-uw</li>
        <li>handle relative paths in check-coverage, thanks to @dragn</li>
        <li>support explicit includes for cover, thanks to @tonylukasavage</li>
    </ul>
</td>
</tr>
<tr>
<td>v0.3.7</td>
<td>
    Fix asset paths on windows, thanks to @juangabreil
</td>
</tr>
<tr>
<td>v0.3.6</td>
<td>
    <ul>
        <li>Update to Esprima 2.0</li>
        <li>Remove YUI dependency and provide custom sort code. No network access needed for HTML report view</li>
        <li>use supports-color module to colorize output, thanks to @gustavnikolaj</li>
        <li>Fix tests to work on Windows, thanks to @dougwilson</li>
        <li>Docs: "Instrument code" API example correction thanks to @robatron</li>
        <li>Extracted embedded CSS and JavaScript and made them external files, thanks to @booleangate</td>
    </ul>
</td>
</tr>
<tr>
<td>v0.3.5</td>
<td>
<p>Merge #275 - `--include-all-sources` option. Thanks @gustavnikolaj</p>
<p>
The `--preload-sources` option is now deprecated and superseded by the
`--include-all-sources` option instead. This provides a better coverage representation
of the code that has not been included for testing.
</p>
</td>
</tr>
<tr>
<td>v0.3.4</td>
<td>Merge #219 - Support reporting within symlink/junction. Thanks to @dougwilson</td>
</tr>
<tr>
<td>v0.3.3</td>
<td>Merge #268 - per file coverage enforcement. Thanks to @ryan-roemer</td>
</tr>
<tr>
<td>v0.3.2</td>
<td>Republish 0.3.1 because of bad shasum</td>
</tr>
<tr>
<td>v0.3.1</td>
<td>Fixes #249</td>
</tr>
<tr>
<td>v0.3.0</td>
<td>
    The *reports* release. **Potentially backwards-incompatible** if you are using
    undocumented features or custom report implementations.
    <ul>
        <li>Change report command line to support multiple reports, add back-compat processing with warnings</li>
        <li>Enable `report` command to read report list from config, thanks to @piuccio</li>
        <li>Support multiple reports for `cover` and `report` commands</li>
        <li>Support per-report config options in configuration file</li>
        <li>Turn reports into event emitters so they can signal `done`</li>
        <li>Add `Reporter` class to be able to generate multiple reports</li>
        <li>Add a bunch of API docs, refactor README</li>
    </ul>
</td>
</tr>
<tr>
<td>v0.2.16</td><td>Make YUI links https-always since relative links break local
filesystem use-case
</td>
</tr>
<tr>
<td>v0.2.15</td><td>make link protocols relative so they don't break on https connections
(thanks to @yasyf)
</td>
</tr>
<tr>
<td>v0.2.14</td><td>Fix hook to deal with non-string/ missing filenames
(thanks to @jason0x43), update dependencies
</td>
</tr>
<tr>
<td>v0.2.13</td><td>Add `--preload-sources` option to `cover` command to make
code not required by tests to appear in the coverage report.
</td>
</tr>
<tr>
<td>v0.2.12</td><td>Text summary as valid markdown, thanks to @smikes</td>
</tr>
<tr>
<td>v0.2.11</td><td>Allow source map generation, thanks to @jason0x43</td>
</tr>
<tr>
<td>v0.2.10</td><td>Add flag to handle sigints and dump coverage, thanks to @samccone</td>
</tr>
<tr>
<td>v0.2.9</td><td>Fix #202</td>
</tr>
<tr>
<tr>
<td>v0.2.8</td><td>Upgrade esprima</td>
</tr>
<tr>
<td>v0.2.7</td><td><ul>
    <li>Upgrade esprima</li>
    <li>Misc jshint fixes</li>
</ul></td>
</tr>
<tr>
<td>v0.2.6</td><td><ul>
    <li>Revert bad commit for tree summarizer</li>
</ul></td>
</tr>
<tr>
<td>v0.2.5</td><td><ul>
    <li>Add clover report, thanks to @bixdeng, @mpderbec</li>
    <li>Fix cobertura report bug for relative paths, thanks to @jxiaodev</li>
    <li>Run self-coverage on tests always</li>
    <li>Fix tree summarizer when relative paths are involved, thanks to @Swatinem</li>
</ul></td>
</tr>
<tr>
<td>v0.2.4</td><td><ul>
    <li>Fix line-split algo to handle Mac lin separators, thanks to @asifrc</li>
    <li>Update README for quick intro to ignoring code for coverage, thanks to @gergelyke</li>
</ul></td>
</tr>
<tr>
<td>v0.2.3</td><td><ul>
    <li>Add YAML config file. `istanbul help config` has more details</li>
    <li>Support custom reporting thresholds using the `watermarks` section of the config file</li>
</ul></td>
</tr>
<tr><td>v0.2.2</td><td>update escodegen, handlebars and resolve dependency versions</td></tr>
<tr>
<td>v0.2.1</td><td><ul>
    <li>Add ability to skip branches and other hard-to-test code using comments.
        See <a href="https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md">the doc</a> for more details</li>
    <li>Turn `util.error` into `console.error` for node 0.11 compatibility, thanks to @pornel</li>
</ul></td>
</tr>
<tr><td>v0.2.0</td><td><ul>
    <li>Add --preserve-comments to instrumenter options, thanks to @arikon</li>
    <li>Support 'use strict;' in file scope, thanks to @pornel</li>
</ul>
    Up minor version due to the new way in which the global object is accessed.
    This _should_ be backwards-compatible but has not been tested in the wild.
</td></tr>
<tr><td>v0.1.46</td><td>Fix #114</td></tr>
<tr><td>v0.1.45</td><td>Add teamcity reporter, thanks to @chrisgladd</td></tr>
<tr><td>v0.1.44</td><td>Fix inconsistency in processing empty switch with latest esprima, up deps</td></tr>
<tr><td>v0.1.43</td><td>Add colors to text report thanks to @runk</td></tr>
<tr><td>v0.1.42</td><td>fix #78: embed source regression introduced in v0.1.38. Fix broken test for this</td></tr>
<tr><td>v0.1.41</td><td>add json report to dump coverage object for certain use cases</td></tr>
<tr><td>v0.1.40</td><td>forward sourceStore from lcov to html report, pull request by @vojtajina</td></tr>
<tr><td>v0.1.39</td><td>add <source> tag to cobertura report, pull request by @jhansche</td></tr>
<tr><td>v0.1.38</td><td><ul>
        <li>factor out AST instrumentation into own instrumentASTSync method</li>
        <li>always set function declaration coverage stats to 1 since every such declaration is "executed" exactly one time by the compiler</li>
    </ul></td></tr>
<tr><td>v0.1.37</td><td>--complete-copy flag contrib from @kami, correct strict mode semantics for instrumented functions</td></tr>
<tr><td>v0.1.36</td><td>real quiet when --print=none specified, add repo URL to package.json, add contributors</td></tr>
<tr><td>v0.1.35</td><td>accept cobertura contrib from @nbrownus, fix #52</td></tr>
<tr><td>v0.1.34</td><td>fix async reporting, update dependencies, accept html cleanup contrib from @mathiasbynens</td></tr>
<tr><td>v0.1.33</td><td>initialize global coverage object before running tests to workaround mocha leak detection</td></tr>
<tr><td>v0.1.32</td><td>Fix for null nodes in array expressions, add @unindented as contributor</td></tr>
<tr><td>v0.1.31</td><td>Misc internal fixes and test changes</td></tr>
<tr><td>v0.1.30</td><td>Write standard blurbs ("writing coverage object..." etc.) to stderr rather than stdout</td></tr>
<tr><td>v0.1.29</td><td>Allow --post-require-hook to be a module that can be `require`-d</td></tr>
<tr><td>v0.1.28</td><td>Add --post-require-hook switch to support use-cases similar to the YUI loader</td></tr>
<tr><td>v0.1.27</td><td>Add --hook-run-in-context switch to support RequireJS modules. Thanks to @millermedeiros for the pull request</td></tr>
<tr><td>v0.1.26</td><td>Add support for minimum uncovered unit for check-coverage. Fixes #25</td></tr>
<tr><td>v0.1.25</td><td>Allow for relative paths in the YUI loader hook</td></tr>
<tr><td>v0.1.24</td><td>Add lcov summaries. Fixes issue #20</td></tr>
<tr><td>v0.1.23</td><td>Add ability to save a baseline coverage file for the instrument command. Fixes issue #19</td></tr>
<tr><td>v0.1.22</td><td>Add signature attribute to cobertura method tags to fix NPE by the Hudson publisher</td></tr>
<tr><td>v0.1.21</td><td>Add cobertura XML report format; exprimental for now</td></tr>
<tr><td>v0.1.20</td><td>Fix HTML/ lcov report interface to be more customizable for middleware needs</td></tr>
<tr><td>v0.1.19</td><td>make all hooking non-destructive in that already loaded modules are never reloaded. Add self-test mode so that already loaded istanbul modules can be unloaded prior to hooking.</td></tr>
<tr><td>v0.1.18</td><td>Add option to hook in non-destructive mode; i.e. the require cache is not unloaded when hooking</td></tr>
<tr><td>v0.1.17</td><td>Export some more objects; undocumented for now</td></tr>
<tr><td>v0.1.16</td><td>Fix npm keywords for istanbul which expects an array of strings but was being fed a single string with keywords instead</td></tr>
<tr><td>v0.1.15</td><td>Add the 'check-coverage' command so that Istanbul can be used as a posttest script to enforce minimum coverage</td></tr>
<tr><td>v0.1.14</td><td>Expose the experimental YUI load hook in the interface</td></tr>
<tr><td>v0.1.13</td><td>Internal jshint cleanup, no features or fixes</td></tr>
<tr><td>v0.1.12</td><td>Give npm the README that was getting inadvertently excluded</td></tr>
<tr><td>v0.1.11</td><td>Merge pull request #14 for HTML tweaks. Thanks @davglass. Add @davglass and @nowamasa as contributors in `package.json`</td></tr>
<tr><td>v0.1.10</td><td>Fix to issue #12. Do not install `uncaughtException` handler and pass input error back to CLI using a callback as opposed to throwing.</td></tr>
<tr><td>v0.1.9</td><td>Attempt to create reporting directory again just before writing coverage in addition to initial creation</td></tr>
<tr><td>v0.1.8</td><td>Fix issue #11.</td></tr>
<tr><td>v0.1.7</td><td>Add text summary and detailed reporting available as --print [summary|detail|both|none]. summary is the default if nothing specified.</td></tr>
<tr><td>v0.1.6</td><td>Handle backslashes in the file path correctly in emitted code. Fixes #9. Thanks to @nowamasa for bug report and fix</td></tr>
<tr><td>v0.1.5</td><td>make object-utils.js work on a browser as-is</td></tr>
<tr><td>v0.1.4</td><td>partial fix for issue #4; add titles to missing coverage spans, remove negative margin for missing if/else indicators</td></tr>
<tr><td>v0.1.3</td><td>Set the environment variable running_under_istanbul to 1 when that is the case. This allows test runners that use istanbul as a library to back off on using it when set.</td></tr>
<tr><td>v0.1.2</td><td>HTML reporting cosmetics. Reports now show syntax-colored JS using `prettify`. Summary tables no longer wrap in awkward places.</td></tr>
<tr><td>v0.1.1</td><td>Fixes issue #1. HTML reports use sources embedded inside the file coverage objects if found rather than reading from the filesystem</td></tr>
<tr><td>v0.1.0</td><td>Initial version</td></tr>
</td></tr>
</table>

