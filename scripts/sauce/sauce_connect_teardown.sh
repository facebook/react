#!/bin/bash

set -e -o pipefail


echo "Shutting down Sauce Connect tunnel"

killall sc

while [[ -n `ps -ef | grep "sauce-connect-" | grep -v "grep"` ]]; do
  printf "."
  sleep .5
done

echo ""
echo "Sauce Connect tunnel has been shut down"
