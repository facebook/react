# !/bin/bash
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

# Script to bundle React Forget and prepare for test deployment on Meta devservers.


if ! command -v rg >/dev/null; then
  echo "\`rg\` not found. You might have to install it (e.g. via Homebrew)."
  exit 1
fi

set -eo pipefail

# if [ -z "$COMPILER_PATH" ]; then
#   echo "\$COMPILER_PATH must be set to a checkout of \`react-forget\`."
#   echo "For example:"
#   echo ""
#   echo "  COMPILER_PATH=path/to/react-forget bundle-meta.sh"
#   echo ""
#   exit 1
# fi

# cd "$COMPILER_PATH";

yarn install
rm -rf dist/
mkdir dist

packages=("babel-plugin-react-compiler" "eslint-plugin-react-compiler")
for package in "${packages[@]}"; do
  echo "Building" "$package"
  yarn workspace "$package" run build
done

echo "Copying artifacts to dist..."
for package in "${packages[@]}"; do
  for dir in packages/$package/; do
    if [ -d "$dir/dist" ]; then
      package_name=$(basename "$dir")
      cp -R "$dir/dist" "./dist/$package_name"
    fi
  done
done

echo "Hashing dist..."
yarn hash dist > dist/HASH

if [ "$(git rev-parse --is-inside-work-tree 2>/dev/null)" = "true" ]; then
  echo "Writing git commit history..."
  git log -n 200 \
      --pretty=format:'{%n  "commit": "%H",%n  "author": "%aN",%n  "date": "%as",%n  "title": "%f"%n},' \
      "$@" | \
      perl -pe 'BEGIN{print "["}; END{print "]\n"}' | \
      perl -pe 's/},]/}]/' \
      > dist/commit_history.json
fi

TMP_FILE="$(mktemp -d)/react-forget.tar.zst"

# delete tests
find dist -name __tests__ -type d -exec rm -rf {} +
# delete *.d.ts definition files
find dist -name '*.d.ts' -delete
# delete sourcemaps
find dist -name '*.js.map' -delete
# delete typescript compiler cache
find dist -name '*.tsbuildinfo' -delete

echo "Uploading bundle..."
tar --zstd -cf "$TMP_FILE" dist
HANDLE="$(jf upload "$TMP_FILE" | rg "success File available as (\w+)" | cut -f5 -d' ')"

echo "Install the bundle in www or fbsource with:"
echo
echo "  DEV=1 js1 upgrade react-forget $HANDLE"
