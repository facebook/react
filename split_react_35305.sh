#!/bin/bash
set -e

# React
cd /Users/work/react_temp
git checkout main
git reset --hard origin/main
gh pr checkout 35305 -R facebook/react -b feature/original-35305 --force
git remote set-url origin https://github.com/tennisleng/react.git

ORIGIN_BRANCH="feature/original-35305"

# 1. Logic Branch
echo "Creating branch: feat/react-update-expr-logic"
git checkout main
git checkout -b feat/react-update-expr-logic

# Checkout logic file
git checkout $ORIGIN_BRANCH -- compiler/packages/babel-plugin-react-compiler/src/HIR/BuildHIR.ts

# Commit
git add .
git commit -m "fix(compiler): Support UpdateExpression on captured variables logic"

# Push
git push origin feat/react-update-expr-logic
gh pr create --repo facebook/react --base main --head tennisleng:feat/react-update-expr-logic --title "fix(compiler): Support UpdateExpression on captured variables logic" --body "Splitting #35305: Core logical fix."

# 2. Test Branch
echo "Creating branch: feat/react-update-expr-tests"
git checkout feat/react-update-expr-logic
git checkout -b feat/react-update-expr-tests

# Checkout tests
git checkout $ORIGIN_BRANCH -- compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures

# Commit
git add .
git commit -m "test(compiler): Add regression tests for UpdateExpression"

# Push
git push origin feat/react-update-expr-tests
gh pr create --repo facebook/react --base main --head tennisleng:feat/react-update-expr-tests --title "test(compiler): Add regression tests for UpdateExpression" --body "Splitting #35305: Test fixtures. Depends on #logic-pr"

echo "Done splitting #35305"
