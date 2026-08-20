/**
 * 轻量级中英文（en / zh）国际化模块。
 *
 * - `translate(key, vars, lang)`：纯函数，用于模板/脚本中带语言参数的翻译
 * - `detectLang()`：检测用户语言（Windy 设置优先，其次浏览器语言；简体中文 → 'zh'）
 * - `weatherText / moonPhaseText / dir2compass / weekdayName / levelLabel`：
 *   展示类辅助函数，均接受可选 `lang` 参数（默认取当前语言）
 */
import store from '@windy/store';

import type { Lang, MoonPhase, SevereKind, WeatherConditionIcon } from './types';
import { MoonPhase as MoonPhaseEnum, WeatherConditionIcon as IconEnum } from './types';

export type { Lang };

/** 英文翻译表（默认语言） */
const en = {
    // 工具栏
    model: 'Model',
    locateMe: '📍 Locate me',
    clickHint: 'Click anywhere on the map to change the fishing spot 🗺️',
    switchLang: '中文',
    // 状态
    loading: '⏳ Loading Windy weather data…',
    // 当前钓鱼指数
    currentIndex: 'Current Fishing Index',
    todayBest: "Today's best: {time} ({weekday})",
    scorePressure: 'Pressure',
    scoreWeather: 'Weather',
    scoreWind: 'Wind',
    scoreTemp: 'Temperature',
    scoreTime: 'Time of day',
    scoreMoon: 'Moon',
    scoreSafety: 'Safety',
    // 恶劣天气警示
    severeTitle: 'Adverse Conditions',
    severeEndAt: 'Estimated end: {time}',
    severePersist: 'May persist for the forecast period',
    // 当前气象条件
    currentConditions: 'Current Conditions',
    lblTemp: 'Temp',
    lblFeels: 'Feels like',
    lblWind: 'Wind',
    lblDir: 'Direction',
    lblGust: 'Gust',
    lblPressure: 'Pressure',
    lblTrend: 'Trend',
    lblHumidity: 'Humidity',
    lblClouds: 'Clouds',
    lblPrecip: 'Precip',
    lblMoon: 'Moon',
    lblElevation: 'Elevation',
    // 日出日落与黄金时段
    sunTitle: 'Sunrise / Sunset & Prime Time',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    primeMorning: 'Morning prime time',
    primeEvening: 'Evening prime time',
    primeEst: 'Est. index {score} ({level})',
    // 未来几天
    nextDays: 'Next Days Fishing Index',
    today: 'Today',
    dayLabel: '{day}',
    dayBest: 'Best {time} · Avg {avg}',
    predictability: 'Predictability {p}%',
    // 海浪与海况
    wavesTitle: 'Waves & Sea State',
    lblWaveHeight: 'Wave height',
    lblPeriod: 'Period',
    lblWaveDir: 'Direction',
    lblSwell1: 'Swell 1',
    lblSeaTemp: 'Sea temp',
    lblWavePower: 'Wave power',
    // 天气预警
    alertsTitle: 'Weather Alerts',
    modelLabel: 'Model:',
    // 地图图层
    layersTitle: 'Quick Map Layers',
    layerWind: 'Wind',
    layerGust: 'Gust',
    layerRain: 'Rain',
    layerTemp: 'Temp',
    layerWaves: 'Waves',
    layerSST: 'SST',
    // 其它
    windSuffix: '',
    footer:
        'Data source: Windy free point forecast API ({model}, updated {time}). The index is for reference only — always check local conditions. 🎣',
    pluginName: 'Fishing Assistant',
} as const;

