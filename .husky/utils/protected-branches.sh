#!/usr/bin/env bash

BRANCH=`git rev-parse --abbrev-ref HEAD`
PROTECTED_BRANCHES="^(main|master|develop)"

if [[ "$BRANCH" =~ $PROTECTED_BRANCHES ]]
then
  echo "🚫 Cannot commit or push to $BRANCH branch. Please create your own branch and then create a new Pull Request."
  exit 1
fi

exit 0
