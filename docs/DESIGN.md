# Design System

## 기반

- **React Native Reusables** (shadcn/ui 스타일 RN 포팅) — 컴포넌트를 CLI로 레포에 복사해 소유한다.
- **NativeWind v4** — Tailwind 클래스, 테마 토큰은 CSS 변수(`global.css`)로.

## 컴포넌트 추가

```bash
npx @react-native-reusables/cli@latest add button card input
```

- `components/ui/`에 생성된다. 생성물 수정은 허용하되 **도메인 로직은 넣지 않는다**.
- 없는 프리미티브가 필요하면 먼저 Reusables 목록 확인 → 없으면 `components/ui/`에 같은 스타일로 작성.

## 토큰 규칙 (불변식 #6)

- 색상: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border` 등 시맨틱 토큰만.
- 하드코딩 `#hex` / `rgb()` 금지 → `check-architecture.mjs`가 검출.
- 다크 모드: 토큰이 처리. 컴포넌트에서 `colorScheme` 분기 최소화.

## 운동 앱 특화

- 터치 타겟 최소 44pt (땀 묻은 손, 빠른 입력)
- 숫자 입력은 큰 글씨 + 스테퍼 (±2.5kg, ±1 rep)
- 아이콘: Reusables 기본(`lucide-react-native`)

## 미정 (design-doc 필요)

- 차트 라이브러리 (victory-native / react-native-gifted-charts / 자체 SVG)
