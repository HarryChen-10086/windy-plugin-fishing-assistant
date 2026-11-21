<div class="plugin__mobile-header">
    {t('pluginName')}
</div>
<section class="plugin__content fa-root">
    <!-- 标题即返回按钮：Windy 侧栏模板惯用 div + on:click，保持外观不变 -->
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={() => bcast.emit('rqstOpen', 'menu')}
    >
        {t('pluginName')}
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
        <div class="fa-loading" role="status" aria-live="polite">{t('loading')}</div>
    {/if}

    {#if error}
        <div class="rounded-box bg-error size-s mt-10 fa-error" role="alert">
            ⚠️ {error}
            <button class="fa-retry" on:click={refresh}>{t('retry')}</button>
        </div>
    {/if}

    {#if air && nowScore}
        {@const offset = tzOffsetOf()}
        {@const weather = weatherText(nowScore.icon, lang)}
        {@const level = scoreLevel(nowScore.total)}

        <!-- 恶劣天气警示（最上方） -->
        {#if currentSevere.length > 0}
            <div class="fa-warn" role="alert">
                <div class="fa-warn-title">
                    ⚠️ {t('severeTitle')}
                    {#if !isNowTime}
                        <span class="fa-fcst-badge">{t('forecastTime')}</span>
                    {/if}
                </div>
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
                    <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false">
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
                    <span class="fa-bd-name">{t('moonLine', { phase: moonPhaseText(air.data.moonPhase[nowIdx], lang) })}</span>
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
                <div class="fa-item"><span class="fa-item-icon">🌧️</span><span class="fa-item-label">{t('lblPrecipStep', { h: airStepHours })}</span><span class="fa-item-val">{rainText(nowIdx)}</span></div>
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
                        <span class="fa-prime-time">{p.date} {formatLocalTime(p.start, offset)} – {formatLocalTime(p.end, offset)}</span>
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
                    {#each hourly12 as h}
                        {@const hl = scoreLevel(h.total)}
                        <div class="fa-hour" class:fa-hour--now={isCurrentStep(h.ts, nowTs, hourlyStepH)}>
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
                {#each upcomingDays as d}
                    {@const dl = scoreLevel(d.best.total)}
                    {@const isToday = localDayKey(d.timestamp, offset) === todayKey}
                    <div class="fa-day" class:fa-day--today={isToday}>
                        <div class="fa-day-head">
                            <span class="fa-day-weekday">{isToday ? t('today') : weekdayName(d.timestamp, offset, lang)}</span>
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
        {#if waves && hasWavesData(waves) && waveIdx !== null}
            {@const wIdx = waveIdx}
            <div class="fa-card">
                <div class="fa-section-title">{t('wavesTitle')}</div>
                <div class="fa-grid">
                    <div class="fa-item"><span class="fa-item-icon">🌊</span><span class="fa-item-label">{t('lblWaveHeight')}</span><span class="fa-item-val">{wavesText(waves.data.waves[wIdx])}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">🔄</span><span class="fa-item-label">{t('lblPeriod')}</span><span class="fa-item-val">{periodText(waves.data.wavesPeriod[wIdx])}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">🧭</span><span class="fa-item-label">{t('lblWaveDir')}</span><span class="fa-item-val">{dir2compass(waves.data.wavesDir[wIdx], lang)}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">🌊</span><span class="fa-item-label">{t('lblSwell1')}</span><span class="fa-item-val">{wavesSwell1Text(wIdx, lang)}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">🌡️</span><span class="fa-item-label">{t('lblSeaTemp')}</span><span class="fa-item-val">{sstText()}</span></div>
                    <div class="fa-item"><span class="fa-item-icon">⚡</span><span class="fa-item-label">{t('lblWavePower')}</span><span class="fa-item-val">{wavePowerText(waves.data.wavesPower[wIdx])}</span></div>
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

    <!-- 项目地址（页面最下方） -->
    <div class="fa-project">
        <a
            class="fa-project-link"
            href="https://github.com/HarryChen-10086/windy-plugin-fishing-assistant"
            target="_blank"
            rel="noreferrer"
        >
            {t('projectLink')}
        </a>
    </div>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { getGPSlocation } from '@windy/geolocation';
    import { map } from '@windy/map';
    import { setTitle, setUrl } from '@windy/location';
    import * as reverse from '@windy/reverseName';
    import { singleclick } from '@windy/singleclick';
    import store from '@windy/store';
    import metrics from '@windy/metrics';
    import { normalizeLatLon } from '@windy/utils';
    import { getCapAlertsSummary, getPointForecastData } from '@windy/fetch';

    import { onDestroy, onMount } from 'svelte';

    import config from './pluginConfig';
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
        closestIndexWithin,
        closestSegment,
        computeDaily,
        computeSegments,
        formatLocalDateTime,
        formatLocalTime,
        localDayKey,
        primeWindows,
        relativeHumidity,
        scoreLevel,
        severeEndTs,
        stepHoursOf,
    } from './fishingIndex';
    import { isCurrentStep, pickHourlyWindow } from './hourlyWindow';
    import { isSameSpot, parseLatLonParams, toLatLonParams } from './pluginParams';

    import type { LatLon } from '@windy/interfaces';

    import type {
        CapAlertHeadline,
        Celestial,
        DataHash2,
        Lang,
        SevereKind,
        WavesDataHash2,
        WeatherDataPayload2,
    } from './types';

    import type { DayScore, PrimeWindow, SegmentScore } from './fishingIndex';

    /** 快捷图层按钮可切换的叠加层（字面量联合：写错图层名在编译期就会报错） */
    type LayerOverlay = 'wind' | 'gust' | 'rain' | 'temp' | 'waves' | 'sst';

    const { name } = config;
    const HOUR = 3600 * 1000;
    const MINUTE = 60 * 1000;
    const INCLUDE = { header: true, celestial: true, meteogram: true, summary: true } as const;
    const WAVES_INCLUDE = { header: true, celestial: true, summary: true } as const;
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
        // 地名可能为空（反向地理编码失败），此时也要把标题的语言换过来
        if (loc) {
            applyTitle();
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
    /** nowScore 在 air.data 中的下标，供模板取温度/湿度/云量等原始字段 */
    let nowIdx = 0;
    let bestToday: SegmentScore | null = null;

    /** 未来小时逐小时指数（基于接口实际返回步长的数据） */
    let hourlySegments: SegmentScore[] = [];
    /** 接口实际返回的步长（小时），用于界面标注与窗口计算 */
    $: hourlyStepH = hourlySegments.length >= 2 ? hourlyStepOf(hourlySegments) : 1;
    /**
     * 当前真实的「现在」时刻（毫秒）。
     *
     * 单独用 state 而不是在响应式语句里直接调 Date.now()：Svelte 只跟踪语句里
     * 读写到的 state，Date.now() 不是 state，面板开久了窗口会一直停在打开的瞬间。
     * 定时器 + 时间条事件都会推进它，窗口随之滑动。
     */
    let nowTs = Date.now();
    /** 按实际步长取未来 12 个点（含正在进行的这一步）：1h → 12h，3h → 36h */
    $: hourly12 = pickHourlyWindow(hourlySegments, nowTs, hourlyStepH, 12);

    /** Windy 时间条当前时刻（毫秒），用于计算“当前”钓鱼指数 */
    let selectedTime = Date.now();
    /** 所选时刻是否即“现在”（界面徽章用） */
    let isNowTime = true;
    /** store.on('timestamp') 订阅 id，以及推进 nowTs 的定时器 id */
    let timeListenerId = 0;
    let tickTimerId: ReturnType<typeof setInterval> | null = null;
    /** bcast.on('metricChanged') 订阅 id */
    let metricListenerId = 0;
    /** 大气预报的实际步长（小时），用于给累计量标注时间窗口 */
    let airStepHours = 3;
    /** 当前时刻对应的海浪数据下标，超出海浪预报覆盖范围时为 null */
    let waveIdx: number | null = null;
    /** 海浪预报的实际步长（小时） */
    let waveStepHours = 3;
    /** 逐小时点预报的原始数据，供海浪晚到时重算使用 */
    let hourlyData: { data: DataHash2; celestial: Celestial | undefined } | null = null;

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
    /** 反向地理编码的请求序号，防止旧请求覆盖新钓点的地名 */
    let reverseSeq = 0;

    const wavesModelOf = (model: string): string => {
        if (model === 'gfs') {return 'gfsWaves';}
        if (model === 'icon') {return 'iconEuWaves';}
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

    /**
     * 更新标签页标题。地名（reverseName）可能为空，此时只显示插件名，
     * 不要把 `· ` 后面的空字符串留在标题里。
     */
    const applyTitle = () => {
        const place = reverseName ? ` · ${reverseName}` : '';
        setTitle(`🎣 ${_translate('pluginName', undefined, lang)}${place}`);
    };

    /**
     * 设置钓点并加载数据。
     * @param latLon 目标经纬度
     * @param syncUrl 是否把钓点写回 URL（由 URL/外部参数驱动的调用无需再写）
     */
    const setLocation = (latLon: LatLon, syncUrl = true) => {
        const next = toLatLonParams(latLon.lat, latLon.lon);
        const changed = !loc || !isSameSpot(loc, next);
        loc = next;
        if (!changed && air) {
            // 同一个点重复点击（或 onopen 被重复调用）：标记与数据都无需重来，
            // 只把标记摆正，避免白白打 4 个网络请求
            showMarker(latLon.lat, latLon.lon);
            return;
        }
        if (changed && syncUrl) {
            // 依据 Windy 文档：自身参数变化时用 setUrl 同步 URL，使链接可分享、刷新后保持钓点
            setUrl(name, next);
        }
        // 换点后先清掉上一个点的地名，避免新坐标配旧地名
        reverseName = '';
        hideMarker();
        showMarker(latLon.lat, latLon.lon);
        const myRevSeq = ++reverseSeq;
        reverse
            .get(loc)
            .then(({ name: n }) => {
                // 快速连续换点时丢弃过期结果，防止旧地名覆盖新钓点
                if (myRevSeq !== reverseSeq) {return;}
                reverseName = n;
                applyTitle();
            })
            .catch(() => {
                if (myRevSeq !== reverseSeq) {return;}
                reverseName = '';
                applyTitle();
            });
        loadData(latLon.lat, latLon.lon);
    };

    /** 计算评分序列的实际步长（小时），取中位数 */
    const hourlyStepOf = (segs: SegmentScore[]): number => {
        if (segs.length < 2) {return 0;}
        const diffs = segs.slice(1).map((s, i) => s.ts - segs[i].ts);
        const sorted = [...diffs].sort((a, b) => a - b);
        return Math.round(sorted[Math.floor(sorted.length / 2)] / HOUR);
    };

    /**
     * 当前地的 UTC 偏移（小时）。
     * 依次取 celestial（最准）、header.utcOffset，都没有时退回 UTC，
     * 界面与评分必须用同一个值，否则时间显示会整体错几个小时。
     */
    const tzOffsetOf = (): number => air?.celestial?.TZoffset ?? air?.header.utcOffset ?? 0;

    /**
     * 给定时刻对应的海浪数据下标。
     * 超出海浪预报覆盖范围时返回 null —— 海浪只取 3 天而大气取 5 天，
     * 直接取最近点会把最后一步的浪高一直沿用下去，第 4-5 天会凭空出现“大浪”。
     */
    const waveIndexOf = (ts: number): number | null => {
        if (!waves?.data?.ts) {return null;}
        const maxGap = Math.max(waveStepHours, 1) * 1.5 * HOUR;
        return closestIndexWithin(waves.data.ts, ts, maxGap);
    };

    /** 本地「今天」的日期键，用于给未来几天列表判断哪一行才是今天 */
    $: todayKey = localDayKey(nowTs, tzOffsetOf());
    /**
     * 未来几天列表：只保留今天及以后的日子。
     * 不能靠「第 0 项就是今天」——接口返回的 5 天数据在负时区下会从昨天开始，
     * 那样既会把昨天标成 Today，又会因为 slice(0, 5) 丢掉最后一天。
     */
    $: upcomingDays = daily
        .filter(d => localDayKey(d.timestamp, tzOffsetOf()) >= todayKey)
        .slice(0, 5);

    /**
     * 根据 Windy 时间条当前时刻重算“当前”钓鱼指数、
     * 所选时刻所在“日”的最佳时段以及恶劣天气警示。
     */
    const applySelectedTime = () => {
        if (!air || segments.length === 0) {return;}
        nowScore = closestSegment(segments, selectedTime);
        isNowTime = !!nowScore && closestSegment(segments, nowTs)?.ts === nowScore.ts;

        // 当前恶劣条件（用于顶部警示）
        const nowSegIdx = nowScore ? segments.indexOf(nowScore) : -1;
        // 同一时间步在原始点预报里的下标，模板用它取温度/湿度/云量等字段。
        // 放在这里算一次，避免模板每次重渲染都做一遍 indexOf（长度可达上百）
        nowIdx = nowScore ? Math.max(0, air.data.ts.indexOf(nowScore.ts)) : 0;
        currentSevere =
            nowSegIdx >= 0
                ? segments[nowSegIdx].severeKinds.map(kind => ({
                      kind,
                      end: severeEndTs(segments, kind, nowSegIdx),
                  }))
                : [];

        // 所选时刻所在「本地日」的最佳时段
        const offset = tzOffsetOf();
        const selectedDay = localDayKey(selectedTime, offset);
        const stepMs = Math.max(airStepHours, 1) * HOUR;
        let daySegs = segments.filter(seg => localDayKey(seg.ts, offset) === selectedDay);
        if (selectedDay === localDayKey(nowTs, offset)) {
            // 看「今天」时排除已经过去的时间步，否则下午还在推荐清晨那个黄金时段
            daySegs = daySegs.filter(seg => seg.ts + stepMs > nowTs);
        }
        // 当天已无剩余数据就干脆不显示，而不是把「当前」冒充成「当日最佳」
        bestToday = daySegs.length
            ? daySegs.reduce((a, b) => (b.total > a.total ? b : a), daySegs[0])
            : null;

        // 「当前」时刻对应的海浪下标（超出海浪预报覆盖范围时为 null）
        waveIdx = nowScore ? waveIndexOf(nowScore.ts) : null;
    };

    /** 清空当前钓点的全部计算结果（换点/加载失败时避免继续显示上一个钓点的数据） */
    const resetData = () => {
        air = null;
        waves = null;
        alerts = [];
        segments = [];
        daily = [];
        primes = [];
        nowScore = null;
        nowIdx = 0;
        bestToday = null;
        hourlySegments = [];
        currentSevere = [];
        waveIdx = null;
        hourlyData = null;
    };

    /** 用当前的 air / waves / hourly 数据重算所有派生结果 */
    const recompute = () => {
        if (!air) {return;}
        airStepHours = stepHoursOf(air.data.ts);
        waveStepHours = waves?.data?.ts ? stepHoursOf(waves.data.ts) : airStepHours;
        // 海浪数据可能比大气数据晚到，那时要带上浪高重算一遍安全扣分
        segments = computeSegments(air.data, air.celestial, waves?.data ?? null);
        primes = primeWindows(air.celestial);
        daily = computeDaily(air.data, segments, air.summary, air.celestial);
        if (hourlyData) {
            hourlySegments = computeSegments(hourlyData.data, hourlyData.celestial, waves?.data ?? null);
        }
        applySelectedTime();
    };

    /**
     * 加载 Windy 点预报数据（大气 + 海浪 + 预警 + 逐小时）。
     *
     * 四个请求各自独立落地：大气数据一到就渲染主内容，海浪/预警/逐小时随后补齐。
     * 如果等 Promise.allSettled 全部 resolve，任何一个接口卡住都会让整个面板
     * 永远停在 “Loading…”，而主预报其实早就到手了。
     */
    const loadData = async (lat: number, lon: number) => {
        const mySeq = ++requestSeq;
        loading = true;
        error = '';
        // 换点瞬间先清空：时间条事件会立刻用 segments 重算，不清就会拿旧钓点的
        // 数据算出「新钓点的指数」并显示在新地名下面
        resetData();

        const stale = () => mySeq !== requestSeq;

        const airTask = getPointForecastData(
            selectedModel,
            { lat, lon, days: 5, step: 3, source: 'detail' },
            INCLUDE,
        )
            .then(res => {
                if (stale()) {return;}
                const payload = res.data;
                if (!payload || !payload.data) {
                    throw new Error(_translate('errNoForecast', undefined, lang));
                }
                air = payload as unknown as WeatherDataPayload2<DataHash2>;
                recompute();
            })
            .catch(reason => {
                if (stale()) {return;}
                // 原始错误只留在控制台，界面上一律用本地化文案
                console.error('Fishing assistant error:', reason);
                resetData();
                error = _translate('errFetchFailed', undefined, lang);
            })
            .finally(() => {
                if (!stale()) {loading = false;}
            });

        const wavesTask = getPointForecastData(
            wavesModelOf(selectedModel),
            { lat, lon, days: 3, step: 3, source: 'detail' },
            WAVES_INCLUDE,
        )
            .then(res => {
                if (stale()) {return;}
                const payload = res.data;
                if (payload?.data) {
                    waves = payload as unknown as WeatherDataPayload2<WavesDataHash2>;
                    // 大气数据已在场时，带上浪高重算一遍（含「大浪」安全扣分）
                    if (air) {recompute();}
                }
            })
            .catch(() => {
                // 内陆/无海浪数据是正常情况，静默忽略
            });

        const alertsTask = getCapAlertsSummary({ lat, lon }, 'detail')
            .then(res => {
                if (stale()) {return;}
                alerts = res.data ?? [];
            })
            .catch(() => {
                /* 预警非核心数据，失败不影响指数 */
            });

        const hourlyTask = getPointForecastData(
            selectedModel,
            { lat, lon, days: 2, step: 1, source: 'detail' },
            HOURLY_INCLUDE,
        )
            .then(res => {
                if (stale()) {return;}
                const payload = res.data;
                if (!payload?.data) {return;}
                hourlyData = {
                    data: payload.data as unknown as DataHash2,
                    celestial: payload.celestial as unknown as Celestial | undefined,
                };
                if (air) {recompute();}
            })
            .catch(() => {
                /* 逐小时仅用点预报，失败时隐藏该卡片 */
            });

        // 逐个请求自己消化错误，这里只需等它们都结束，不会被任何一个卡死主流程
        await Promise.all([airTask, wavesTask, alertsTask, hourlyTask]);
    };

    /** 手动刷新（切换模型后） */
    const refresh = () => {
        if (loc) {loadData(loc.lat, loc.lon);}
    };

    /**
     * 只重算展示层（不重新请求数据）。
     * 用户切换 Windy 的单位设置时用：所有数值都经 metrics.*.convertValue 输出，
     * 单位变了必须让 Svelte 重新跑一遍模板，而 metrics 内部状态不是 Svelte 的
     * 响应式变量，只能靠把模板读到的 state 换成新引用触发重渲染。
     */
    const refreshView = () => {
        if (air) {air = { ...air };}
        if (waves) {waves = { ...waves };}
        nowTs = Date.now();
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
                error = _translate('errGps', undefined, lang);
            });
    };

    /**
     * 快捷切换地图图层。
     * 图层名收窄成 LayerOverlay，写错在编译期就报错；`store.set` 对 'overlay'
     * 是异步 store，返回 Promise，这里显式忽略（切换失败不影响插件其它功能）。
     */
    const setOverlay = (ovl: LayerOverlay) => {
        void Promise.resolve(store.set('overlay', ovl)).catch(() => {
            /* 图层切换失败无需打扰用户 */
        });
    };

    /** 工具函数：数值保留一位小数（无单位的纯数字展示才用它） */
    const tempText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.temp.convertValue(x);

    const windText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.wind.convertValue(x);

    const pressureText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.pressure.convertValue(x);

    const wavesText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.waves.convertValue(x);

    /** 海浪周期：Windy 的 metrics 里有 period（秒），交给它决定单位与小数位 */
    const periodText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x) ? '--' : metrics.period.convertValue(x);

    /** 波浪功率：Windy 的 metrics 里有 wavePower（kW/m） */
    const wavePowerText = (x: number | null | undefined): string =>
        x === null || x === undefined || Number.isNaN(x)
            ? '--'
            : metrics.wavePower.convertValue(x);

    /** 气压变化趋势：单位换算交给 Windy 的 metrics，文字走 i18n */
    const pressureTrend = (idx: number, langSel: Lang): string => {
        if (!air) {return '--';}
        const p = air.data.pressure[idx];
        const pp = idx > 0 ? air.data.pressure[idx - 1] : null;
        if (p === null || p === undefined || Number.isNaN(p)) {return '--';}
        if (pp === null || pp === undefined || Number.isNaN(pp)) {return '--';}
        const delta = p - pp;
        // 30 Pa ≈ 0.3 hPa：小于该幅度视为「稳定」
        if (Math.abs(delta) < 30) {return _translate('stable', undefined, langSel);}
        const magnitude = metrics.pressure.convertValue(Math.abs(delta));
        return delta > 0 ? `↑ +${magnitude}` : `↓ ${magnitude}`;
    };

    const humidityText = (idx: number): string => {
        if (!air?.meteogram) {return '--';}
        const rh = relativeHumidity(air.data.temperature[idx], air.meteogram.dewPoint[idx]);
        return rh === null ? '--' : `${Math.round(rh)}%`;
    };

    const cloudText = (idx: number): string => {
        if (!air?.meteogram) {return '--';}
        const c = air.meteogram['cloud-surface']?.[idx];
        return c === null || c === undefined || Number.isNaN(c) ? '--' : `${Math.round(c)}%`;
    };

    const rainText = (idx: number): string => {
        if (!air) {return '--';}
        const p = air.data.precipAmount[idx];
        // 缺数据时老实显示 '--'：点预报的 precipAmount 是「每个时间步的累计量」，
        // 把 null 当成 0 会在雷雨时显示“0 mm”，等于编数据
        if (p === null || p === undefined || Number.isNaN(p)) {return '--';}
        return metrics.rain.convertValue(p);
    };

    const elevationText = (): string => {
        if (!air) {return '--';}
        const elev = air.header.elevation;
        if (elev === null || elev === undefined || Number.isNaN(elev)) {return '--';}
        return metrics.elevation.convertValue(elev);
    };

    const primeScoreText = (p: PrimeWindow, langSel: Lang): string => {
        if (!segments.length) {return '';}
        let inWin = segments.filter(s => s.ts >= p.start && s.ts <= p.end);
        if (!inWin.length) {
            // 窗口内无数据点（如清晨窗口早于预报数据起点）：取最接近窗口中心的时段
            const nearest = closestSegment(segments, (p.start + p.end) / 2);
            if (!nearest) {return '';}
            inWin = [nearest];
        }
        const best = inWin.reduce((a, b) => (b.total > a.total ? b : a), inWin[0]);
        return _translate(
            'primeEst',
            {
                score: best.total,
                level: levelLabel(scoreLevel(best.total).level, langSel),
            },
            langSel,
        );
    };

    const hasWavesData = (w: WeatherDataPayload2<WavesDataHash2>): boolean =>
        !!w.data && Array.isArray(w.data.waves) && w.data.waves.some(v => v !== null && !Number.isNaN(v));

    const wavesSwell1Text = (idx: number, langSel: Lang): string => {
        if (!waves) {return '--';}
        const h = waves.data.swell1?.[idx];
        if (h === null || h === undefined || Number.isNaN(h)) {return '--';}
        const per = waves.data.swell1Period?.[idx];
        const dir = waves.data.swell1Dir?.[idx];
        const perText = per != null && !Number.isNaN(per) ? ` / ${periodText(per)}` : '';
        const dirText = dir != null && !Number.isNaN(dir) ? ` ${dir2compass(dir, langSel)}` : '';
        return `${wavesText(h)}${perText}${dirText}`;
    };

    const sstText = (): string => {
        if (air?.header.sst !== undefined && air.header.sst !== null && !Number.isNaN(air.header.sst)) {
            return tempText(air.header.sst);
        }
        return '--';
    };

    const updateText = (): string => {
        if (!air?.header.update) {return '--';}
        const d = new Date(air.header.update);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
            d.getUTCDate(),
        ).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(
            d.getUTCMinutes(),
        ).padStart(2, '0')} UTC`;
    };

    const alertSeverityClass = (sev: string): boolean =>
        sev === 'S' || sev === 'E' || sev === 'Severe' || sev === 'Extreme';

    /**
     * 预警时段文字。
     * 用「M/D HH:MM」而不是只有时刻：跨天的预警只显示 22:00 – 04:00 会让人
     * 以为时间倒流；偏移量与面板其它时间显示共用 tzOffsetOf()，不单独退回 UTC。
     */
    const alertTimeText = (a: CapAlertHeadline): string => {
        if (!air) {return '';}
        const offset = tzOffsetOf();
        return `${formatLocalDateTime(a.start, offset)} – ${formatLocalDateTime(a.end, offset)}`;
    };

    /**
     * 插件打开时：优先使用 URL / 上下文菜单传入的地点，否则使用地图中心。
     * 依据 Windy 文档，onopen 里不改 URL 与标题，
     * 且 onopen 可能被多次调用，这里不挂任何监听器。
     */
    export const onopen = (params?: unknown) => {
        const target = parseLatLonParams(params);
        if (target) {
            const zoom = Math.max(8, map.getZoom());
            map.setView([target.lat, target.lon], zoom, { animate: true });
            setLocation(target, false);
        } else {
            const c = map.getCenter();
            setLocation({ lat: c.lat, lon: c.lng }, false);
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

        // 推进「现在」：时间条不动时 Date.now() 不会触发 Svelte 重算，
        // 未来小时窗口与“当日最佳”需要自己走时钟（每分钟一次足够）
        tickTimerId = setInterval(() => {
            nowTs = Date.now();
            if (air) {applySelectedTime();}
        }, MINUTE);

        // 用户切换 Windy 单位后，界面上所有 metrics.*.convertValue 的结果都要重算；
        // Svelte 不会因为模块内部状态变化而重渲染，必须显式触发一次
        metricListenerId = bcast.on('metricChanged', () => {
            refreshView();
        });
    });

    onDestroy(() => {
        singleclick.off(scListenerId);
        store.off(timeListenerId);
        bcast.off(metricListenerId);
        if (tickTimerId !== null) {
            clearInterval(tickTimerId);
            tickTimerId = null;
        }
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
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }

    .fa-retry {
        margin-left: auto;
        padding: 3px 12px;
        font-size: 12px;
        font-weight: 600;
        color: #fff;
        background: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 999px;
        cursor: pointer;
        transition: background 0.15s;

        &:hover {
            background: rgba(255, 255, 255, 0.28);
        }
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

    .fa-project {
        padding: 6px 4px 10px;
        text-align: center;

        .fa-project-link {
            font-size: 12px;
            color: #3d87ff;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    :global(.fa-marker) {
        z-index: 1000;
        cursor: move;
    }
</style>

