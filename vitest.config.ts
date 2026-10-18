import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
    },
    resolve: {
        alias: {
            // Windy 的 @windy/* 是运行时注入的全局模块，测试环境没有实体 npm 包，
            // 这里仅给 vitest 用的替身；rollup 侧的 external 规则绝不能改。
            '@windy/store': fileURLToPath(new URL('./tests/mocks/windy-store.ts', import.meta.url)),
        },
    },
});
