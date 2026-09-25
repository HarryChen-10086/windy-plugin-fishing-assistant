# Agent 记忆汇总（windy-nhc-warnings 工作区）

本文件由 Copilot 记忆工具的持久化记忆整理而来，用于跨会话复用工程知识。

- 记忆来源：`%APPDATA%\Code\User\workspaceStorage\87199c339068cdd712a97b9d0aa09028\GitHub.copilot-chat\memory-tool\memories\repo\`
- 记忆作用域：`repo`（工作区 `e:\soft\progfile\WindyCMAAlertPlugin\windy-nhc-warnings`）
- 记忆最后更新：2026-08-20
- 共 4 条记忆：Windy 插件开发约定、多语言实现、发布准备、恶劣天气安全机制

---

## 1. Windy 插件开发关键事实

> 来源：`windy-plugin-conventions.md`（2026-08-20 23:52 更新）

### 1.1 构建与命令

- 构建（Windows，cmd 语法）：`npm run build:win`
- 开发：`npm start`（watch + 9999 https 服务）
- 发布验证：`$env:SERVE='false'; npx rollup -c`（约 5–10s）
- 编译用 swc 剥离类型、**不做类型检查**；编辑器用 svelte 语言服务做检查

### 1.2 模块与类型解析

- `@windy/*` import 在 rollup 构建时被转换为运行时 `W.*` 全局访问（plugin-devtools `transformCode`）
- 类型定义在 `node_modules/@windycom/plugin-devtools/types/`，tsconfig `paths` 映射 `@windy/*` → `types/client/*`
- 示例 06（foehn-chart `Chart.svelte`）展示 `getPointForecastData` 用法（旧版第 3 参传插件名，新版应传 include 对象）

### 1.3 点预报 API

```ts
getPointForecastData(model, { lat, lon, days, step, source }, includeObj?, httpOptions?)
// → HttpPayload<WeatherDataPayload2<K>>，.data 才是载荷
```

- **include 是对象**，不是逗号分隔字符串：
  `{ header, celestial, meteogram, summary, debug, airgram, sounding }`
  类型定义在 `types/client/fetchForecastHosts.d.ts`
- `PointForecastOptions.source` 取值：`'detail' | 'detail-preload' | 'hp' | 'favs' | 'favs-on-top' | 'alerts' | 'embedded-meteogram' | 'multiload'`
- 只需 `{ header: true, celestial: true }` 即可计算指数（`computeSegments` 只用 `data` 时间序列 + `celestial`），可减小载荷
- **⚠️ 免费账号 `step: 1` 会被服务端强制降级为 3h**（类型上 `step: 1 | 3` 都合法，但以实际返回为准；meteogram v1.2 接口在免费账号同样返回 3h，故不使用）
  - **最终方案**：仅使用 `getPointForecastData(step: 1)`，按实际步长自适应展示固定 12 个点 —— 1h 步长看 12 小时窗口、3h 步长看 36 小时窗口
    （`filter(ts in [now, now + stepH * 12h]).slice(0, 12)`）
  - 标题使用通用的"未来小时钓鱼指数"（不写死 12h）；用相邻 ts 中位数计算实际步长，可用 `hourlyStep` 徽章标注
  - 插值方案（`interpolateToHourly`）**用户未采用**

### 1.4 载荷数据结构（node-forecast-v3）

- `WeatherDataPayload2`：`data`（时间序列）、`header`（elevation/sst/hasWaves/model/update）、`celestial`（sunrise/sunset Ts + TZoffset）、`summary`（`SummaryDayWithPredictability[]`）、`meteogram`（dewPoint/cloud-{level}）
- 单位：temperature / wind / windDir / windGust / pressure 分别为 K、m/s、度、Pa；precipAmount 为 mm；icon / moonPhase 为枚举码
- 湿度与云量需 `include.meteogram`；云量取 `cloud-surface` 键；相对湿度用 dewPoint(K) + temperature(K) 经 Magnus 公式计算
- waves 模型映射：`ecmwf → ecmwfWaves`、`gfs → gfsWaves`、`icon → iconEuWaves`；内陆 `hasWavesData` 会返回全 null

### 1.5 其它可用 API

- `getCapAlertsSummary({ lat, lon }, 'detail')` → `.data` 为 `CapAlertHeadline[]`
- `getElevation`、`reverse.get`、`getGPSlocation`
- `store.set('overlay', ...)`（异步 store，`AsyncStores` 含 overlay）

### 1.6 事件与订阅

- `singleclick.on(name, cb)` 返回订阅 id，`singleclick.off(id)` 解绑；`Evented.off` 有两个重载（id 或 topic + cb）
- 监听 Windy 时间条：`store.on('timestamp', ts => ...)`（ts 为毫秒时间戳，同步 store，返回订阅 id），`store.off(id)` 解绑；`store.get('timestamp')` 取当前时间条时刻（参见 DataSpecifications 的 `timestamp` 键）

### 1.7 metrics 单位换算

- `import metrics from '@windy/metrics'`
- `metrics.temp/wind/pressure/rain/waves.convertValue(x)` 返回带单位的字符串，`convertNumber` 返回数字
- 传入 null/NaN 可能异常，**需先判空**

### 1.8 Svelte 本地化陷阱

模板中直接调用函数（如 `{primeScoreText(p)}`、`{pressureTrend(idx)}`）时，若函数体内部读取闭包变量 `lang` / `t`，Svelte 无法穿透函数体追踪依赖 → 切换语言后这些表达式不重算、残留旧语言。

**修复**：把 `lang` 作为显式参数传入（`{fn(x, lang)}`），函数签名加 `lang: Lang`，内部使用该参数（如 `_translate(key, vars, lang)`），与 `moonPhaseText(..., lang)` 等模式保持一致。

### 1.9 类型陷阱（`plugin.svelte` 已修复，别改回）

- 本地 `types.ts` 的 `WeatherConditionIcon` / `MoonPhase` 枚举与 `node-forecast-v3.d.ts` 的 `const enum` 名义不兼容 → 任何 `getPointForecastData` 返回值赋给本地类型、或把本地类型作为其泛型参数都会报错
  - 修复：在边界用 `as unknown as` 断言
    （`air = payload as unknown as WeatherDataPayload2<DataHash2>`、waves 同理；`computeSegments(pf.data as unknown as DataHash2, ...)`）
  - **不要**给 `getPointForecastData` 传本地泛型 `<WavesDataHash2>`
- `Overlays` 类型不在 `@windy/rootScope.d`（client 版只有 `overlays` 常量）→ 用
  `import type { overlays } from '@windy/rootScope.d'; type Overlays = (typeof overlays)[number];` 派生
- `marker.on('dragend')` 回调参数类型是 `L.DragEndEvent`（非 `LeafletMouseEvent`），`ev.target` 需 `as L.Marker` 才有 `getLatLng`
- `isValidLatLonObj<T>(item: LatLon | T) => item is T & LatLon`：传 `LatLon | undefined` 会把类型窄化成 `never`！
  应直接传 `unknown` 参数（`onopen(params?: unknown)` 里 `if (isValidLatLonObj(params))`）

### 1.10 tsconfig 约定（勿改动）

- plugin-devtools 的 `d.ts.files` 内部 .d.ts 有自引用错误，加 `"skipLibCheck": true` 忽略（不影响自身代码检查）—— **保留**
- 编辑器会提示 `baseUrl` / `moduleResolution: "node"` 弃用，属无害信息，**不要**加 `ignoreDeprecations`
- **⚠️ tsconfig 别加 `ignoreDeprecations`**：本地 TS 5.9.3 不认 `"6.0"`（TS5103），且设置 `ignoreDeprecations` 会触发 svelte-preprocess 注入已弃用的 `importsNotUsedAsValues`，导致 rollup 构建失败（TS5102 "has been removed"）
- 若遇构建 TS5102 / TS5103，先检查 tsconfig 里有没有 `ignoreDeprecations`

### 1.11 插件配置校验

`ExternalPluginConfig` 约束：

| 字段 | 约束 |
| --- | --- |
| `title` | 长度必须 7–50 字符（含中文时按 JS 字符串长度计算） |
| `icon` | 单个 emoji |
| `name` | 必须以 `windy-plugin-` 为前缀 |
| `routerPath` | 长度需 > 4 字符 |

---

## 2. 多语言（i18n）实现要点

> 来源：`fishing-assistant-i18n.md`（2026-08-20 13:23 更新）

- i18n 模块：`src/i18n.ts`；`Lang = 'en' | 'zh'`（定义在 `src/types.ts`）
- 语言检测：`detectLang()` 使用 `store.get('usedLang') || store.get('lang')`（`'zh'` 表示简体中文），回退 `navigator.language`
- 语言持久化：localStorage key `windy-fishing-assistant-lang`
- 插件默认语言为英语（pluginConfig `title = 'Fishing Index'`，2026-09-25 由 `Windy Fishing Assistant` 改名；插件 id `windy-plugin-fishing-assistant` 不变），检测到中文自动切换
- README.md（英文）+ README_zh.md（中文）互链

### 2.1 Svelte 语言切换响应式技巧

模板里的 `t()` 函数需响应式，用：

```ts
$: t = (key, vars) => _translate(key, vars, lang)
```

这样切换 `lang` 时模板自动重渲染。**直接调用模块 `t(key)` 不会触发重渲染。**

### 2.2 翻译函数组织

- 展示类翻译（`weatherText` / `moonPhaseText` / `dir2compass` / `weekdayName` / `levelLabel` / `alertTypeText` / `alertSeverityText`）统一放在 `i18n.ts`，接受 `lang` 参数（默认 `currentLang`），在模板中显式传 `lang`
- `scoreLevel(score)` 改为返回 `{ level: 0-4, color }`（语言无关），等级文字用 `levelLabel(level, lang)` 获取
- `PrimeWindow` 使用 `kind: 'morning' | 'evening'` 而非硬编码 label，模板按 `kind` 翻译

### 2.3 ⚠️ CAP 预警字段是单字母代码（不是完整英文名）

类型定义在 `node_modules/@windycom/plugin-devtools/types/types.d.ts` 的 `CapAlertType` / `CapAlertSeverity`。

`type` 字段：

| 代码 | 含义 | 代码 | 含义 |
| --- | --- | --- | --- |
| `T` | 雷暴 | `G` | 雾 |
| `R` | 降雨 | `N` | 龙卷风 |
| `H` | 高温 | `Q` | 空气质量 |
| `W` | 大风 | `S` | 降雪 / 冰雪 |
| `F` | 洪水 | `A` | 雪崩 |
| `L` | 低温 | `-` | 无效 |
| `C` | 海岸事件 | | |
| `I` | 火险 | | |

`severity` 字段：`M` = 中度（Moderate）、`S` = 严重（Severe）、`E` = 极端（Extreme）、`A` = 未知（Unknown）

处理时需按单字母映射；`alertTypeText` / `alertSeverityText` 在 `src/i18n.ts`，同时兼容完整英文名回退。

---

## 3. 发布前准备（2026-08-20 完成）

> 来源：`fishing-assistant-release.md`（2026-08-20 14:45 更新）

- GitHub 仓库：<https://github.com/HarryChen-10086/windy-plugin-fishing-assistant>（作者 HarryChen-10086）
- 本地 git remote 已更新为新仓库 URL（`.git/config`）
- 已删除 `examples/` 目录；`rollup.config.js` 只保留 `src` 构建；`package.json` 移除 example 脚本
- `package.json` / `package-lock.json` / `pluginConfig.ts` 的名称、仓库、作者、license 均已更新（MIT）
- `docslink.txt` 保留不动（且在 `.gitignore` 中）
- `declarations/` 保留（`leaflet-gl-L.d.ts` 提供全局 `L` 类型，删除会破坏编辑器类型检查）
- `.github/workflows/publish-plugin.yml` 保留（发布用 CI）
- 插件页面底部新增测试版 banner（i18n keys：`betaText` / `betaLink`），链接指向 GitHub Issues
- README.md（英文）+ README_zh.md（中文）：去掉"免费接口 / 无需 Key"等演示性文案，保留功能 / 快速开始 / 项目结构 / 数据来源 / 评分规则 / 测试版贡献 / 开源协议
- 发布验证命令：`$env:SERVE='false'; npx rollup -c`（约 5–10s）

---

## 4. 恶劣天气安全机制

> 来源：`fishing-assistant-safety.md`（2026-08-20 13:55 更新）

### 4.1 类型与检测

- `SevereKind` 类型在 `src/types.ts`：`thunder | rain | snow | wind | waves | temp | fog`
- 检测逻辑 `severeKindsAt()` 在 `src/fishingIndex.ts`：

| 恶劣类型 | 判定条件 |
| --- | --- |
| 雷暴 thunder | `icon ∈ [14, 15, 16, 21, 23, 24]` |
| 暴雨 rain | `precipAmount >= 8`（3h 步长） |
| 暴雪 snow | `precipSnowAmount >= 5` 或 `icon ∈ [8, 9, 10, 11, 12, 13]` |
| 大风 wind | `wind >= 10.8 m/s`（6 级） |
| 大浪 waves | `waves >= 2.5 m`（需传 waves 数据） |
| 极端温度 temp | `<= -15 °C` 或 `>= 38 °C` |
| 大雾 fog | `icon ∈ [17, 22]` |

### 4.2 安全扣分

`SAFETY_PENALTY`：thunder −30、wind/waves −20、rain/snow −15、temp −10、fog −5，**封顶 −50**

### 4.3 数据结构与函数

- `computeSegments(data, celestial, waves?)` 第 3 参为海浪数据
- 每个 `SegmentScore` 新增 `safety`（<= 0）与 `severeKinds`
- `severeEndTs(segments, kind, startIdx)`：扫描后续时段，返回第一个不再恶劣的时段 ts 作为预计结束；持续到预报期末返回 `null`
- `closestIndex(tsArr, ts)` 已从 `plugin.svelte` 移到 `fishingIndex.ts` 并导出

### 4.4 UI 布局

- 顶部警示横幅 `.fa-warn`：展示当前恶劣条件的 emoji / 标签 / 提示 / 预计结束时间；模板放在指数卡片之前
- 分项得分新增"安全"行（红条 + 负分），仅当 `safety < 0` 时显示
- CAP 预警板块位置：评分板块（hero）之后、当前气象条件之前
