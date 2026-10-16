/**
 * 钓鱼指数计算逻辑（纯函数，便于测试）。
 *
 * 指数范围 0-100，由以下六个因子加权而成：
 *  - 气压趋势稳定性  25 分：气压骤变对鱼情不利，稳定缓慢变化最佳
 *  - 天气状况        20 分：晴朗/多云最佳，降水次之，雷暴/暴雪最差
 *  - 风力            15 分：微风（1.5-6 m/s）最佳
 *  - 温度            15 分：10-25°C 为多数鱼类的舒适区间
 *  - 时段            15 分：日出前后与日落前后为黄金时段
 *  - 月相            10 分：新月/满月及其前后鱼情通常更好
 *
 * 所有气象数据均来自 Windy 免费点预报客户端 API。
 */
import type {
    Celestial,
    DataHash2,
    MoonPhase,
    NumValue,
    SevereKind,
    SummaryDay2,
    WavesDataHash2,
    WeatherConditionIcon,
} from './types';
import { MoonPhase as MoonPhaseEnum, WeatherConditionIcon as IconEnum } from './types';

/** 单个时间步的钓鱼指数评分明细 */
export interface SegmentScore {
    /** 时间戳（毫秒） */
    ts: number;
    /** 当地时间（0-23 时） */
    hour: number;
    /** 总分 0-100（含安全扣分后的最终分） */
    total: number;
    /** 气压得分（0-25） */
    pressure: number;
    /** 天气得分（0-20） */
    weather: number;
    /** 风力得分（0-15） */
    wind: number;
    /** 温度得分（0-15） */
    temp: number;
    /** 时段得分（0-15） */
    time: number;
    /** 月相得分（0-10） */
    moon: number;
    /** 恶劣条件安全扣分（<=0，0 表示无扣分） */
    safety: number;
    /** 该时段存在的恶劣条件 */
    severeKinds: SevereKind[];
    /** 天气图标码 */
    icon: WeatherConditionIcon;
}

/** 单日钓鱼指数汇总 */
export interface DayScore {
    /** 几号 */
    day: number;
    /** 当日零点时间戳 */
    timestamp: number;
    /** 当日最佳时段评分 */
    best: SegmentScore;
    /** 当日平均分 */
    avg: number;
    /** 当日天气图标 */
    icon: WeatherConditionIcon;
    /** 最高温（K） */
    tempMax: number | null;
    /** 最低温（K） */
    tempMin: number | null;
    /** 可预报性 0-100 */
    predictability: number | null;
}

/** 黄金时段 */
export interface PrimeWindow {
    /** morning | evening，用于模板中按语言取标签 */
    kind: 'morning' | 'evening';
    emoji: string;
    /** 窗口所在本地日期（如 "8/20"） */
    date: string;
    start: number;
    end: number;
}

/** 指数等级（0 极佳 … 4 很差） */
export interface ScoreLevel {
    level: 0 | 1 | 2 | 3 | 4;
    color: string;
}

const HOUR = 3600 * 1000;

/**
 * 指数等级划分（语言无关，只返回等级与颜色）。
 * 等级文字请通过 i18n 的 levelLabel(level, lang) 获取。
 */
export const scoreLevel = (score: number): ScoreLevel => {
    if (score >= 80) return { level: 0, color: '#2ecc71' };
    if (score >= 60) return { level: 1, color: '#8bc34a' };
    if (score >= 40) return { level: 2, color: '#f1c40f' };
    if (score >= 25) return { level: 3, color: '#e67e22' };
    return { level: 4, color: '#e74c3c' };
};

/** 气压趋势得分（0-25）：比较相邻两个时间步的气压差（Pa） */
const scorePressure = (pressure: NumValue, prevPressure: NumValue): number => {
    if (pressure === null || pressure === undefined || Number.isNaN(pressure)) return 10;
    if (prevPressure === null || prevPressure === undefined || Number.isNaN(prevPressure)) {
        // 无历史数据，仅看绝对值
        const abs = pressure / 100; // hPa
        if (abs >= 1008 && abs <= 1022) return 20;
        if (abs >= 1000 && abs <= 1030) return 15;
        return 10;
    }
    const diff = Math.abs(pressure - prevPressure); // Pa
    const abs = pressure / 100; // hPa

    let trend = 0;
    if (diff <= 100) trend = 18; // 气压非常稳定
    else if (diff <= 200) trend = 15;
    else if (diff <= 350) trend = 11;
    else if (diff <= 550) trend = 6;
    else trend = 2; // 气压骤变

    // 绝对值：中高气压（稳定高压区）额外加分
    let absScore = 0;
    if (abs >= 1008 && abs <= 1022) absScore = 7;
    else if (abs >= 1000 && abs <= 1030) absScore = 4;

    return Math.min(25, trend + absScore);
};

