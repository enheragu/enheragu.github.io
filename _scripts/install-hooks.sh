#!/usr/bin/env bash
# Activate this repo's versioned git hooks (one-time, per clone).
# Git won't auto-run hooks from a tracked directory on clone, so point
# core.hooksPath at _scripts/git-hooks here.
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
cd "$REPO"

chmod +x _scripts/git-hooks/* 2>/dev/null || true
git config core.hooksPath _scripts/git-hooks

echo "Git hooks activated: core.hooksPath -> _scripts/git-hooks"
echo "  - pre-commit: regenerates pdf/EnriqueHerediaAguado_CV.pdf when CV source changes."
echo "  - Skip once:   git commit --no-verify"
echo "  - Deactivate:  git config --unset core.hooksPath"
