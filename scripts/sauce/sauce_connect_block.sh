#!/bin/bash

# Wait for Connect to be ready before exiting
printf "Connecting to Sauce."
while [ ! -f $BROWSER_PROVIDER_READY_FILE ]; do
  printf "."
  #dart2js takes longer than the travis 10 min timeout to complete
  sleep .5
done
echo "Connected"