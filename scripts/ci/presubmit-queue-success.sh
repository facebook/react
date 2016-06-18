#!/bin/bash
set -e -o pipefail

#  If we're on the presubmit branch, the dev Dart release, and all unit
#  tests pass, merge the presubmit branch into master and push it.


CHANNEL=`echo $JOB | cut -f 2 -d -`
SHA=`git rev-parse HEAD`

echo Current channel is: $CHANNEL
echo Current branch is: $TRAVIS_BRANCH
echo Test result is: $TRAVIS_TEST_RESULT

if [ "$TRAVIS_REPO_SLUG" = "angular/angular" ]; then
  if [ $TRAVIS_TEST_RESULT -eq 0 ] && [[ $TRAVIS_BRANCH == "presubmit-"* ]]; then
    echo '***************'
    echo '** PRESUBMIT **'
    echo '***************'
    echo
    echo "Pushing HEAD to master..."
    git stash
    git fetch upstream master
    git rebase upstream/master

    if [[ $TRAVIS_BRANCH == *"-pr-"* ]]; then
      PR_NO=`echo $TRAVIS_BRANCH | sed -e 's/^.*-pr-//'`
      if echo $PR_NO | egrep -q '^[0-9]+$'; then
        echo "Adding Closes #$PR_NO"
        git filter-branch -f --msg-filter "cat /dev/stdin && echo && echo Closes \#$PR_NO" HEAD~1..HEAD
      fi
    fi

    if git push upstream HEAD:master; then
      echo "$TRAVIS_BRANCH has been merged into master, deleting..."
      git push upstream :"$TRAVIS_BRANCH"
    else
      COMITTER_EMAIL=`git --no-pager show -s --format='%cE' HEAD`
      echo Sending failure email to ${COMITTER_EMAIL}
      mail \
         -s "Failed to merge branch $TRAVIS_BRANCH to master" \
         ${COMMITTER_EMAIL} \
         << EOM
Your travis branch ${TRAVIS_BRANCH} failed!

https://travis-ci.org/angular/angular/builds/${TRAVIS_JOB_ID}

Please take a look.
EOM
    fi
  fi
fi
