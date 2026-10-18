/**
 * 回归测试：1h 步长数据与 3h 步长数据必须算出同一口径的分数。
 *
 * 背景：插件有两条数据链路——5 天详情用 3h 步长，未来小时用 1h 步长，
 * 而气压差、降水量、暴雨/暴雪阈值都是按 3h 累计量标定的。若不归一，
 * 同一段天气在两条链路会给出不同指数。
 */
import { describe, expect, it } from 'vitest';

import {
    BASE_STEP_HOURS,
    computeSegments,
    scorePressure,
    scoreWeather,
    severeKindsAt,
    stepHoursOf,
} from '../src/fishingIndex';
import { HOUR, buildData } from './fixtures';
import { WeatherConditionIcon } from '../src/types';

describe('stepHoursOf', () => {
    it('从 3h 序列推出 3', () => {
        const ts = [0, 3 * HOUR, 6 * HOUR, 9 * HOUR];
        expect(stepHoursOf(ts)).toBe(3);
    });

    it('从 1h 序列推出 1', () => {
        const ts = [0, HOUR, 2 * HOUR, 3 * HOUR];
        expect(stepHoursOf(ts)).toBe(1);
    });

    it('数据不足时回退到基准步长', () => {
        expect(stepHoursOf([])).toBe(BASE_STEP_HOURS);
        expect(stepHoursOf([0])).toBe(BASE_STEP_HOURS);
        expect(stepHoursOf([0, 0])).toBe(BASE_STEP_HOURS);
    });

    it('用中位数抵抗个别缺口', () => {
        const ts = [0, HOUR, 2 * HOUR, 5 * HOUR, 6 * HOUR];
        expect(stepHoursOf(ts)).toBe(1);
    });
});

describe('scorePressure 步长归一', () => {
    it('同一气压趋势在 1h 与 3h 下得分相同', () => {
        const per3h = scorePressure(101325, 101325 - 375, 3);
        const per1h = scorePressure(101325, 101325 - 125, 1);
        expect(per1h).toBe(per3h);
    });

    it('1h 数据里的持续下跌不会被当成"稳定"', () => {
        // 125 Pa/h 看起来温和，但折合 375 Pa/3h 已属明显变化
        const stableLooking = scorePressure(101325, 101325 - 125, 3);
        const hourly = scorePressure(101325, 101325 - 125, 1);
        expect(hourly).toBeLessThan(stableLooking);
    });

    it('缺省步长按 3h 处理，保持既有口径', () => {
        expect(scorePressure(101325, 101200)).toBe(scorePressure(101325, 101200, 3));
    });
});

describe('scoreWeather 步长归一', () => {
    it('同一降水强度在 1h 与 3h 下得分相同', () => {
        const per3h = scoreWeather(WeatherConditionIcon.Clear, 8, 3);
        const per1h = scoreWeather(WeatherConditionIcon.Clear, 8 / 3, 1);
        expect(per1h).toBe(per3h);
    });

    it('1h 里的小时雨量会被折成 3h 累计量再判档', () => {
        // 4 mm/h ≈ 12 mm/3h，属于需要扣分的降水
        expect(scoreWeather(WeatherConditionIcon.Clear, 4, 1)).toBe(
            scoreWeather(WeatherConditionIcon.Clear, 12, 3),
        );
    });
});

describe('severeKindsAt 步长归一', () => {
    it('暴雨阈值按 3h 累计量判定', () => {
        const per3h = buildData({ steps: 1, stepHours: 3, precipAmount: () => 8 });
        const per1h = buildData({ steps: 1, stepHours: 1, precipAmount: () => 8 / 3 });
        expect(severeKindsAt(per3h, 0, null, null, 3)).toEqual(['rain']);
        expect(severeKindsAt(per1h, 0, null, null, 1)).toEqual(['rain']);
    });

    it('1h 里未达标的雨量不会被误判为暴雨', () => {
        const per1h = buildData({ steps: 1, stepHours: 1, precipAmount: () => 1 });
        expect(severeKindsAt(per1h, 0, null, null, 1)).toEqual([]);
    });

    it('暴雪阈值同样按 3h 累计量判定', () => {
        const per1h = buildData({ steps: 1, stepHours: 1, precipSnowAmount: () => 5 / 3 });
        expect(severeKindsAt(per1h, 0, null, null, 1)).toEqual(['snow']);
    });
});

describe('computeSegments 端到端口径一致', () => {
    // 气压按 125 Pa/h 匀速下降，降水按 8mm/3h 匀速下：两条链路描述的是同一段天气。
    // 3h 序列取 4 步（12h），1h 序列取 12 步，逐 3 步对齐比较。
    const build = (stepHours: number) =>
        buildData({
            steps: (12 / stepHours) | 0,
            stepHours,
            icon: () => WeatherConditionIcon.Clear,
            pressure: i => 101325 - i * stepHours * 125,
            precipAmount: () => stepHours * (8 / 3),
        });

    it('等价的时间对齐数据得到相同分数', () => {
        const threeHourly = computeSegments(build(3), undefined);
        const hourly = computeSegments(build(1), undefined);

        expect(threeHourly).toHaveLength(4);
        expect(hourly).toHaveLength(12);
        for (let k = 0; k < threeHourly.length; k++) {
            const h = hourly[k * 3];
            expect(h.pressure).toBe(threeHourly[k].pressure);
            expect(h.weather).toBe(threeHourly[k].weather);
            expect(h.severeKinds).toEqual(threeHourly[k].severeKinds);
            expect(h.total).toBe(threeHourly[k].total);
        }
    });

    it('默认 3h 数据的分数不受改造影响', () => {
        const data = buildData({ steps: 2, pressure: i => [101325, 101325 - 375][i] });
        const segments = computeSegments(data, undefined);
        expect(segments[1].pressure).toBe(scorePressure(101325 - 375, 101325, 3));
    });
});
