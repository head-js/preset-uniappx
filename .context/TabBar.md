# 微信小程序一级导航实施方案

> status: 2026-11-13 重构前编写，仅对微信小程序有效。App 端行为不同：`custom: true` 被忽略，走原生 tabBar；App 端 WebView 页无入口。详见 BUILD.md "App 端编译约束"一节。App 端 tabBar 未来会重写。

> updated_by: HBR - GPT-5
> updated_at: 2026-08-28 19:03:00

## 1. 目标

为当前 uni-app 微信小程序增加一级底部导航。配置加载完成后固定展示四个入口；加载期间先展示 Home 和 Profile。本期不接入真实后端、不设计正式配置协议、不实现动态增删、排序、缓存或兜底逻辑。

四个入口按以下顺序展示：

| 入口 | 类型 | 页面路径 | 点击行为 | 是否产生选中态 |
| --- | --- | --- | --- | --- |
| Home | 真实 Tab | `pages/index/index` | `switchTab` | 是 |
| Detail | 真实 Tab | `pages/detail/index` | `switchTab` | 是 |
| WebView | 动作入口 | `pages/webview/index` | `navigateTo` | 否 |
| Profile | 真实 Tab | `pages/profile/index` | `switchTab` | 是 |

底部视觉上有四个等宽入口，但微信真正的 Tab 页面只有 Home、Detail、Profile。WebView 只是放在底部栏中的图标动作，不加入 `tabBar.list`。

## 2. 已确认的产品规则

1. 仅支持 uni-app 微信小程序，不考虑其他平台。
2. 仅讨论应用级一级导航。
3. Home 和 Profile 必定存在。
4. 配置加载完成后固定展示四个入口，加载期间只展示 Home 和 Profile。
5. 本期使用 `setTimeout` 模拟 fetch，配置结构保持可替换为后端返回；不接入真实远端配置。
6. Home、Detail、Profile 使用微信 Tab 页面语义。
7. WebView 使用普通页面栈语义；点击后压入页面栈，返回时回到发起操作的 Tab。
8. WebView 不改变底部栏的选中项，也不显示持久选中态。
9. WebView 页面本身不显示底部栏。

## 3. 现有 WebView 行为

项目已经存在 `src/pages/webview/index.vue`，不需要新建 WebView 页面。

现有行为如下：

- 页面从 `onLoad(options)` 读取 `url` 查询参数。
- 页面尝试对 `url` 执行 `decodeURIComponent`。
- 参数为空时显示 `Missing url` 提示。
- 参数有效时通过 `<web-view :src="url" />` 加载目标页面。
- Home 页面不再提供独立 WebView 按钮，WebView 入口统一由自定义 TabBar 提供。
- 当前固定目标地址为 `https://uniapp.dcloud.net.cn/`。
- 当前跳转格式为 `/pages/webview/index?url=${encodeURIComponent(target)}`。

自定义 TabBar 中的 WebView 动作应复用同一页面、同一目标地址和同一参数编码方式，不改变现有 WebView 页的参数协议。

## 4. 技术选型

采用微信官方自定义 TabBar 能力：

- 在 `pages.json` 的 `tabBar` 中启用 `custom: true`。
- 在源码根目录创建 `src/custom-tab-bar`。
- 自定义 TabBar 使用微信原生组件文件，不使用 Vue 单文件组件。
- 使用 Vant Weapp 组件直接作为自定义 TabBar 的视觉根节点，不使用 `cover-view` 包裹 Vant；固定定位、层级和安全区表现需要在微信工具及真机上验证。

选择自定义 TabBar 的原因是底部栏需要同时容纳两种行为：

- Home、Detail、Profile 需要调用 `switchTab`。
- WebView 需要调用 `navigateTo`。

微信标准 TabBar 无法把普通页面栈动作混入 Tab 项，因此不满足本期需求。

## 5. 页面和 Tab 注册

### 5.1 `pages.json` 页面列表

保留现有页面，并新增：

- `pages/detail/index`
- `pages/profile/index`

最终页面集合至少包含：

- `pages/index/index`
- `pages/detail/index`
- `pages/webview/index`
- `pages/profile/index`

### 5.2 `tabBar.list`

`tabBar.list` 只声明三个真实 Tab 页面：

1. `pages/index/index`
2. `pages/detail/index`
3. `pages/profile/index`

WebView 只出现在 `pages` 中，不得加入 `tabBar.list`。

`tabBar` 仍需完整声明微信要求的 `color`、`selectedColor`、`backgroundColor` 和三个真实 Tab 项，并设置 `custom: true`。即使这些样式不直接控制自定义组件的最终渲染，也需要保留完整合法的微信 TabBar 配置。

