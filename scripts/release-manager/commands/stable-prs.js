'use strict';

const chalk = require('chalk');
const pify = require('pify');

const git = require('./utils/git');

const SEMVER_LABELS = [
  'semver-major',
  'semver-minor',
  'semver-patch',
  'semver-exempt',
];



module.exports = function(vorpal, app) {
  vorpal
    .command('stable-prs')
    .description('Get list of stable pull requests that need to be merged to the stable branch')
    .action(function(args) {
      // This makes the chaining easier but obfuscates the actual API, which is
      // unfortunate. The standalone API will return the right data but
      // promisified will get the response object and then we need to pull data
      // off of that.
      let listMilestones = pify(app.ghissues.listMilestones.bind(app.ghissues));
      let listIssues = pify(app.ghissues.listIssues.bind(app.ghissues));
      let editIssue = pify(app.ghissues.editIssue.bind(app.ghissues));
      let getPullRequest = pify(app.ghrepo.getPullRequest.bind(app.ghrepo));

      let targetMilestone = null;

      return new Promise((resolveAction, rejectAction) => {
        listMilestones(null).then((milestones) => {
          app.writeTo('milestones.json', milestones);

          // Turn the milestones into choices for Inquirer
          let milestoneChoices = milestones.map((milestone) => {
            return {
              value: milestone.number,
              name: milestone.title,
            };
          });

          // We need label choices too
          let labelChoices = SEMVER_LABELS.map((label) => {
            return {
              value: label,
              name: label.split('-')[1], // "major" instead of "semver-major"
            };
          });

          // Ask about source milestone
          // Ask about dest milestone
          // TODO: allow creation of milestone here.
          // Ask about which labels to pull from

          return this.prompt([
            {
              name: 'srcMilestone',
              type: 'list',
              message: 'Which milestone should we pull PRs from?',
              choices: milestoneChoices,
            },
            {
              name: 'destMilestone',
              type: 'list',
              message: 'Which milestone should we assign PRs to upon completion?',
              choices: milestoneChoices,
            },
            {
              name: 'labels',
              type: 'checkbox',
              message: 'Which PRs should we select (use spacebar to check all that apply)',
              choices: labelChoices,
            },
          ]).then((answers) => {
            // this.log(JSON.stringify(answers, null, 2));
            targetMilestone = answers.destMilestone;
            let labels = {};
            answers.labels.forEach((label) => {
              labels[label] = true;
            });
            return {
              labels: labels,
              query: {
                milestone: answers.srcMilestone,
                per_page: 100,
                state: 'closed',
              },
            };
          });
        })
        // Request issues, filter to applicable PRs
        .then(({labels, query}) => {
          return listIssues(query).then((issues) => {
            app.writeTo('stable-issues.json', issues);

            // This API *could* return issues that aren't pull requests, so filter out
            // issues that don't have pull_request set. Also filter out issues that
            // aren't the right level of semver (eg if running a patch release)
            let filteringLabels = Object.keys(labels).length > 0;
            const pulls = issues.filter((issue) => {
              if (!issue.pull_request) {
                return false;
              }

              if (!filteringLabels) {
                return true;
              }

              return issue.labels.some((label) => labels[label.name]);
            });
            app.writeTo('stable-prs.json', pulls);
            return pulls;
          })
          // We need to convert the issues to PRs. We don't actually have enough
          // info for the pull request data, so we need to get more. Then we'll
          // do some filtering and sorting to make sure we apply merged PRs in
          // the order they were originally committed to avoid conflicts as much
          // as possible.
          .then((pulls) => {
            return Promise.all(pulls.map((pr) => {
              return getPullRequest(pr.number)
                .then((richPR) => {
                  app.writeTo(`pr-${pr.number}.json`, richPR);
                  richPR.__originalIssue = pr;
                  return richPR;
                });
            }))
            .then((richPRs) => {
              return richPRs.filter((pr) => {
                if (!pr.merged_at) {
                  this.log(
                    `${chalk.yellow.bold('WARNING')} ${pr.html_url} was not merged,` +
                     ` should have the milestone unset.`
                  );
                  return false;
                }
                return true;
              }).map((pr) => {
                pr.merged_at_date = new Date(pr.merged_at);
                return pr;
              }).sort((a, b) => a.merged_at_date - b.merged_at_date);
            });
          });
        })
        // Quick prompt to double check that we should proceed.
        .then((pulls) => {
          this.log(`Found ${chalk.bold(pulls.length)} pull requests:`);
          pulls.forEach((pr) => {
            this.log(`${pr.html_url}: ${chalk.bold(pr.title)}`);
          });

          return this.prompt({
            name: 'merge',
            type: 'confirm',
            message: `Merge these ${pulls.length} pull requests?`,
          }).then((answers) => {
            return answers.merge ? pulls : rejectAction('cancelled');
          });
        })
        // Ok, now we finally have rich pull request data. We can start cherry picking…
        .then((pulls) => {
          // We're going to do some error handling here so we don't get into a
          // terrible state.
          this.log(`Found ${chalk.bold(pulls.length)} pull requests:`);
          return new Promise((resolve, reject) => {
            cherryPickPRs.call(this, app, pulls)
              .then((results) => {
                resolve(results);
              })
              .catch((err) => {
                this.log(
                  `${chalk.red.bold('ERROR')} Something went wrong and your repo is` +
                   ` probably in a bad state. Sorry.`
                );
                resolve({
                  successful: [],
                  skipped: [],
                  didAbort: true,
                });
              });
          });
        })
        // Update the milestone on successful PRs
        // TODO: maybe handle didAbort and git reset --hard to a rev we read when we start the process?
        .then(({successful, aborted, didAbort}) => {
          if (didAbort) {
            return undefined;
          }

          return Promise.all(successful.map((pr) => {
            return editIssue(pr.number, {milestone: targetMilestone});
          }));
        })
        // yay, we're done
        .then(() => {
          resolveAction();
        })
        .catch((err) => {
          this.log('ERROR', err);
          rejectAction();
        });
      });
    });
};

