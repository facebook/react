'use strict';

const chalk = require('chalk');

// currently 15-next
// IDEA: maybe just always use this milestone across major releases too?
const MILESTONE_NUMBER = 25;

// 15.3.0
const TARGET_MILESTONE_NUMBER = 31;

const LABELS = {
  // Until there is a UI for it, uncomment these lines to run a patch release instead
  // 'semver-patch': true,
  // 'semver-exempt': true,
};

// FOR CODE
// get all closed issues with milestone
// ensure all have pull_request
//   FAIL: log issues that aren't prs
// fetch each pr, (issues.pull_request.url)
// sort each by merged_at
// git cherry-pick -x sha || git cherry-pick -x -m1 sha
//   (or use API to look up number of parents, 2 = use -m1)
// track progress. on fail, pause and force user to handle manually, continue? prompt
// git push
// update labels on each PR
//   ALT: dump link to https://github.com/facebook/react/issues?q=label%3A%22Documentation%3A+needs+merge+to+stable%22+is%3Aclosed
//        and say manual step to remove label


module.exports = function(vorpal, app) {
  vorpal
    .command('stable-prs')
    .description('Get list of stable pull requests that need to be merged to the stable branch')
    .action(function(args, actionCB) {
      // TODO: stop assuming this all fits into a single
      const query = {
        milestone: MILESTONE_NUMBER,
        per_page: 100, // MAX
        state: 'closed',
      };

      app.ghissues.listIssues(query, (err, body) => {
        if (err) {
          this.log('ERROR', err);
          return actionCB();
        }
        app.writeTo('stable-issues.json', body);


        // This API *could* return issues that aren't pull requests, so filter out
        // issues that don't have pull_request set. Also filter out issues that
        // aren't the right level of semver (eg if running a patch release)
        const filteringLabels = Object.keys(LABELS).length > 0;
        const pulls = body.filter((issue) => {
          if (!issue.pull_request) {
            return false;
          }

          if (!filteringLabels) {
            return true;
          }

          return issue.labels.some((label) => LABELS[label.name]);
        });

        // We don't enough data about the pull request (merge sha or merge time) so we
        // need to fetch more. We'll use promises so we don't have to count completions.
        const pullPromises = pulls.map((pr) => {
          return new Promise((resolve, reject) => {
            app.ghrepo.getPullRequest(pr.number, (err, body) => {
              if (err) {
                reject(err);
              }

              app.writeTo(`pr-${pr.number}.json`, body);
              // We want to track the original issue as well since it has the
              // milestone & label information.
              const richPull = body;
              richPull.__originalIssue = pr;
              resolve(richPull);
            });
          });
        });
        Promise.all(pullPromises).then((richPulls) => {
          // Remove any pull requests that were closed but not merged. We don't
          // care about those. They shouldn't have the milestone set anyway.
          // Log for that so they can be manually modified.
          richPulls = richPulls.filter((pr) => {
            if (!pr.merged_at) {
              this.log(`${chalk.yellow.bold('WARNING')} ${pr.html_url} was not merged, should have the milestone unset.`);
              return false;
            }
            return true;
          });
          richPulls.forEach((pr) => {
            // Convert merged_at to real Date for sorting
            pr.merged_at_date = new Date(pr.merged_at);
          });

          richPulls = richPulls.sort((a, b) => a.merged_at_date - b.merged_at_date);

          this.log(`Found ${chalk.bold(richPulls.length)} pull requests:`);

          promptForPRs.call(this, app, richPulls, 0).then(() => {

            // Update the milestone
            if (!TARGET_MILESTONE_NUMBER) {
              return actionCB();
            }

            const milestonePromises = richPulls.map((pr) => {
              return app.ghissues.editIssue(pr.number, {
                milestone: TARGET_MILESTONE_NUMBER,
              });
            });
            Promise.all(milestonePromises).then(actionCB);
          });
        });

      });

    });
};


// TODO: pull this out to some shared place. We can reuse this for docs.
function promptForPRs(app, prs, start) {
  return new Promise((resolve, reject) => {
    const choices = prs.map((pr, idx) => {
      return {
        value: idx,
        name: `${pr.html_url}: ${chalk.bold(pr.title)}`,
      };
    });
    // TODO: add a seperator so we know when we loop around. doesn't look like
    // the "native" inquirer one is exposed so maybe build our own.

    this.prompt({
      name: 'start',
      type: 'list',
      message: 'Start from?',
      default: start,
      choices: choices,
    }).then((res) => {

      let failed = false;

      for (let i = +res.start; i < prs.length; i++) {
        let pr = prs[i];
        this.log(chalk.grey.italic(`Cherry-picking ${pr.number}`));
        try {
          app.gitCherryPickMerge(pr.merge_commit_sha);
        } catch (e) {

          // TODO: add ability to mark a PR as skipped
          failed = true;
          this.log(`${chalk.bold.red('FAILED!')} Please fix manually and continue when ready.`);
          promptForPRs.call(this, app, prs, i + 1).then(resolve);
          break;
        }
      }

      // Make sure we resolve in case there were no issues
      if (!failed) {
        resolve();
      }
    });
  });


}
