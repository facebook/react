
2.8.1 / 2015-04-22
==================

 * Back out `support multiline description` Close #396 #397



2.8.0 / 2015-04-07
==================

  * Add `process.execArg` support, execution args like `--harmony` will be passed to sub-commands #387 @DigitalIO @zhiyelee
  * Fix bug in Git-style sub-commands #372 @zhiyelee
  * Allow commands to be hidden from help #383 @tonylukasavage
  * When git-style sub-commands are in use, yet none are called, display help #382 @claylo
  * Add ability to specify arguments syntax for top-level command #258 @rrthomas
  * Support multiline descriptions #208 @zxqfox

2.7.1 / 2015-03-11
==================

 * Revert #347 (fix collisions when option and first arg have same name) which causes a bug in #367.

2.7.0 / 2015-03-09
==================

 * Fix git-style bug when installed globally. Close #335 #349 @zhiyelee
 * Fix collisions when option and first arg have same name. Close #346 #347 @tonylukasavage
 * Add support for camelCase on `opts()`. Close #353  @nkzawa
 * Add node.js 0.12 and io.js to travis.yml
 * Allow RegEx options. #337 @palanik
 * Fixes exit code when sub-command failing.  Close #260 #332 @pirelenito
 * git-style `bin` files in $PATH make sense. Close #196 #327  @zhiyelee

2.6.0 / 2014-12-30
==================

  * added `Command#allowUnknownOption` method. Close #138 #318 @doozr @zhiyelee
  * Add application description to the help msg. Close #112 @dalssoft

2.5.1 / 2014-12-15
==================

  * fixed two bugs incurred by variadic arguments. Close #291 @Quentin01 #302 @zhiyelee

2.5.0 / 2014-10-24
==================

 * add support for variadic arguments. Closes #277 @whitlockjc

2.4.0 / 2014-10-17
==================

 * fixed a bug on executing the coercion function of subcommands option. Closes #270
 * added `Command.prototype.name` to retrieve command name. Closes #264 #266 @tonylukasavage
 * added `Command.prototype.opts` to retrieve all the options as a simple object of key-value pairs. Closes #262 @tonylukasavage
 * fixed a bug on subcommand name. Closes #248 @jonathandelgado
 * fixed function normalize doesn’t honor option terminator. Closes #216 @abbr

2.3.0 / 2014-07-16
==================

 * add command alias'. Closes PR #210
 * fix: Typos. Closes #99
 * fix: Unused fs module. Closes #217

2.2.0 / 2014-03-29
==================

 * add passing of previous option value
 * fix: support subcommands on windows. Closes #142
 * Now the defaultValue passed as the second argument of the coercion function.

2.1.0 / 2013-11-21
==================

 * add: allow cflag style option params, unit test, fixes #174

2.0.0 / 2013-07-18
==================

 * remove input methods (.prompt, .confirm, etc)

1.3.2 / 2013-07-18
==================

 * add support for sub-commands to co-exist with the original command

1.3.1 / 2013-07-18
==================

 * add quick .runningCommand hack so you can opt-out of other logic when running a sub command

1.3.0 / 2013-07-09
==================

 * add EACCES error handling
 * fix sub-command --help

1.2.0 / 2013-06-13
==================

 * allow "-" hyphen as an option argument
 * support for RegExp coercion

1.1.1 / 2012-11-20
==================

  * add more sub-command padding
  * fix .usage() when args are present. Closes #106

1.1.0 / 2012-11-16
==================

  * add git-style executable subcommand support. Closes #94

1.0.5 / 2012-10-09
==================

  * fix `--name` clobbering. Closes #92
  * fix examples/help. Closes #89

1.0.4 / 2012-09-03
==================

  * add `outputHelp()` method.

1.0.3 / 2012-08-30
==================

  * remove invalid .version() defaulting

1.0.2 / 2012-08-24
==================

  * add `--foo=bar` support [arv]
  * fix password on node 0.8.8. Make backward compatible with 0.6 [focusaurus]

1.0.1 / 2012-08-03
==================

  * fix issue #56
  * fix tty.setRawMode(mode) was moved to tty.ReadStream#setRawMode() (i.e. process.stdin.setRawMode())

1.0.0 / 2012-07-05
==================

  * add support for optional option descriptions
  * add defaulting of `.version()` to package.json's version

0.6.1 / 2012-06-01
==================

  * Added: append (yes or no) on confirmation
  * Added: allow node.js v0.7.x

0.6.0 / 2012-04-10
==================

  * Added `.prompt(obj, callback)` support. Closes #49
  * Added default support to .choose(). Closes #41
  * Fixed the choice example

0.5.1 / 2011-12-20
==================

  * Fixed `password()` for recent nodes. Closes #36

0.5.0 / 2011-12-04
==================

  * Added sub-command option support [itay]

0.4.3 / 2011-12-04
==================

  * Fixed custom help ordering. Closes #32

0.4.2 / 2011-11-24
==================

  * Added travis support
  * Fixed: line-buffered input automatically trimmed. Closes #31

0.4.1 / 2011-11-18
==================

  * Removed listening for "close" on --help

0.4.0 / 2011-11-15
==================

  * Added support for `--`. Closes #24

0.3.3 / 2011-11-14
==================

  * Fixed: wait for close event when writing help info [Jerry Hamlet]

0.3.2 / 2011-11-01
==================

  * Fixed long flag definitions with values [felixge]

0.3.1 / 2011-10-31
==================

  * Changed `--version` short flag to `-V` from `-v`
  * Changed `.version()` so it's configurable [felixge]

0.3.0 / 2011-10-31
==================

  * Added support for long flags only. Closes #18

0.2.1 / 2011-10-24
==================

  * "node": ">= 0.4.x < 0.7.0". Closes #20

0.2.0 / 2011-09-26
==================

  * Allow for defaults that are not just boolean. Default peassignment only occurs for --no-*, optional, and required arguments. [Jim Isaacs]

0.1.0 / 2011-08-24
==================

  * Added support for custom `--help` output

0.0.5 / 2011-08-18
==================

  * Changed: when the user enters nothing prompt for password again
  * Fixed issue with passwords beginning with numbers [NuckChorris]

0.0.4 / 2011-08-15
==================

  * Fixed `Commander#args`

0.0.3 / 2011-08-15
==================

  * Added default option value support

0.0.2 / 2011-08-15
==================

  * Added mask support to `Command#password(str[, mask], fn)`
  * Added `Command#password(str, fn)`

0.0.1 / 2010-01-03
==================

  * Initial release
