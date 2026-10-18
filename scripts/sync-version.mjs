#!/usr/bin/env node
/**
 * 版本号单源化：以 package.json 的 version 为唯一真源，
 * 自动同步 src/pluginConfig.ts（Windy 会读它生成 plugin.json）与 README 里的安装 URL。
 *
 * 用法：
 *   node scripts/sync-version.mjs          写入同步
 *   node scripts/sync-version.mjs --check  只校验，不一致则退出码 1（CI 用）
 */
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;
const checkOnly = process.argv.includes('--check');

/** 只改版本号那一段，其余字节保持原样（避免动到中文内容） */
const targets = [
    {
        file: 'src/pluginConfig.ts',
        pattern: /(^\s*version:\s*')([^']*)(')/m,
    },
    {
        file: 'README.md',
        pattern: /(windy-plugin-fishing-assistant\/)(\d+\.\d+\.\d+)(\/plugin\.min\.js)/,
    },
    {
        file: 'README_zh.md',
        pattern: /(windy-plugin-fishing-assistant\/)(\d+\.\d+\.\d+)(\/plugin\.min\.js)/,
    },
];

let failed = false;
const changed = [];

for (const { file, pattern } of targets) {
    const source = readFileSync(file, 'utf8');
    const match = source.match(pattern);

    if (!match) {
        console.error(`[version] 在 ${file} 中找不到版本号占位，请检查文件结构`);
        failed = true;
        continue;
    }

    if (match[2] === version) continue;

    changed.push(`${file}: ${match[2]} -> ${version}`);
    if (!checkOnly) {
        writeFileSync(file, source.replace(pattern, `$1${version}$3`));
    }
}

if (checkOnly) {
    if (failed || changed.length > 0) {
        for (const line of changed) console.error(`[version] 不一致 ${line}`);
        console.error(`[version] 请执行 npm run version:sync（真源：package.json -> ${version}）`);
        process.exit(1);
    }
    console.log(`[version] ok: ${version}`);
} else {
    for (const line of changed) console.log(`[version] 已同步 ${line}`);
    if (changed.length === 0) console.log(`[version] 已是 ${version}，无需改动`);
    if (failed) process.exit(1);
}
