/**
 * 时段得分与时间格式化的测试。
 *
 * 重点是"跨日黄金时段"回归：Windy 的 celestial 只给出参考日的日出/日落，
 * 旧实现直接用 ts 与参考日时刻比较，导致第 2 天以后整天都拿不到黄金时段分。
 */
import { describe, expect, it } from 'vitest';

import {
    formatLocalDate,
    formatLocalDateTime,
    formatLocalTime,
    primeWindows,
    scoreTimeOfDay,
} from '../src/fishingIndex';

import { buildCelestial, DAY, HOUR, localMidnight } from './fixtures';

const REF = Date.UTC(2026, 5, 1, 0, 0); // 2026-06-01 00:00Z

describe('scoreTimeOfDay（0-15）', () => {
    it('没有 celestial 时给中间分', () => {
        expect(scoreTimeOfDay(REF, 1, undefined)).toBe(8);
    });

    it('参考日的日出/日落前后为黄金时段', () => {
        const c = buildCelestial(REF, { tzOffset: 0 }); // 日出 06:00、日落 18:00
        expect(scoreTimeOfDay(c.sunriseTs, 1, c)).toBe(15);
        expect(scoreTimeOfDay(c.sunsetTs, 0, c)).toBe(15);
    });

    it('跨日仍然按各自的日出/日落给分（回归）', () => {
        const c = buildCelestial(REF, { tzOffset: 0 });

        const day3Sunrise = c.sunriseTs + 2 * DAY;
        expect(scoreTimeOfDay(day3Sunrise, 1, c)).toBe(15);
        expect(scoreTimeOfDay(day3Sunrise - 1 * HOUR, 1, c)).toBe(15); // 仍在黄金时段内
        expect(scoreTimeOfDay(day3Sunrise - 4 * HOUR, 1, c)).toBe(9); // 黄金时段外，白天

        const day5Sunset = c.sunsetTs + 4 * DAY;
        expect(scoreTimeOfDay(day5Sunset, 0, c)).toBe(15);
        expect(scoreTimeOfDay(day5Sunset - 2 * HOUR, 0, c)).toBe(15);
    });

    it('黄金时段边界与过渡期', () => {
        const c = buildCelestial(REF, { tzOffset: 0 });
        const morningStart = c.sunriseTs - 2 * HOUR;
        const morningEnd = c.sunriseTs + 1.5 * HOUR;
        const eveningStart = c.sunsetTs - 3 * HOUR;
        const eveningEnd = c.sunsetTs + 1 * HOUR;

        expect(scoreTimeOfDay(morningStart, 1, c)).toBe(15);
        expect(scoreTimeOfDay(morningStart - 1, 1, c)).toBe(12);
        expect(scoreTimeOfDay(morningEnd, 1, c)).toBe(15);
        expect(scoreTimeOfDay(morningEnd + 1, 1, c)).toBe(12);
        expect(scoreTimeOfDay(morningEnd + 1 * HOUR + 1, 1, c)).toBe(9);

        expect(scoreTimeOfDay(eveningStart, 0, c)).toBe(15);
        expect(scoreTimeOfDay(eveningStart - 1, 0, c)).toBe(12);
        expect(scoreTimeOfDay(eveningEnd, 0, c)).toBe(15);
        expect(scoreTimeOfDay(eveningEnd + 1, 0, c)).toBe(12);
        expect(scoreTimeOfDay(eveningEnd + 2 * HOUR, 0, c)).toBe(6); // 深夜
        expect(scoreTimeOfDay(eveningEnd + 2 * HOUR, 1, c)).toBe(9); // 白天其余时间
    });

    it('带时区偏移时同样按本地日平移', () => {
        const tz = 8;
        const c = buildCelestial(REF, { tzOffset: tz });
        const midnight = localMidnight(REF, tz);
        expect(c.sunriseTs).toBe(midnight + 6 * HOUR);

        expect(scoreTimeOfDay(midnight + 3 * DAY + 6 * HOUR, 1, c)).toBe(15);
        expect(scoreTimeOfDay(midnight + 3 * DAY + 18 * HOUR, 0, c)).toBe(15);
        expect(scoreTimeOfDay(midnight + 3 * DAY + 12 * HOUR, 1, c)).toBe(9);
    });
});

describe('时间格式化（按 UTC 偏移换算本地时间）', () => {
    const ts = Date.UTC(2026, 5, 1, 20, 30); // UTC 6/1 20:30

    it('formatLocalTime', () => {
        expect(formatLocalTime(ts, 8)).toBe('04:30');
        expect(formatLocalTime(ts, -5)).toBe('15:30');
        expect(formatLocalTime(ts, 0)).toBe('20:30');
    });

    it('formatLocalDateTime', () => {
        expect(formatLocalDateTime(ts, 8)).toBe('6/2 04:30');
        expect(formatLocalDateTime(ts, -5)).toBe('6/1 15:30');
    });

    it('formatLocalDate', () => {
        expect(formatLocalDate(ts, 8)).toBe('6/2');
        expect(formatLocalDate(ts, -5)).toBe('6/1');
    });
});

describe('primeWindows', () => {
    it('返回早晚两个窗口，日期取窗口所在本地日期', () => {
        const c = buildCelestial(REF, { tzOffset: 8 });
        const windows = primeWindows(c);

        expect(windows).toHaveLength(2);
        expect(windows[0]).toEqual({
            kind: 'morning',
            emoji: '🌅',
            date: formatLocalDate(c.sunriseTs, 8),
            start: c.sunriseTs - 2 * HOUR,
            end: c.sunriseTs + 1.5 * HOUR,
        });
        expect(windows[1]).toEqual({
            kind: 'evening',
            emoji: '🌇',
            date: formatLocalDate(c.sunsetTs, 8),
            start: c.sunsetTs - 3 * HOUR,
            end: c.sunsetTs + 1 * HOUR,
        });
    });

    it('没有 celestial 时返回空数组', () => {
        expect(primeWindows(undefined)).toEqual([]);
    });
});
