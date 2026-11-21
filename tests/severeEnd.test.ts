/**
 * severeEndTs 的回归测试：结束时刻应落在最后一个恶劣时间步的末尾。
 *
 * 背景：旧实现返回第一个非恶劣步的时间戳，相当于把持续时长多算了一个步长。
 * 例如 3h 步长下 09:00 起大风、12:00 转好，结束时刻应是 12:00（09:00 步的结束）。
 */
import { describe, expect, it } from 'vitest';

import { computeSegments, severeEndTs } from '../src/fishingIndex';

import { HOUR, buildData } from './fixtures';

import type { SegmentScore } from '../src/fishingIndex';
import type { SevereKind } from '../src/types';

const WIND: SevereKind[] = ['wind'];

/** 按判定函数重写每步的恶劣条件，其余字段保持 computeSegments 的结果 */
const withWindAt = (segments: SegmentScore[], isSevere: (i: number) => boolean): SegmentScore[] =>
    segments.map((seg, i) => ({ ...seg, severeKinds: isSevere(i) ? WIND : [] }));

describe('severeEndTs', () => {
    const data = buildData({ steps: 6, stepHours: 3 });
    const segments = computeSegments(data, undefined);

    it('起始步之后立刻转好时，返回起始步结束时刻', () => {
        const onlySecond = withWindAt(segments, i => i === 1);

        // 3h 步长：起始步 03:00 的结束 = 06:00 = segments[2].ts
        expect(severeEndTs(onlySecond, 'wind', 1)).toBe(segments[2].ts);
        expect(severeEndTs(onlySecond, 'wind', 1)).toBe(segments[1].ts + 3 * HOUR);
    });

    it('连续多个恶劣步时返回最后一步的结束时刻', () => {
        const threeSteps = withWindAt(segments, i => i >= 1 && i <= 3);

        // 最后一步 09:00 的结束 = 12:00 = segments[4].ts
        expect(severeEndTs(threeSteps, 'wind', 1)).toBe(segments[4].ts);
        // 从中间开始查也应落到同一步的末尾
        expect(severeEndTs(threeSteps, 'wind', 2)).toBe(segments[4].ts);
    });

    it('持续到预报期末时返回 null', () => {
        const tillEnd = withWindAt(segments, i => i >= 3);
        expect(severeEndTs(tillEnd, 'wind', 3)).toBeNull();
    });

    it('起始步就没有该恶劣条件时返回 null', () => {
        expect(severeEndTs(segments, 'wind', 0)).toBeNull();
    });

    it('真实大风数据：结束时刻等于最后一步加一个步长', () => {
        // 下标 1 风速 11 m/s（>=10.8 判大风），其余微风
        const windData = buildData({ steps: 6, stepHours: 3, wind: i => (i === 1 ? 11 : 3) });
        const windSegments = computeSegments(windData, undefined);

        expect(windSegments[1].severeKinds).toEqual(['wind']);
        expect(severeEndTs(windSegments, 'wind', 1)).toBe(windSegments[2].ts);
    });
});