## 6. 自定义 TabBar 结构

需要新增以下文件：

```text
src/custom-tab-bar/
  index.js
  index.json
  index.wxml
  index.wxss
```

### 6.1 固定入口定义

自定义 TabBar 内维护固定的四项定义：

| key | 标题 | 图标 | 动作 |
| --- | --- | --- | --- |
| `home` | `Home` | 首页图标 | `switchTab('/pages/index/index')` |
| `detail` | `Detail` | 详情图标 | `switchTab('/pages/detail/index')` |
| `webview` | 空文本 | WebView 图标 | `navigateTo('/pages/webview/index?url=...')` |
| `profile` | `Profile` | 用户图标 | `switchTab('/pages/profile/index')` |

WebView 入口只展示图标，不展示标题。它占据与其他入口相同的布局宽度，但不参与选中态计算。

### 6.2 点击分发

点击处理必须按稳定的 `key` 分发，不按数组下标推导行为：

- `home`、`detail`、`profile` 调用 `wx.switchTab`。
- `webview` 使用当前固定 URL，经过 `encodeURIComponent` 后调用 `wx.navigateTo`。
- 点击当前已选中的真实 Tab 时不重复调用 `switchTab`。
- 跳转期间使用短暂导航锁，避免快速连续点击产生重复 WebView 页面或并发导航错误。
- 在导航成功、失败或完成后正确释放导航锁。

### 6.3 选中态

选中态必须根据当前真实页面路由计算，不得根据视觉数组下标计算：

```text
pages/index/index   -> home
pages/detail/index  -> detail
pages/profile/index -> profile
```

WebView 永远不写入选中态。

微信自定义 TabBar 在每个 Tab 页面下拥有独立组件实例。实施时必须确保每个真实 Tab 页面显示时，都把当前路由同步到该页面对应的自定义 TabBar 实例。可在真实 Tab 页的 `onShow` 中，通过当前微信页面实例的 `getTabBar()` 获取组件并调用 `setData`；也可以封装一个仅供三个真实 Tab 页调用的同步函数，避免重复逻辑。

需要验证以下进入方式都能得到正确选中态：

- 小程序正常冷启动进入 Home。
- 开发工具或场景值直接启动 Detail。
- 开发工具或场景值直接启动 Profile。
- Home、Detail、Profile 之间反复切换。
- 从任意真实 Tab 打开 WebView 后再返回。

## 7. 新增页面要求

### 7.1 Detail

新增 `src/pages/detail/index.vue`，作为可独立打开的一级页面。本期不设计业务详情数据，页面只需提供稳定、可识别的 Detail 内容，不能依赖 Home 传入参数才能正常显示。

### 7.2 Profile

新增 `src/pages/profile/index.vue`，作为可独立打开的一级页面。本期不接入登录、用户接口或权限系统，页面只需提供稳定、可识别的 Profile 内容。

两个新增页面应遵循现有项目的 Vue 3、`script setup` 和 TypeScript 风格，不引入新的状态管理库或 UI 框架。

## 8. 图标和视觉要求

新增本地静态图标资源，禁止依赖远端图标：

- Home 默认态和选中态。
- Detail 默认态和选中态。
- Profile 默认态和选中态。
- WebView 默认态；如需要按压反馈，可增加按压态资源或使用透明度反馈。

建议资源目录：

```text
src/static/tabbar/
```

基础视觉规则：

- 四个入口等宽排列。
- 底部栏背景为白色。
- 未选中文字和图标使用中性灰色。
- 选中文字和图标使用项目主色。
- WebView 图标不使用持久选中色。
- 使用底部安全区变量，保证全面屏设备上内容不贴近 Home Indicator。
- 页面主体不得被固定底部栏遮挡。
- 点击区域应覆盖整个入口单元，而不是只允许点击图标本身。

具体色值和图标样式如无额外设计稿，可采用简洁、可辨识的默认方案，但三个真实 Tab 的默认态和选中态必须有清晰差异。

### 8.1 Vant Weapp 视觉方案

自定义 TabBar 的微信机制保持不变，视觉层改为使用 Vant Weapp 的原生微信组件，采用方案一：Vant 组件直接作为自定义 TabBar 的根视觉组件，不使用 `cover-view` 包裹 Vant。

设计要求如下：

