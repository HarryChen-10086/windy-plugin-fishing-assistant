/**
 * 测试用的点预报数据构造器：不联网，按需生成任意时长的时间序列。
 */
import { MoonPhase, WeatherConditionIcon } from '../src/types';

import type {
    Celestial,
    DataHash2,
    NumValue,
    SummaryDay2,
    WavesDataHash2,
} from '../src/types';

export const HOUR = 3600 * 1000;
export const DAY = 24 * HOUR;

/** 本地午夜时间戳（用固定 UTC 偏移换算） */
export const localMidnight = (ts: number, tzOffset: number): number =>
    Math.floor((ts + tzOffset * HOUR) / DAY) * DAY - tzOffset * HOUR;

const hhmm = (hour: number): string =>
    `${String(Math.floor(hour)).padStart(2, '0')}:${String(
        Math.round((hour - Math.floor(hour)) * 60),
    ).padStart(2, '0')}`;

export interface CelestialOptions {
    tzOffset?: number;
    sunriseHour?: number;
    sunsetHour?: number;
}

/** 构造 celestial：日出/日落只代表 refTs 所在的那一天（与真实接口一致） */
export const buildCelestial = (refTs: number, options: CelestialOptions = {}): Celestial => {
    const { tzOffset = 0, sunriseHour = 6, sunsetHour = 18 } = options;
    const midnight = localMidnight(refTs, tzOffset);
    const sunriseTs = midnight + sunriseHour * HOUR;
    const sunsetTs = midnight + sunsetHour * HOUR;

    return {
        TZoffset: tzOffset,
        TZname: 'UTC',
        atSea: 0,
        isDay: true,
        sunrise: hhmm(sunriseHour),
        sunriseTs,
        sunset: hhmm(sunsetHour),
        sunsetTs,
        dusk: hhmm(sunsetHour + 1),
        duskTs: sunsetTs + HOUR,
        night: hhmm(sunsetHour + 2),
        nowObserved: hhmm(sunriseHour),
    };
};

const series = <T>(steps: number, fn: (i: number) => T): T[] =>
    Array.from({ length: steps }, (_, i) => fn(i));

export interface BuildDataOptions {
    startTs?: number;
    steps?: number;
    stepHours?: number;
    icon?: (i: number) => WeatherConditionIcon;
    moonPhase?: (i: number) => MoonPhase;
    temperature?: (i: number) => NumValue;
    wind?: (i: number) => NumValue;
    pressure?: (i: number) => NumValue;
    precipAmount?: (i: number) => NumValue;
    precipSnowAmount?: (i: number) => NumValue;
    isDay?: (i: number) => number;
}

/** 构造 DataHash2：默认是 20°C、3 m/s、1013 hPa 的晴天 */
export const buildData = (options: BuildDataOptions = {}): DataHash2 => {
    const {
        startTs = Date.UTC(2026, 5, 1, 0, 0),
        steps = 16,
        stepHours = 3,
        icon = () => WeatherConditionIcon.Clear,
        moonPhase = () => MoonPhase.NewMoon,
        temperature = () => 293.15,
        wind = () => 3,
        pressure = () => 101325,
        precipAmount = () => 0,
        precipSnowAmount = () => 0,
        isDay = () => 1,
    } = options;

    const ts = series(steps, i => startTs + i * stepHours * HOUR);

    return {
        ts,
        hour: ts.map(t => new Date(t).getUTCHours()),
        isDay: series(steps, isDay),
        icon: series(steps, icon),
        moonPhase: series(steps, moonPhase),
        precipAmount: series(steps, precipAmount),
        precipSnowAmount: series(steps, precipSnowAmount),
        precipConvectiveAmount: series(steps, () => 0),
        precipType: series(steps, () => 0),
        temperature: series(steps, temperature),
        feelTemperature: series(steps, temperature),
        wind: series(steps, wind),
        windGust: series(steps, wind),
        windDir: series(steps, () => 270),
        pressure: series(steps, pressure),
    };
};

export interface BuildWavesOptions extends BuildDataOptions {
    waveHeight?: number;
}

/** 构造 WavesDataHash2（海浪点预报） */
export const buildWaves = (options: BuildWavesOptions = {}): WavesDataHash2 => {
    const { waveHeight = 1.2, ...rest } = options;
    const base = buildData(rest);
    const steps = base.ts.length;

    return {
        ...base,
        waves: series(steps, () => waveHeight),
        wavesDir: series(steps, () => 200),
        wavesPeriod: series(steps, () => 8),
        wavesPower: series(steps, () => 5),
        swell1: series(steps, () => waveHeight * 0.8),
        swell1Dir: series(steps, () => 200),
        swell1Period: series(steps, () => 7),
        swell2: series(steps, () => 0.2),
        swell2Dir: series(steps, () => 190),
        swell2Period: series(steps, () => 5),
    };
};

export interface BuildSummaryOptions {
    startTs?: number;
    days?: number;
    segmentsPerDay?: number;
    tempMax?: number;
    tempMin?: number;
}

/** 构造 summary（每日摘要），index/segments 指向 data 数组下标 */
export const buildSummary = (options: BuildSummaryOptions = {}): SummaryDay2[] => {
    const {
        startTs = Date.UTC(2026, 5, 1, 0, 0),
        days = 2,
        segmentsPerDay = 8,
        tempMax = 300,
        tempMin = 285,
    } = options;

    return series(days, i => ({
        day: new Date(startTs + i * DAY).getUTCDate(),
        timestamp: startTs + i * DAY,
        weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i % 7],
        icon: WeatherConditionIcon.Clear,
        index: i * segmentsPerDay,
        segments: segmentsPerDay,
        tempMax,
        tempMin,
        predictability: 90,
    }));
};
