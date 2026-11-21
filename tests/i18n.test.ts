/**
 * i18n 测试：中英词表完整性与展示类辅助函数。
 *
 * 这类测试的性价比在于"新加 key 却忘了翻译"会立刻失败；
 * 语言检测（Windy 设置优先、浏览器次之）也一并覆盖。
 */
import store from '@windy/store';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    alertSeverityText,
    alertTypeText,
    detectLang,
    dir2compass,
    getLang,
    levelLabel,
    moonPhaseText,
    setLang,
    severeEmoji,
    severeLabel,
    severeMsg,
    translate,
    translations,
    weatherText,
    weekdayName,
} from '../src/i18n';
import { MoonPhase, WeatherConditionIcon } from '../src/types';
import type { TranslationKey } from '../src/i18n';
import type { SevereKind } from '../src/types';

const SEVERE_KINDS: SevereKind[] = ['thunder', 'rain', 'snow', 'wind', 'waves', 'temp', 'fog'];

const iconCodes = Object.values(WeatherConditionIcon).filter(
    (v): v is WeatherConditionIcon => typeof v === 'number',
);
const moonPhases = Object.values(MoonPhase).filter((v): v is MoonPhase => typeof v === 'number');

/** 测试用的 store 替身比真实 Store 多一个 clear()，这里做一次局部窄化 */
type ClearableStore = typeof store & { clear?: () => void };
const resetStore = (): void => {
    (store as ClearableStore).clear?.();
};

beforeEach(() => {
    resetStore();
    setLang('en');
});

describe('词表', () => {
    const keys = Object.keys(translations.en).sort() as TranslationKey[];

    it('中英 key 集合完全一致', () => {
        expect(Object.keys(translations.zh).sort()).toEqual(keys);
    });

    it('中英 key 顺序一致（方便人工对照维护）', () => {
        expect(Object.keys(translations.zh)).toEqual(Object.keys(translations.en));
    });

    it('两语言都没有空字符串（windSuffix 例外：英文方位后不需要后缀）', () => {
        // 英文里 "NE" 后面不加东西，中文要加"风"，所以这两个空值是有意为之
        for (const key of keys) {
            for (const lang of ['en', 'zh'] as const) {
                const value = translations[lang][key];
                expect(typeof value, `${lang}.${key}`).toBe('string');
                if (key !== 'windSuffix') {
                    expect(value.trim(), `${lang}.${key}`).not.toBe('');
                }
            }
        }
        expect(translations.en.windSuffix).toBe('');
        expect(translations.zh.windSuffix).toBe('风');
    });

    it('绝大多数中文词条确实是中文', () => {
        const cjk = keys.filter(key => /[\u4e00-\u9fa5]/.test(translations.zh[key]));
        expect(cjk.length / keys.length).toBeGreaterThan(0.6);
    });

    it('中英词条不会整体雷同', () => {
        const identical = keys.filter(key => translations.zh[key] === translations.en[key]);
        expect(identical.length).toBeLessThan(keys.length * 0.3);
    });
});

describe('translate', () => {
    it('按语言取词', () => {
        expect(translate('currentIndex', {}, 'en')).toBe(translations.en.currentIndex);
        expect(translate('currentIndex', {}, 'zh')).toBe(translations.zh.currentIndex);
    });

    it('替换 {var} 占位符', () => {
        const out = translate('todayBest', { time: '06:00', weekday: 'Mon' }, 'en');
        expect(out).toContain('06:00');
        expect(out).toContain('Mon');
        expect(out).not.toContain('{time}');
    });

    it('缺少参数时保留占位符，不崩', () => {
        expect(translate('todayBest', undefined, 'en')).toContain('{time}');
    });

    it('未知 key 回退为 key 本身', () => {
        expect(translate('__no_such_key__' as TranslationKey, {}, 'en')).toBe('__no_such_key__');
    });

    it('新文案键 moonLine / lblPrecipStep / retry 中英俱全且插值正常', () => {
        expect(translate('moonLine', { phase: 'New moon' }, 'en')).toBe('Moon (New moon)');
        expect(translate('moonLine', { phase: '新月' }, 'zh')).toBe('月相（新月）');
        // 英文模板不得出现中文全角括号
        expect(translate('moonLine', { phase: 'x' }, 'en')).not.toMatch(/[（）]/);

        expect(translate('lblPrecipStep', { h: 3 }, 'en')).toBe('Precip (3h)');
        expect(translate('lblPrecipStep', { h: 3 }, 'zh')).toBe('降水（3h）');
        expect(translate('lblPrecipStep', { h: 1 }, 'en')).not.toContain('{h}');

        expect(translate('retry', {}, 'en')).toBe('Retry');
        expect(translate('retry', {}, 'zh')).toBe('重试');
        // lblPrecip 仍然保留（模板里旧用法不能被误删）
        expect(translations.en.lblPrecip).toBe('Precip');
        expect(translations.zh.lblPrecip).toBe('降水');
    });
});