- 使用 `@vant/weapp` 的 `van-tabbar` 和 `van-tabbar-item`（或同等的 Vant Weapp TabBar 组件）。
- 在 `src/custom-tab-bar/index.json` 的 `usingComponents` 中注册 Vant 组件，并确保构建微信小程序 npm 后，产物中的组件路径可解析。
- `src/custom-tab-bar/index.wxml` 的根视觉节点使用 Vant TabBar；`Component`、`attached`、`detached`、`getTabBar`、路由分发和导航锁仍由项目原生代码负责。
- Vant 的选中态必须由项目的 `selectedKey` 控制，使用稳定 `key`/`name` 映射，不以视觉数组下标作为业务路由依据。
- WebView 仍是四项视觉入口中的动作项，只显示图标，不写入持久选中态；其点击事件继续调用 `navigateTo`。
- 初始本地配置只返回 Home、Profile；模拟 fetch 完成后返回 Home、Detail、WebView、Profile。Vant 只消费 `items`，不负责配置加载。
- 不在 Vant 组件外层包裹 `cover-view`。微信官方 `cover-view` 只支持嵌套 `cover-view`、`cover-image`（另允许 `button`），不能把 Vant 自定义组件作为其子树。
- 保留微信自定义 TabBar 页面级生命周期和实例隔离的验证；Vant 组件不能替代页面 `onShow` 中的选中态同步。

需要验证的项目：

1. Vant Weapp 依赖、`usingComponents` 注册和微信开发者工具构建 npm 后的产物路径都能正常解析。
2. 自定义 TabBar 根节点使用 Vant 后，Home、Detail、Profile 三个 Tab 页面均能正常显示四项等宽入口。
3. 初始 Home/Profile 两项和模拟 fetch 完成后的四项切换过程中，布局、图标、文字和安全区不发生异常跳动。
4. Vant 的 active/change 事件与项目 `selectedKey` 双向映射正确；Home、Detail、Profile 冷启动和反复切换时选中态正确。
5. 点击 WebView 不改变真实 Tab 的选中态，返回后回到发起操作的 Tab；快速点击不产生重复导航。
6. 不使用 `cover-view` 后，在微信开发者工具、至少一台真机以及包含原生层组件的页面中验证固定定位、层级、点击区域和安全区。
7. 验证 Vant 组件卸载时不会残留模拟 fetch 或导航 timer，且每个真实 Tab 的独立组件实例状态不会互相污染。
8. 检查引入 Vant 后的主包体积和构建耗时，确认没有引入不必要的组件或平台代码。

## 9. 文件级实施清单

### 修改

- `src/pages.json`
  - 注册 Detail 和 Profile 页面。
  - 增加完整的 `tabBar` 配置。
  - 启用 `custom: true`。
  - `tabBar.list` 只包含 Home、Detail、Profile。
- `src/pages/index/index.vue`
  - 仅在选中态同步确实需要页面配合时增加 `onShow` 同步。
  - 保留现有其他能力，WebView 入口由自定义 TabBar 提供。

### 新增

- `src/pages/detail/index.vue`
- `src/pages/profile/index.vue`
- `src/custom-tab-bar/index.js`
- `src/custom-tab-bar/index.json`
- `src/custom-tab-bar/index.wxml`
- `src/custom-tab-bar/index.wxss`
- `src/static/tabbar/` 下所需图标资源
- 如采用公共选中态同步函数，可新增一个职责单一的微信 TabBar 工具模块
- `package.json` 和锁文件（引入 Vant Weapp 及其构建所需依赖）

### 原则上不修改

- `src/pages/webview/index.vue`
- 网络、设备信息、包信息等现有工具模块
- 构建脚本和依赖清单

## 10. 推荐实施顺序

1. 新增 Detail 和 Profile 页面并注册到 `pages.json`。
2. 添加三个真实 Tab 的完整静态 `tabBar.list`。
3. 创建微信原生 `custom-tab-bar` 四个文件。
4. 引入并注册 Vant Weapp，确认微信 npm 构建和产物路径。
5. 使用 Vant TabBar 完成四项视觉布局，并添加本地图标资源。
6. 实现三个真实 Tab 的 `switchTab` 分发。
7. 实现 WebView 图标的 `navigateTo` 分发，复用现有 URL 和编码规则。
8. 实现按当前页面路由同步选中态。
9. 增加导航锁和当前 Tab 重复点击保护。
10. 在微信开发者工具和真机上完成验收。

## 11. 验收标准

### 页面和路由

- 冷启动默认进入 Home，Home 正确选中。
- 点击 Detail 使用 `switchTab`，Detail 正确选中。
- 点击 Profile 使用 `switchTab`，Profile 正确选中。
- 三个真实 Tab 之间切换不会不断增加普通页面栈。
- 直接启动 Detail 或 Profile 时，底部栏选中态与当前页面一致。

### WebView 动作

