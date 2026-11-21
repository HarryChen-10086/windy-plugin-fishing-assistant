/**
 * 海浪数据覆盖范围的回归测试。
 *
 * 背景：大气点预报取 5 天、海浪点预报只取 3 天。旧实现用 closestIndex 找浪下标，
 * 越界查询会被钳到浪数据的最后一步，于是第 4-5 天凭空出现"大浪 -20"的扣分，
 * 与界面上浪预报的覆盖范围不符。
 */
import { describe, expect, it } from 'vitest';

import { closestIndexWithin, computeSegments } from '../src/fishingIndex';

import { buildData, buildWaves } from './fixtures';

describe('closestIndexWithin', () => {
    const ts = [0, 10, 20];

    it('覆盖范围内返回最近下标', () => {
        expect(closestIndexWithin(ts, 0, 15)).toBe(0);
        expect(closestIndexWithin(ts, 7, 15)).toBe(1);
        // 与 closestIndex 不同：越界不钳首尾
        expect(closestIndexWithin(ts, 999, 15)).toBeNull();
        expect(closestIndexWithin(ts, -999, 15)).toBeNull();
    });

    it('偏差恰好等于上限时仍算覆盖内', () => {
        expect(closestIndexWithin(ts, 35, 15)).toBe(2);
        expect(closestIndexWithin(ts, 35, 14.999)).toBeNull();
        expect(closestIndexWithin(ts, -15, 15)).toBe(0);
        expect(closestIndexWithin(ts, -16, 15)).toBeNull();
    });

    it('空数组返回 null', () => {
        expect(closestIndexWithin([], 0, 1e9)).toBeNull();
    });
});

describe('computeSegments 浪数据越界', () => {
    it('浪覆盖完整时每一步都扣大浪分', () => {
        const data = buildData({ steps: 16, stepHours: 3 });
        const waves = buildWaves({ startTs: data.ts[0], steps: 16, stepHours: 3, waveHeight: 3 });
        const segments = computeSegments(data, undefined, waves);

        for (const seg of segments) {
            expect(seg.severeKinds).toContain('waves');
            expect(seg.safety).toBe(-20);
        }
    });

    it('浪只覆盖前 8 步时，越界的时间步不出现大浪、也不扣 20 分', () => {
        const data = buildData({ steps: 16, stepHours: 3 });
        const waves = buildWaves({ startTs: data.ts[0], steps: 8, stepHours: 3, waveHeight: 3 });
        const segments = computeSegments(data, undefined, waves);

        // 容差 1.5 个浪数据步长（4.5h），浪最后一步 21:00 覆盖到 24:00 附近，
        // 因此下标 0-8 仍在覆盖内
        expect(segments[0].severeKinds).toEqual(['waves']);
        expect(segments[8].severeKinds).toEqual(['waves']);
        for (let i = 9; i < segments.length; i++) {
            expect(segments[i].severeKinds).toEqual([]);
            expect(segments[i].safety).toBe(0);
        }
    });

    it('5 天大气数据 + 3 天浪数据：第 4-5 天不再凭空扣分（回归）', () => {
        const data = buildData({ steps: 40, stepHours: 3 }); // 120h = 5 天
        const waves = buildWaves({
            startTs: data.ts[0],
            steps: 24,
            stepHours: 3, // 72h = 3 天
            waveHeight: 4,
        });
        const segments = computeSegments(data, undefined, waves);

        expect(segments[0].severeKinds).toEqual(['waves']);
        // 浪最后一步是 69h，容差 4.5h ⇒ 覆盖到 73.5h，之后的时间步必须无浪
        for (let i = 25; i < segments.length; i++) {
            expect(segments[i].severeKinds).toEqual([]);
            expect(segments[i].safety).toBe(0);
        }
        // 无浪扣分，各步总分不再被压到基准分以下
        expect(segments[39].total).toBeGreaterThan(segments[0].total);
    });

    it('浪高不足 2.5m 时即使覆盖完整也不扣分', () => {
        const data = buildData({ steps: 16, stepHours: 3 });
        const waves = buildWaves({ startTs: data.ts[0], steps: 16, stepHours: 3, waveHeight: 1 });
        const segments = computeSegments(data, undefined, waves);

        expect(segments[0].severeKinds).toEqual([]);
        expect(segments[0].safety).toBe(0);
    });
});
