# Pushing changes into the Angular 2 tree

Please see [Using git with Angular repositories](https://docs.google.com/document/d/1h8nijFSaa1jG_UE8v4WP7glh5qOUXnYtAtJh_gwOQHI/edit)
for details about how we maintain a linear commit history, and the rules for committing.

As a contributor, just read the instructions in [CONTRIBUTING.md](CONTRIBUTING.md) and send a pull request.
Someone with committer access will do the rest.

## The `PR: merge` label and `presubmit-*` branches

We have automated the process for merging pull requests into master. Our goal is to minimize the disruption for
Angular committers and also prevent breakages on master.

When a PR has `pr_state: LGTM` and is ready to merge, you should add the `pr_action: merge` label.
Currently (late 2015), we need to ensure that each PR will cleanly merge into the Google-internal version control,
so the caretaker reviews the changes manually.

After this review, the caretaker adds `zomg_admin: do_merge` which is restricted to admins only. 
A robot running as [mary-poppins](https://github.com/mary-poppins)
is notified that the label was added by an authorized person,
and will create a new branch in the angular project, using the convention `presubmit-{username}-pr-{number}`.

(Note: if the automation fails, committers can instead push the commits to a branch following this naming scheme.)

When a Travis build succeeds for a presubmit branch named following the convention,
Travis will re-base the commits, merge to master, and close the PR automatically.

Finally, after merge `mary-poppins` removes the presubmit branch.

## Administration

The list of users who can trigger a merge by adding the `zomg_admin: do_merge` label is stored in our appengine app datastore.
Edit the contents of the [CoreTeamMember Table](
https://console.developers.google.com/project/angular2-automation/datastore/query?queryType=KindQuery&namespace=&kind=CoreTeamMember)
