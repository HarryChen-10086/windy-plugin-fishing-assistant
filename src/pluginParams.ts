/**
 * 插件参数（URL hash / 上下文菜单）解析工具。
 *
 * Windy 通过 URL 片段与 `onopen` / `onparamsChanged` 把参数交给插件，
 * 参数可能缺失、可能是字符串、也可能越界，因此统一在这里做校验，
 * 让插件内部只处理合法的 `{ lat, lon }`。
 */

/** 插件参数：钓点经纬度 */
export interface PluginLatLonParams {
    lat: number;
    lon: number;
}

/** URL 参数保留的小数位数（4 位 ≈ 11 m 精度，足够钓点定位，也能避免浮点抖动导致重复加载） */
export const PARAM_DECIMALS = 4;

const MIN_LAT = -90;
const MAX_LAT = 90;
const MIN_LON = -180;
const MAX_LON = 180;

/** 把任意值转成有限数字；无法转换（含空串、布尔、对象）时返回 null */
const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') {
            return null;
        }
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

/** 按 URL 精度取整 */
const roundTo = (value: number): number => Number(value.toFixed(PARAM_DECIMALS));

/**
 * 解析并校验插件参数。
 * @param params Windy 传入的参数（未知类型）
 * @returns 合法的经纬度，或 null（参数缺失/非法/越界）
 */
export const parseLatLonParams = (params?: unknown): PluginLatLonParams | null => {
    if (params === null || typeof params !== 'object') {
        return null;
    }
    const { lat, lon } = params as Record<string, unknown>;
    const latNum = toFiniteNumber(lat);
    const lonNum = toFiniteNumber(lon);
    if (latNum === null || lonNum === null) {
        return null;
    }
    if (latNum < MIN_LAT || latNum > MAX_LAT || lonNum < MIN_LON || lonNum > MAX_LON) {
        return null;
    }
    return { lat: latNum, lon: lonNum };
};

/** 把经纬度归一成写进 URL 的参数（与解析结果可直接比较） */
export const toLatLonParams = (lat: number, lon: number): PluginLatLonParams => ({
    lat: roundTo(lat),
    lon: roundTo(lon),
});

/** 两个钓点在 URL 精度下是否算同一个点（避免同一个点反复重载/反复改 URL） */
export const isSameSpot = (a: PluginLatLonParams, b: PluginLatLonParams): boolean =>
    roundTo(a.lat) === roundTo(b.lat) && roundTo(a.lon) === roundTo(b.lon);
