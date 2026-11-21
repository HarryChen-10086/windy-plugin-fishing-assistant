/**
 * computeDaily 的 summary 边界与 localDayKey 测试。
 *
 * 背景：summary 的 index/segments 来自远端接口，与本地评分序列长度可能对不上
 * （步长切换、数据被截断等）。旧实现直接 slice，越界时整天被静默丢掉；
 * 现在改为夹取区间，并跳过重复/乱序条目。
 */
import { describe, expect, it } from 'vitest';

import { computeDaily, computeSegments, localDayKey } from '../src/fishingIndex';
import { WeatherConditionIcon } from '../src/types';

import { HOUR, buildData, buildSummary } from './fixtures';

import type { SummaryDay2 } from '../src/types';

/** 16 步 × 3h = 48h，恰好两天 */
const data = buildData({ steps: 16, stepHours: 3 });
const segments = computeSegments(data, undefined);

const summaryDay = (over: Partial<SummaryDay2>): SummaryDay2 => ({
    day: 1,
    timestamp: data.ts[0],
    weekday: 'Mon',
    icon: WeatherConditionIcon.Clear,
    index: 0,
    segments: 8,
    tempMax: 300,
    tempMin: 285,
    predictability: 90,
    ...over,
});

describe('localDayKey', () => {
    it('返回 Y*10000+M*100+D', () => {
        expect(localDayKey(Date.UTC(2026, 5, 1, 12), 0)).toBe(20260601);
        expect(localDayKey(Date.UTC(2026, 11, 31, 23), 0)).toBe(20261231);
    });

    it('按固定 UTC 偏移换算本地日（跨日）', () => {
        const lateUtc = Date.UTC(2026, 5, 1, 20); // 20:00 UTC
        expect(localDayKey(lateUtc, 0)).toBe(20260601);
        expect(localDayKey(lateUtc, 6)).toBe(20260602); // 次日 02:00
        expect(localDayKey(lateUtc, -8)).toBe(20260601); // 同日 12:00
    });

    it('与 computeDaily 的无 summary 分组口径一致', () => {
        const days = computeDaily(data, segments, undefined, undefined);
        const keys = new Set(segments.map(seg => localDayKey(seg.ts, 0)));
        expect(days).toHaveLength(keys.size);
    });
});

describe('computeDaily summary 边界', () => {
    it('区间超出序列末尾时按剩余长度夹取，不丢天', () => {
        // 第二天 index 10 只够 6 步，旧实现仍能取到 6 步；关键是不越界也不丢天
        const summary = [summaryDay({ index: 0, segments: 10 }), summaryDay({ day: 2, index: 10, segments: 10 })];
        const days = computeDaily(data, segments, summary, undefined);

        expect(days).toHaveLength(2);
        expect(days[1].best.total).toBe(
            Math.max(...segments.slice(10, 16).map(seg => seg.total)),
        );
        expect(days[1].avg).toBe(
            Math.round(segments.slice(10, 16).reduce((sum, seg) => sum + seg.total, 0) / 6),
        );
    });

    it('index 完全落在序列外时跳过该天且不抛错', () => {
        const summary = [summaryDay({ index: 0 }), summaryDay({ day: 2, index: 100, segments: 8 })];
        const days = computeDaily(data, segments, summary, undefined);

        expect(days).toHaveLength(1);
        expect(days[0].day).toBe(1);
    });

    it('负 index 夹到 0，negative/过大 segments 都不会产生空切片异常', () => {
        const summary = [summaryDay({ index: -5, segments: -3 })];
        // segments 为负 ⇒ len 夹到 0 ⇒ 该天跳过，函数不抛错
        expect(() => computeDaily(data, segments, summary, undefined)).not.toThrow();
        expect(computeDaily(data, segments, summary, undefined)).toHaveLength(0);
    });

    it('重复或乱序的同一起点不会被重复计入', () => {
        const summary = [
            summaryDay({ day: 1, index: 8, segments: 8 }),
            summaryDay({ day: 2, index: 0, segments: 8 }),
            summaryDay({ day: 3, index: 8, segments: 8 }),
        ];
        const days = computeDaily(data, segments, summary, undefined);

        // 第二条 index 0 < 已用游标 8，被跳过；第三条与第一条重复，同样跳过
        expect(days).toHaveLength(1);
        expect(days[0].day).toBe(1);
        expect(days[0].timestamp).toBe(summary[0].timestamp);
    });

    it('正常 summary 聚合结果与手工切片一致', () => {
        const summary = buildSummary({ days: 2, segmentsPerDay: 8 });
        const days = computeDaily(data, segments, summary, undefined);

        expect(days).toHaveLength(2);
        for (let d = 0; d < 2; d++) {
            const slice = segments.slice(d * 8, d * 8 + 8);
            expect(days[d].best.total).toBe(Math.max(...slice.map(seg => seg.total)));
            expect(days[d].avg).toBe(
                Math.round(slice.reduce((sum, seg) => sum + seg.total, 0) / slice.length),
            );
            expect(days[d].predictability).toBe(90);
        }
    });
});

describe('computeDaily 无 summary 分支的温度极值', () => {
    it('线性遍历取到的最高/最低温与逐段查找等价', () => {
        // 每步升 1K：第一天 280..287，第二天 288..295
        const varying = buildData({ steps: 16, stepHours: 3, temperature: i => 280 + i });
        const varyingSegs = computeSegments(varying, undefined);
        const days = computeDaily(varying, varyingSegs, undefined, undefined);

        expect(days).toHaveLength(2);
        expect(days[0].tempMin).toBe(280);
        expect(days[0].tempMax).toBe(287);
        expect(days[1].tempMin).toBe(288);
        expect(days[1].tempMax).toBe(295);
    });

    it('评分时间戳在数据里找不到时不参与温度统计（不抛错）', () => {
        const stale = segments.map(seg => ({ ...seg, ts: seg.ts + HOUR / 2 }));
        // 时间戳全部错位 ⇒ ts 映射查不到，温度极值保持 null
        expect(() => computeDaily(data, stale, undefined, undefined)).not.toThrow();
        const days = computeDaily(data, stale, undefined, undefined);
        expect(days.every(d => d.tempMax === null && d.tempMin === null)).toBe(true);
    });
});
