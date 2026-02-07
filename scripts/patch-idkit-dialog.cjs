/**
 * @worldcoin/idkit + @radix-ui/react-dialog 패치
 * - idkit: DialogTitle sr-only, ErrorState 빈 객체일 때 console.error 방지
 * - radix: TitleWarning console.error 제거
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules');

// 1) @worldcoin/idkit
const idkitRoot = path.join(root, '@worldcoin', 'idkit', 'build');
const idkitReplacements = [
  ['/* @__PURE__ */ jsx15(Dialog.Title, {}),', '/* @__PURE__ */ jsx15(Dialog.Title, { className: "sr-only", children: "World ID Verification" }),'],
  ['/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Dialog.Title, {}),', '/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Dialog.Title, { className: "sr-only", children: "World ID Verification" }),'],
];
// ErrorState: console.error 완전 제거 (빈 객체 {} 로그로 오버레이 뜨는 것 방지)
let idkitPatched = 0;
for (const file of ['index.js', 'index.cjs']) {
  const filePath = path.join(idkitRoot, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [from, to] of idkitReplacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      idkitPatched++;
    }
  }
  // idkit index.js: useEffect4(() => { if ... console.error ... }, [errorState]) → 빈 effect
  const prev = content;
  content = content.replace(/useEffect4\(\(\) => \{\s*if \(errorState\?\.code != null\) \{\s*console\.error\([^)]+\);\s*\}\s*\}, \[errorState\]\);/g, 'useEffect4(() => {}, [errorState]);');
  content = content.replace(/useEffect4\(\(\) => \{\s*if \(errorState\) \{\s*console\.error\([^)]+\);\s*\}\s*\}, \[errorState\]\);/g, 'useEffect4(() => {}, [errorState]);');
  // idkit index.cjs: (0, import_react4.useEffect)(() => { ... }, [errorState]) → 빈 effect
  content = content.replace(/\(0, import_react4\.useEffect\)\(\(\) => \{\s*if \(errorState\?\.code != null\) \{\s*console\.error\([^)]+\);\s*\}\s*\}, \[errorState\]\);/g, '(0, import_react4.useEffect)(() => {}, [errorState]);');
  content = content.replace(/\(0, import_react4\.useEffect\)\(\(\) => \{\s*if \(errorState\) \{\s*console\.error\([^)]+\);\s*\}\s*\}, \[errorState\]\);/g, '(0, import_react4.useEffect)(() => {}, [errorState]);');
  if (content !== prev) idkitPatched++;
  fs.writeFileSync(filePath, content);
}

// 2) @radix-ui/react-dialog – TitleWarning에서 console.error 제거 (idkit은 형제/Shadow 등으로 getElementById 실패)
const radixDir = path.join(root, '@radix-ui', 'react-dialog', 'dist');
const radixSuppress = 'if (!hasTitle) console.error(MESSAGE);';
const radixSuppressRepl = 'if (!hasTitle) {} /* suppressed for @worldcoin/idkit */';
let radixPatched = 0;
for (const file of ['index.mjs', 'index.js']) {
  const filePath = path.join(radixDir, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(radixSuppress)) {
    content = content.split(radixSuppress).join(radixSuppressRepl);
    fs.writeFileSync(filePath, content);
    radixPatched++;
  }
}

if (idkitPatched > 0 || radixPatched > 0) {
  console.log('patch-idkit-dialog: idkit DialogTitle + radix TitleWarning 지연 검사 패치 적용됨.');
}
