
redirect_stderr() {
  REPORT_FORMATTER=$1
  TEMPORARY_LOG_FILE=$2

  if [ "$REPORT_FORMATTER" = "junit" ]; then
    "${@:3}" 2> "$TEMPORARY_LOG_FILE"
  else
    "${@:3}"
  fi
}

process_command() {
  BUILD_STEP=$1
  REPORT_FORMATTER=$2
  TEMPORARY_LOG_FILE=$3

  redirect_stderr "$REPORT_FORMATTER" "$TEMPORARY_LOG_FILE" "${@:4}"

  if [ "$REPORT_FORMATTER" = "junit" ]; then
    ERROR=$(cat "$TEMPORARY_LOG_FILE")
    if [ "$ERROR" != "" ];then
      echo $ERROR
      ./scripts/circleci/write_junit_report.sh "$BUILD_STEP" "$ERROR" false
    fi
    rm -f $TEMPORARY_LOG_FILE
    if [ "$ERROR" != "" ];then
      exit 1
    fi
  fi
}
