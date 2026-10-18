#!/usr/bin/env node
/**
 * 跨平台构建脚本：替代原先 `rm -rf dist && mkdir dist && SERVE=false rollup -c && cp package.json dist/`
 * （Windows 上没有 rm -rf；`set SERVE=false` 还会带尾随空格导致 rollup-plugin-serve 误启动）
 */
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const step = (msg) => console.log(`[build] ${msg}`);

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

step('rollup -c (SERVE=false)');
const res = spawnSync('npx rollup -c', {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, SERVE: 'false' },
});
if (res.status !== 0) {
    process.exit(res.status ?? 1);
}

copyFileSync('package.json', 'dist/package.json');
step('done: dist/');
