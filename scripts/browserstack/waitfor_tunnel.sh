#!/bin/bash


# Wait for Connect to be ready before exiting
# Time out if we wait for more than 2 minutes, so that we can print logs.
let "counter=0"

while [ ! -f $BROWSER_PROVIDER_READY_FILE ]; do
  let "counter++"
  if [ $counter -gt 240 ]; then
    echo "Timed out after 2 minutes waiting for browser provider ready file"
    # We must manually print logs here because travis will not run
    # after_script commands if the failure occurs before the script
    # phase.
    ./scripts/ci/print-logs.sh
    exit 5
  fi
  sleep .5
done
