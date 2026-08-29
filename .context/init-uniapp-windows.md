# 在 Windows 上初始化 uni-app 开发环境

> status: 2026-08 编写的旧版 CLI 工具链文档，与现行规范（HBuilderX 统一工作流）冲突，以现行规范为准。仅作历史参考。

> updated_by: Kilo - k3 (kimi/k3)
> updated_at: 2026-08-12 17:52:00+08:00
> platform: Windows 11 on x86-64 (amd64)

---

## Node.js 环境

**规范要求**：
- 使用标准化 Node.js 环境（Node 22 LTS + pnpm 10），安装与路径配置不在本文档范围
- 包管理器统一为 **pnpm**，不使用 npm / yarn 安装项目依赖

**检查步骤**：
1. 确认 Node 版本：`node --version`，应为 v22.x（实测 v22.22.3）
2. 确认 pnpm 版本：`pnpm --version`，应为 10.x（实测 10.2.1）

---

## 开发工具链（CLI）

**规范要求**：
- 唯一工具链为 **CLI（Vue 3 + Vite + TypeScript）**，基于 DCloud 官方 `uni-preset-vue` 模板，项目的创建、依赖安装、构建全部通过 pnpm scripts 完成，不依赖任何 IDE 内部状态
- **禁止使用 HBuilderX**（包括其可视化运行/发行、云打包和标准基座）
- 开发工具不做限制，一般为 VSCode + 腾讯官方微信开发者工具，均为标准环境，无需检查
- 切换运行端只通过 `pnpm dev:%PLATFORM%` / `pnpm build:%PLATFORM%` 参数完成，不修改源码适配不同端
- **本项目即为基座项目**：不提供创建项目命令，所有其他项目应从本项目复制后改造

---

## 运行环境

**概念说明**：
- 本项目的验证目标为**唯一目标：微信小程序**
- dev 模式需同时支持两种运行方式：**H5**（浏览器，承载日常开发调试）与**微信开发者工具**（导入 `dev:mp-weixin` 产物，做最终验证）

### H5（日常开发）

**规范要求**：
- 使用系统默认浏览器的最新稳定版（Edge / Chrome 均可），无需额外配置
- 开发期通过 Vite dev server 热更新调试

**验证命令**：
```bash
pnpm dev:h5
```
- 启动后访问终端输出的本地地址（默认 `http://localhost:5173`），页面正常渲染即通过

### 微信小程序（最终验证目标）

**规范要求**：
- 使用腾讯官方微信开发者工具预览、真机调试和上传，属标准环境，不做检查
- 小程序 AppID 使用测试号或正式 AppID，配置在 `src/manifest.json` 的 `mp-weixin.appid`；测试阶段允许为空（游客模式）

**验证命令**：
```bash
pnpm dev:mp-weixin
```
- 编译产物输出到 `dist/dev/mp-weixin`，用微信开发者工具导入该目录，模拟器正常渲染即通过

---

## 项目配置文件（manifest.json / pages.json）

**概念**：
- `src/manifest.json` 是应用级配置的合集：应用名称、appid、各端专属配置（权限、SDK、模块）都在这里
- `src/pages.json` 相当于路由表 + 全局导航样式配置，决定页面注册、tabBar、导航栏外观
- 两者均在**编译期**被 uni-app 编译器解析并生成各端原生配置（如微信小程序的 `app.json`），运行时各端读到的是编译产物中的具体值

**本仓库约定**：
| 配置项 | 位置 | 说明 |
|---|---|---|
| 应用名称 | `manifest.json` 的 `name` | 各端显示名 |
| uni-app appid | `manifest.json` 的 `appid` | DCloud 应用标识，App 打包必需 |
| 微信小程序 AppID | `manifest.json` 的 `mp-weixin.appid` | 测试期可留空 |
| 页面路由 | `pages.json` 的 `pages` | 首项即首页 |
| 全局样式 | `pages.json` 的 `globalStyle` | 导航栏标题/颜色 |

