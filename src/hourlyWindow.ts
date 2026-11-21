/**
 * 「未来小时」窗口的纯函数工具。
 *
 * 单独成文件是为了能被单元测试直接覆盖：这段逻辑原先写在 plugin.svelte 的
 * 响应式语句里，依赖 Date.now()，Svelte 只会跟踪其中的 state（hourlySegments /
 * hourlyStepH），时间流逝本身不会触发重算，面板开久了窗口就停在打开那一刻。
 * 现在把「锚点时刻」作为显式参数传入，由组件用定时器推进，逻辑本身可测。
 *
 * 时间步的含义：点预报的时间戳是该步的**起始**时刻，一个步覆盖
 * [ts, ts + stepMs)。3h 步长时，13:45 属于 12:00 开始的那一步。
 */
import type { SegmentScore } from './fishingIndex';

const HOUR = 3600 * 1000;

/** 把实际步长规范成正数（0/NaN 视为 1 小时），避免下面出现 0 长度窗口 */
const safeStepHours = (stepHours: number): number =>
    Number.isFinite(stepHours) && stepHours > 0 ? stepHours : 1;

/**
 * 取「当前所在的步」及其之后的 count 个评分点。
 *
 * 判据是步区间与当前时刻有交集（`ts + stepMs > nowTs`），而不是与步起始时刻
 * 的距离：否则 1h 步长下当前步还能落进来，3h 步长下却会漏掉正在进行的这一步，
 * 界面上「现在」反而从下一个时刻开始。
 */
export const pickHourlyWindow = (
    segments: ReadonlyArray<SegmentScore>,
    nowTs: number,
    stepHours: number,
    count = 12,
): SegmentScore[] => {
    const stepMs = safeStepHours(stepHours) * HOUR;
    return segments.filter(s => s.ts + stepMs > nowTs).slice(0, count);
};

/** 某个时间步是否就是「当前」所在的那一步（用于界面高亮） */
export const isCurrentStep = (ts: number, nowTs: number, stepHours: number): boolean => {
    const stepMs = safeStepHours(stepHours) * HOUR;
    return ts <= nowTs && nowTs < ts + stepMs;
};