/** 中文翻译表 */
const zh: Record<keyof typeof en, string> = {
    model: '模型',
    locateMe: '📍 定位到我',
    clickHint: '点击地图任意位置可更换钓点 🗺️',
    switchLang: 'English',
    loading: '⏳ 正在获取 Windy 气象数据…',
    currentIndex: '当前钓鱼指数',
    todayBest: '今日最佳：{time}（{weekday}）',
    scorePressure: '气压趋势',
    scoreWeather: '天气状况',
    scoreWind: '风力',
    scoreTemp: '温度',
    scoreTime: '时段',
    scoreMoon: '月相',
    scoreSafety: '安全',
    // 恶劣天气警示
    severeTitle: '恶劣天气提示',
    severeEndAt: '预计结束：{time}',
    severePersist: '预计将持续至预报期末',
    currentConditions: '当前气象条件',
    lblTemp: '气温',
    lblFeels: '体感',
    lblWind: '风力',
    lblDir: '风向',
    lblGust: '阵风',
    lblPressure: '气压',
    lblTrend: '趋势',
    lblHumidity: '湿度',
    lblClouds: '云量',
    lblPrecip: '降水',
    lblMoon: '月相',
    lblElevation: '海拔',
    sunTitle: '日出日落与黄金时段',
    sunrise: '日出',
    sunset: '日落',
    primeMorning: '清晨黄金时段',
    primeEvening: '傍晚黄金时段',
    primeEst: '预计指数 {score}（{level}）',
    nextDays: '未来几天钓鱼指数',
    today: '今天',
    dayLabel: '{day}日',
    dayBest: '最佳时段 {time} · 均分 {avg}',
    predictability: '可预报性 {p}%',
    wavesTitle: '海浪与海况',
    lblWaveHeight: '浪高',
    lblPeriod: '周期',
    lblWaveDir: '浪向',
    lblSwell1: '涌浪1',
    lblSeaTemp: '海表温度',
    lblWavePower: '波功率',
    alertsTitle: '天气预警',
    modelLabel: '模型：',
    layersTitle: '地图图层快捷切换',
    layerWind: '风',
    layerGust: '阵风',
    layerRain: '雨',
    layerTemp: '温度',
    layerWaves: '浪',
    layerSST: '海温',
    windSuffix: '风',
    footer: '数据来源：Windy 免费点预报接口（{model}，更新时间 {time}）。指数仅供参考，请结合当地实况判断。🎣',
    pluginName: '钓鱼助手',
};

export type TranslationKey = keyof typeof en;

/** 全部翻译表 */
export const translations: Record<Lang, Record<TranslationKey, string>> = { en, zh };

/** 当前语言（模块级，供脚本辅助函数默认使用） */
let currentLang: Lang = 'en';

export const getLang = (): Lang => currentLang;

export const setLang = (l: Lang): void => {
    currentLang = l;
};

/** 纯翻译函数：按语言取词并做 {var} 插值 */
export const translate = (
    key: TranslationKey,
    vars?: Record<string, string | number>,
    lang: Lang = currentLang,
): string => {
    let s = translations[lang]?.[key] ?? translations.en[key] ?? key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            s = s.split(`{${k}}`).join(String(v));
        }
    }
    return s;
};

/**
 * 检测用户语言：Windy 的 usedLang / lang 设置优先（简体中文 'zh' → 中文），
 * 其次回退到浏览器语言（zh* → 中文），默认英语。
 */
export const detectLang = (): Lang => {
    try {
        const windyLang = store.get('usedLang') || store.get('lang');
        if (typeof windyLang === 'string') {
            const low = windyLang.toLowerCase();
            if (low === 'zh' || low === 'zh-cn' || low === 'zh-hans' || low === 'zh-cn.utf-8') {
                return 'zh';
            }
        }
    } catch {
        /* store 未就绪时忽略 */
    }
    try {
        const nav = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
        if (nav.toLowerCase().startsWith('zh')) return 'zh';
    } catch {
        /* 忽略 */
    }
    return 'en';
};

/* ---------- 展示类辅助函数（语言相关） ---------- */

