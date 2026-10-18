/**
 * 回归测试：打分的输入口径与用户界面单位无关。
 *
 * 指数打分只消费 Windy 点预报的原始 SI 值：温度 K、气压 Pa、风速 m/s、
 * 降水 mm、浪高 m、海拔 m。用户在界面上切到公制 / 英制 / 航海单位，
 * 只影响展示层的 `metrics.*.convertValue`，不参与任何阈值判断。
 *
 * 这里锁定两件事：
 * 1) store 的 `metric` 取任何值时，分数必须完全一致；
 * 2) 打分函数确实按 SI 解读入参（若误传 mph / hPa / 摄氏，结果会不同）。
 */
import store from '@windy/store';
import { afterAll, describe, expect, it } from 'vitest';

import {
    computeDaily,
    computeSegments,
    scorePressure,
    scoreTemp,
    scoreWind,
} from '../src/fishingIndex';
import { buildCelestial, buildData, buildSummary, buildWaves } from './fixtures';

/** 测试用的 store 替身接受任意 key，这里局部窄化以避开真实 DataSpecifications 的类型约束 */
type SettableStore = { set: (key: string, value: unknown) => void };
const setMetric = (unit: string): void => {
    (store as unknown as SettableStore).set('metric', unit);
};

/** 用同一份物理量数据算一遍分数快照 */
const snapshot = () => {
    const data = buildData({});
    const waves = buildWaves({});
    const celestial = buildCelestial(data.ts[0]);
    const segments = computeSegments(data, celestial, waves);
    const daily = computeDaily(data, segments, buildSummary({}), celestial);
    return {
        segments: segments.map(s => [s.ts, s.pressure, s.weather, s.wind, s.temp, s.time, s.total]),
        daily: daily.map(d => [d.day, d.avg, d.best.total]),
    };
};

afterAll(() => {
    setMetric('metric');
});

describe('用户单位设置不影响打分', () => {
    it('英制（imperial）下与公制完全一致', () => {
        setMetric('metric');
        const metric = snapshot();
        setMetric('imperial');
        expect(snapshot()).toEqual(metric);
    });

    it('航海单位（nautical）下与公制完全一致', () => {
        setMetric('metric');
        const metric = snapshot();
        setMetric('nautical');
        expect(snapshot()).toEqual(metric);
    });
});

describe('打分入参按 SI 解读', () => {
    it('温度按开尔文：293.15 K 高于误传的 68', () => {
        expect(scoreTemp(293.15)).toBeGreaterThan(scoreTemp(68));
    });

    it('风速按 m/s：3 m/s 优于 6.7（≈15 mph）', () => {
        expect(scoreWind(3)).toBeGreaterThan(scoreWind(6.7));
    });

    it('气压按帕：101325 Pa 优于误传的 1013.25', () => {
        expect(scorePressure(101325, 101325, 3)).toBeGreaterThan(scorePressure(1013.25, 1013.25, 3));
    });
});
