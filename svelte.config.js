/**
 * Svelte 编译器配置。
 *
 * rollup 构建与 `svelte-check` 共用这一份预处理配置：
 * 之前 preprocess 只写在 rollup.config.js 里，`svelte-check` 读不到，
 * 于是 src/plugin.svelte 里的 TypeScript 实际上从未被类型检查过。
 */
import sveltePreprocess from 'svelte-preprocess';
import { less } from 'svelte-preprocess-less';

const useSourceMaps = true;

export default {
    preprocess: {
        style: less({
            sourceMap: false,
            math: 'always',
        }),
        script: data => {
            const preprocessed = sveltePreprocess({ sourceMap: useSourceMaps });
            return preprocessed.script(data);
        },
    },
};