/** 天气状况得分（0-20） */
const scoreWeather = (icon: WeatherConditionIcon, precip: NumValue): number => {
    let base = 10;
    switch (icon) {
        case IconEnum.Clear:
        case IconEnum.MostlyClear:
        case IconEnum.PartlyCloudy:
            base = 20;
            break;
        case IconEnum.Overcast:
            base = 16;
            break;
        case IconEnum.Fog:
        case IconEnum.ClearFog:
            base = 10;
            break;
        case IconEnum.MostlyClearShowers:
        case IconEnum.PartlyCloudyShowers:
        case IconEnum.OvercastShowers:
            base = 13;
            break;
        case IconEnum.MostlyClearRain:
        case IconEnum.PartlyCloudyRain:
        case IconEnum.OvercastRain:
            base = 8;
            break;
        case IconEnum.MostlyClearSnow:
        case IconEnum.PartlyCloudySnow:
        case IconEnum.OvercastSnow:
            base = 4;
            break;
        case IconEnum.MostlyClearRainWithSnow:
        case IconEnum.PartlyCloudyRainWithSnow:
        case IconEnum.OvercastRainWithSnow:
            base = 5;
            break;
        case IconEnum.OvercastThunderstormRain:
        case IconEnum.OvercastThunderstormSnow:
        case IconEnum.OvercastThunderstormRainWithSnow:
        case IconEnum.PartlyCloudyThunderstormRain:
        case IconEnum.ThunderstormOvercast:
        case IconEnum.ThunderstormPartlyCloudy:
            base = 2; // 雷暴天气，谨防雷击，钓鱼风险高
            break;
        default:
            base = 10;
    }
    // 降水量过大再扣分
    if (precip !== null && precip !== undefined && !Number.isNaN(precip)) {
        if (precip > 10) base = Math.min(base, 4);
        else if (precip > 4) base = Math.min(base, 8);
        else if (precip > 1) base = Math.min(base, 13);
    }
    return Math.max(0, Math.min(20, base));
};

/** 风力得分（0-15）：风速单位为 m/s */
const scoreWind = (wind: NumValue): number => {
    if (wind === null || wind === undefined || Number.isNaN(wind)) return 7;
    const w = Math.abs(wind);
    if (w >= 1.5 && w <= 6) return 15; // 微风拂面，最适宜
    if (w < 1.5 && w > 0.5) return 12;
    if (w <= 0.5) return 9; // 水面太静，鱼口偏差
    if (w > 6 && w <= 9) return 10;
    if (w > 9 && w <= 12) return 5;
    if (w > 12 && w <= 16) return 3;
    return 1; // 大风，抛竿困难且危险
};

/** 温度得分（0-15）：温度为开尔文 */
const scoreTemp = (tempK: NumValue): number => {
    if (tempK === null || tempK === undefined || Number.isNaN(tempK)) return 7;
    const c = tempK - 273.15;
    if (c >= 10 && c <= 25) return 15;
    if (c >= 5 && c < 10) return 11;
    if (c > 25 && c <= 30) return 11;
    if (c >= 0 && c < 5) return 6;
    if (c > 30 && c <= 35) return 6;
    return 2; // 冰点以下或酷热
};

/** 时段得分（0-15）：日出前 2h 至日出后 1.5h、日落前 3h 至日落后 1h 为黄金时段 */
const scoreTimeOfDay = (
    ts: number,
    isDay: number,
    celestial: Celestial | undefined,
): number => {
    if (!celestial) return 8;
    const sunrise = celestial.sunriseTs;
    const sunset = celestial.sunsetTs;
    const morningStart = sunrise - 2 * HOUR;
    const morningEnd = sunrise + 1.5 * HOUR;
    const eveningStart = sunset - 3 * HOUR;
    const eveningEnd = sunset + 1 * HOUR;

    if (ts >= morningStart && ts <= morningEnd) return 15;
    if (ts >= eveningStart && ts <= eveningEnd) return 15;
    // 紧邻黄金时段的过渡期
    if (ts >= morningStart - 1 * HOUR && ts <= morningEnd + 1 * HOUR) return 12;
    if (ts >= eveningStart - 1 * HOUR && ts <= eveningEnd + 1 * HOUR) return 12;
    if (isDay > 0.5) return 9; // 白天其余时间
    return 6; // 深夜
};

/** 月相得分（0-10）：新月/满月前后鱼情较好 */
const scoreMoon = (phase: MoonPhase): number => {
    switch (phase) {
        case MoonPhaseEnum.NewMoon:
        case MoonPhaseEnum.FullMoon:
            return 10;
        case MoonPhaseEnum.WaxingCrescent:
        case MoonPhaseEnum.WaningCrescent:
            return 8; // 接近新月
        case MoonPhaseEnum.WaxingGibbous:
        case MoonPhaseEnum.WaningGibbous:
            return 6; // 接近满月
        case MoonPhaseEnum.FirstQuarter:
        case MoonPhaseEnum.LastQuarter:
            return 5;
        default:
            return 5;
    }
};

