#!/bin/bash

LOG_FILES=$LOGS_DIR/*

for FILE in $LOG_FILES; do

  echo -e "\n\n\n"
  echo "================================================================================"
  echo 'travis_fold:start:cleanup.printfile'
  echo " $FILE"
  echo "================================================================================"
  cat $FILE
  echo 'travis_fold:end:cleanup.printfile'
done
