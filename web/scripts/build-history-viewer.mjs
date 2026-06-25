// Standalone history-viewer 번들. esbuild로 단일 JS 파일로 빌드해 public/에 배치.
// cuchenon-history/[id] 페이지의 "페이지 저장"이 이 파일을 fetch해 데이터와 합쳐 단일 HTML 다운로드.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

await build({
    entryPoints: [path.join(root, 'lib/history-viewer/viewer.tsx')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    platform: 'browser',
    outfile: path.join(root, 'public/history-viewer.js'),
    jsx: 'automatic',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    define: {
        'process.env.NODE_ENV': '"production"',
    },
    alias: {
        '@': root,
    },
    logLevel: 'info',
});
console.log('[history-viewer] built successfully');