/** 恶劣天气图标集合 */
const THUNDER_ICONS: number[] = [14, 15, 16, 21, 23, 24];
const SNOW_ICONS: number[] = [8, 9, 10, 11, 12, 13];
const FOG_ICONS: number[] = [17, 22];

/** 各恶劣条件对应的安全扣分（负分） */
const SAFETY_PENALTY: Record<SevereKind, number> = {
    thunder: -30,
    wind: -20,
    waves: -20,
    rain: -15,
    snow: -15,
    temp: -10,
    fog: -5,
};

/** 判断单个时间步是否存在恶劣条件 */
export const severeKindsAt = (
    data: DataHash2,
    index: number,
    waves: WavesDataHash2 | null | undefined,
    wavesIndex: number | null,
): SevereKind[] => {
    const kinds: SevereKind[] = [];
    const icon = data.icon[index];
    const precip = data.precipAmount[index];
    const snow = data.precipSnowAmount[index];
    const wind = data.wind[index];
    const temp = data.temperature[index];

    if (THUNDER_ICONS.includes(icon)) kinds.push('thunder');
    if (precip !== null && precip !== undefined && !Number.isNaN(precip) && precip >= 8) {
        kinds.push('rain');
    }
    if (snow !== null && snow !== undefined && !Number.isNaN(snow) && snow >= 5) {
        kinds.push('snow');
    }
    if (SNOW_ICONS.includes(icon)) kinds.push('snow');
    if (wind !== null && wind !== undefined && !Number.isNaN(wind) && wind >= 10.8) {
        kinds.push('wind');
    }
    if (temp !== null && temp !== undefined && !Number.isNaN(temp)) {
        const c = temp - 273.15;
        if (c <= -15 || c >= 38) kinds.push('temp');
    }
    if (FOG_ICONS.includes(icon)) kinds.push('fog');
    if (waves && wavesIndex !== null) {
        const w = waves.waves[wavesIndex];
        if (w !== null && w !== undefined && !Number.isNaN(w) && w >= 2.5) {
            kinds.push('waves');
        }
    }
    return kinds;
};

/** 计算某恶劣条件预计结束的时间戳（持续到预报期末则为 null） */
export const severeEndTs = (
    segments: SegmentScore[],
    kind: SevereKind,
    startIdx: number,
): number | null => {
    for (let i = startIdx + 1; i < segments.length; i++) {
        if (!segments[i].severeKinds.includes(kind)) {
            return segments[i].ts;
        }
    }
    return null;
};

/** 在时间戳数组中查找最接近给定时刻的下标 */
export const closestIndex = (tsArr: number[], ts: number): number => {
    let best = 0;
    let bestDiff = Infinity;
    tsArr.forEach((t, i) => {
        const d = Math.abs(t - ts);
        if (d < bestDiff) {
            bestDiff = d;
            best = i;
        }
    });
    return best;
};

/** 计算整个时间序列中每个时间步的钓鱼指数（含恶劣条件安全扣分） */
export const computeSegments = (
    data: DataHash2,
    celestial: Celestial | undefined,
    waves?: WavesDataHash2 | null,
): SegmentScore[] => {
    const n = data.ts.length;
    const result: SegmentScore[] = [];
    for (let i = 0; i < n; i++) {
        const prevPressure = i > 0 ? data.pressure[i - 1] : null;
        const pressure = scorePressure(data.pressure[i], prevPressure);
        const weather = scoreWeather(data.icon[i], data.precipAmount[i]);
        const wind = scoreWind(data.wind[i]);
        const temp = scoreTemp(data.temperature[i]);
        const time = scoreTimeOfDay(data.ts[i], data.isDay[i], celestial);
        const moon = scoreMoon(data.moonPhase[i]);
        const base = pressure + weather + wind + temp + time + moon;

        // 恶劣条件识别与安全扣分
        const wIdx = waves ? closestIndex(waves.ts, data.ts[i]) : null;
        const severeKinds = severeKindsAt(data, i, waves, wIdx);
        const penalty = Math.max(
            -50,
            severeKinds.reduce((sum, k) => sum + SAFETY_PENALTY[k], 0),
        );

        result.push({
            ts: data.ts[i],
            hour: data.hour[i],
            total: Math.max(0, Math.round(base + penalty)),
            pressure,
            weather,
            wind,
            temp,
            time,
            moon,
            safety: penalty,
            severeKinds,
            icon: data.icon[i],
        });
    }
    return result;
};