function cherryPickPRs(app, prs) {
  let successful = [];
  let skipped = [];
  return new Promise((resolve, reject) => {
    // Build array of thenables
    let promises = prs.map((pr) => {
      return () => new Promise((res, rej) => {
        this.log(chalk.yellow(`Cherry-picking #${pr.number} (${pr.title})...`));
        let failed = false;
        try {
          git.cherryPickMerge(app, pr.merge_commit_sha);
        } catch (e) {
          failed = true;
        }

        if (!failed) {
          this.log(chalk.green`Success`);
          successful.push(pr);
          return res();
        }

        return this.prompt({
          name: 'handle',
          type: 'list',
          message: `${chalk.red`Failed!`} ${chalk.yellow('This must be resolved manually!')}`,
          choices: [
            {value: 'ok', name: 'Continue, mark successful'},
            {value: 'skip', name: 'Continue, mark skipped'},
            {value: 'abort', name: 'Abort process. Will require manual resetting of git state.'},
          ],
        }).then((answers) => {
          switch (answers.handle) {
            case 'ok':
              successful.push(pr);
              break;
            case 'skip':
              skipped.push(pr);
              break;
            case 'abort':
              return rej(pr.number);
          }
          res(pr.number);
        });
      });
    });

    // Since promises run on creation and we don't actually want that, we create
    // an array of functions that return promises. We'll chain them here, not
    // actually creating the next promise until we're ready.
    var p = promises[0]();
    for (let i = 1; i < promises.length; i++) {
      p = p.then(() => promises[i]());
    }
    p.then(() => {
      resolve({successful, skipped, didAbort: false});
    }).catch((e) => {
      resolve({successful, skipped, didAbort: true});
    });

  });
}
