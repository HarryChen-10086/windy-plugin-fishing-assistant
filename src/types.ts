/**
 * Windy 点预报（node-forecast v3）数据的本地类型声明。
 * 字段与 Windy 客户端返回的数据保持一致，方便本插件类型安全地使用。
 */

/** 插件支持的语言 */
export type Lang = 'en' | 'zh';

/** 恶劣天气类型（用于顶部警示与安全扣分） */
export type SevereKind =
    | 'thunder' // 雷暴
    | 'rain' // 暴雨
    | 'snow' // 暴雪
    | 'wind' // 大风
    | 'waves' // 大浪
    | 'temp' // 极端温度
    | 'fog'; // 大雾

/** 天气状况图标码（与 Windy 客户端 WeatherConditionIcon 枚举一致） */
export enum WeatherConditionIcon {
    Clear = 1,
    MostlyClear = 2,
    PartlyCloudy = 3,
    Overcast = 4,
    MostlyClearRain = 5,
    PartlyCloudyRain = 6,
    OvercastRain = 7,
    MostlyClearSnow = 8,
    PartlyCloudySnow = 9,
    OvercastSnow = 10,
    MostlyClearRainWithSnow = 11,
    PartlyCloudyRainWithSnow = 12,
    OvercastRainWithSnow = 13,
    OvercastThunderstormRain = 14,
    OvercastThunderstormSnow = 15,
    OvercastThunderstormRainWithSnow = 16,
    Fog = 17,
    MostlyClearShowers = 18,
    PartlyCloudyShowers = 19,
    OvercastShowers = 20,
    PartlyCloudyThunderstormRain = 21,
    ClearFog = 22,
    ThunderstormOvercast = 23,
    ThunderstormPartlyCloudy = 24,
}

/** 月相枚举（与 Windy 客户端 MoonPhase 枚举一致） */
export enum MoonPhase {
    NewMoon = 1,
    WaxingCrescent = 2,
    FirstQuarter = 3,
    WaxingGibbous = 4,
    FullMoon = 5,
    WaningGibbous = 6,
    LastQuarter = 7,
    WaningCrescent = 8,
}

/** 可为 null 的数值（Windy 数据中无数据时返回 null） */
export type NumValue = number | null;

/** 天体信息（日出日落等），来自点预报接口的 celestial 字段 */
export interface Celestial {
    /** UTC 偏移（小时） */
    TZoffset: number;
    /** 时区名称，例如 Europe/Prague */
    TZname?: string;
    /** 1 表示陆地，0 表示海洋 */
    atSea: number;
    /** 当前是否白天 */
    isDay: boolean;
    /** 日出时间 "HH:MM"（当地时间） */
    sunrise: string;
    /** 日出时间戳（毫秒） */
    sunriseTs: number;
    /** 日落时间 "HH:MM"（当地时间） */
    sunset: string;
    /** 日落时间戳（毫秒） */
    sunsetTs: number;
    /** 黄昏时间 "HH:MM" */
    dusk: string;
    duskTs: number;
    night: string;
    nowObserved: string;
}

/** 每个预报时间步的基础时间信息 */
export interface TimedData {
    /** 各时间步的时间戳（毫秒） */
    ts: number[];
    /** 当地时间（0-23 时） */
    hour: number[];
    /** 各时间步是否为白天（0/1 或昼夜比例） */
    isDay: (0 | 1 | number)[];
}

/** 陆地（大气）点预报主数据对象 */
export interface DataHash2 extends TimedData {
    /** 天气图标码 */
    icon: WeatherConditionIcon[];
    /** 月相码 */
    moonPhase: MoonPhase[];
    /** 降水量（mm，每个时间步为 1h 或 3h） */
    precipAmount: NumValue[];
    /** 降雪量（mm） */
    precipSnowAmount: NumValue[];
    /** 对流性降水量（mm） */
    precipConvectiveAmount: NumValue[];
    /** 降水类型位掩码 */
    precipType: number[];
    /** 气温（K） */
    temperature: NumValue[];
    /** 体感温度（K） */
    feelTemperature: NumValue[];
    /** 风速（m/s） */
    wind: NumValue[];
    /** 阵风（m/s） */
    windGust: NumValue[];
    /** 风向（度，真北方向） */
    windDir: NumValue[];
    /** 海平面气压（Pa） */
    pressure: NumValue[];
}

