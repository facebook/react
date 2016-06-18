# Triage Process and Github Labels for Angular 2

This document describes how the Angular team uses labels and milestones to triage issues on github.

# Issues and PRs
## Triaged vs Untriaged Issues

Every triaged issue must have four attributes assigned to it:

* `priority` -- P0 through P4. P0 issues are "drop everything and do this now". P4 are nice to have.
* `component` -- Which area of Angular knowledge this relates to.
* `effort` -- Rough assessment of how much work this issue is. E.g. `effort: easy` means 
"probably a few hours of work".
* `type` -- Whether this issue is a bug, feature, or other kind of task.

Untriaged issues are any issues in the queue that don't yet have these four attributes. 

You can view a report of untriaged issues here, in our 
[Angular Triage Dashboard](http://mhevery.github.io/github_issues/).

Issues should also have a clear action to complete that can be addressed or resolved within the 
scope of Angular 2. We'll close issues that don't meet these criteria. 

### Assigning Issues to Milestones

Any issue that is being worked on must have:

* An `assignee`: The person doing the work.
* A `Milestone`: When we expect to complete this work.

We aim to only have at most three milestones open at a time:

* Closing Milestone: A milestone with a very small number of issues, about to release. 
* Current Milestone: Work that we plan to complete within one week.
* Next Milestone: Work that is > 1 week but current for the team.

The [backlog](https://github.com/angular/angular/issues?q=is%3Aopen+is%3Aissue+no%3Amilestone) 
consists of all issues that have been triaged but do not have an assignee or milestone.  

## Triaged vs Untriaged PRs

Because of the cumulative pain associated with rebasing PRs, we triage PRs daily, and 
closing or reviewing PRs is a top priority ahead of other ongoing work. 

Every triaged PR must have a `pr_action` label assigned to it and an assignee:
 
* `pr_action: review` -- work is complete and comment is needed from the assignee.
* `pr_action: cleanup` -- more work is needed from the current assignee. 
* `pr_action: discuss` -- discussion is needed, to be led by the current assignee.
* `pr_action: merge` -- the PR should be merged. Add this to a PR when you would like to 
  trigger automatic merging following a successful build. This is described in [COMMITTER.md](COMMITTER.md).

In addition, PRs can have the following states:

* `pr_state: LGTM` -- PR may have outstanding changes but does not require further review.
* `pr_state: WIP` -- PR is experimental or rapidly changing. Not ready for review or triage.
* `pr_state: blocked` -- PR is blocked on an issue or other PR. Not ready for review or triage.

Note that an LGTM state does not mean a PR is ready to merge: for example, a reviewer might set the
LGTM state but request a minor tweak that doesn't need further review, e.g., a rebase or small 
uncontroversial change.

PRs do not need to be assigned to milestones, unless a milestone release should be held for that 
PR to land.

Victor (`vsavkin`) and Tobias (`tbosch`) are owners of the PR queue. Here is a list of [current 
untriaged PRs](https://github.com/angular/angular/pulls?utf8=%E2%9C%93&q=is%3Aopen+no%3Amilestone+is%3Apr+-label%3A%22pr_action%3A+cleanup%22+-label%3A%22pr_action%3A+merge%22+-label%3A%22pr_action%3A+review%22+-label%3A%22pr_action%3A+discuss%22+-label%3A%22pr_state%3A+blocked%22+-label%3A%22pr_state%3A+WIP%22+).
 
# Prioritization of Work

What should you be working on?

1. Any PRs that are assigned to you that don't have `pr_state: WIP` or `pr_state: blocked`
1. Any issues that are assigned to you in the lowest-numbered Milestone
1. Any issues that are assigned to you in any Milestone

If there are no issues assigned to you in any Milestone, pick an issue, self-assign it, and add 
it to the most appropriate Milestone based on effort.

Here are some suggestions for what to work on next:

* Filter for issues in a component that you are knowledgeable about, and pick something that has a
 high priority.
* Filter for any small effort task that has the special `cust: GT` or `cust:Ionic` tags, 
and priority > P3.
* Add a new task that's really important, add `component`, `priority`, `effort`, `type` and 
assign it to yourself and the most appropriate milestone.

# Labels Used in Triage

## Priority
How urgent is this issue? We use priority to determine what should be worked on in each new 
milestone.

* `P0: critical` -- drop everything to work on this
* `P1: urgent` -- resolve quickly in the current milestone. people are blocked
* `P2: required` -- needed for development but not urgent yet. workaround exists, or e.g. new API
* `P3: important` -- must complete before Angular 2 is ready for release
* `P4: nice to have` -- a good idea, but maybe not until after release


## Effort
Rough, non-binding estimate of how much work this issue represents. Please change this assessment
for anything you're working on to better reflect reality.

* `effort: easy` -- straightforward issue that can be resolved in a few hours, e.g. < 1 day of work.
* `effort: medium` -- issue that will be a few days of work. Can be completed within a single 
milestone.
* `effort: tough` -- issue that will likely take more than 1 milestone to complete.

<!-- We don't like these label names as 
they're not absolute (what is one developer-hour, really?) but decided it wasn't worth arguing 
over terms. -->

## Component
Which area of Angular knowledge is this issue most closely related to? Helpful when deciding what
to work on next.

 * `comp: benchpress` -- benchmarks and performance testing &rarr; *tbosch*, *crossj*
 * `comp: build/dev-productivity` -- build process, e.g. CLI and related tasks &rarr; *iminar*, *caitp*
 * `comp: build/pipeline` -- build pipeline, e.g. ts2dart &rarr; *mprobst*, *alexeagle*
 * `comp: core` -- general core Angular issues, not related to a sub-category (see below) &rarr; 
   *mhevery*
 * `comp: core/animations` -- animations framework &rarr; *matsko*
 * `comp: core/change_detection` -- change detection &rarr; *vsavkin*
 * `comp: core/di` -- dependency injection &rarr; *vicb*, *rkirov*
 * `comp: core/directives` -- directives 
 * `comp: core/forms` -- forms &rarr; *vsavkin*
 * `comp: core/pipes` -- pipes
 * `comp: core/view` -- runtime processing of the `View`s
 * `comp: core/view/compiler` -- static analysis of the templates which generate `ProtoView`s.
 * `comp: core/testbed` -- e2e tests and support for them
 * `comp: core/webworker` -- core web worker infrastructure
 * `comp: dart-transformer` -- Dart transforms &rarr; *kegluneq*, *jakemac* 
 * `comp: data-access` -- &rarr; *jeffbcross*
 * `comp: docs` -- API docs and doc generation &rarr; *naomiblack*, *petebacondarwin*
 * `comp: material-components` -- Angular Material components built in Angular 2 &rarr; *jelbourn*
 * `comp: router` -- Component Router &rarr; *btford*, *igorminar*, *matsko*
 * `comp: wrenchjs`

## Type
What kind of problem is this?

* `type RFC / discussion / question`
* `type bug`
* `type chore`
* `type feature`
* `type performance`
* `type refactor`

## Special Labels

### action:design
More active discussion is needed before the issue can be worked on further. Typically used for 
`type: feature` or `type: RFC/discussion/question`

[See all issues that need discussion](https://github.com/angular/angular/labels/action:%20Design)

### cla
Managed by googlebot. Indicates whether a PR has a CLA on file for its author(s). Only issues with 
`cla:yes` should be merged into master.

### cust
This is an issue causing user pain for early adopter customers `cust: GT` or `cust: Ionic`.

### WORKS_AS_INTENDED

Only used on closed issues, to indicate to the reporter why we closed it.
