/**
 * 工具函数测试：相对湿度的缺数据回归 + 最近索引查找。
 */
import { describe, expect, it } from 'vitest';

import { closestIndex, closestSegment, relativeHumidity } from '../src/fishingIndex';

import type { SegmentScore } from '../src/fishingIndex';

const seg = (ts: number): SegmentScore => ({
    ts,
    hour: 0,
    total: 50,
    pressure: 20,
    weather: 20,
    wind: 15,
    temp: 15,
    time: 8,
    moon: 10,
    safety: 0,
    severeKinds: [],
    icon: 1,
});

describe('relativeHumidity', () => {
    it('正常计算相对湿度', () => {
        const rh = relativeHumidity(298.15, 288.15); // 25°C / 露点 15°C
        expect(rh).not.toBeNull();
        expect(rh as number).toBeGreaterThan(53.6);
        expect(rh as number).toBeLessThan(54.0);
    });

    it('气温等于露点时饱和为 100%', () => {
        expect(relativeHumidity(288.15, 288.15)).toBe(100);
    });

    it('露点高于气温时夹到 100%', () => {
        expect(relativeHumidity(288.15, 298.15)).toBe(100);
    });

    it('缺数据时返回 null 而不是 NaN（回归）', () => {
        expect(relativeHumidity(null, 288.15)).toBeNull();
        expect(relativeHumidity(288.15, null)).toBeNull();
        expect(relativeHumidity(Number.NaN, 288.15)).toBeNull();
        expect(relativeHumidity(288.15, Number.NaN)).toBeNull();
        expect(relativeHumidity(undefined as unknown as null, 288.15)).toBeNull();
    });
});

describe('closestIndex', () => {
    const ts = [0, 10, 20, 30];

    it('返回最接近的下标', () => {
        expect(closestIndex(ts, 0)).toBe(0);
        expect(closestIndex(ts, 7)).toBe(1);
        expect(closestIndex(ts, 16)).toBe(2);
        expect(closestIndex(ts, 999)).toBe(3);
        expect(closestIndex(ts, -999)).toBe(0);
    });
});

describe('closestSegment', () => {
    const segments = [seg(0), seg(10), seg(20)];

    it('返回最接近的评分', () => {
        expect(closestSegment(segments, 4)?.ts).toBe(0);
        expect(closestSegment(segments, 6)?.ts).toBe(10);
        expect(closestSegment(segments, 100)?.ts).toBe(20);
    });

    it('空数组返回 null', () => {
        expect(closestSegment([], 0)).toBeNull();
    });
});
