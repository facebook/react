const { test, ln, chmod } = require('shelljs')

function installHooks () {
  if (test('-e', '.git/hooks')) {
    ln('-sf', '../../build/git-hooks/pre-commit', '.git/hooks/pre-commit')
    chmod('+x', '.git/hooks/pre-commit')
    ln('-sf', '../../build/git-hooks/commit-msg', '.git/hooks/commit-msg')
    chmod('+x', '.git/hooks/commit-msg')
  }
}

installHooks()