describe('语言检测与切换', () => {
    it('默认英语，setLang 生效', () => {
        expect(getLang()).toBe('en');
        setLang('zh');
        expect(getLang()).toBe('zh');
        expect(translate('currentIndex')).toBe(translations.zh.currentIndex);
    });

    it('Windy 的 usedLang 优先', () => {
        store.set('usedLang', 'zh');
        expect(detectLang()).toBe('zh');
        store.set('usedLang', 'zh-CN');
        expect(detectLang()).toBe('zh');
        store.set('usedLang', 'zh-Hans');
        expect(detectLang()).toBe('zh');
    });

    it('usedLang 缺失时回退到 lang 设置', () => {
        store.set('lang', 'zh');
        expect(detectLang()).toBe('zh');
    });

    it('非中文设置时回退到浏览器/系统语言，结果始终是合法语言', () => {
        // 第二级回退依赖宿主语言（Node 的 navigator.language），不能断言具体值
        store.set('usedLang', 'en');
        expect(['en', 'zh']).toContain(detectLang());
        store.set('usedLang', 'de');
        expect(['en', 'zh']).toContain(detectLang());
    });
});

describe('展示类辅助函数', () => {
    it('每个天气图标都有中英文本与 emoji', () => {
        for (const icon of iconCodes) {
            for (const lang of ['en', 'zh'] as const) {
                const { text, emoji } = weatherText(icon, lang);
                expect(text.trim(), `${icon}/${lang}`).not.toBe('');
                expect(emoji.trim(), `${icon}/${lang}`).not.toBe('');
            }
        }
    });

    it('月相名称覆盖全部枚举', () => {
        for (const phase of moonPhases) {
            expect(moonPhaseText(phase, 'en')).not.toBe('—');
            expect(moonPhaseText(phase, 'zh')).not.toBe('—');
        }
        expect(moonPhaseText(MoonPhase.NewMoon, 'zh')).toBe('新月');
    });

    it('风向转方位', () => {
        expect(dir2compass(0, 'en')).toBe('N');
        expect(dir2compass(45, 'en')).toBe('NE');
        expect(dir2compass(90, 'en')).toBe('E');
        expect(dir2compass(180, 'en')).toBe('S');
        expect(dir2compass(270, 'en')).toBe('W');
        expect(dir2compass(359, 'en')).toBe('N');
        expect(dir2compass(-90, 'en')).toBe('W');
        expect(dir2compass(90, 'zh')).toBe('东');
        expect(dir2compass(null, 'en')).toBe('--');
        expect(dir2compass(Number.NaN, 'en')).toBe('--');
    });

    it('星期按本地时区计算', () => {
        const monday = Date.UTC(2026, 5, 1, 0, 0); // 2026-06-01 是周一
        expect(weekdayName(monday, 0, 'en')).toBe('Mon');
        expect(weekdayName(monday, 0, 'zh')).toBe('周一');
        expect(weekdayName(monday, 8, 'en')).toBe('Mon');
        expect(weekdayName(Date.UTC(2026, 4, 31, 20, 0), 8, 'en')).toBe('Mon'); // 本地已是 6/1
        expect(weekdayName(Date.UTC(2026, 4, 31, 20, 0), -5, 'en')).toBe('Sun'); // 本地还是 5/31
    });

    it('指数等级文字', () => {
        expect(levelLabel(0, 'en')).toBe('Excellent');
        expect(levelLabel(4, 'zh')).toBe('很差');
        expect(levelLabel(9, 'en')).toBe('—');
    });

    it('预警类型与级别', () => {
        expect(alertTypeText('T', 'en')).toBe('Thunderstorm');
        expect(alertTypeText('T', 'zh')).toBe('雷暴');
        expect(alertTypeText('Wind', 'en')).toBe('Wind');
        expect(alertTypeText('XYZ', 'en')).toBe('XYZ');

        expect(alertSeverityText('S', 'en')).toBe('Severe');
        expect(alertSeverityText('E', 'zh')).toBe('极端');
        expect(alertSeverityText('Minor', 'en')).toBe('Minor');
        expect(alertSeverityText('XYZ', 'en')).toBe('XYZ');
    });

    it('恶劣条件的标签、提示语与 emoji', () => {
        for (const kind of SEVERE_KINDS) {
            expect(severeLabel(kind, 'en').trim()).not.toBe('');
            expect(severeLabel(kind, 'zh').trim()).not.toBe('');
            expect(severeMsg(kind, 'en').trim()).not.toBe('');
            expect(severeMsg(kind, 'zh').trim()).not.toBe('');
            expect(severeEmoji(kind).trim()).not.toBe('');
        }
        expect(severeLabel('thunder', 'zh')).toBe('雷暴');
        expect(severeEmoji('waves')).toBe('🌊');
    });
});