/** 将时间序列聚合为每日钓鱼指数 */
export const computeDaily = (
    data: DataHash2,
    segments: SegmentScore[],
    summary: SummaryDay2[] | undefined,
    celestial: Celestial | undefined,
): DayScore[] => {
    const offset = celestial?.TZoffset ?? 0;
    const localDay = (ts: number) => {
        const d = new Date(ts + offset * HOUR);
        return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    };

    // 优先使用 summary（含当日天气与温度），否则按当地时间分组
    const days: DayScore[] = [];

    if (summary && summary.length > 0) {
        for (const s of summary) {
            const daySegs = segments.slice(s.index, s.index + s.segments);
            if (daySegs.length === 0) continue;
            const best = daySegs.reduce((a, b) => (b.total > a.total ? b : a), daySegs[0]);
            const avg = Math.round(
                daySegs.reduce((sum, seg) => sum + seg.total, 0) / daySegs.length,
            );
            days.push({
                day: s.day,
                timestamp: s.timestamp,
                best,
                avg,
                icon: s.icon,
                tempMax: s.tempMax,
                tempMin: s.tempMin,
                predictability: s.predictability ?? null,
            });
        }
    } else {
        const groups = new Map<number, SegmentScore[]>();
        segments.forEach(seg => {
            const key = localDay(seg.ts);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(seg);
        });
        const sortedKeys = [...groups.keys()].sort((a, b) => a - b);
        for (const key of sortedKeys) {
            const daySegs = groups.get(key)!;
            const best = daySegs.reduce((a, b) => (b.total > a.total ? b : a), daySegs[0]);
            const avg = Math.round(
                daySegs.reduce((sum, seg) => sum + seg.total, 0) / daySegs.length,
            );
            // 找到当日对应数据索引，取最高/最低温
            let tempMax: number | null = null;
            let tempMin: number | null = null;
            for (const seg of daySegs) {
                const i = data.ts.indexOf(seg.ts);
                if (i === -1) continue;
                const t = data.temperature[i];
                if (t !== null && t !== undefined && !Number.isNaN(t)) {
                    if (tempMax === null || t > tempMax) tempMax = t;
                    if (tempMin === null || t < tempMin) tempMin = t;
                }
            }
            days.push({
                day: new Date(best.ts + offset * HOUR).getUTCDate(),
                timestamp: best.ts,
                best,
                avg,
                icon: best.icon,
                tempMax,
                tempMin,
                predictability: null,
            });
        }
    }

    return days;
};

/** 黄金时段（当前日日出/日落前后），date 为该窗口所在日期 */
export const primeWindows = (celestial: Celestial | undefined): PrimeWindow[] => {
    if (!celestial) return [];
    const offset = celestial.TZoffset ?? 0;
    const sunrise = celestial.sunriseTs;
    const sunset = celestial.sunsetTs;
    return [
        {
            kind: 'morning',
            emoji: '🌅',
            date: formatLocalDate(sunrise, offset),
            start: sunrise - 2 * HOUR,
            end: sunrise + 1.5 * HOUR,
        },
        {
            kind: 'evening',
            emoji: '🌇',
            date: formatLocalDate(sunset, offset),
            start: sunset - 3 * HOUR,
            end: sunset + 1 * HOUR,
        },
    ];
};

/** 由气温与露点计算相对湿度（%） */
export const relativeHumidity = (tempK: NumValue, dewK: NumValue): number | null => {
    if (tempK === null || dewK === null || Number.isNaN(tempK) || Number.isNaN(dewK)) return null;
    const T = tempK - 273.15;
    const Td = dewK - 273.15;
    const e = Math.exp((17.625 * Td) / (243.04 + Td));
    const es = Math.exp((17.625 * T) / (243.04 + T));
    const rh = 100 * (e / es);
    return Math.max(0, Math.min(100, rh));
};

/** 将时间戳格式化为当地时间 "HH:MM" */
export const formatLocalTime = (ts: number, offsetHours: number): string => {
    const d = new Date(ts + offsetHours * HOUR);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
};

/** 将时间戳格式化为当地时间 "M/D HH:MM"（如 8/20 20:00） */
export const formatLocalDateTime = (ts: number, offsetHours: number): string => {
    const d = new Date(ts + offsetHours * HOUR);
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${month}/${day} ${hh}:${mm}`;
};

/** 将时间戳格式化为当地时间 "M/D"（如 8/20） */
export const formatLocalDate = (ts: number, offsetHours: number): string => {
    const d = new Date(ts + offsetHours * HOUR);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

/** 找到最接近给定时间戳的评分 */
export const closestSegment = (
    segments: SegmentScore[],
    ts: number,
): SegmentScore | null => {
    if (segments.length === 0) return null;
    return segments.reduce((a, b) =>
        Math.abs(b.ts - ts) < Math.abs(a.ts - ts) ? b : a,
    );
};
