/**
 * 各单项评分函数的边界测试。夹具都用真实单位（Pa / K / m/s），
 * 与 Windy 点预报返回值的单位保持一致。
 */
import { describe, expect, it } from 'vitest';

import {
    scoreLevel,
    scoreMoon,
    scorePressure,
    scoreTemp,
    scoreWeather,
    scoreWind,
} from '../src/fishingIndex';
import { MoonPhase, WeatherConditionIcon } from '../src/types';

describe('scorePressure（0-25，Pa）', () => {
    it('缺数据时给中间分', () => {
        expect(scorePressure(null, null)).toBe(10);
        expect(scorePressure(Number.NaN, null)).toBe(10);
    });

    it('没有历史气压时只看绝对值', () => {
        expect(scorePressure(101325, null)).toBe(20); // 1013.25 hPa
        expect(scorePressure(100500, null)).toBe(15); // 1005 hPa
        expect(scorePressure(99500, null)).toBe(10);
        expect(scorePressure(103500, null)).toBe(10);
    });

    it('气压变化越小分越高', () => {
        expect(scorePressure(101325, 101325)).toBe(25); // 差 0 Pa
        expect(scorePressure(101325, 101200)).toBe(22); // 差 125 Pa
        expect(scorePressure(101325, 101000)).toBe(18); // 差 325 Pa
        expect(scorePressure(101325, 100800)).toBe(13); // 差 525 Pa
        expect(scorePressure(101325, 100600)).toBe(9); // 差 725 Pa，气压骤变
    });

    it('绝对值不在舒适区时不加绝对分', () => {
        expect(scorePressure(105000, 105000)).toBe(18);
    });

    it('上一刻缺数据按"无历史"处理', () => {
        expect(scorePressure(101325, Number.NaN)).toBe(20);
    });
});

describe('scoreWeather（0-20）', () => {
    it('按图标给基础分', () => {
        expect(scoreWeather(WeatherConditionIcon.Clear, 0)).toBe(20);
        expect(scoreWeather(WeatherConditionIcon.PartlyCloudy, 0)).toBe(20);
        expect(scoreWeather(WeatherConditionIcon.Overcast, 0)).toBe(16);
        expect(scoreWeather(WeatherConditionIcon.Fog, 0)).toBe(10);
        expect(scoreWeather(WeatherConditionIcon.OvercastRain, 0)).toBe(8);
        expect(scoreWeather(WeatherConditionIcon.OvercastSnow, 0)).toBe(4);
        expect(scoreWeather(WeatherConditionIcon.ThunderstormPartlyCloudy, 0)).toBe(2);
    });

    it('降水量越大再扣分，但不会低于图标基础分', () => {
        expect(scoreWeather(WeatherConditionIcon.Clear, 2)).toBe(13);
        expect(scoreWeather(WeatherConditionIcon.Clear, 5)).toBe(8);
        expect(scoreWeather(WeatherConditionIcon.Clear, 12)).toBe(4);
        expect(scoreWeather(WeatherConditionIcon.OvercastSnow, 5)).toBe(4);
    });

    it('降水缺数据或为 0 时不扣分', () => {
        expect(scoreWeather(WeatherConditionIcon.Clear, null)).toBe(20);
        expect(scoreWeather(WeatherConditionIcon.Clear, Number.NaN)).toBe(20);
    });
});

describe('scoreWind（0-15，m/s）', () => {
    it('微风最优，无风与大风递减', () => {
        expect(scoreWind(3)).toBe(15);
        expect(scoreWind(1)).toBe(12);
        expect(scoreWind(0.3)).toBe(9);
        expect(scoreWind(7)).toBe(10);
        expect(scoreWind(10)).toBe(5);
        expect(scoreWind(14)).toBe(3);
        expect(scoreWind(20)).toBe(1);
    });

    it('取绝对值，缺数据给中间分', () => {
        expect(scoreWind(-4)).toBe(15);
        expect(scoreWind(null)).toBe(7);
    });
});

describe('scoreTemp（0-15，K）', () => {
    it('10-25°C 最适宜', () => {
        expect(scoreTemp(293.15)).toBe(15); // 20°C
        expect(scoreTemp(283.15)).toBe(15); // 10°C
        expect(scoreTemp(298.15)).toBe(15); // 25°C
    });

    it('两侧递减', () => {
        expect(scoreTemp(280)).toBe(11); // 6.85°C
        expect(scoreTemp(301)).toBe(11); // 27.85°C
        expect(scoreTemp(275)).toBe(6); // 1.85°C
        expect(scoreTemp(273.15)).toBe(6); // 0°C
        expect(scoreTemp(305)).toBe(6); // 31.85°C
        expect(scoreTemp(268)).toBe(2); // -5.15°C
        expect(scoreTemp(313)).toBe(2); // 39.85°C
    });

    it('缺数据给中间分', () => {
        expect(scoreTemp(null)).toBe(7);
    });
});

describe('scoreMoon（0-10）', () => {
    it('新月与满月最高，上下弦最低', () => {
        expect(scoreMoon(MoonPhase.NewMoon)).toBe(10);
        expect(scoreMoon(MoonPhase.FullMoon)).toBe(10);
        expect(scoreMoon(MoonPhase.WaxingCrescent)).toBe(8);
        expect(scoreMoon(MoonPhase.WaningCrescent)).toBe(8);
        expect(scoreMoon(MoonPhase.WaxingGibbous)).toBe(6);
        expect(scoreMoon(MoonPhase.WaningGibbous)).toBe(6);
        expect(scoreMoon(MoonPhase.FirstQuarter)).toBe(5);
        expect(scoreMoon(MoonPhase.LastQuarter)).toBe(5);
    });
});

describe('scoreLevel', () => {
    it('按阈值返回等级与颜色', () => {
        expect(scoreLevel(100)).toEqual({ level: 0, color: '#2ecc71' });
        expect(scoreLevel(80)).toEqual({ level: 0, color: '#2ecc71' });
        expect(scoreLevel(79.9).level).toBe(1);
        expect(scoreLevel(60).level).toBe(1);
        expect(scoreLevel(59).level).toBe(2);
        expect(scoreLevel(40).level).toBe(2);
        expect(scoreLevel(39).level).toBe(3);
        expect(scoreLevel(25).level).toBe(3);
        expect(scoreLevel(24).level).toBe(4);
        expect(scoreLevel(0).level).toBe(4);
    });
});