const WEATHER_TEXTS: Record<Lang, Record<number, { text: string; emoji: string }>> = {
    en: {
        [IconEnum.Clear]: { text: 'Clear', emoji: '☀️' },
        [IconEnum.MostlyClear]: { text: 'Mostly clear', emoji: '🌤️' },
        [IconEnum.PartlyCloudy]: { text: 'Partly cloudy', emoji: '⛅' },
        [IconEnum.Overcast]: { text: 'Overcast', emoji: '☁️' },
        [IconEnum.MostlyClearRain]: { text: 'Clear, then rain', emoji: '🌦️' },
        [IconEnum.PartlyCloudyRain]: { text: 'Cloudy, rain', emoji: '🌧️' },
        [IconEnum.OvercastRain]: { text: 'Overcast, rain', emoji: '🌧️' },
        [IconEnum.MostlyClearSnow]: { text: 'Snow', emoji: '🌨️' },
        [IconEnum.PartlyCloudySnow]: { text: 'Snow', emoji: '🌨️' },
        [IconEnum.OvercastSnow]: { text: 'Snow', emoji: '🌨️' },
        [IconEnum.MostlyClearRainWithSnow]: { text: 'Rain & snow', emoji: '🌨️' },
        [IconEnum.PartlyCloudyRainWithSnow]: { text: 'Rain & snow', emoji: '🌨️' },
        [IconEnum.OvercastRainWithSnow]: { text: 'Rain & snow', emoji: '🌨️' },
        [IconEnum.OvercastThunderstormRain]: { text: 'Thunderstorm', emoji: '⛈️' },
        [IconEnum.OvercastThunderstormSnow]: { text: 'Thunderstorm', emoji: '⛈️' },
        [IconEnum.OvercastThunderstormRainWithSnow]: { text: 'Thunderstorm', emoji: '⛈️' },
        [IconEnum.PartlyCloudyThunderstormRain]: { text: 'Thunderstorm', emoji: '⛈️' },
        [IconEnum.ThunderstormOvercast]: { text: 'Thunderstorm', emoji: '⛈️' },
        [IconEnum.ThunderstormPartlyCloudy]: { text: 'Thunderstorm', emoji: '⛈️' },
        [IconEnum.Fog]: { text: 'Fog', emoji: '🌫️' },
        [IconEnum.ClearFog]: { text: 'Fog', emoji: '🌫️' },
        [IconEnum.MostlyClearShowers]: { text: 'Scattered showers', emoji: '🌦️' },
        [IconEnum.PartlyCloudyShowers]: { text: 'Showers', emoji: '🌦️' },
        [IconEnum.OvercastShowers]: { text: 'Showers', emoji: '🌦️' },
    },
    zh: {
        [IconEnum.Clear]: { text: '晴', emoji: '☀️' },
        [IconEnum.MostlyClear]: { text: '大部晴朗', emoji: '🌤️' },
        [IconEnum.PartlyCloudy]: { text: '多云', emoji: '⛅' },
        [IconEnum.Overcast]: { text: '阴', emoji: '☁️' },
        [IconEnum.MostlyClearRain]: { text: '晴转雨', emoji: '🌦️' },
        [IconEnum.PartlyCloudyRain]: { text: '多云有雨', emoji: '🌧️' },
        [IconEnum.OvercastRain]: { text: '阴雨', emoji: '🌧️' },
        [IconEnum.MostlyClearSnow]: { text: '雪', emoji: '🌨️' },
        [IconEnum.PartlyCloudySnow]: { text: '雪', emoji: '🌨️' },
        [IconEnum.OvercastSnow]: { text: '雪', emoji: '🌨️' },
        [IconEnum.MostlyClearRainWithSnow]: { text: '雨夹雪', emoji: '🌨️' },
        [IconEnum.PartlyCloudyRainWithSnow]: { text: '雨夹雪', emoji: '🌨️' },
        [IconEnum.OvercastRainWithSnow]: { text: '雨夹雪', emoji: '🌨️' },
        [IconEnum.OvercastThunderstormRain]: { text: '雷暴', emoji: '⛈️' },
        [IconEnum.OvercastThunderstormSnow]: { text: '雷暴', emoji: '⛈️' },
        [IconEnum.OvercastThunderstormRainWithSnow]: { text: '雷暴', emoji: '⛈️' },
        [IconEnum.PartlyCloudyThunderstormRain]: { text: '雷阵雨', emoji: '⛈️' },
        [IconEnum.ThunderstormOvercast]: { text: '雷暴', emoji: '⛈️' },
        [IconEnum.ThunderstormPartlyCloudy]: { text: '雷暴', emoji: '⛈️' },
        [IconEnum.Fog]: { text: '雾', emoji: '🌫️' },
        [IconEnum.ClearFog]: { text: '雾', emoji: '🌫️' },
        [IconEnum.MostlyClearShowers]: { text: '阵雨', emoji: '🌦️' },
        [IconEnum.PartlyCloudyShowers]: { text: '阵雨', emoji: '🌦️' },
        [IconEnum.OvercastShowers]: { text: '阵雨', emoji: '🌦️' },
    },
};

/** 天气图标 -> 描述 + emoji */
export const weatherText = (
    icon: WeatherConditionIcon,
    lang: Lang = currentLang,
): { text: string; emoji: string } =>
    WEATHER_TEXTS[lang][icon] ?? { text: '—', emoji: '❓' };

