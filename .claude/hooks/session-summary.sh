#!/usr/bin/env bash
# SessionEnd: 세션 동안 바뀐 것 요약을 .claude/session-logs/ 에 남긴다 (gitignore 대상).
input=$(cat)
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" || exit 0
sid=$(jq -r '.session_id // "unknown"' <<<"$input")
reason=$(jq -r '.reason // ""' <<<"$input")
transcript=$(jq -r '.transcript_path // ""' <<<"$input")
dir="$root/.claude/session-logs"; mkdir -p "$dir"
out="$dir/$(date +%Y-%m-%d_%H%M)_${sid:0:8}.md"

{
  echo "# Session ${sid:0:8} — $(date '+%Y-%m-%d %H:%M')"
  echo "- 종료 사유: ${reason:-n/a}"
  echo "- 브랜치: $(git branch --show-current 2>/dev/null)"
  if [[ -f "$transcript" ]]; then
    echo
    echo "## 요청 (사용자 프롬프트)"
    jq -r 'select(.type=="user" and (.message.content|type)=="string") | .message.content' "$transcript" 2>/dev/null \
      | grep -v '^<' | cut -c1-160 | grep -v '^\s*$' | sed 's/^/- /' | head -20
    echo
    echo "## 수정한 파일 (Edit/Write)"
    jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and (.name|test("^(Edit|Write|MultiEdit|NotebookEdit)$"))) | .input.file_path // .input.notebook_path' "$transcript" 2>/dev/null \
      | sed "s|^$root/||" | sort -u | sed 's/^/- /'
    echo
    echo "## 실행한 명령 수"
    jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Bash") | 1' "$transcript" 2>/dev/null | wc -l | tr -d ' ' | sed 's/^/- Bash: /'
  fi
  echo
  echo "## Git 상태"
  echo '```'
  git status --short 2>/dev/null | head -40
  echo '```'
  echo "## 최근 커밋"
  echo '```'
  git log --oneline -5 2>/dev/null
  echo '```'
  if [[ -n "$(ls docs/exec-plans/active 2>/dev/null | grep -v .gitkeep)" ]]; then
    echo "## 진행 중인 실행 계획"
    ls docs/exec-plans/active | grep -v .gitkeep | sed 's/^/- /'
  fi
  if [[ -x node_modules/.bin/tsc || -f scripts/check-architecture.mjs ]]; then
    echo "## 불변식 검사"
    echo '```'
    node scripts/check-architecture.mjs 2>&1 | tail -15
    echo '```'
  fi
} > "$out" 2>/dev/null

# 오래된 로그 정리 (최근 30개 유지)
ls -1t "$dir"/*.md 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null
exit 0
