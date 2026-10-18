/**
 * 恶劣条件识别、安全扣分与每日聚合的测试。
 *
 * 重点回归：同一时间步"降雪量 ≥5mm"与"雪图标"会同时命中，
 * 旧实现把 'snow' 压进数组两次，导致安全扣分从 -15 变成 -30。
 */
import { describe, expect, it } from 'vitest';

import { computeDaily, computeSegments, severeEndTs, severeKindsAt } from '../src/fishingIndex';
import { WeatherConditionIcon } from '../src/types';

import { buildData, buildSummary, buildWaves, DAY } from './fixtures';

describe('severeKindsAt', () => {
    it('雪量与雪图标同时命中时只保留一个 snow（回归）', () => {
        const data = buildData({
            icon: () => WeatherConditionIcon.OvercastSnow,
            precipSnowAmount: () => 10,
        });
        expect(severeKindsAt(data, 0, null, null)).toEqual(['snow']);
    });

    it('各类恶劣条件各自识别', () => {
        const thunder = buildData({ icon: () => WeatherConditionIcon.ThunderstormPartlyCloudy });
        expect(severeKindsAt(thunder, 0, null, null)).toEqual(['thunder']);

        const rain = buildData({ precipAmount: () => 9 });
        expect(severeKindsAt(rain, 0, null, null)).toEqual(['rain']);

        const snow = buildData({ precipSnowAmount: () => 6 });
        expect(severeKindsAt(snow, 0, null, null)).toEqual(['snow']);

        const wind = buildData({ wind: () => 11 });
        expect(severeKindsAt(wind, 0, null, null)).toEqual(['wind']);

        const cold = buildData({ temperature: () => 250 }); // -23°C
        expect(severeKindsAt(cold, 0, null, null)).toEqual(['temp']);

        const hot = buildData({ temperature: () => 313 }); // ~40°C
        expect(severeKindsAt(hot, 0, null, null)).toEqual(['temp']);

        const fog = buildData({ icon: () => WeatherConditionIcon.Fog });
        expect(severeKindsAt(fog, 0, null, null)).toEqual(['fog']);
    });

    it('有海浪数据时才判断大浪', () => {
        const data = buildData();
        const waves = buildWaves({ waveHeight: 3 });
        expect(severeKindsAt(data, 0, waves, 0)).toEqual(['waves']);
        expect(severeKindsAt(data, 0, waves, null)).toEqual([]);
        expect(severeKindsAt(data, 0, buildWaves({ waveHeight: 1 }), 0)).toEqual([]);
    });
});

describe('computeSegments', () => {
    it('单项安全扣分是 -15（不再翻倍）', () => {
        const data = buildData({
            icon: () => WeatherConditionIcon.OvercastSnow,
            precipSnowAmount: () => 10,
        });
        const segments = computeSegments(data, undefined);
        expect(segments[0].severeKinds).toEqual(['snow']);
        expect(segments[0].safety).toBe(-15);
    });

    it('多项叠加时扣分上限为 -50', () => {
        const data = buildData({
            icon: () => WeatherConditionIcon.ThunderstormPartlyCloudy,
            precipAmount: () => 9,
            precipSnowAmount: () => 10,
            wind: () => 12,
            temperature: () => 250,
        });
        const waves = buildWaves({ waveHeight: 3 });
        const segments = computeSegments(data, undefined, waves);

        expect(segments[0].severeKinds).toEqual([
            'thunder',
            'rain',
            'snow',
            'wind',
            'temp',
            'waves',
        ]);
        expect(segments[0].safety).toBe(-50);
        expect(segments[0].total).toBe(0); // 47 - 50，被夹到 0
    });

    it('晴朗微风的白天得分较高', () => {
        const data = buildData();
        const segments = computeSegments(data, undefined);
        expect(segments[0].severeKinds).toEqual([]);
        expect(segments[0].safety).toBe(0);
        expect(segments[0].total).toBe(20 + 20 + 15 + 15 + 8 + 10); // 88
    });
});

describe('severeEndTs', () => {
    it('返回该条件第一次消失的时间戳', () => {
        const data = buildData({ wind: i => (i === 1 ? 11 : 3) });
        const segments = computeSegments(data, undefined);

        expect(segments[1].severeKinds).toEqual(['wind']);
        expect(severeEndTs(segments, 'wind', 1)).toBe(segments[2].ts);
    });

    it('持续到期末时返回 null', () => {
        const data = buildData({ wind: () => 11 });
        const segments = computeSegments(data, undefined);
        expect(severeEndTs(segments, 'wind', 0)).toBeNull();
    });
});

describe('computeDaily', () => {
    const data = buildData({ steps: 16, stepHours: 3 }); // 48h，3h 一步
    const segments = computeSegments(data, undefined);

    it('有 summary 时按其分段聚合', () => {
        const summary = buildSummary({ days: 2, segmentsPerDay: 8 });
        const days = computeDaily(data, segments, summary, undefined);

        expect(days).toHaveLength(2);
        expect(days[0].day).toBe(1);
        expect(days[0].predictability).toBe(90);
        expect(days[0].tempMax).toBe(300);
        expect(days[0].tempMin).toBe(285);

        const firstDay = segments.slice(0, 8);
        expect(days[0].best.total).toBe(Math.max(...firstDay.map(s => s.total)));
        expect(days[0].avg).toBe(
            Math.round(firstDay.reduce((sum, s) => sum + s.total, 0) / firstDay.length),
        );
    });

    it('没有 summary 时按本地日分组', () => {
        const days = computeDaily(data, segments, undefined, undefined);

        expect(days).toHaveLength(2);
        expect(days[0].day).toBe(1);
        // 第一步没有历史气压（20 分），从第二步开始稳定（25 分），所以最佳时段落在第二步
        expect(days[0].timestamp).toBe(segments[1].ts);
        expect(days[1].timestamp).toBe(segments[0].ts + DAY);
        expect(days[0].tempMax).toBe(293.15);
        expect(days[0].predictability).toBeNull();
    });

    it('空 summary 退化为按本地日分组', () => {
        const days = computeDaily(data, segments, [], undefined);
        expect(days).toHaveLength(2);
    });
});