/** 高空/气象图数据（通过 meteogram include 获取），用于计算湿度与云量 */
export interface MeteogramDataHash2 extends TimedData {
    /** 露点（K） */
    dewPoint: NumValue[];
    /** 云底高度（米，如有） */
    cloudBase?: NumValue[];
    /** 各高度层云量 0-100，例如 cloud-surface、cloud-850h */
    [level: `cloud-${string}`]: NumValue[];
    /** 各高度层位势高度（米） */
    [level: `gh-${string}`]: NumValue[];
}

/** 海浪点预报数据对象 */
export interface WavesDataHash2 extends DataHash2 {
    /** 有效波高（m） */
    waves: NumValue[];
    /** 波浪方向（度） */
    wavesDir: NumValue[];
    /** 波浪周期（s） */
    wavesPeriod: NumValue[];
    /** 波浪能量 */
    wavesPower: NumValue[];
    /** 第一涌浪波高（m） */
    swell1: NumValue[];
    swell1Dir: NumValue[];
    swell1Period: NumValue[];
    /** 第二涌浪 */
    swell2: NumValue[];
    swell2Dir: NumValue[];
    swell2Period: NumValue[];
}

/** 每日天气摘要 */
export interface SummaryDay2 {
    /** 几号（1-31） */
    day: number;
    /** 当日零点时间戳 */
    timestamp: number;
    /** 星期几 */
    weekday: string;
    /** 当日天气图标 */
    icon: WeatherConditionIcon;
    /** 在数据表中的起始下标 */
    index: number;
    /** 当日包含的时间步数量 */
    segments: number;
    /** 最高温（K） */
    tempMax: NumValue;
    /** 最低温（K） */
    tempMin: NumValue;
    /** 可预报性（0-100，如有） */
    predictability?: NumValue;
}

/** 点预报响应头 */
export interface NodeForecastHeader2 {
    /** 可用的气压层 */
    availableLevels: string[];
    /** UTC 偏移（小时） */
    utcOffset: number;
    /** 该点是否有海浪预报 */
    hasWaves: boolean;
    /** 可用预报天数 */
    daysAvail: number;
    /** 提供数据的模型 */
    model: string;
    update?: string;
    refTime?: string;
    /** 海拔（米） */
    elevation: number;
    /** 海表温度（K，如适用） */
    sst?: number;
}

/** 点预报接口返回的整体数据 */
export interface WeatherDataPayload2<K extends DataHash2 | WavesDataHash2 = DataHash2> {
    /** 主数据对象（时间序列） */
    data: K;
    /** 响应头 */
    header: NodeForecastHeader2;
    /** 天体信息（日出日落、时区） */
    celestial?: Celestial;
    /** 每日摘要 */
    summary?: SummaryDay2[];
    /** 调试信息 */
    debug?: { cache: string };
    /** 气象图数据（含露点、各层云量） */
    meteogram?: MeteogramDataHash2;
    airgram?: unknown;
    sounding?: unknown;
}

/** 天气预警头条（CAP 预警） */
export interface CapAlertHeadline {
    id: string;
    /** 开始时间戳（毫秒） */
    start: number;
    /** 结束时间戳（毫秒） */
    end: number;
    /** 预警类型，例如 Wind、Rain、Thunderstorm 等 */
    type: string;
    /** 严重级别，例如 Moderate、Severe、Extreme */
    severity: string;
    /** 预警标题 */
    headline?: string;
    /** 预警事件名 */
    event: string;
    startLocal: { day?: string; hour: string };
    endLocal: { day?: string; hour: string };
}
