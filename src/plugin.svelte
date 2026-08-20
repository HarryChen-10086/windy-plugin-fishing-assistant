<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content fa-root">
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={() => bcast.emit('rqstOpen', 'menu')}
    >
        {title}
        {#if reverseName && loc}
            {@const { lat, lon } = loc}
            <div class="plugin__title__subtitle">
                {reverseName} · {normalizeLatLon(lat)}, {normalizeLatLon(lon)}
            </div>
        {/if}
    </div>

    <!-- 顶部设置：语言/模型选择 + 定位 -->
    <div class="fa-toolbar">
        <label class="fa-model">
            {t('model')}
            <select bind:value={selectedModel} on:change={() => refresh()}>
                <option value="ecmwf">ECMWF</option>
                <option value="gfs">GFS</option>
                <option value="icon">ICON</option>
            </select>
        </label>
        <button class="button button--variant-orange fa-locate" on:click={locateMe}>{t('locateMe')}</button>
        <button
            class="fa-lang"
            on:click={toggleLang}
            title="Switch language / 切换语言"
        >
            🌐 {t('switchLang')}
        </button>
        <div class="fa-hint">{t('clickHint')}</div>
        <div class="fa-hint">{t('timeHint')}</div>
    </div>

    {#if loading}
        <div class="fa-loading">{t('loading')}</div>
    {/if}

    {#if error}
        <div class="rounded-box bg-error size-s mt-10 fa-error">⚠️ {error}</div>
    {/if}

    {#if air && nowScore}
        {@const offset = air.celestial?.TZoffset ?? air.header.utcOffset ?? 0}
        {@const nowIdx = Math.max(0, air.data.ts.indexOf(nowScore.ts))}
        {@const weather = weatherText(nowScore.icon, lang)}
        {@const level = scoreLevel(nowScore.total)}

        <!-- 恶劣天气警示（最上方） -->
        {#if currentSevere.length > 0}
            <div class="fa-warn">
                <div class="fa-warn-title">⚠️ {t('severeTitle')}</div>
                {#each currentSevere as c}
                    <div class="fa-warn-item">
                        <span class="fa-warn-emoji">{severeEmoji(c.kind)}</span>
                        <div class="fa-warn-body">
                            <div class="fa-warn-label">{severeLabel(c.kind, lang)}</div>
                            <div class="fa-warn-msg">{severeMsg(c.kind, lang)}</div>
                            <div class="fa-warn-end">
                                {c.end !== null
                                    ? t('severeEndAt', { time: formatLocalDateTime(c.end, offset) })
                                    : t('severePersist')}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- 当前钓鱼指数 -->
        <div class="fa-card fa-card--hero">
            <div class="fa-section-title">
                {t('currentIndex')}
                <span class="fa-time-chip">🕐 {formatLocalTime(nowScore.ts, offset)}</span>
                {#if !isNowTime}
                    <span class="fa-fcst-badge">{t('forecastTime')}</span>
                {/if}
            </div>
            <div class="fa-hero">
                <div class="fa-gauge">
                    <svg viewBox="0 0 120 120" width="120" height="120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="11" />
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke={level.color}
                            stroke-width="11"
                            stroke-linecap="round"
                            stroke-dasharray={`${(nowScore.total / 100) * 326.7} 326.7`}
                            transform="rotate(-90 60 60)"
                        />
                    </svg>
                    <div class="fa-gauge-center">
                        <div class="fa-score">{nowScore.total}</div>
                        <div class="fa-level" style="color: {level.color}">{levelLabel(level.level, lang)}</div>
                    </div>
                </div>
                <div class="fa-hero-side">
                    <div class="fa-now-weather">
                        <span class="fa-emoji">{weather.emoji}</span>
                        <span class="fa-now-temp">{tempText(air.data.temperature[nowIdx])}</span>
                    </div>
                    <div class="fa-now-desc">{weather.text}</div>
                    <div class="fa-now-time">
                        {t('todayBest', {
                            time: bestToday ? formatLocalTime(bestToday.ts, offset) : '--',
                            weekday: bestToday ? weekdayName(bestToday.ts, offset, lang) : '',
                        })}
                    </div>
                </div>
            </div>

            <!-- 分项得分 -->
            <div class="fa-breakdown">
                <div class="fa-bd-row">
                    <span class="fa-bd-name">{t('scorePressure')}</span>
                    <div class="fa-bd-bar"><div class="fa-bd-fill" style="width: {(nowScore.pressure / 25) * 100}%"></div></div>
                    <span class="fa-bd-val">{nowScore.pressure}/25</span>
                </div>
                <div class="fa-bd-row">
                    <span class="fa-bd-name">{t('scoreWeather')}</span>
                    <div class="fa-bd-bar"><div class="fa-bd-fill" style="width: {(nowScore.weather / 20) * 100}%"></div></div>
                    <span class="fa-bd-val">{nowScore.weather}/20</span>
                </div>
                <div class="fa-bd-row">
                    <span class="fa-bd-name">{t('scoreWind')}</span>
                    <div class="fa-bd-bar"><div class="fa-bd-fill" style="width: {(nowScore.wind / 15) * 100}%"></div></div>
                    <span class="fa-bd-val">{nowScore.wind}/15</span>
                </div>
                <div class="fa-bd-row">
                    <span class="fa-bd-name">{t('scoreTemp')}</span>
                    <div class="fa-bd-bar"><div class="fa-bd-fill" style="width: {(nowScore.temp / 15) * 100}%"></div></div>
                    <span class="fa-bd-val">{nowScore.temp}/15</span>
                </div>
                <div class="fa-bd-row">
                    <span class="fa-bd-name">{t('scoreTime')}</span>
                    <div class="fa-bd-bar"><div class="fa-bd-fill" style="width: {(nowScore.time / 15) * 100}%"></div></div>
                    <span class="fa-bd-val">{nowScore.time}/15</span>
                </div>
                <div class="fa-bd-row">
                    <span class="fa-bd-name">{t('scoreMoon')}（{moonPhaseText(air.data.moonPhase[nowIdx], lang)}）</span>
                    <div class="fa-bd-bar"><div class="fa-bd-fill" style="width: {(nowScore.moon / 10) * 100}%"></div></div>
                    <span class="fa-bd-val">{nowScore.moon}/10</span>
                </div>
                {#if nowScore.safety < 0}
                    <div class="fa-bd-row fa-bd-row--safety">
                        <span class="fa-bd-name">{t('scoreSafety')}</span>
                        <div class="fa-bd-bar"><div class="fa-bd-fill fa-bd-fill--neg" style="width: {Math.min(100, (Math.abs(nowScore.safety) / 40) * 100)}%"></div></div>
                        <span class="fa-bd-val fa-bd-val--neg">{nowScore.safety}</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- 天气预警 -->
        {#if alerts.length > 0}
            <div class="fa-card">
                <div class="fa-section-title">⚠️ {t('alertsTitle')}</div>
                {#each alerts as a}
                    <div class="fa-alert" class:fa-alert--sev={alertSeverityClass(a.severity)}>
                        <div class="fa-alert-title">
                            <b>{alertTypeText(a.type, lang)}</b>
                            <span class="fa-alert-sev">{alertSeverityText(a.severity, lang)}</span>
                        </div>
                        <div class="fa-alert-event">{a.event || a.headline || ''}</div>
                        <div class="fa-alert-time">
                            {alertTimeText(a)} · {t('modelLabel')} {air.header.model.toUpperCase()}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- 当前气象条件 -->
        <div class="fa-card">
            <div class="fa-section-title">{t('currentConditions')}</div>
            <div class="fa-grid">
                <div class="fa-item"><span class="fa-item-icon">🌡️</span><span class="fa-item-label">{t('lblTemp')}</span><span class="fa-item-val">{tempText(air.data.temperature[nowIdx])}</span></div>
                <div class="fa-item"><span class="fa-item-icon">🤒</span><span class="fa-item-label">{t('lblFeels')}</span><span class="fa-item-val">{tempText(air.data.feelTemperature[nowIdx])}</span></div>
                <div class="fa-item"><span class="fa-item-icon">💨</span><span class="fa-item-label">{t('lblWind')}</span><span class="fa-item-val">{windText(air.data.wind[nowIdx])}</span></div>
                <div class="fa-item"><span class="fa-item-icon">🧭</span><span class="fa-item-label">{t('lblDir')}</span><span class="fa-item-val">{dir2compass(air.data.windDir[nowIdx], lang)}{t('windSuffix')}</span></div>
                <div class="fa-item"><span class="fa-item-icon">💨</span><span class="fa-item-label">{t('lblGust')}</span><span class="fa-item-val">{windText(air.data.windGust[nowIdx])}</span></div>
                <div class="fa-item"><span class="fa-item-icon">🌀</span><span class="fa-item-label">{t('lblPressure')}</span><span class="fa-item-val">{pressureText(air.data.pressure[nowIdx])}</span></div>
                <div class="fa-item"><span class="fa-item-icon">📈</span><span class="fa-item-label">{t('lblTrend')}</span><span class="fa-item-val">{pressureTrend(nowIdx, lang)}</span></div>
                <div class="fa-item"><span class="fa-item-icon">💧</span><span class="fa-item-label">{t('lblHumidity')}</span><span class="fa-item-val">{humidityText(nowIdx)}</span></div>
                <div class="fa-item"><span class="fa-item-icon">☁️</span><span class="fa-item-label">{t('lblClouds')}</span><span class="fa-item-val">{cloudText(nowIdx)}</span></div>
                <div class="fa-item"><span class="fa-item-icon">🌧️</span><span class="fa-item-label">{t('lblPrecip')}</span><span class="fa-item-val">{rainText(nowIdx)}</span></div>
                <div class="fa-item"><span class="fa-item-icon">🌙</span><span class="fa-item-label">{t('lblMoon')}</span><span class="fa-item-val">{moonPhaseText(air.data.moonPhase[nowIdx], lang)}</span></div>
                <div class="fa-item"><span class="fa-item-icon">⛰️</span><span class="fa-item-label">{t('lblElevation')}</span><span class="fa-item-val">{elevationText()}</span></div>
            </div>
        </div>

        <!-- 日出日落 + 黄金时段 -->
        <div class="fa-card">
            <div class="fa-section-title">{t('sunTitle')}</div>
            <div class="fa-sun">
                <span>🌅 {t('sunrise')} <b>{air.celestial?.sunrise ?? '--'}</b></span>
                <span>🌇 {t('sunset')} <b>{air.celestial?.sunset ?? '--'}</b></span>
            </div>
            <div class="fa-prime-list">
                {#each primes as p}
                    <div class="fa-prime">
                        <span class="fa-prime-emoji">{p.emoji}</span>
                        <span class="fa-prime-label">{t(p.kind === 'morning' ? 'primeMorning' : 'primeEvening')}</span>
                        <span class="fa-prime-time">{formatLocalTime(p.start, offset)} – {formatLocalTime(p.end, offset)}</span>
                        <span class="fa-prime-score">{primeScoreText(p, lang)}</span>
                    </div>
                {/each}
            </div>
        </div>

        <!-- 未来小时钓鱼指数 -->
        {#if hourly12.length > 0}
            <div class="fa-card">
                <div class="fa-section-title">
                    {t('nextHours')}
                    {#if hourlyStepH > 1}
                        <span class="fa-step-note">({t('hourlyStep', { h: hourlyStepH })})</span>
                    {/if}
                </div>
                <div class="fa-hours">
                    {#each hourly12 as h, hi}
                        {@const hl = scoreLevel(h.total)}
                        <div class="fa-hour" class:fa-hour--now={hi === 0}>
                            <div class="fa-hour-time">{formatLocalTime(h.ts, offset)}</div>
                            <div class="fa-hour-icon">{weatherText(h.icon, lang).emoji}</div>
                            <div class="fa-hour-score">{h.total}</div>
                            <div class="fa-hour-level" style="color: {hl.color}">{levelLabel(hl.level, lang)}</div>
                            <div class="fa-hour-bar">
                                <div class="fa-hour-fill" style="width: {h.total}%; background: {hl.color}"></div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 未来几天指数 -->
        <div class="fa-card">
            <div class="fa-section-title">{t('nextDays')}</div>
            <div class="fa-days">
                {#each daily.slice(0, 5) as d, di}
                    {@const dl = scoreLevel(d.best.total)}
                    <div class="fa-day" class:fa-day--today={di === 0}>
                        <div class="fa-day-head">
                            <span class="fa-day-weekday">{di === 0 ? t('today') : weekdayName(d.timestamp, offset, lang)}</span>
                            <span class="fa-day-date">{t('dayLabel', { day: d.day })}</span>
                            <span class="fa-day-icon">{weatherText(d.icon, lang).emoji}</span>
                        </div>
                        <div class="fa-day-temps">
                            {tempText(d.tempMax)} / {tempText(d.tempMin)}
                        </div>
                        <div class="fa-day-score-row">
                            <div class="fa-day-bar">
                                <div class="fa-day-fill" style="width: {d.best.total}%; background: {dl.color}"></div>
                            </div>
                            <span class="fa-day-score">{d.best.total}</span>
                            <span class="fa-day-level" style="color: {dl.color}">{levelLabel(dl.level, lang)}</span>
                        </div>
                        <div class="fa-day-best">{t('dayBest', { time: formatLocalTime(d.best.ts, offset), avg: d.avg })}</div>
                        {#if d.predictability !== null}
                            <div class="fa-day-pred">{t('predictability', { p: d.predictability })}</div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <!-- 海浪与海况 -->
        {#if waves && hasWavesData(waves)}
            {@const wIdx = closestIndex(waves.data.ts, nowScore.ts)}
            <div class="fa-card">
                <div class="fa-section-title">{t('wavesTitle')}</div>
                <div class="fa-grid">
                    <div class="fa-item"><span class="fa-item-icon">🌊</span><span class="fa-item-label">{t('lblWaveHeight')}</span><span class="fa-item-val">{wavesText(waves.data.waves[wIdx])}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">🔄</span><span class="fa-item-label">{t('lblPeriod')}</span><span class="fa-item-val">{val(waves.data.wavesPeriod[wIdx])} s</span></div>
                    <div class="fa-item"><span class="fa-item-icon">🧭</span><span class="fa-item-label">{t('lblWaveDir')}</span><span class="fa-item-val">{dir2compass(waves.data.wavesDir[wIdx], lang)}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">🌊</span><span class="fa-item-label">{t('lblSwell1')}</span><span class="fa-item-val">{wavesSwell1Text(wIdx, lang)}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">🌡️</span><span class="fa-item-label">{t('lblSeaTemp')}</span><span class="fa-item-val">{sstText()}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">⚡</span><span class="fa-item-label">{t('lblWavePower')}</span><span class="fa-item-val">{val(waves.data.wavesPower[wIdx])}</span></div>
                </div>
            </div>
        {/if}

        <!-- 地图图层快捷切换 -->
        <div class="fa-card">
            <div class="fa-section-title">{t('layersTitle')}</div>
            <div class="fa-layers">
                <button class="fa-layer" on:click={() => setOverlay('wind')}>💨 {t('layerWind')}</button>
                <button class="fa-layer" on:click={() => setOverlay('gust')}>💨 {t('layerGust')}</button>
                <button class="fa-layer" on:click={() => setOverlay('rain')}>🌧️ {t('layerRain')}</button>
                <button class="fa-layer" on:click={() => setOverlay('temp')}>🌡️ {t('layerTemp')}</button>
                <button class="fa-layer" on:click={() => setOverlay('waves')}>🌊 {t('layerWaves')}</button>
                <button class="fa-layer" on:click={() => setOverlay('sst')}>🌡️ {t('layerSST')}</button>
            </div>
        </div>

        <div class="fa-footer">
            {t('footer', { model: air.header.model.toUpperCase(), time: updateText() })}
        </div>
    {/if}

    <!-- 测试版横幅（页面最下方） -->
    <div class="fa-beta">
        <div class="fa-beta-title">🧪 Beta</div>
        <div class="fa-beta-text">{t('betaText')}</div>
        <a
            class="fa-beta-link"
            href="https://github.com/HarryChen-10086/windy-plugin-fishing-assistant/issues"
            target="_blank"
            rel="noreferrer"
        >
            {t('betaLink')}
        </a>
        <a
            class="fa-beta-repo"
            href="https://github.com/HarryChen-10086/windy-plugin-fishing-assistant"
            target="_blank"
            rel="noreferrer"
        >
            {t('betaRepoLabel')}
        </a>
    </div>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { getGPSlocation } from '@windy/geolocation';
    import { map } from '@windy/map';
    import { setTitle } from '@windy/location';
    import * as reverse from '@windy/reverseName';
    import { singleclick } from '@windy/singleclick';
    import store from '@windy/store';
    import metrics from '@windy/metrics';
    import { isValidLatLonObj, normalizeLatLon } from '@windy/utils';
    import { getCapAlertsSummary, getPointForecastData } from '@windy/fetch';

    import { onDestroy, onMount } from 'svelte';

    import config from './pluginConfig';

    import type { LatLon } from '@windy/interfaces.d';
    import type { overlays } from '@windy/rootScope.d';

    import type {
        CapAlertHeadline,
        Celestial,
        DataHash2,
        Lang,
        SevereKind,
        WavesDataHash2,
        WeatherDataPayload2,
    } from './types';

    /** 地图叠加层标识（由 rootScope 的 overlays 常量派生） */
    type Overlays = (typeof overlays)[number];
    import {
        alertSeverityText,
        alertTypeText,
        detectLang,
        dir2compass,
        levelLabel,
        moonPhaseText,
        setLang,
        severeEmoji,
        severeLabel,
        severeMsg,
        translate as _translate,
        weatherText,
        weekdayName,
    } from './i18n';
    import {
        closestIndex,
        closestSegment,
        computeDaily,
        computeSegments,
        formatLocalDateTime,
        formatLocalTime,
        primeWindows,
        relativeHumidity,
        scoreLevel,
        severeEndTs,
    } from './fishingIndex';
    import type { DayScore, PrimeWindow, SegmentScore } from './fishingIndex';

    const { title, name } = config;
    const HOUR = 3600 * 1000;
    const INCLUDE = { header: true, celestial: true, meteogram: true, summary: true, debug: true } as const;
    const WAVES_INCLUDE = { header: true, celestial: true, summary: true, debug: true } as const;
    const HOURLY_INCLUDE = { header: true, celestial: true } as const;
    const LANG_KEY = 'windy-fishing-assistant-lang';

    // 语言状态（默认英语；模板中的翻译通过响应式的 t 读取，语言切换时自动更新）
    let lang: Lang = 'en';
    /** 响应式翻译函数：依赖 lang，语言切换后模板自动重渲染 */
    $: t = (key: Parameters<typeof _translate>[0], vars?: Parameters<typeof _translate>[1]) =>
        _translate(key, vars, lang);

    const loadSavedLang = (): Lang | null => {
        try {
            const v = localStorage.getItem(LANG_KEY);
            return v === 'en' || v === 'zh' ? v : null;
        } catch {
            return null;
        }
    };

    const saveLang = (l: Lang) => {
        try {
            localStorage.setItem(LANG_KEY, l);
        } catch {
            /* 忽略 */
        }
    };

    /** 切换语言（中 ⇄ 英） */
    const toggleLang = () => {
        lang = lang === 'en' ? 'zh' : 'en';
        setLang(lang);
        saveLang(lang);
        if (loc && reverseName) {
            setTitle(`🎣 ${t('pluginName')} · ${reverseName}`);
        }
    };

    let loc: LatLon | null = null;
    let reverseName = '';
    let loading = false;
    let error = '';

    let selectedModel = 'ecmwf';
    let air: WeatherDataPayload2<DataHash2> | null = null;
    let waves: WeatherDataPayload2<WavesDataHash2> | null = null;
    let alerts: CapAlertHeadline[] = [];

    let segments: SegmentScore[] = [];
    let daily: DayScore[] = [];
    let primes: PrimeWindow[] = [];
    let nowScore: SegmentScore | null = null;
    let bestToday: SegmentScore | null = null;

    /** 未来小时逐小时指数（基于接口实际返回步长的数据） */
    let hourlySegments: SegmentScore[] = [];
    /** 接口实际返回的步长（小时），用于界面标注与窗口计算 */
    $: hourlyStepH = hourlySegments.length >= 2 ? hourlyStepOf(hourlySegments) : 1;
    /** 按实际步长取未来 12 个点：1h → 12 小时窗口，3h → 36 小时窗口 */
    $: hourly12 = hourlySegments
        .filter(s => s.ts >= Date.now() && s.ts <= Date.now() + hourlyStepH * 12 * HOUR)
        .slice(0, 12);

    /** Windy 时间条当前时刻（毫秒），用于计算“当前”钓鱼指数 */
    let selectedTime = Date.now();
    /** 所选时刻是否即“现在”（界面徽章用） */
    let isNowTime = true;
    /** store.on('timestamp') 订阅 id */
    let timeListenerId = 0;

    /** 当前存在的恶劣条件（用于顶部警示） */
    interface CurrentSevere {
        kind: SevereKind;
        /** 预计结束时间戳，null 表示将持续 */
        end: number | null;
    }
    let currentSevere: CurrentSevere[] = [];

    let marker: L.Marker | null = null;
    let scListenerId = 0;
    let requestSeq = 0;

    const wavesModelOf = (model: string): string => {
        if (model === 'gfs') return 'gfsWaves';
        if (model === 'icon') return 'iconEuWaves';
        return 'ecmwfWaves';
    };

    const hideMarker = () => {
        if (marker) {
            marker.remove();
            marker = null;
        }
    };

    const showMarker = (lat: number, lon: number) => {
        hideMarker();
        const icon = new L.DivIcon({
            className: 'icon-dot fa-marker',
            html: '<div class="pulsating-icon repeat"></div>',
            iconSize: [10, 10],
            iconAnchor: [5, 5],
        });
        marker = L.marker([lat, lon], { draggable: true, icon }).addTo(map);
        marker.on('dragend', (ev: L.DragEndEvent) => {
            const { lat: la, lng } = (ev.target as L.Marker).getLatLng();
            setLocation({ lat: la, lon: lng });
        });
    };

    /** 设置钓点并加载数据 */
    const setLocation = (latLon: LatLon) => {
        loc = { lat: latLon.lat, lon: latLon.lon };
        hideMarker();
        showMarker(latLon.lat, latLon.lon);
        reverse
            .get(loc)
            .then(({ name: n }) => {
                reverseName = n;
                setTitle(`🎣 ${t('pluginName')} · ${n}`);
            })
            .catch(() => {
                reverseName = '';
            });
        loadData(latLon.lat, latLon.lon);
    };

    /** 计算评分序列的实际步长（小时），取中位数 */
    const hourlyStepOf = (segs: SegmentScore[]): number => {
        if (segs.length < 2) return 0;
        const diffs = segs.slice(1).map((s, i) => s.ts - segs[i].ts);
        const sorted = [...diffs].sort((a, b) => a - b);
        return Math.round(sorted[Math.floor(sorted.length / 2)] / HOUR);
    };

    /**
     * 根据 Windy 时间条当前时刻重算“当前”钓鱼指数、
     * 所选时刻所在“日”的最佳时段以及恶劣天气警示。
     */
    const applySelectedTime = () => {
        if (!air || segments.length === 0) return;
        nowScore = closestSegment(segments, selectedTime);
        isNowTime = !!nowScore && closestSegment(segments, Date.now())?.ts === nowScore.ts;

        // 当前恶劣条件（用于顶部警示）
        const nowSegIdx = nowScore ? segments.indexOf(nowScore) : -1;
        currentSevere =
            nowSegIdx >= 0
                ? segments[nowSegIdx].severeKinds.map(kind => ({
                      kind,
                      end: severeEndTs(segments, kind, nowSegIdx),
                  }))
                : [];

        // 所选时刻所在“日”的最佳时段
        const offset = air.celestial?.TZoffset ?? air.header.utcOffset ?? 0;
        const dayTs = selectedTime + offset * HOUR;
        const dayKey =
            new Date(dayTs).getUTCFullYear() * 10000 +
            (new Date(dayTs).getUTCMonth() + 1) * 100 +
            new Date(dayTs).getUTCDate();
        const daySegs = segments.filter(seg => {
            const d = new Date(seg.ts + offset * HOUR);
            return (
                d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate() ===
                dayKey
            );
        });
        bestToday = daySegs.length
            ? daySegs.reduce((a, b) => (b.total > a.total ? b : a), daySegs[0])
            : nowScore;
    };

    /** 加载 Windy 点预报数据（大气 + 海浪 + 预警） */
    const loadData = async (lat: number, lon: number) => {
        const mySeq = ++requestSeq;
        loading = true;
        error = '';
        try {
            const [airRes, wavesRes, alertsRes, hourlyRes] = await Promise.allSettled([
                getPointForecastData(selectedModel, { lat, lon, days: 5, step: 3, source: 'detail' }, INCLUDE),
                getPointForecastData(wavesModelOf(selectedModel), { lat, lon, days: 3, step: 3, source: 'detail' }, WAVES_INCLUDE),
                getCapAlertsSummary({ lat, lon }, 'detail'),
                getPointForecastData(selectedModel, { lat, lon, days: 2, step: 1, source: 'detail' }, HOURLY_INCLUDE),
            ]);

            // 丢弃过期请求的结果
            if (mySeq !== requestSeq) return;

            // 先处理海浪数据，供指数计算中的大浪检测使用
            if (wavesRes.status === 'fulfilled' && wavesRes.value.data?.data) {
                waves = wavesRes.value.data as unknown as WeatherDataPayload2<WavesDataHash2>;
            } else {
                waves = null;
            }

            if (airRes.status === 'fulfilled') {
                const payload = airRes.value.data;
                if (!payload || !payload.data) {
                    throw new Error('未能获取该地点的预报数据（可能不在所选模型覆盖范围）');
                }
                air = payload as unknown as WeatherDataPayload2<DataHash2>;

                // 计算各时段钓鱼指数（含恶劣条件安全扣分），并按时间条时刻定位“当前”指数
                segments = computeSegments(air.data, air.celestial, waves?.data ?? null);
                primes = primeWindows(air.celestial);
                daily = computeDaily(air.data, segments, air.summary, air.celestial);
                applySelectedTime();
            } else {
                throw new Error((airRes.reason as Error)?.message || '获取气象数据失败');
            }

            if (alertsRes.status === 'fulfilled' && alertsRes.value.data) {
                alerts = alertsRes.value.data;
            } else {
                alerts = [];
            }

            // 未来小时逐小时指数：仅用点预报，按实际步长展示 12 个点（1h → 12h，3h → 36h）
            hourlySegments = [];
            if (hourlyRes.status === 'fulfilled' && hourlyRes.value.data?.data) {
                const pf = hourlyRes.value.data;
                hourlySegments = computeSegments(
                    pf.data as unknown as DataHash2,
                    pf.celestial as unknown as Celestial | undefined,
                    waves?.data ?? null,
                );
            }
            console.log(
                `[FishingAssistant] 未来小时指数：${hourlySegments.length} 个点，步长 ${hourlyStepOf(
                    hourlySegments,
                )}h`,
            );
        } catch (e) {
            if (mySeq !== requestSeq) return;
            console.error('Fishing assistant error:', e);
            error = (e as Error)?.message || String(e);
        } finally {
            if (mySeq === requestSeq) {
                loading = false;
            }
        }
    };

    /** 手动刷新（切换模型后） */
    const refresh = () => {
        if (loc) loadData(loc.lat, loc.lon);
    };

    /** 定位到我的位置 */
    const locateMe = () => {
        getGPSlocation()
            .then(geo => {
                const zoom = Math.max(8, map.getZoom());
                map.setView([geo.lat, geo.lon], zoom, { animate: true });
                setLocation({ lat: geo.lat, lon: geo.lon });
            })
            .catch(e => {
                console.error(e);
                error = '无法获取 GPS 位置';
            });
    };

    /** 快捷切换地图图层 */
    const setOverlay = (ovl: string) => {
        store.set('overlay', ovl as Overlays);
    };

    /** 工具函数（用于模板展示） */
    const val = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : String(Math.round(x * 10) / 10);

    const tempText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.temp.convertValue(x);

    const windText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.wind.convertValue(x);

    const pressureText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.pressure.convertValue(x);

    const wavesText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.waves.convertValue(x);

    const pressureTrend = (idx: number, lang: Lang): string => {
        if (!air) return '--';
        const p = air.data.pressure[idx];
        const pp = idx > 0 ? air.data.pressure[idx - 1] : null;
        if (p === null || p === undefined || Number.isNaN(p)) return '--';
        if (pp === null || pp === undefined || Number.isNaN(pp)) return '--';
        const d = (p - pp) / 100;
        if (Math.abs(d) < 0.3) return lang === 'en' ? 'Stable' : '稳定';
        return d > 0 ? `↑ +${d.toFixed(1)} hPa` : `↓ ${d.toFixed(1)} hPa`;
    };

    const humidityText = (idx: number): string => {
        if (!air?.meteogram) return '--';
        const rh = relativeHumidity(air.data.temperature[idx], air.meteogram.dewPoint[idx]);
        return rh === null ? '--' : `${Math.round(rh)}%`;
    };

    const cloudText = (idx: number): string => {
        if (!air?.meteogram) return '--';
        const c = air.meteogram['cloud-surface']?.[idx];
        return c === null || c === undefined || Number.isNaN(c) ? '--' : `${Math.round(c)}%`;
    };

    const rainText = (idx: number): string => {
        if (!air) return '--';
        const p = air.data.precipAmount[idx];
        return p === null || p === undefined || Number.isNaN(p) ? '0 mm' : metrics.rain.convertValue(p);
    };

    const elevationText = (): string => {
        if (!air) return '--';
        return `${Math.round(air.header.elevation)} m`;
    };

    const primeScoreText = (p: PrimeWindow, lang: Lang): string => {
        if (!segments.length) return '';
        const inWin = segments.filter(s => s.ts >= p.start && s.ts <= p.end);
        if (!inWin.length) return '';
        const best = inWin.reduce((a, b) => (b.total > a.total ? b : a), inWin[0]);
        return _translate(
            'primeEst',
            {
                score: best.total,
                level: levelLabel(scoreLevel(best.total).level, lang),
            },
            lang,
        );
    };

    const hasWavesData = (w: WeatherDataPayload2<WavesDataHash2>): boolean =>
        !!w.data && Array.isArray(w.data.waves) && w.data.waves.some(v => v !== null && !Number.isNaN(v));

    const wavesSwell1Text = (idx: number, lang: Lang): string => {
        if (!waves) return '--';
        const h = waves.data.swell1?.[idx];
        if (h === null || h === undefined || Number.isNaN(h)) return '--';
        const per = waves.data.swell1Period?.[idx];
        const dir = waves.data.swell1Dir?.[idx];
        return `${wavesText(h)}${per != null && !Number.isNaN(per) ? ` / ${Math.round(per)}s` : ''}${dir != null && !Number.isNaN(dir) ? ` ${dir2compass(dir, lang)}` : ''}`;
    };

    const sstText = (): string => {
        if (air?.header.sst !== undefined && air.header.sst !== null && !Number.isNaN(air.header.sst)) {
            return tempText(air.header.sst);
        }
        return '--';
    };

    const updateText = (): string => {
        if (!air?.header.update) return '--';
        const d = new Date(air.header.update);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
            d.getUTCDate(),
        ).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(
            d.getUTCMinutes(),
        ).padStart(2, '0')} UTC`;
    };

    const alertSeverityClass = (sev: string): boolean =>
        sev === 'S' || sev === 'E' || sev === 'Severe' || sev === 'Extreme';

    const alertTimeText = (a: CapAlertHeadline): string => {
        if (!air) return '';
        const offset = air.celestial?.TZoffset ?? 0;
        return `${formatLocalTime(a.start, offset)} – ${formatLocalTime(a.end, offset)}`;
    };

    /** 插件打开时：优先使用上下文菜单传入的地点，否则使用地图中心 */
    export const onopen = (params?: unknown) => {
        if (isValidLatLonObj(params)) {
            const zoom = Math.max(8, map.getZoom());
            map.setView([params.lat, params.lon], zoom, { animate: true });
            setLocation({ lat: params.lat, lon: params.lon });
        } else {
            const c = map.getCenter();
            setLocation({ lat: c.lat, lon: c.lng });
        }
    };

    onMount(() => {
        // 语言：用户手动选择优先，否则自动检测（简体中文用户自动切换为中文）
        lang = loadSavedLang() ?? detectLang();
        setLang(lang);
        scListenerId = singleclick.on(name, (ev: LatLon) => {
            setLocation(ev);
        });

        // 跟随 Windy 时间条：初始取时间条当前时刻，之后监听变化实时重算
        try {
            const ts = store.get('timestamp');
            if (typeof ts === 'number' && !Number.isNaN(ts)) {
                selectedTime = ts;
            }
        } catch {
            /* store 未就绪时忽略 */
        }
        timeListenerId = store.on('timestamp', (ts: number) => {
            selectedTime = ts;
            applySelectedTime();
        });
    });

    onDestroy(() => {
        singleclick.off(scListenerId);
        store.off(timeListenerId);
        hideMarker();
    });
</script>

<style lang="less">
    .fa-root {
        padding-bottom: 30px;
    }

    .fa-toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 14px;

        .fa-model {
            font-size: 12px;
            color: #9aa7b4;
            display: flex;
            align-items: center;
            gap: 6px;

            select {
                background: #1e2430;
                color: #e8ecf0;
                border: 1px solid #2f3a48;
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 13px;
                outline: none;
            }
        }

        .fa-locate {
            margin: 0;
        }

        .fa-lang {
            background: #1e2430;
            color: #e8ecf0;
            border: 1px solid #2f3a48;
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 13px;
            cursor: pointer;

            &:hover {
                border-color: #3d87ff;
            }
        }

        .fa-hint {
            font-size: 11px;
            color: #7f8b99;
            margin-left: auto;
        }
    }

    .fa-loading {
        padding: 24px;
        text-align: center;
        color: #9aa7b4;
        font-size: 14px;
    }

    .fa-error {
        padding: 8px 12px;
    }

    .fa-warn {
        background: linear-gradient(135deg, #3a1f1f 0%, #46221f 100%);
        border: 1px solid #7a2f28;
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 14px;

        .fa-warn-title {
            font-size: 14px;
            font-weight: 700;
            color: #ffd27a;
            margin-bottom: 8px;
        }

        .fa-warn-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 6px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.08);

            &:first-of-type {
                border-top: none;
            }

            .fa-warn-emoji {
                font-size: 20px;
                line-height: 1.3;
            }

            .fa-warn-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .fa-warn-label {
                font-size: 13px;
                font-weight: 700;
                color: #ffb4a2;
            }

            .fa-warn-msg {
                font-size: 12px;
                color: #e8d5cf;
                line-height: 1.5;
            }

            .fa-warn-end {
                font-size: 12px;
                color: #ffd27a;
                font-variant-numeric: tabular-nums;
            }
        }
    }

    .fa-card {
        background: #171d27;
        border: 1px solid #232b38;
        border-radius: 10px;
        padding: 14px 14px 12px;
        margin-bottom: 14px;

        .fa-section-title {
            font-size: 13px;
            font-weight: 600;
            color: #aeb9c4;
            letter-spacing: 0.5px;
            margin-bottom: 10px;

            .fa-time-chip {
                display: inline-block;
                margin-left: 6px;
                font-size: 11px;
                font-weight: 500;
                color: #7ec8ff;
                background: rgba(62, 135, 255, 0.14);
                border: 1px solid rgba(62, 135, 255, 0.35);
                border-radius: 999px;
                padding: 1px 8px;
                vertical-align: middle;
            }

            .fa-fcst-badge {
                display: inline-block;
                margin-left: 6px;
                font-size: 11px;
                font-weight: 500;
                color: #f1c40f;
                background: rgba(241, 196, 15, 0.12);
                border: 1px solid rgba(241, 196, 15, 0.35);
                border-radius: 999px;
                padding: 1px 8px;
                vertical-align: middle;
            }

            .fa-step-note {
                font-size: 11px;
                font-weight: 400;
                color: #7f8b99;
                margin-left: 6px;
            }
        }
    }

    .fa-card--hero {
        background: linear-gradient(135deg, #16222e 0%, #1b2a3a 100%);
        border-color: #2a3b4d;
    }

    .fa-hero {
        display: flex;
        align-items: center;
        gap: 18px;
    }

    .fa-gauge {
        position: relative;
        width: 120px;
        height: 120px;
        flex-shrink: 0;

        .fa-gauge-center {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .fa-score {
            font-size: 34px;
            font-weight: 700;
            line-height: 1;
            color: #fff;
        }

        .fa-level {
            font-size: 13px;
            font-weight: 600;
            margin-top: 4px;
        }
    }

    .fa-hero-side {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .fa-now-weather {
            display: flex;
            align-items: center;
            gap: 8px;

            .fa-emoji {
                font-size: 28px;
            }

            .fa-now-temp {
                font-size: 26px;
                font-weight: 600;
                color: #fff;
            }
        }

        .fa-now-desc {
            font-size: 14px;
            color: #aeb9c4;
        }

        .fa-now-time {
            font-size: 12px;
            color: #7f8b99;
        }
    }

    .fa-breakdown {
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .fa-bd-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;

            .fa-bd-name {
                width: 96px;
                color: #9aa7b4;
                flex-shrink: 0;
                text-align: right;
            }

            .fa-bd-bar {
                flex: 1;
                height: 6px;
                background: #2a3442;
                border-radius: 3px;
                overflow: hidden;

                .fa-bd-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #2ecc71, #27ae60);
                    border-radius: 3px;
                    transition: width 0.4s ease;
                }
            }

            .fa-bd-val {
                width: 40px;
                color: #cfd8e0;
                flex-shrink: 0;
                text-align: right;
                font-variant-numeric: tabular-nums;
            }

            &--safety {
                .fa-bd-name {
                    color: #ffb4a2;
                }

                .fa-bd-fill--neg {
                    background: linear-gradient(90deg, #e74c3c, #c0392b);
                }

                .fa-bd-val--neg {
                    color: #e74c3c;
                    font-weight: 700;
                }
            }
        }
    }

    .fa-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;

        .fa-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            background: #12161d;
            border-radius: 8px;
            padding: 8px 4px;

            .fa-item-icon {
                font-size: 16px;
            }

            .fa-item-label {
                font-size: 11px;
                color: #7f8b99;
            }

            .fa-item-val {
                font-size: 13px;
                font-weight: 600;
                color: #e8ecf0;
                text-align: center;
                font-variant-numeric: tabular-nums;
            }
        }
    }

    .fa-sun {
        display: flex;
        justify-content: space-around;
        font-size: 14px;
        color: #cfd8e0;
        margin-bottom: 12px;

        b {
            color: #f7c948;
        }
    }

    .fa-prime-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .fa-prime {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #12161d;
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 13px;

            .fa-prime-emoji {
                font-size: 18px;
            }

            .fa-prime-label {
                color: #cfd8e0;
                font-weight: 600;
            }

            .fa-prime-time {
                color: #f7c948;
                font-variant-numeric: tabular-nums;
            }

            .fa-prime-score {
                margin-left: auto;
                color: #9aa7b4;
                font-size: 12px;
            }
        }
    }

    .fa-days {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .fa-day {
            background: #12161d;
            border-radius: 8px;
            padding: 10px 12px;

            &--today {
                border: 1px solid #2a3b4d;
            }

            .fa-day-head {
                display: flex;
                align-items: center;
                gap: 8px;

                .fa-day-weekday {
                    font-weight: 700;
                    color: #fff;
                    font-size: 14px;
                }

                .fa-day-date {
                    color: #7f8b99;
                    font-size: 12px;
                }

                .fa-day-icon {
                    margin-left: auto;
                    font-size: 18px;
                }
            }

            .fa-day-temps {
                font-size: 12px;
                color: #9aa7b4;
                margin: 4px 0 8px;
                font-variant-numeric: tabular-nums;
            }

            .fa-day-score-row {
                display: flex;
                align-items: center;
                gap: 8px;

                .fa-day-bar {
                    flex: 1;
                    height: 8px;
                    background: #232b38;
                    border-radius: 4px;
                    overflow: hidden;

                    .fa-day-fill {
                        height: 100%;
                        border-radius: 4px;
                        transition: width 0.4s ease;
                    }
                }

                .fa-day-score {
                    font-size: 15px;
                    font-weight: 700;
                    color: #fff;
                    width: 26px;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }

                .fa-day-level {
                    font-size: 12px;
                    font-weight: 600;
                    width: 32px;
                }
            }

            .fa-day-best {
                font-size: 11px;
                color: #7f8b99;
                margin-top: 4px;
                font-variant-numeric: tabular-nums;
            }

            .fa-day-pred {
                font-size: 11px;
                color: #5c6b7a;
                margin-top: 2px;
            }
        }
    }

    .fa-hours {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
        gap: 8px;

        .fa-hour {
            background: #12161d;
            border-radius: 8px;
            padding: 8px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;

            &--now {
                border: 1px solid #2a3b4d;
            }

            .fa-hour-time {
                font-size: 12px;
                font-weight: 700;
                color: #fff;
                font-variant-numeric: tabular-nums;
            }

            .fa-hour-icon {
                font-size: 18px;
                line-height: 1;
            }

            .fa-hour-score {
                font-size: 18px;
                font-weight: 700;
                color: #fff;
                line-height: 1;
                font-variant-numeric: tabular-nums;
            }

            .fa-hour-level {
                font-size: 10px;
                line-height: 1;
            }

            .fa-hour-bar {
                width: 100%;
                height: 4px;
                background: #232b38;
                border-radius: 2px;
                overflow: hidden;

                .fa-hour-fill {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.4s ease;
                }
            }
        }
    }

    .fa-alert {
        background: #12161d;
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 8px;
        border-left: 3px solid #f1c40f;

        &--sev {
            border-left-color: #e74c3c;
        }

        .fa-alert-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #e8ecf0;

            .fa-alert-sev {
                font-size: 11px;
                color: #f1c40f;
                border: 1px solid #f1c40f;
                border-radius: 4px;
                padding: 0 4px;

                .fa-alert--sev & {
                    color: #e74c3c;
                    border-color: #e74c3c;
                }
            }
        }

        .fa-alert-event {
            font-size: 12px;
            color: #9aa7b4;
            margin-top: 2px;
        }

        .fa-alert-time {
            font-size: 11px;
            color: #7f8b99;
            margin-top: 2px;
        }
    }

    .fa-layers {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .fa-layer {
            background: #12161d;
            color: #cfd8e0;
            border: 1px solid #2a3442;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 13px;
            cursor: pointer;

            &:hover {
                border-color: #3d87ff;
                color: #fff;
            }
        }
    }

    .fa-footer {
        font-size: 11px;
        color: #5c6b7a;
        line-height: 1.6;
        padding: 4px 4px 10px;
    }

    .fa-beta {
        background: #1b2533;
        border: 1px dashed #3a4c63;
        border-radius: 10px;
        padding: 12px 14px;
        margin-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .fa-beta-title {
            font-size: 13px;
            font-weight: 700;
            color: #f7c948;
        }

        .fa-beta-text {
            font-size: 12px;
            color: #aeb9c4;
            line-height: 1.6;
        }

        .fa-beta-link,
        .fa-beta-repo {
            font-size: 13px;
            color: #3d87ff;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }

        .fa-beta-repo {
            font-size: 12px;
        }
    }

    :global(.fa-marker) {
        z-index: 1000;
        cursor: move;
    }
</style>

