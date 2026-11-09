#!/usr/bin/env bash
# PostToolUse: 수정된 파일을 prettier(+eslint --fix)로 포맷. 실패해도 작업은 막지 않음.
input=$(cat)
p=$(jq -r '.tool_input.file_path // ""' <<<"$input")
[[ -z "$p" || ! -f "$p" ]] && exit 0
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$p" in
  */node_modules/*|*/ios/*|*/android/*|*/docs/generated/*|*.types.ts) exit 0 ;;
esac
case "$p" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
    [[ -x "$root/node_modules/.bin/eslint" ]] && (cd "$root" && node_modules/.bin/eslint --fix --quiet "$p" >/dev/null 2>&1)
    [[ -x "$root/node_modules/.bin/prettier" ]] && (cd "$root" && node_modules/.bin/prettier --write --log-level silent "$p")
    ;;
  *.json|*.css|*.md|*.yml|*.yaml)
    [[ -x "$root/node_modules/.bin/prettier" ]] && (cd "$root" && node_modules/.bin/prettier --write --log-level silent "$p")
    ;;
esac
exit 0
