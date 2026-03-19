#!/bin/bash
# Auto-pull latest from default branch on session start
git fetch origin "$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')" 2>/dev/null
git rebase "origin/$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')" --quiet 2>/dev/null
exit 0
