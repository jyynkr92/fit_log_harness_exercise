#!/usr/bin/env bash
# PreToolUse: ios/ android/ 직접 수정 차단 (CNG: prebuild 생성물). 불변식 #9
set -euo pipefail
input=$(cat)
tool=$(jq -r '.tool_name // ""' <<<"$input")
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

deny() {
  echo "🚫 차단: $1 — ios/, android/ 는 'npx expo prebuild'가 생성하는 산출물입니다 (CLAUDE.md 불변식 #9)." >&2
  echo "네이티브 설정은 app.config.ts 또는 config plugin(plugins/)으로 변경하고 'npx expo prebuild --clean'으로 재생성하세요." >&2
  exit 2
}

case "$tool" in
  Edit|Write|MultiEdit|NotebookEdit)
    p=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // ""' <<<"$input")
    rel="${p#"$root"/}"
    [[ "$rel" =~ ^(\./)?(ios|android)/ ]] && deny "$p"
    ;;
  Bash)
    cmd=$(jq -r '.tool_input.command // ""' <<<"$input")
    # expo prebuild 는 공식 재생성 경로이므로 허용
    grep -Eq 'expo +prebuild' <<<"$cmd" && exit 0
    if grep -Eq '(^|[;&|[:space:]])(rm|mv|cp|touch|tee|truncate|sed +-i|perl +-i|patch)([[:space:]]|$)[^;&|]*(^|[[:space:]"'"'"'/=])(\./)?(ios|android)(/|[[:space:]"'"'"']|$)' <<<"$cmd" \
       || grep -Eq '>>? *["'"'"']?(\./)?(ios|android)/' <<<"$cmd"; then
      deny "명령어: $cmd"
    fi
    ;;
esac
exit 0
