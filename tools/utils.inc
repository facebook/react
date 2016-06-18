# This file provides:
# - a default control flow
#   * initializes the environment
#   * able to mock "git push" in your script and in all sub scripts
#   * call a function in your script based on the arguments
# - named argument parsing and automatic generation of the "usage" for your script
# - intercepting "git push" in your script and all sub scripts
# - utility functions
#
# Usage:
# - define the variable ARGS_DEF (see below) with the arguments for your script
# - include this file using `source utils.inc` at the end of your script.
#
# Default control flow:
# 0. Set the current directory to the directory of the script. By this
#    the script can be called from anywhere.
# 1. Parse the named arguments
# 2. If the parameter "git_push_dryrun" is set, all calls to `git push` in this script
#    or in child scripts will be intercepted so that the `--dry-run` and `--porcelain` is added
#    to show what the push would do but not actually do it.
# 3. If the parameter "verbose" is set, the `-x` flag will be set in bash.
# 4. The function "init" will be called if it exists
# 5. If the parameter "action" is set, it will call the function with the name of that parameter.
#    Otherwise the function "run" will be called.
#
# Named Argument Parsing:
# - The variable ARGS_DEF defines the valid command arguments
#   * Required args syntax: --paramName=paramRegex
#   * Optional args syntax: [--paramName=paramRegex]
#   * e.g. ARG_DEFS=("--required_param=(.+)" "[--optional_param=(.+)]")
# - Checks that:
#   * all arguments match to an entry in ARGS_DEF
#   * all required arguments are present
#   * all arguments match their regex
# - Afterwards, every parameter value will be stored in a variable
#   with the name of the parameter in upper case (with dash converted to underscore).
#
# Special arguments that are always available:
# - "--action=.*": This parameter will be used to execute a function with that name when the
#   script is started
# - "--git_push_dryrun=true": This will intercept all calls to `git push` in this script
#   or in child scripts so that the `--dry-run` and `--porcelain` is added
#   to show what the push would do but not actually do it.
# - "--verbose=true": This will set the `-x` flag in bash so that all calls will be logged
#
# Utility functions:
# - readJsonProp
# - replaceJsonProp
# - resolveDir
# - getVar
# - serVar
# - isFunction

# always stop on errors
set -e

function usage {
  echo "Usage: ${0} ${ARG_DEFS[@]}"
  exit 1
}


