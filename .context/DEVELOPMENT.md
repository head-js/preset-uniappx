# 开发规范

> status: 2026-11-13 重构前编写。"依赖与调试数据"、"API 与用户数据"（mallClient/loanClient/YXH_USER_INFO）描述的是旧形态或其他项目，当前仓库中不存在；通用规范（TypeScript、HBuilderX 工作流、UI 与路由原则）仍然适用。

## 源码

- 应用逻辑使用 TypeScript。`.uvue` 和 `.nvue` 文件中的脚本都写成 `lang="ts"`；工具、API、composable 和配置模块也使用 TypeScript。
- 有多种实现选择时优先使用 TypeScript。只有在已确认所需平台能力无法用 TypeScript 实现时，才引入其他语言。
- 路由、条件编译、模块别名和 uni-app x API 遵循 HBuilderX 规范。不要引入机器专属别名或绝对依赖路径。

## 构建与调试

- 通过 HBuilderX 运行和调试应用。不要用另行全局安装的 Node/Vite 工具链替代 HBuilderX。
- Android Studio 工作流使用仓库内的原生工程和本地 Gradle 构建。HBuilderX 将应用资源生成到 `unpackage/resources/app-android/<appid>`，Gradle 从该目录读取；不要手动复制生成资源，也不要提交 `unpackage` 产物。
- 禁止 Android 云打包、云构建和云开发，只使用本地工作流。
- Android APK 的 `Debug`/`Release` 与 `VITE_APP_ENV` profile 是两个独立维度。

## 依赖与调试数据

- 只有在确实需要纯 TypeScript 逻辑库时才使用 `pnpm`。根目录运行时依赖和编辑器专用依赖分别放在规定的 package 目录中，详见 [环境配置](ENVIRONMENT.md)。
- 不使用 mock 框架，也不创建 `mocks` 目录。调试时可以把临时手写数据直接放在对应 API 或模块中；调试结束后替换为正式实现。

## API 与用户数据

- `request` 只负责底层 `uni.request` 传输。分别使用 `mallClient` 和 `loanClient` 处理各自服务的请求头、编码和响应格式。
- 不依赖拦截器处理请求：uni-app x 内置拦截器不覆盖 `uni.request`。服务相关逻辑放在对应 client 中。
- 登录信息唯一存入 `YXH_USER_INFO` 这个 Storage Key。登录响应模型只保存登录所需的用户标识和 token；需要展示用户资料的页面自行请求资料。
- 不要在成功 toast 或持久日志中打印完整登录响应或 token。临时排查响应的输出在调试完成后删除。

## UI 与路由

- 原生 `tabBar` 的每一项都是页面入口，点击后使用 `switchTab`，不能绑定任意按钮回调。需要系统返回箭头的二级页面（包括 WebView 容器）通过 `navigateTo` 打开。
- 二级 WebView 页面负责隐藏 TabBar，并在离开时恢复。如果 Tab 页面仅作为 WebView 中转页，保持中转逻辑简单，并确保返回后页面仍有可用状态。
- uni-app x/Vapor 的样式行为可能与浏览器 CSS 不同。确认问题后优先修复使用方组件自己的样式；只有确认多个使用方确实共享同一行为后，才考虑全局规则。

## API 边界

- 单个接口特有的细节放在对应 API 模块中。只有一个使用方时，不要为它额外设计通用抽象。
- profile 配置只放基础 URL 和配置值；服务路径片段由代码中的 API 持有，除非用户明确要求其他设计。
