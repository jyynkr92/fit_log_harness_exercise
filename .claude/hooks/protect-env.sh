#!/usr/bin/env bash
# PreToolUse: .env* 파일 접근 차단 (.env.example 제외). 불변식 #8
set -euo pipefail
input=$(cat)
tool=$(jq -r '.tool_name // ""' <<<"$input")

is_secret_path() {
  local base; base=$(basename -- "$1")
  [[ "$base" == .env || "$base" == .env.* ]] && [[ "$base" != .env.example ]]
}

deny() {
  echo "🚫 차단: $1 — 비밀값 파일(.env*)은 에이전트가 읽거나 쓸 수 없습니다 (CLAUDE.md 불변식 #8)." >&2
  echo "필요한 키 이름은 .env.example 에 값 없이 추가하고, 실제 값은 사용자에게 요청하세요. docs/SECURITY.md 참고." >&2
  exit 2
}

case "$tool" in
  Read|Edit|Write|MultiEdit|NotebookEdit)
    p=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // ""' <<<"$input")
    [[ -n "$p" ]] && is_secret_path "$p" && deny "$p"
    ;;
  Grep|Glob)
    p=$(jq -r '.tool_input.path // ""' <<<"$input")
    g=$(jq -r '(.tool_input.glob // "") + " " + (.tool_input.pattern // "")' <<<"$input")
    [[ -n "$p" ]] && is_secret_path "$p" && deny "$p"
    if [[ "$tool" == Glob ]] && grep -Eq '(^|/| )\.env(\*|\.[A-Za-z0-9_*]+)?( |$)' <<<"$g" && ! grep -q '\.env\.example' <<<"$g"; then deny "$g"; fi
    ;;
  Bash)
    cmd=$(jq -r '.tool_input.command // ""' <<<"$input")
    # .env.example 언급은 제거한 뒤 남은 .env 참조 검사
    stripped=$(sed -E 's/\.env\.example//g' <<<"$cmd")
    if grep -Eq '(^|[^A-Za-z0-9_])\.env([.][A-Za-z0-9_*-]+)?([^A-Za-z0-9_]|$)' <<<"$stripped"; then
      deny "명령어 내 .env 참조: $cmd"
    fi
    ;;
esac
exit 0