const MOON_TEXTS: Record<Lang, Record<number, string>> = {
    en: {
        [MoonPhaseEnum.NewMoon]: 'New moon',
        [MoonPhaseEnum.WaxingCrescent]: 'Waxing crescent',
        [MoonPhaseEnum.FirstQuarter]: 'First quarter',
        [MoonPhaseEnum.WaxingGibbous]: 'Waxing gibbous',
        [MoonPhaseEnum.FullMoon]: 'Full moon',
        [MoonPhaseEnum.WaningGibbous]: 'Waning gibbous',
        [MoonPhaseEnum.LastQuarter]: 'Last quarter',
        [MoonPhaseEnum.WaningCrescent]: 'Waning crescent',
    },
    zh: {
        [MoonPhaseEnum.NewMoon]: '新月',
        [MoonPhaseEnum.WaxingCrescent]: '娥眉月',
        [MoonPhaseEnum.FirstQuarter]: '上弦月',
        [MoonPhaseEnum.WaxingGibbous]: '盈凸月',
        [MoonPhaseEnum.FullMoon]: '满月',
        [MoonPhaseEnum.WaningGibbous]: '亏凸月',
        [MoonPhaseEnum.LastQuarter]: '下弦月',
        [MoonPhaseEnum.WaningCrescent]: '残月',
    },
};

/** 月相中文/英文名 */
export const moonPhaseText = (phase: MoonPhase, lang: Lang = currentLang): string =>
    MOON_TEXTS[lang][phase] ?? '—';

const COMPASS: Record<Lang, string[]> = {
    en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    zh: ['北', '东北', '东', '东南', '南', '西南', '西', '西北'],
};

/** 风向（度）-> 方位 */
export const dir2compass = (deg: number | null | undefined, lang: Lang = currentLang): string => {
    if (deg === null || deg === undefined || Number.isNaN(deg)) return '--';
    return COMPASS[lang][Math.round((((deg % 360) + 360) % 360) / 45) % 8];
};

const WEEKDAYS: Record<Lang, string[]> = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
};

/** 星期（按当地时间） */
export const weekdayName = (ts: number, offsetHours: number, lang: Lang = currentLang): string => {
    const d = new Date(ts + offsetHours * 3600 * 1000);
    return WEEKDAYS[lang][d.getUTCDay()];
};

/** 指数等级文字（0 极佳/Excellent … 4 很差/Very poor） */
export const levelLabel = (level: number, lang: Lang = currentLang): string => {
    const labels: Record<Lang, string[]> = {
        en: ['Excellent', 'Good', 'Fair', 'Poor', 'Very poor'],
        zh: ['极佳', '良好', '一般', '较差', '很差'],
    };
    return labels[lang][level] ?? '—';
};

/**
 * 预警类型 -> 可读文本。
 * Windy 的 CapAlertType 是单字母代码（T=雷暴、H=高温、W=大风…），
 * 这里同时兼容部分来源直接给出的完整英文名。
 */
export const alertTypeText = (type: string, lang: Lang = currentLang): string => {
    const codeMap: Record<string, { en: string; zh: string }> = {
        T: { en: 'Thunderstorm', zh: '雷暴' },
        R: { en: 'Rain', zh: '降雨' },
        H: { en: 'Heat', zh: '高温' },
        W: { en: 'Wind', zh: '大风' },
        F: { en: 'Flood', zh: '洪水' },
        L: { en: 'Low temperature', zh: '低温' },
        C: { en: 'Coastal event', zh: '海岸事件' },
        I: { en: 'Fire', zh: '火险' },
        G: { en: 'Fog', zh: '雾' },
        N: { en: 'Tornado', zh: '龙卷风' },
        Q: { en: 'Air quality', zh: '空气质量' },
        S: { en: 'Snow / ice', zh: '降雪' },
        A: { en: 'Avalanche', zh: '雪崩' },
    };
    const code = codeMap[type];
    if (code) return lang === 'en' ? code.en : code.zh;

    // 兼容完整英文名（例如 Thunderstorm、Heat、Wind…）
    const fullMap: Record<string, { en: string; zh: string }> = {
        Wind: { en: 'Wind', zh: '大风' },
        Rain: { en: 'Rain', zh: '降雨' },
        Thunderstorm: { en: 'Thunderstorm', zh: '雷暴' },
        Snow: { en: 'Snow / ice', zh: '降雪' },
        Fog: { en: 'Fog', zh: '雾' },
        Temperature: { en: 'Temperature', zh: '温度' },
        Heat: { en: 'Heat', zh: '高温' },
        Cold: { en: 'Low temperature', zh: '低温' },
        Flood: { en: 'Flood', zh: '洪水' },
        CoastalEvent: { en: 'Coastal event', zh: '海岸事件' },
        Avalanche: { en: 'Avalanche', zh: '雪崩' },
        Fire: { en: 'Fire', zh: '火险' },
        Tornado: { en: 'Tornado', zh: '龙卷风' },
    };
    const full = fullMap[type];
    return full ? (lang === 'en' ? full.en : full.zh) : type;
};

