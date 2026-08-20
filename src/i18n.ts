/**
 * 轻量级中英文（en / zh）国际化模块。
 *
 * - `translate(key, vars, lang)`：纯函数，用于模板/脚本中带语言参数的翻译
 * - `detectLang()`：检测用户语言（Windy 设置优先，其次浏览器语言；简体中文 → 'zh'）
 * - `weatherText / moonPhaseText / dir2compass / weekdayName / levelLabel`：
 *   展示类辅助函数，均接受可选 `lang` 参数（默认取当前语言）
 */
import store from '@windy/store';

import type { Lang, MoonPhase, WeatherConditionIcon } from './types';
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

/** 预警类型（英文直接返回原始类型，中文翻译） */
export const alertTypeText = (type: string, lang: Lang = currentLang): string => {
    if (lang === 'en') return type;
    const map: Record<string, string> = {
        Wind: '大风',
        Rain: '降雨',
        Thunderstorm: '雷暴',
        Snow: '降雪',
        Fog: '雾',
        Temperature: '温度',
        Heat: '高温',
        Cold: '低温',
        Flood: '洪水',
        CoastalEvent: '海岸事件',
        Avalanche: '雪崩',
        Fire: '火险',
    };
    return map[type] || type;
};

/** 预警级别（英文直接返回原始级别，中文翻译） */
export const alertSeverityText = (sev: string, lang: Lang = currentLang): string => {
    if (lang === 'en') return sev;
    const map: Record<string, string> = {
        Minor: '轻度',
        Moderate: '中度',
        Severe: '严重',
        Extreme: '极端',
        Unknown: '未知',
    };
    return map[sev] || sev;
};
