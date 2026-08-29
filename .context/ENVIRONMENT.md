# 环境配置

> status: 2026-11-13 重构前编写。Profile 体系（VITE_APP_ENV、config/profiles）当前仓库已不存在且不在需求范围内；"依赖"章节中 types/ 目录的约定当前仓库同样不存在。工具链原则（HBuilderX 统一运行调试）仍然适用。

## 工具

- uni-app x 应用的运行和调试统一使用 HBuilderX，包括 H5、微信小程序和 HBuilderX Android 模拟器工作流。
- 使用 HBuilderX 管理的 Node 运行时和 uni-app x 工具链；不要仅为本项目另行全局安装 Node 工具链。HBuilderX 不得向电脑全局位置安装软件。如果 HBuilderX 需要内置插件或工具，告知用户具体名称，由用户在 HBuilderX 内安装。Android SDK 仍由本地 Android Studio 工作流管理。
- Android Studio 仅用于本仓库的本地原生 Android 工程。Android 打包保持本地化，禁止使用云打包、云构建或云开发功能。

## Profile 与构建模式

- `VITE_APP_ENV` 选择应用后端和配置 profile，当前取值为 `dev`、`test1`、`prod`，由 `AppEnv` 类型表示。
- profile 与 Vite 的 `mode`、`NODE_ENV` 相互独立。`dev`、`test1`、`prod` 决定应用使用哪套配置；`NODE_ENV` 仍表示 Vite 的 `development` 或 `production` 构建行为。因此，`test1` 可以使用 production 构建模式，同时选择 `test1` profile。
- Android APK 的 `Debug`/`Release` 又是独立维度。不要根据 APK 模式推导 `VITE_APP_ENV`，也不要混淆两者。
- HBuilderX 自定义运行脚本定义在根目录 `package.json` 的 `uni-app.scripts` 中。每个脚本设置 `UNI_PLATFORM` 和 `VITE_APP_ENV`，在 HBuilderX 中通过这些脚本选择目标平台和 profile。
- `vite.config.ts` 将选中的 `VITE_APP_ENV` 传入应用代码。HBuilderX 本地导出 Android 资源时不会注入 `launch.json.env`，因此当前配置从 Android 运行配置读取 profile 作为该导出流程的回退值。
- `config/index.ts` 会校验 `VITE_APP_ENV`；缺失或非法时应明确报错，不要静默使用默认 profile。

## Profile 文件

- 每个 profile 在 `config/profiles/dev.ts`、`config/profiles/test1.ts` 和 `config/profiles/prod.ts` 中维护一份完整配置。
- 每个文件独立拥有所有配置项。不要添加公共环境配置文件、`.env.local` 或共享覆盖层。
- 目前不要添加 `test2`，除非用户提出且已具备实际配置值。
- 不要改用 Vite `.env.*` 文件或自创 `env.*` JSON 文件。环境选择使用 `VITE_APP_ENV`，配置放在 TypeScript profile 模块中。
- `dev` 和 `test1` 的部分值目前可以相同，但两者是不同的运行环境，必须保留为独立 profile。
- 按要求，`dev` 和 `test1` 的 AES 凭据可以提交到仓库。`prod` 的密钥和 IV 字段保留为空；不要把生产密钥提交到仓库。

## 平台配置

- 构建目标和 profile 是两项选择：HBuilderX 用 `UNI_PLATFORM` 选择目标平台，用 `VITE_APP_ENV` 选择配置 profile。
- 平台专属值使用 HBuilderX/uni-app x 条件编译指令显式选择，例如 `#ifdef APP-ANDROID`、`#ifdef H5` 和 `#ifdef MP-WEIXIN`。不要通过运行时猜测判断平台。
- 只配置当前使用的 H5、微信小程序和 Android 目标，不为尚未提出的平台添加兼容配置。

## 依赖

- 需要纯 TypeScript 逻辑库时使用 `pnpm`。应用构建和调试仍由 HBuilderX 负责，项目依赖安装不能替代 HBuilderX 工具链。
- 应用代码运行时需要的库放在根目录 `package.json` 和根锁文件中；这些库明确需要的类型包也安装在根目录。
- 仅供编辑器使用的 HBuilderX、Vue、uni-app x 类型包放在 `types/package.json` 和 `types/pnpm-lock.yaml` 中，并从 `types` 目录安装。`types/node_modules` 只保留在本地，不提交；它只用于编辑器类型解析，不作为应用运行时依赖或打包内容。
- 不要在类型配置中写机器专属的绝对路径。TypeScript 路径配置遵守 HBuilderX 项目规范。