/**
 * 预警级别 -> 可读文本。
 * Windy 的 CapAlertSeverity 是单字母代码（M=中度、S=严重、E=极端、A=未知）。
 */
export const alertSeverityText = (sev: string, lang: Lang = currentLang): string => {
    const codeMap: Record<string, { en: string; zh: string }> = {
        M: { en: 'Moderate', zh: '中度' },
        S: { en: 'Severe', zh: '严重' },
        E: { en: 'Extreme', zh: '极端' },
        A: { en: 'Unknown', zh: '未知' },
    };
    const code = codeMap[sev];
    if (code) return lang === 'en' ? code.en : code.zh;

    // 兼容完整英文名（例如 Moderate、Severe、Extreme、Minor…）
    const fullMap: Record<string, { en: string; zh: string }> = {
        Minor: { en: 'Minor', zh: '轻度' },
        Moderate: { en: 'Moderate', zh: '中度' },
        Severe: { en: 'Severe', zh: '严重' },
        Extreme: { en: 'Extreme', zh: '极端' },
        Unknown: { en: 'Unknown', zh: '未知' },
    };
    const full = fullMap[sev];
    return full ? (lang === 'en' ? full.en : full.zh) : sev;
};

/* ---------- 恶劣天气警示 ---------- */

const SEVERE_LABELS: Record<SevereKind, { en: string; zh: string }> = {
    thunder: { en: 'Thunderstorm', zh: '雷暴' },
    rain: { en: 'Heavy rain', zh: '暴雨' },
    snow: { en: 'Heavy snow', zh: '暴雪' },
    wind: { en: 'Strong wind', zh: '大风' },
    waves: { en: 'Big waves', zh: '大浪' },
    temp: { en: 'Extreme temperature', zh: '极端温度' },
    fog: { en: 'Dense fog', zh: '大雾' },
};

const SEVERE_MESSAGES: Record<SevereKind, { en: string; zh: string }> = {
    thunder: {
        en: 'Lightning risk is high — avoid open water and banks.',
        zh: '雷击风险高，请勿在水边或空旷处逗留。',
    },
    rain: {
        en: 'Heavy rainfall may cut fish activity and visibility.',
        zh: '强降水可能降低鱼口，也影响观察与安全。',
    },
    snow: {
        en: 'Heavy snowfall with cold air and low visibility.',
        zh: '降雪大，气温低且能见度差。',
    },
    wind: {
        en: 'Strong wind makes casting and boat handling difficult.',
        zh: '风力大，抛竿与船只操控困难。',
    },
    waves: {
        en: 'Big waves — risky for small boats and shore fishing.',
        zh: '浪高较大，小船或岸边作钓存在风险。',
    },
    temp: {
        en: 'Extreme temperatures stress both fish and anglers.',
        zh: '气温极端，鱼与人都不易适应。',
    },
    fog: {
        en: 'Dense fog with poor visibility.',
        zh: '雾大，能见度低。',
    },
};

const SEVERE_EMOJIS: Record<SevereKind, string> = {
    thunder: '⛈️',
    rain: '🌧️',
    snow: '🌨️',
    wind: '💨',
    waves: '🌊',
    temp: '🌡️',
    fog: '🌫️',
};

/** 恶劣条件标签 */
export const severeLabel = (kind: SevereKind, lang: Lang = currentLang): string =>
    SEVERE_LABELS[kind][lang];

/** 恶劣条件提示语 */
export const severeMsg = (kind: SevereKind, lang: Lang = currentLang): string =>
    SEVERE_MESSAGES[kind][lang];

/** 恶劣条件 emoji */
export const severeEmoji = (kind: SevereKind): string => SEVERE_EMOJIS[kind] ?? '⚠️';
