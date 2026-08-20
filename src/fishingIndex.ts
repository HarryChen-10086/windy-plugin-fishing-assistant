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
    SummaryDay2,
    WeatherConditionIcon,
} from './types';
import { MoonPhase as MoonPhaseEnum, WeatherConditionIcon as IconEnum } from './types';

/** 单个时间步的钓鱼指数评分明细 */
export interface SegmentScore {
    /** 时间戳（毫秒） */
    ts: number;
    /** 当地时间（0-23 时） */
    hour: number;
    /** 总分 0-100 */
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
    label: string;
    emoji: string;
    start: number;
    end: number;
}

/** 指数等级 */
export interface ScoreLevel {
    label: string;
    color: string;
}

const HOUR = 3600 * 1000;

/** 指数等级划分 */
export const scoreLevel = (score: number): ScoreLevel => {
    if (score >= 80) return { label: '极佳', color: '#2ecc71' };
    if (score >= 60) return { label: '良好', color: '#8bc34a' };
    if (score >= 40) return { label: '一般', color: '#f1c40f' };
    if (score >= 25) return { label: '较差', color: '#e67e22' };
    return { label: '很差', color: '#e74c3c' };
};

/** 月相中文名 */
export const moonPhaseText = (phase: MoonPhase): string => {
    switch (phase) {
        case MoonPhaseEnum.NewMoon:
            return '新月';
        case MoonPhaseEnum.WaxingCrescent:
            return '娥眉月';
        case MoonPhaseEnum.FirstQuarter:
            return '上弦月';
        case MoonPhaseEnum.WaxingGibbous:
            return '盈凸月';
        case MoonPhaseEnum.FullMoon:
            return '满月';
        case MoonPhaseEnum.WaningGibbous:
            return '亏凸月';
        case MoonPhaseEnum.LastQuarter:
            return '下弦月';
        case MoonPhaseEnum.WaningCrescent:
            return '残月';
        default:
            return '未知';
    }
};

/** 天气图标 -> 中文描述 + emoji */
export const weatherText = (icon: WeatherConditionIcon): { text: string; emoji: string } => {
    switch (icon) {
        case IconEnum.Clear:
            return { text: '晴', emoji: '☀️' };
        case IconEnum.MostlyClear:
            return { text: '大部晴朗', emoji: '🌤️' };
        case IconEnum.PartlyCloudy:
            return { text: '多云', emoji: '⛅' };
        case IconEnum.Overcast:
            return { text: '阴', emoji: '☁️' };
        case IconEnum.MostlyClearRain:
            return { text: '晴转雨', emoji: '🌦️' };
        case IconEnum.PartlyCloudyRain:
            return { text: '多云有雨', emoji: '🌧️' };
        case IconEnum.OvercastRain:
            return { text: '阴雨', emoji: '🌧️' };
        case IconEnum.MostlyClearSnow:
        case IconEnum.PartlyCloudySnow:
        case IconEnum.OvercastSnow:
            return { text: '雪', emoji: '🌨️' };
        case IconEnum.MostlyClearRainWithSnow:
        case IconEnum.PartlyCloudyRainWithSnow:
        case IconEnum.OvercastRainWithSnow:
            return { text: '雨夹雪', emoji: '🌨️' };
        case IconEnum.OvercastThunderstormRain:
        case IconEnum.OvercastThunderstormSnow:
        case IconEnum.OvercastThunderstormRainWithSnow:
            return { text: '雷暴', emoji: '⛈️' };
        case IconEnum.PartlyCloudyThunderstormRain:
            return { text: '雷阵雨', emoji: '⛈️' };
        case IconEnum.ThunderstormOvercast:
        case IconEnum.ThunderstormPartlyCloudy:
            return { text: '雷暴', emoji: '⛈️' };
        case IconEnum.Fog:
        case IconEnum.ClearFog:
            return { text: '雾', emoji: '🌫️' };
        case IconEnum.MostlyClearShowers:
        case IconEnum.PartlyCloudyShowers:
        case IconEnum.OvercastShowers:
            return { text: '阵雨', emoji: '🌦️' };
        default:
            return { text: '未知', emoji: '❓' };
    }
};

/** 风向（度）-> 中文方位 */
export const dir2compass = (deg: number | null | undefined): string => {
    if (deg === null || deg === undefined || Number.isNaN(deg)) return '--';
    const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
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

/** 计算整个时间序列中每个时间步的钓鱼指数 */
export const computeSegments = (
    data: DataHash2,
    celestial: Celestial | undefined,
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

        result.push({
            ts: data.ts[i],
            hour: data.hour[i],
            total: Math.round(pressure + weather + wind + temp + time + moon),
            pressure,
            weather,
            wind,
            temp,
            time,
            moon,
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

/** 黄金时段（日出/日落前后） */
export const primeWindows = (celestial: Celestial | undefined): PrimeWindow[] => {
    if (!celestial) return [];
    const sunrise = celestial.sunriseTs;
    const sunset = celestial.sunsetTs;
    return [
        { label: '清晨黄金时段', emoji: '🌅', start: sunrise - 2 * HOUR, end: sunrise + 1.5 * HOUR },
        { label: '傍晚黄金时段', emoji: '🌇', start: sunset - 3 * HOUR, end: sunset + 1 * HOUR },
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

/** 中文星期 */
export const weekdayCN = (ts: number, offsetHours: number): string => {
    const d = new Date(ts + offsetHours * HOUR);
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getUTCDay()];
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
