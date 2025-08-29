#!/bin/bash
# Create the output directory if it doesn't exist
mkdir -p ./preserve-existing-memoization-guarantees
# Store the results of the rg command into a variable
rg_results=$(rg enablePreserveExistingMemoizationGuarantees -l)
# Iterate over each line stored in the variable
while IFS= read -r path; do
  # Skip if not a .js file
  if [[ "$path" != *.js ]]; then
    continue
  fi
  # Remove the .js extension
  base="${path%.js}"
  # Construct destination paths
  preserve="./preserve-existing-memoization-guarantees/${base}-preserve.js"
  dont_preserve="./preserve-existing-memoization-guarantees/${base}-dont-preserve.js"
  # Copy the file to both destinations
  cp "$path" "$preserve"
  cp "$path" "$dont_preserve"
done <<< "$rg_results"