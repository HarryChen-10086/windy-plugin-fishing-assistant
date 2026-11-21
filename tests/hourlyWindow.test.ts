/**
 * 未来小时窗口测试：当前步包含、数量上限、步长异常兜底。
 */
import { describe, expect, it } from 'vitest';

import { isCurrentStep, pickHourlyWindow } from '../src/hourlyWindow';

import type { SegmentScore } from '../src/fishingIndex';

const HOUR = 3600 * 1000;

const seg = (ts: number): SegmentScore => ({
    ts,
    hour: new Date(ts).getUTCHours(),
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

/** 从 startTs 起每 stepHours 小时一个点，共 steps 个 */
const buildSegs = (startTs: number, steps: number, stepHours: number): SegmentScore[] =>
    Array.from({ length: steps }, (_, i) => seg(startTs + i * stepHours * HOUR));

describe('pickHourlyWindow', () => {
    const start = Date.UTC(2026, 5, 1, 0, 0);

    it('1h 步长：包含当前所在步，默认取 12 个', () => {
        const segs = buildSegs(start, 48, 1);
        // 13:45 → 当前步是 13:00，窗口为 13:00…24:00
        const win = pickHourlyWindow(segs, start + 13.75 * HOUR, 1);
        expect(win).toHaveLength(12);
        expect(win[0].ts).toBe(start + 13 * HOUR);
        expect(win[11].ts).toBe(start + 24 * HOUR);
    });

    it('3h 步长：13:45 仍归到 12:00 那一步，而不是从 15:00 开始', () => {
        const segs = buildSegs(start, 16, 3);
        const win = pickHourlyWindow(segs, start + 13.75 * HOUR, 3);
        expect(win[0].ts).toBe(start + 12 * HOUR);
        // 16 个点覆盖 0…45h，从 12:00 起还剩 12 个点（12/15/…/45）
        expect(win).toHaveLength(12);
    });

    it('恰好落在步边界上时取新的那一步', () => {
        const segs = buildSegs(start, 16, 3);
        // 15:00 整 → 12:00 那步已结束，应从 15:00 开始
        const win = pickHourlyWindow(segs, start + 15 * HOUR, 3);
        expect(win[0].ts).toBe(start + 15 * HOUR);
    });

    it('数量上限由 count 控制', () => {
        const segs = buildSegs(start, 48, 1);
        expect(pickHourlyWindow(segs, start, 1, 3)).toHaveLength(3);
    });

    it('全部数据都在过去时返回空数组', () => {
        const segs = buildSegs(start, 4, 3);
        expect(pickHourlyWindow(segs, start + 30 * HOUR, 3)).toEqual([]);
    });

    it('步长为 0 或 NaN 时按 1 小时处理，不会算出空窗口', () => {
        const segs = buildSegs(start, 20, 1);
        const now = start + 5.5 * HOUR;
        expect(pickHourlyWindow(segs, now, 0)[0].ts).toBe(start + 5 * HOUR);
        expect(pickHourlyWindow(segs, now, Number.NaN)[0].ts).toBe(start + 5 * HOUR);
    });
});

describe('isCurrentStep', () => {
    const start = Date.UTC(2026, 5, 1, 0, 0);

    it('落在步区间内算当前步', () => {
        expect(isCurrentStep(start + 12 * HOUR, start + 13.75 * HOUR, 3)).toBe(true);
        expect(isCurrentStep(start + 12 * HOUR, start + 12 * HOUR, 3)).toBe(true);
        expect(isCurrentStep(start + 12 * HOUR, start + 14.99 * HOUR, 3)).toBe(true);
    });

    it('超出步区间不算当前步', () => {
        expect(isCurrentStep(start + 15 * HOUR, start + 13.75 * HOUR, 3)).toBe(false);
        expect(isCurrentStep(start + 9 * HOUR, start + 13.75 * HOUR, 3)).toBe(false);
    });

    it('步长异常时按 1 小时处理', () => {
        expect(isCurrentStep(start, start + 0.4 * HOUR, 0)).toBe(true);
        expect(isCurrentStep(start, start + 1 * HOUR, Number.NaN)).toBe(false);
    });
});