**结论**：读取应用信息应通过编译产物或 `uni.getSystemInfoSync()` / `uni.getAccountInfoSync()` 等运行时 API，不要手写硬编码副本；编译期变量（如 `process.env.UNI_PLATFORM`）用于条件编译区分平台。

---

## UI 组件与状态管理选择（待定）

> 本节内容先保持记录，**尚未定稿**，后续确认后再移除待定标记。

**规范要求**：
- 基础组件使用 uni-app 内置组件（`view`/`text`/`scroll-view`/`list` 等），跨端自动映射
- 扩展组件使用 DCloud 官方 **uni-ui**（`@dcloudio/uni-ui`），通过 `easycom` 自动引入，**不引入其他第三方 UI 库**（如 uView、TuniaoUI），避免多端兼容性分裂
- 状态管理使用 **Pinia**（Vue 3 官方推荐，uni-app Vue 3 模板内置支持），不使用 Vuex
- 列表式界面优先用 `scroll-view` + 分组卡片式布局；小程序端长列表注意 `scroll-view` 的 `scroll-y` 必须显式声明高度，否则不滚动（常见坑点）

**easycom 规范**：
- `uni-ui` 组件按 `uni-` 前缀自动扫描（如 `<uni-card>` 对应 `@dcloudio/uni-ui`），无需手动 `import` 与 `components` 注册
- 自定义组件放在 `src/components/<name>/<name>.vue`，符合 easycom 默认规则即可自动注册

**示例**：
```vue
<template>
  <scroll-view scroll-y style="height: 100vh;">
    <uni-card title="Network">
      <text>{{ statusText }}</text>
    </uni-card>
    <uni-card title="Log">
      <view v-for="(log, i) in logs" :key="i">{{ log }}</view>
    </uni-card>
  </scroll-view>
</template>
```

---

## 网络层选择（待定）

> 本节内容先保持记录，**尚未定稿**，后续确认后再移除待定标记。

**规范要求**：
- 使用 uni-app 内置 **`uni.request`**（各端自动映射到 XHR / 小程序 `wx.request` / App 原生网络栈），**不引入第三方网络库**（axios 在小程序/App 端无 XHR 环境，需额外 adapter，不采用）
- 在 `uni.request` 之上封装项目级 `HttpClient`（统一 baseURL、超时、错误处理、Token 注入）
- `uni.request` 为回调风格 API；项目内统一用 `Promise` 封装（`new Promise((resolve, reject) => ...)`），配合 `async/await` 使用
- TypeScript 响应体用接口/类型建模

**async/await 支持现状**：
- uni-app Vue 3 + Vite 工具链基于现代 JS 转译，**`async/await` 全端可用**（小程序端由编译器转译为 ES5 兼容代码）
- 故 `HttpClient` 直接写为 `async postTest(body): Promise<HttpBinResponse>`，调用处 `await` 即可

**示例**：
```ts
export function postTest(body: Record<string, unknown>): Promise<HttpBinResponse> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://httpbin.org/post',
      method: 'POST',
      data: body,
      success: (res) => resolve(res.data as HttpBinResponse),
      fail: (err) => reject(err),
    })
  })
}
```

---

## 运行时日志查看

**规范要求**：
- 统一使用 `console.log` / `console.warn` / `console.error`；uni-app 会将其映射到各端日志系统，不引入第三方日志库
- 关键模块日志加统一前缀（如 `[HttpClient]`），便于在各端控制台过滤

**各端查看方式**：
- **H5**：浏览器 DevTools Console，按前缀文本过滤
- **微信小程序**：微信开发者工具 Console 面板；真机预览时用「真机调试」模式的 Console

**坑点**：
- 小程序生产包默认保留 `console`，如需剥离应在 `vite.config.ts` 配置 `drop_console` 类压缩选项，**不要在源码里包条件判断**
- 小程序端 `console.log` 大对象会被序列化为 `[object Object]` 风格快照，调试复杂对象建议先 `JSON.stringify`