- WebView 入口只展示图标。
- 点击 WebView 不改变当前真实 Tab 的选中记录。
- WebView 使用 `navigateTo` 打开现有 `pages/webview/index`。
- WebView 能加载当前固定目标 `https://uniapp.dcloud.net.cn/`。
- WebView 页面不显示底部栏。
- 从 WebView 返回后回到发起操作的 Home、Detail 或 Profile。
- 快速连续点击 WebView 不产生重复页面或导航报错。

### 视觉和设备适配

- 四项等宽且点击区域完整。
- 三个真实 Tab 的默认态和选中态清晰可辨。
- WebView 没有持久选中态。
- 底部安全区适配正确。
- 页面内容不被底部栏遮挡。
- 微信开发者工具和至少一台真机表现一致。

### 工程质量

- `pnpm build` 成功。
- 新增代码不引入新的 TypeScript 错误。
- Vant 仅作为自定义 TabBar 的视觉组件使用，不引入第三方 TabBar 导航插件替代微信机制。
- 不实现本期范围外的配置系统。

## 12. 已知基线问题

当前仓库执行 `pnpm type-check` 时，`src/pages/index/index.vue` 中两个 `<button type="primary">` 会触发既有的 `TS2322`。该问题已记录为 `BLAME-175`，不是本次 TabBar 改造引入的问题。

实施 Agent 应记录类型检查的基线差异，并确保本次新增文件没有产生额外类型错误；不要把既有错误误判为本次回归。

## 13. 本期明确不做

- 后端接口。
- 真实后端配置接口（当前仅保留可替换的本地 mock fetch）。
- 后端驱动的动态 Tab 数量（当前 mock 只延迟返回固定四项）。
- 动态排序。
- 配置缓存或最后有效配置。
- 配置失败兜底。
- 登录、权限和角色控制。
- WebView URL 动态配置。
- 其他平台适配。
- 其他 UI 框架或第三方 TabBar 导航插件接入。

## 14. 3+2 模式验证结论

本节记录在保留现有实现的前提下，对“首屏 3 个真实 Tab + 次屏 2 个真实 Tab”方案的验证结果。该方案不接入 Vant。

### 14.1 可行的实现方式

微信仍然只有一套全局 `custom-tab-bar`，不能配置两套彼此独立的自定义 TabBar。验证采用同一个 `custom-tab-bar` 根据当前页面路由切换视觉入口组：

- 首屏视觉组：Home、Detail、WebView、Profile。
- 次屏视觉组：Plan、Phase。

`tabBar.list` 是一套静态配置，当前包含 5 个真实 Tab 页面：

1. `pages/index/index`
2. `pages/detail/index`
3. `pages/profile/index`
4. `pages/plan/index`
5. `pages/phase/index`

WebView 仍然只是首屏视觉组中的动作入口，不加入 `tabBar.list`。

### 14.2 路由和页面栈语义

当前验证实现使用以下导航关系：

```text
Profile --switchTab--> Plan
Plan <----switchTab--> Phase
Plan --switchTab--> Profile
```

由于 Plan 和 Phase 被注册为真实 Tab，它们在微信机制上仍是一级 Tab 页面。它们不是通过 `navigateTo` 压入 Profile 上方的普通页面，因此默认没有左上角系统返回按钮；返回 Profile 需要使用 `switchTab` 或页面内的返回按钮。

导航 API 的语义记录如下：

- `navigateTo`：普通页面入栈，通常会出现系统返回按钮。
- `redirectTo`：替换当前普通页面，不增加栈层。
- `switchTab`：切换真实 Tab，并清理普通页面栈。
- `reLaunch`：关闭全部页面后重新打开目标页面。

### 14.3 方案边界

如果后续要求 Plan/Phase 具备原生左上角返回按钮，Plan 和 Phase 就不能继续作为 `tabBar.list` 中的真实 Tab。届时应改为普通页面，通过 `navigateTo` 进入、`redirectTo` 切换，并使用普通 Vue 二级 Tab 组件；这样视觉上可以保持类似 TabBar，但不再是微信原生 `custom-tab-bar`。

因此当前方案的取舍是：

| 方案 | 次屏使用全局 custom-tab-bar | 左上角系统返回 |
| --- | --- | --- |
| 3+2 真实 Tab | 可以 | 默认没有 |
| 普通二级页面 | 不可以 | 有 |

### 14.4 当前验证状态

- `pnpm build`：通过。
- `pnpm type-check`：仅保留现有 `src/pages/index/index.vue` 中的 `TS2322` 基线错误，本次新增代码没有产生额外类型错误。
- 当前实现已新增 Plan、Phase 页面、对应本地图标和路由选中态同步。