function parseArgs {
  local REQUIRED_ARG_NAMES=()

  # -- helper functions
  function varName {
    # everything to upper case and dash to underscore
    echo ${1//-/_} | tr '[:lower:]' '[:upper:]'
  }

  function readArgDefs {
    local ARG_DEF
    local AD_OPTIONAL
    local AD_NAME
    local AD_RE

    # -- helper functions
    function parseArgDef {
      local ARG_DEF_REGEX="(\[?)--([^=]+)=(.*)"
      if [[ ! $1 =~ $ARG_DEF_REGEX ]]; then
        echo "Internal error: arg def has wrong format: $ARG_DEF"
        exit 1
      fi
      AD_OPTIONAL="${BASH_REMATCH[1]}"
      AD_NAME="${BASH_REMATCH[2]}"
      AD_RE="${BASH_REMATCH[3]}"
      if [[ $AD_OPTIONAL ]]; then
        # Remove last bracket for optional args.
        # Can't put this into the ARG_DEF_REGEX somehow...
        AD_RE=${AD_RE%?}
      fi
    }

    # -- run
    for ARG_DEF in "${ARG_DEFS[@]}"
    do
      parseArgDef $ARG_DEF

      local AD_NAME_UPPER=$(varName $AD_NAME)
      setVar "${AD_NAME_UPPER}_OPTIONAL" "$AD_OPTIONAL"
      setVar "${AD_NAME_UPPER}_RE" "$AD_RE"
      if [[ ! $AD_OPTIONAL ]]; then
        REQUIRED_ARG_NAMES+=($AD_NAME)
      fi
    done
  }

  function readAndValidateArgs {
    local ARG_NAME
    local ARG_VALUE
    local ARG_NAME_UPPER

    # -- helper functions
    function parseArg {
      local ARG_REGEX="--([^=]+)=?(.*)"

      if [[ ! $1 =~ $ARG_REGEX ]]; then
        echo "Can't parse argument $i"
        usage
      fi

      ARG_NAME="${BASH_REMATCH[1]}"
      ARG_VALUE="${BASH_REMATCH[2]}"
      ARG_NAME_UPPER=$(varName $ARG_NAME)
    }

    function validateArg {
      local AD_RE=$(getVar ${ARG_NAME_UPPER}_RE)

      if [[ ! $AD_RE ]]; then
        echo "Unknown option: $ARG_NAME"
        usage
      fi

      if [[ ! $ARG_VALUE =~ ^${AD_RE}$ ]]; then
        echo "Wrong format: $ARG_NAME"
        usage;
      fi

      # validate that the "action" option points to a valid function
      if [[ $ARG_NAME == "action" ]] && ! isFunction $ARG_VALUE; then
        echo "No action $ARG_VALUE defined in this script"
        usage;
      fi
    }

    # -- run
    for i in "$@"
    do
      parseArg $i
      validateArg
      setVar "${ARG_NAME_UPPER}" "$ARG_VALUE"
    done
  }

  function checkMissingArgs {
    local ARG_NAME
    for ARG_NAME in "${REQUIRED_ARG_NAMES[@]}"
    do
      ARG_VALUE=$(getVar $(varName $ARG_NAME))

      if [[ ! $ARG_VALUE ]]; then
        echo "Missing: $ARG_NAME"
        usage;
      fi
    done
  }

  # -- run
  readArgDefs
  readAndValidateArgs "$@"
  checkMissingArgs

}

# getVar(varName)
function getVar {
  echo ${!1}
}

# setVar(varName, varValue)
function setVar {
  eval "$1=\"$2\""
}

# isFunction(name)
# - to be used in an if, so return 0 if successful and 1 if not!
function isFunction {
  if [[ $(type -t $1) == "function" ]]; then
    return 0
  else
    return 1
  fi
}

# readJsonProp(jsonFile, property)
# - restriction: property needs to be on a single line!
function readJsonProp {
  echo $(sed -En 's/.*"'$2'"[ ]*:[ ]*"(.*)".*/\1/p' $1)
}

# replaceJsonProp(jsonFile, propertyRegex, valueRegex, replacePattern)
# - note: propertyRegex will be automatically placed into a
#   capturing group! -> all other groups start at index 2!
function replaceJsonProp {
  replaceInFile $1 '"('$2')"[ ]*:[ ]*"'$3'"' '"\1": "'$4'"'
}

# replaceInFile(file, findPattern, replacePattern)
function replaceInFile {
  sed -i .tmp -E "s/$2/$3/" $1
  rm $1.tmp
}

# resolveDir(relativeDir)
# - resolves a directory relative to the current script
function resolveDir {
  echo $(cd $SCRIPT_DIR; cd $1; pwd)
}

function git_push_dryrun_proxy {
  echo "## git push dryrun proxy enabled!"
  export ORIGIN_GIT=$(which git)

  function git {
	  local ARGS=("$@")
	  local RC
	  if [[ $1 == "push" ]]; then
	    ARGS+=("--dry-run" "--porcelain")
	    echo "####### START GIT PUSH DRYRUN #######"
      echo "${ARGS[@]}"
	  fi
	  if [[ $1 == "commit" ]]; then
      echo "${ARGS[@]}"
	  fi
	  $ORIGIN_GIT "${ARGS[@]}"
	  RC=$?
	  if [[ $1 == "push" ]]; then
	    echo "####### END GIT PUSH DRYRUN #######"
	  fi
	  return $RC
  }

  export -f git
}

function main {
  # normalize the working dir to the directory of the script
  cd $(dirname $0);SCRIPT_DIR=$(pwd)

  ARG_DEFS+=("[--git-push-dryrun=(true|false)]" "[--verbose=(true|false)]")
  parseArgs "$@"

  # --git_push_dryrun argument
  if [[ $GIT_PUSH_DRYRUN == "true" ]]; then
    git_push_dryrun_proxy
  fi

  # --verbose argument
  if [[ $VERBOSE == "true" ]]; then
    set -x
  fi

  if isFunction init; then
    init "$@"
  fi

  # jump to the function denoted by the --action argument,
  # otherwise call the "run" function
  if [[ $ACTION ]]; then
    $ACTION "$@"
  else
    run "$@"
  fi
}


main "$@"
