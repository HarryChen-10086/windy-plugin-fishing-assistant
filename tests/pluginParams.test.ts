/**
 * 插件参数解析测试：URL / 上下文菜单传入的经纬度要做类型、数值与范围校验。
 */
import { describe, expect, it } from 'vitest';

import { isSameSpot, parseLatLonParams, toLatLonParams } from '../src/pluginParams';

describe('parseLatLonParams', () => {
    it('解析合法的数字参数', () => {
        expect(parseLatLonParams({ lat: 39.9, lon: 116.4 })).toEqual({ lat: 39.9, lon: 116.4 });
    });

    it('接受数字字符串（URL 片段里常见）', () => {
        expect(parseLatLonParams({ lat: '39.9', lon: '116.4' })).toEqual({ lat: 39.9, lon: 116.4 });
    });

    it('忽略多余字段', () => {
        expect(parseLatLonParams({ lat: 1, lon: 2, zoom: 8, name: 'x' })).toEqual({ lat: 1, lon: 2 });
    });

    it('参数缺失或类型不对时返回 null', () => {
        expect(parseLatLonParams(undefined)).toBeNull();
        expect(parseLatLonParams(null)).toBeNull();
        expect(parseLatLonParams(42)).toBeNull();
        expect(parseLatLonParams('39.9,116.4')).toBeNull();
        expect(parseLatLonParams({})).toBeNull();
        expect(parseLatLonParams({ lat: 39.9 })).toBeNull();
        expect(parseLatLonParams({ lon: 116.4 })).toBeNull();
    });

    it('空串与非数字字符串返回 null', () => {
        expect(parseLatLonParams({ lat: '', lon: '1' })).toBeNull();
        expect(parseLatLonParams({ lat: '  ', lon: '1' })).toBeNull();
        expect(parseLatLonParams({ lat: 'abc', lon: '1' })).toBeNull();
    });

    it('非有限数字返回 null（NaN / Infinity）', () => {
        expect(parseLatLonParams({ lat: Number.NaN, lon: 1 })).toBeNull();
        expect(parseLatLonParams({ lat: Number.POSITIVE_INFINITY, lon: 1 })).toBeNull();
        expect(parseLatLonParams({ lat: 'Infinity', lon: 1 })).toBeNull();
    });

    it('布尔与对象不会被当成数字', () => {
        expect(parseLatLonParams({ lat: true, lon: 1 })).toBeNull();
        expect(parseLatLonParams({ lat: { value: 1 }, lon: 1 })).toBeNull();
    });

    it('越界坐标返回 null', () => {
        expect(parseLatLonParams({ lat: 90.1, lon: 0 })).toBeNull();
        expect(parseLatLonParams({ lat: -90.1, lon: 0 })).toBeNull();
        expect(parseLatLonParams({ lat: 0, lon: 180.1 })).toBeNull();
        expect(parseLatLonParams({ lat: 0, lon: -180.1 })).toBeNull();
    });

    it('边界值视为合法', () => {
        expect(parseLatLonParams({ lat: 90, lon: 180 })).toEqual({ lat: 90, lon: 180 });
        expect(parseLatLonParams({ lat: -90, lon: -180 })).toEqual({ lat: -90, lon: -180 });
    });
});

describe('toLatLonParams', () => {
    it('保留 4 位小数', () => {
        expect(toLatLonParams(39.9042345, 116.4074891)).toEqual({ lat: 39.9042, lon: 116.4075 });
    });

    it('负值同样取整', () => {
        expect(toLatLonParams(-33.8688197, -70.1234549)).toEqual({ lat: -33.8688, lon: -70.1235 });
    });
});

describe('isSameSpot', () => {
    it('URL 精度内相同视为同一个点', () => {
        expect(isSameSpot({ lat: 39.90421, lon: 116.40741 }, { lat: 39.90424, lon: 116.40738 })).toBe(
            true,
        );
    });

    it('URL 精度内不同视为不同点', () => {
        expect(isSameSpot({ lat: 39.9042, lon: 116.4074 }, { lat: 39.9052, lon: 116.4074 })).toBe(
            false,
        );
        expect(isSameSpot({ lat: 39.9042, lon: 116.4074 }, { lat: 39.9042, lon: 116.4084 })).toBe(
            false,
        );
    });

    it('字符串参数归一后也能比较', () => {
        const parsed = parseLatLonParams({ lat: '39.9042', lon: '116.4074' });
        expect(parsed).not.toBeNull();
        expect(isSameSpot(parsed as { lat: number; lon: number }, toLatLonParams(39.9042, 116.4074))).toBe(
            true,
        );
    });
});
