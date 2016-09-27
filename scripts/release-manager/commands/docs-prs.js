'use strict';

const chalk = require('chalk');
const git = require('./utils/git');

const DOCS_LABEL = 'Documentation: needs merge to stable';

// FOR DOCS
// get all issues with label
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
    .command('docs-prs')
    .description('Get list of documentation pull requests that need to be merged to the stable branch')
    .action(function(args, actionCB) {
      const branch = git.getBranch(app);
      if (!branch.match(/-stable$/)) {
        this.log(chalk.red('Aborting...'));
        this.log(
          `You need to be on the latest stable branch in the React repo ` +
          `to execute this command.\nYou are currently in ${branch}.`
        );
        actionCB();
        return;
      }

      const query = {
        labels: [DOCS_LABEL].join(), // github-api doesn't join automatically
        state: 'closed',
      };

      app.ghissues.listIssues(query, (err, body) => {
        app.writeTo('issues.json', body);
        // console.log(body);
        // fs.writeFileSync('body.json', JSON.stringify(body, null, 2));
        // fs.writeFileSync('headers.json', JSON.stringify(headers, null, 2));
        // const prs = require('./body');

        // This API *could* return issues that aren't pull requests, so filter out
        // issues that don't have pull_request set.
        const pulls = body.filter((issue) => issue.pull_request);

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
              // label information.
              const richPull = body;
              richPull.__originalIssue = pr;
              resolve(richPull);
            });
          });
        });
        Promise.all(pullPromises).then((richPulls) => {
          richPulls.forEach((pr) => {
            // Convert merged_at to real Date for sorting
            pr.merged_at_date = new Date(pr.merged_at);
          });

          richPulls = richPulls.sort((a, b) => a.merged_at_date - b.merged_at_date);

          this.log(`Found ${chalk.bold(richPulls.length)} pull requests:`);
          richPulls.forEach((pr) => {
            this.log(`${pr.html_url}: ${chalk.bold(pr.title)}`);
          });

          this.prompt({
            name: 'merge',
            type: 'confirm',
            message: `Merge these ${richPulls.length} pull requests?`,
          }, (res) => {
            if (res.merge) {
              richPulls.forEach((pr) => {
                git.cherryPickMerge(app, pr.merge_commit_sha);
              });

              this.prompt({
                name: 'push',
                type: 'confirm',
                message: 'Push these commits upstream?',
              }, (res) => {
                if (res.push) {
                  git.push(app);
                  this.log(`Pushed upstream! Removing "${DOCS_LABEL}" label from pull requests.`);
                }

                // TODO: actually test this
                var removeLabelsPromises = richPulls.map((pr) => {
                  return new Promise((resolve, reject) => {
                    const updatedLabels = pr.__originalIssue.labels
                      .filter((label) => label.name !== DOCS_LABEL)
                      .map(label => label.name);
                    app.ghissues.editIssue(pr.number, {labels: updatedLabels}, (err, body) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve(pr);
                      }
                    });
                  });
                });

                Promise.all(removeLabelsPromises).then(() => {
                  this.log('Done!');
                  actionCB();
                });
              });

            } else {
              actionCB();
            }
          });


        });

      });

    });
};
