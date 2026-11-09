#!/usr/bin/env node
/**
 * 불변식 검사기 (CLAUDE.md "불변식" 1·2·4·5·6·7).
 * 의존성 없음. 에러 메시지는 에이전트가 읽고 바로 고칠 수 있도록 "고치는 법"을 포함한다.
 * 규칙을 추가할 땐: RULES 주석 + 메시지에 FIX 포함 + CLAUDE.md 불변식 번호 연결.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const SCAN_DIRS = ['app', 'features', 'components', 'lib'];
const EXTS = /\.(ts|tsx|js|jsx)$/;
const MAX_LINES = 300;

// 레이어별로 import 가능한 같은 feature 내 레이어 (ARCHITECTURE.md#레이어 와 동기화)
const LAYER_ALLOW = {
  types: [],
  schema: ['types'],
  repo: ['types', 'schema'],
  service: ['types', 'schema'],
  store: ['types', 'schema', 'repo', 'service'],
  hooks: ['types', 'schema', 'service', 'store'],
  components: ['types', 'schema', 'service', 'hooks', 'components'],
};
const LAYERS = Object.keys(LAYER_ALLOW);

const violations = [];
const report = (file, line, rule, msg, fix) =>
  violations.push({ file: relative(ROOT, file), line, rule, msg, fix });

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.test(name) && !name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

/** 파일 경로 → { area, feature, layer } */
function classify(absPath) {
  const parts = relative(ROOT, absPath).split(sep);
  const area = parts[0];
  if (area === 'features') {
    const feature = parts[1];
    const sub = parts[2];
    const layer = LAYERS.includes(sub) ? sub : sub?.startsWith('index.') ? 'index' : 'other';
    return { area, feature, layer, rel: parts.slice(2).join('/') };
  }
  if (area === 'components' && parts[1] === 'ui') return { area: 'ui' };
  return { area, rel: parts.slice(1).join('/') };
}

/** import specifier → 절대 경로(확장자 없음) 또는 null(외부 패키지) */
function resolveSpec(spec, fromFile) {
  if (spec.startsWith('@/') || spec.startsWith('~/')) return join(ROOT, spec.slice(2));
  if (spec.startsWith('.')) return resolve(dirname(fromFile), spec);
  return null;
}

const IMPORT_RE =
  /(?:import\s[^'"]*?from\s*|import\s*\(\s*|require\s*\(\s*|export\s[^'"]*?from\s*|import\s+)['"]([^'"]+)['"]/g;
const COLOR_RE = /(#[0-9a-fA-F]{3,8}\b|rgba?\s*\(|hsla?\s*\()/;
const COLOR_EXEMPT = [/^lib\/theme/, /^components\/ui\//, /tailwind\.config/, /\.test\./];

function lineOf(src, idx) {
  return src.slice(0, idx).split('\n').length;
}

for (const file of SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)))) {
  const src = readFileSync(file, 'utf8');
  const relFile = relative(ROOT, file);
  const from = classify(file);

  // 불변식 7: 파일 크기
  const lines = src.split('\n').length;
  if (lines > MAX_LINES && !relFile.endsWith('database.types.ts')) {
    report(file, 1, 'INV7/file-size', `${lines}줄 (최대 ${MAX_LINES})`,
      '책임별로 파일을 분리하세요: 하위 컴포넌트 추출, service 함수 분리, 상수는 별도 파일로.');
  }

  // 불변식 6: 하드코딩 색상 (tsx/ts 내 문자열)
  if (!COLOR_EXEMPT.some((r) => r.test(relFile))) {
    src.split('\n').forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return;
      if (/['"`][^'"`]*$/.test(l.split(COLOR_RE)[0] ?? '') && COLOR_RE.test(l)) {
        report(file, i + 1, 'INV6/hardcoded-color', `하드코딩 색상: ${l.trim().slice(0, 80)}`,
          'NativeWind 시맨틱 토큰 클래스(bg-primary, text-muted-foreground 등)를 쓰세요. 새 색이 필요하면 global.css 테마 변수에 추가. docs/DESIGN.md');
      }
    });
  }

  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1];
    const ln = lineOf(src, m.index);

    // 불변식 2: Supabase는 repo/ 와 lib/supabase 에서만
    const isSupabase =
      spec === '@supabase/supabase-js' || /(^|\/)lib\/supabase(\.\w+)?$/.test(spec) || spec === '@/lib/supabase';
    if (isSupabase) {
      const ok = (from.area === 'features' && from.layer === 'repo') || (from.area === 'lib' && /^supabase/.test(from.rel));
      if (!ok) {
        report(file, ln, 'INV2/supabase-outside-repo', `'${spec}' import`,
          'Supabase 호출을 features/<domain>/repo/ 로 옮기고, 여기서는 store/hooks 를 통해 사용하세요. ARCHITECTURE.md#레이어');
      }
    }

    const target = resolveSpec(spec, file);
    if (!target) continue;
    const to = classify(target);

    // lib, components/ui 는 features 를 몰라야 함
    if ((from.area === 'lib' || from.area === 'ui') && to.area === 'features') {
      report(file, ln, 'INV1/provider-imports-feature', `${from.area} → features (${spec})`,
        'lib/ 와 components/ui/ 는 최하단 레이어입니다. 필요한 타입/로직을 lib/ 로 내리거나, feature 쪽에서 주입하세요.');
    }

    // 불변식 5: app/ 은 feature public index 만
    if (from.area === 'app' && to.area === 'features' && to.layer !== 'index' && to.rel !== '') {
      report(file, ln, 'INV5/route-reaches-internal', `라우트가 feature 내부를 import: ${spec}`,
        `'@/features/${to.feature}' (index.ts) 에서 re-export 한 것만 사용하세요. 필요하면 features/${to.feature}/index.ts 에 export 추가.`);
    }

    if (from.area === 'features' && to.area === 'features') {
      // 불변식 4: 다른 feature 는 index 로만
      if (from.feature !== to.feature) {
        if (to.layer !== 'index' && to.rel !== '') {
          report(file, ln, 'INV4/cross-feature-internal', `${from.feature} → ${to.feature} 내부 (${spec})`,
            `'@/features/${to.feature}' 로 import 하고, 필요한 것은 features/${to.feature}/index.ts 에서 export 하세요.`);
        }
        continue;
      }
      // 불변식 1: 같은 feature 내 레이어 방향
      if (LAYERS.includes(from.layer) && LAYERS.includes(to.layer) && from.layer !== to.layer) {
        if (!LAYER_ALLOW[from.layer].includes(to.layer)) {
          report(file, ln, 'INV1/layer-direction', `${from.layer} → ${to.layer} (${spec})`,
            `${from.layer}/ 는 [${LAYER_ALLOW[from.layer].join(', ') || '없음'}] 만 import 할 수 있습니다. 로직을 올바른 레이어로 옮기세요. ARCHITECTURE.md#레이어`);
        }
      }
      if (from.layer !== 'index' && to.layer === 'index') {
        report(file, ln, 'INV1/self-index-import', `자기 feature의 index.ts import (${spec})`,
          '같은 feature 안에서는 index.ts 대신 실제 파일을 직접 import 하세요 (순환 의존 방지).');
      }
    }
  }
}

if (violations.length === 0) {
  console.log('✅ check-architecture: 불변식 위반 없음');
  process.exit(0);
}
console.error(`❌ check-architecture: ${violations.length}건 위반\n`);
for (const v of violations) {
  console.error(`${v.file}:${v.line}  [${v.rule}] ${v.msg}\n    FIX: ${v.fix}\n`);
}
process.exit(1);