describe('CAP 预警类型与级别', () => {
    /** Windy CapAlertType 的完整单字母集合（见 plugin-devtools types.d.ts） */
    const CAP_TYPES = [
        'T', 'R', 'H', 'W', 'F', 'L', 'C', 'I', 'G', 'N', 'Q', 'S', 'A', 'P', 'V', 'E', 'M', '-',
    ];

    it('每个 CAP 类型都有中英可读文本，不会原样回显单字母', () => {
        for (const type of CAP_TYPES) {
            const enText = alertTypeText(type, 'en');
            const zhText = alertTypeText(type, 'zh');
            expect(enText, `en/${type}`).not.toBe(type);
            expect(zhText, `zh/${type}`).not.toBe(type);
            expect(enText.trim(), `en/${type}`).not.toBe('');
            expect(zhText.trim(), `zh/${type}`).not.toBe('');
        }
    });

    it('新增类型 P/V/E/M/- 的中英文本', () => {
        expect(alertTypeText('P', 'en')).toBe('Hail');
        expect(alertTypeText('P', 'zh')).toBe('冰雹');
        expect(alertTypeText('V', 'en')).toBe('Volcanic ash');
        expect(alertTypeText('V', 'zh')).toBe('火山灰');
        expect(alertTypeText('E', 'en')).toBe('Earthquake');
        expect(alertTypeText('E', 'zh')).toBe('地震');
        expect(alertTypeText('M', 'en')).toBe('Landslide');
        expect(alertTypeText('M', 'zh')).toBe('滑坡');
        expect(alertTypeText('-', 'en')).toBe('Unknown hazard');
        expect(alertTypeText('-', 'zh')).toBe('未知灾害');
    });

    it('新增完整英文名同样可识别', () => {
        expect(alertTypeText('Hail', 'zh')).toBe('冰雹');
        expect(alertTypeText('VolcanicAsh', 'zh')).toBe('火山灰');
        expect(alertTypeText('Earthquake', 'zh')).toBe('地震');
        expect(alertTypeText('Landslide', 'zh')).toBe('滑坡');
        expect(alertTypeText('AirQuality', 'zh')).toBe('空气质量');
        expect(alertTypeText('SnowIce', 'zh')).toBe('降雪');
        expect(alertTypeText('SnowIce', 'en')).toBe('Snow / ice');
    });

    it("字母 'E' 在类型表是地震、在级别表是极端，两套编码不得串味", () => {
        expect(alertTypeText('E', 'en')).toBe('Earthquake');
        expect(alertTypeText('E', 'zh')).toBe('地震');
        expect(alertSeverityText('E', 'en')).toBe('Extreme');
        expect(alertSeverityText('E', 'zh')).toBe('极端');
        expect(alertTypeText('E', 'zh')).not.toBe(alertSeverityText('E', 'zh'));
    });

    it('未知代码原样返回（不抛错、不显示 undefined）', () => {
        expect(alertTypeText('ZZZ', 'en')).toBe('ZZZ');
        expect(alertSeverityText('ZZZ', 'zh')).toBe('ZZZ');
    });
});
