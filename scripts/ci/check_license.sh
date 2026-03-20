#!/usr/bin/env bash

set -euo pipefail

# File that is allowed to contain the string "PATENTS"
EXPECTED_FILE="scripts/ci/check_license.sh"

# Get all files that contain "PATENTS" (ignore binary files, handle no matches safely)
mapfile -t ACTUAL_FILES < <(git grep -l --no-color -- "PATENTS" || true)

# If exactly one file and it matches expected → OK
if [[ "${#ACTUAL_FILES[@]}" -eq 1 && "${ACTUAL_FILES[0]}" == "$EXPECTED_FILE" ]]; then
  exit 0
fi

echo "Error: Unexpected references to 'PATENTS' found."

echo "Expected:"
echo "  $EXPECTED_FILE"

echo "Actual:"
for file in "${ACTUAL_FILES[@]:-<none>}"; do
  echo "  $file"
done

echo
echo "Diff:"
diff -u <(printf "%s\n" "$EXPECTED_FILE") <(printf "%s\n" "${ACTUAL_FILES[@]}") || true

exit 1
