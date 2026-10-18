/**
 * `@windy/store` 的最小替身，仅供单元测试使用。
 * 真实 store 由 Windy 客户端在运行时注入，测试里只需要 get/set 的读写能力。
 */
const values = new Map<string, unknown>();

const store = {
    get: (key: string): unknown => values.get(key),
    set: (key: string, value: unknown): void => {
        values.set(key, value);
    },
    on: (): number => 0,
    off: (): void => {
        /* noop */
    },
    clear: (): void => {
        values.clear();
    },
};

export default store;
