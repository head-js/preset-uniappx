# 构建与打包

> status: 2026-11-13 重构前编写。Android/Gradle/profile 相关章节描述的是旧形态或其他项目，当前仓库已无 `android/` 工程与 profile 体系；Android 工作流归属另一项目。"iOS 模拟器调试"一节为 2026-11-14 新增，反映当前仓库。

## 构建维度

- `VITE_APP_ENV` 选择应用配置 profile；Android 的 `Debug`/`Release` 选择 APK 构建类型。两者正交，例如可以构建使用 `test1` profile 的 Debug APK。
- HBuilderX 负责 uni-app x 编译、运行和导出 App 本地资源。Android Studio 负责本仓库原生 Android 工程的本地 Gradle 构建。
- 禁止使用 HBuilderX 云打包、云构建、云开发等云功能。Android 构建和打包使用本地工作流。
- HBuilderX 的 `Cloud Packaging` 和 `Local Packaging` 是不同入口。生成资源必须选择 `Local Packaging > Generate App Resources`。不要进入云打包入口，也不要为本地构建安装云打包插件；如果提示安装该插件，先退出并核对入口。

## HBuilderX Android 模拟器调试

1. 启动 Android Studio 中的模拟器，等待 HBuilderX 识别并显示为已连接设备。
2. 在 HBuilderX 中运行到 Android App 基座，直接调试 uni-app x 应用。

这条流程用于 HBuilderX 中的快速运行和调试；它与 Android Studio 自行打开仓库原生工程的流程并行支持。

HBuilderX 标准 Android 调试基座的包名为 `io.dcloud.uniappx`，本仓库 APK 的包名为 `com.yingxiaohua.plus`，两者可以同时安装在同一设备上。HBuilderX 向标准基座同步代码，不会更新设备上另行安装的项目 APK。验收时必须确认正在运行的包名；基座中验证通过，不能作为项目 APK 已更新或验证通过的依据。

## Android Studio Debug APK

1. 先在 HBuilderX 执行“发行 → 原生 App 本地打包 → 生成本地打包 App 资源”（英文界面为 Build > App-Android/iOS - Local Packaging > Generate App Resources）。这一步生成 uni-app x 应用资源，不会生成 Java 源码或完整 Android 工程。
2. HBuilderX 资源位于 `unpackage/resources/app-android/<appid>`。其中 `<appid>` 来自根目录 `manifest.json` 的 DCloud AppID。AppID 由 DCloud/HBuilderX 账号流程生成或分配，不能用 Android 包名替代或随意填写。当前项目的 AppID 是 `__UNI__C0990D9`。这是项目共享的 DCloud 应用标识，团队成员使用仓库中的同一个值，不要每人重新生成。
3. 在 Android Studio 中打开仓库内的 `android/` 工程。原生外壳和 Gradle 构建文件属于仓库；uni-app x 运行时 SDK 需要位于 `android/.sdk/Android-uni-app-x-vapor-SDK@101387-5.34`。当前资源由 HBuilderX 5.34 生成，原生工程的 SDK 版本须与导出资源匹配。
4. Gradle 在 `preBuild` 阶段校验导出的资源及其 AppID，并自动将资源同步到 `android/app/build/generated/uniapp-assets/apps/<appid>`。开发者不需要手工从一个目录复制到另一个目录。
5. 在 Android Studio 选择 Build > Build Bundle(s) / APK(s) > Build APK(s)，构建 `app` 的 Debug APK。标准输出路径为 `android/app/build/outputs/apk/debug/app-debug.apk`。

`manifest.json` 中的 DCloud `appid` 与 Android 的 `applicationId` 是两个不同标识。当前 Android `namespace` 和 `applicationId` 都是 `com.yingxiaohua.plus`，配置在 `android/app/build.gradle.kts`。`minSdk` 当前为 23，`targetSdk` 为 36。原生入口继续使用 DCloud 的 `io.dcloud.uniappxv.UniApplication` 和 `io.dcloud.uniappxv.UniAppActivity`。

本地 Android 资源导出时，HBuilderX 不会把 `launch.json.env` 注入 Vite 环境。当前 `vite.config.ts` 会在本地资源导出场景读取 `.hbuilderx/launch.json` 中 Android 运行配置的 `VITE_APP_ENV`。修改 Android 调试所用 profile 时，应通过 HBuilderX 运行配置选择，不能把它和 Gradle 的 Debug/Release 混为一谈。

每次修改应用源码或 profile 后，都要先在 HBuilderX 重新生成 Android 本地资源，再构建 APK，并将新 APK 安装到设备。Gradle 的资源校验只检查导出文件存在且 AppID 一致，不会检查资源是否对应最新源码或目标 profile；仅重新执行 Gradle 构建可能仍打包旧资源。

## Gradle 运行环境与本地命令

当前 DCloud `UTSAutoRegisterPlugin` 要求运行 Gradle 的 Java 为 21。可使用 Android Studio 自带的 Java 21 JBR，无需向全局电脑安装 JDK。Android Studio 中的 Gradle JDK 也应选择 Java 21；项目代码的 Java/Kotlin 编译目标仍为 17，这是另一项配置，不需要跟着改为 21。

如果报错包含 `class file version 65.0` 和 `only recognizes ... 61.0`，说明正在用 Java 17 运行要求 Java 21 的插件，应调整 Gradle 运行环境。

完成 HBuilderX 资源导出后，也可以在 PowerShell 中使用仓库 Gradle Wrapper 本地构建：

```powershell
# 将占位路径替换为本机 Android Studio 安装目录，仅设置当前 PowerShell 会话。
$env:JAVA_HOME = '<Android Studio 安装目录>\jbr'
Set-Location '<仓库目录>\android'
.\gradlew.bat assembleDebug
```

以 `test1` 打包时，先确认 `.hbuilderx/launch.json` 中 Android 运行配置的 `env.VITE_APP_ENV` 为 `test1`，再执行资源导出和上述构建。`assembleDebug` 不负责选择 profile。构建成功后交付 `android/app/build/outputs/apk/debug/app-debug.apk`；可核对文件更新时间并记录 SHA-256，避免传递旧 APK。真机功能验证由人工完成时，构建成功仅表示产物已生成。

## 微信小程序

- 在 HBuilderX 中选择 `mp-weixin-dev`、`mp-weixin-test1` 或 `mp-weixin-prod` 运行/构建；这些脚本分别设置 `UNI_PLATFORM=mp-weixin` 和对应的 `VITE_APP_ENV`。
- HBuilderX 运行产物位于 `unpackage/dist/dev/mp-weixin`，构建产物位于 `unpackage/dist/build/mp-weixin`。开发者工具打开对应目录进行调试；HBuilderX 也可能按本机配置尝试启动微信开发者工具。
- HBuilderX 调用微信开发者工具时，需要微信开发者工具开启服务端口。也可以由开发者手动打开生成目录；这不需要把微信开发者工具的调试配置写入业务代码。
- 微信小程序最终交给微信开发者工具预览、上传和发布；它不是 APK，也不是 Android Studio 的构建产物。

## Release 状态

- Android `Release` 与 profile 选择仍然独立。Release APK 和 AAB 需要分别由本地 Gradle 任务构建；标准输出目录分别是 `android/app/build/outputs/apk/release/` 和 `android/app/build/outputs/bundle/release/`。Android Studio 可通过 Build > Generate Signed Bundle / APK 向导构建签名包。
- 当前仓库尚未配置 Android Release 签名信息，因此 Release APK/AAB 的签名与可发布流程尚未完成。不要将当前 Debug APK 当作发布包，也不要把未经签名配置验证的 Release 产物视为可发布。
- HBuilderX 的 `unpackage/` 资源、微信构建目录、Android `build/` 输出和 APK 均为生成产物，不提交到 Git。原生工程配置、锁文件及所需源文件提交到 Git。

## iOS 模拟器调试（2026-11-14，当前仓库）

### 路线与边界

- 采用 HBuilderX 标准基座调试（与上文 Android"标准基座"流程对称）。
- 范围仅限模拟器调试：不需要 DCloud AppID、不需要原生 Xcode 工程、不需要签名材料。禁用一切云打包/云构建/云开发。
- 基座中验证通过 ≠ 正式产物验证通过；未来离线打包时须重新验收。未来真机调试/离线打包需 DCloud AppID 与 Apple 开发者账号，另立章节。

### 调试标准环境

| 项 | 值 |
| --- | --- |
| 调试设备 | iPhone 12 (iOS 17.0)，udid `EB5976BB-75ED-4038-9B5E-686708B05E4A` |
| Xcode | 27.2 (27B52)；模拟器窗口应用为 **DeviceHub**（Xcode 27 已无传统 `Simulator.app`） |
| HBuilderX | 5.34，CLI 位于 `/Applications/HBuilderX.app/Contents/MacOS/cli` |

iOS 蒸汽模式最低支持 iOS 15+，iOS 17 模拟器满足要求。

### 命令行复现

HBuilderX 的 GUI 运行对话框不需要人工操作，全部可由 CLI 驱动：

```bash
# 查看 HBuilderX 可见的 iOS 模拟器
/Applications/HBuilderX.app/Contents/MacOS/cli devices list --platform ios-simulator

# 启动模拟器（若未启动）
xcrun simctl boot EB5976BB-75ED-4038-9B5E-686708B05E4A

# 编译并运行到 iOS 模拟器（标准基座）
/Applications/HBuilderX.app/Contents/MacOS/cli launch app-ios \
  --project /Users/shuaizhexu/head-js/preset-uniappx \
  --iosTarget simulator \
  --deviceId EB5976BB-75ED-4038-9B5E-686708B05E4A \
  --playground standard

# 仅编译不运行（快速验证编译错误）
# 追加 --compile true；正常收尾输出为 "compiled successfully" + "Stopped running..."
```

截图验证：`xcrun simctl io <udid> screenshot /tmp/shot.png`

注意：`launch` 会话会保持存活以维持热更新；`--pagePath` 可指定启动页，但 `--pageQuery` 实测（5.34）未送达页面 `options`，不要依赖它做参数化启动验证。

### App 端编译约束（5.34 实测）

以下约束在小程序/Web 端不存在，是 App 端蒸汽模式管线独有：

1. **仅接受 ESM**。CJS 模块（含 `.cjs`、`module.exports` 写法）不做任何 CJS→ESM 转换，报 `"default" is not exported` 直接停机。本地文件与 node_modules 一视同仁（已用本地 `.cjs` 探针实验证实）。官方文档未明说此规则，属实测结论。
   - 三方包选型：检查 `package.json` 的 `module` / `exports` / `"type": "module"`；纯 CJS 包不可用。
   - 双重门槛：ESM 产物 + 无宿主环境依赖（无 DOM / Node API）；纯 TS 逻辑类包最安全。
2. **CSS 仅支持 `display: flex | none`**。`display: block` 是编译错误（曾存在于 detail/plan/phase/profile 四页，已删除）。
3. **`scroll-view` 不支持 `scroll-y` 属性**（仅 warning，不阻塞）。
4. **`tabBar.custom: true` 与 `custom-tab-bar/` 是微信专属机制**。App 端忽略之，使用 `tabBar.list` 渲染原生 tabBar，不报错。WebView 页在 App 端因此没有入口，其入口行为归入未来 tabBar 重写。
5. 蒸汽模式仅支持组合式 API，不支持选项式。

### 验证记录（2026-11-14）

- 6 页全部编译通过，Home 页渲染正常（网络/包信息/LOCAL_UUID）。
- 原生 tabBar 五项（Home/Detail/Profile/Plan/Phase）渲染与选中态正常。
- WebView 页可打开（`navigateTo` 语义，带系统返回箭头），内容空白属启动参数问题 + 无入口，见上节第 4 条。
- 修复记录：uuid4 由 CJS 依赖 vanilla.js 收编为 `device-info/index.ts` 本地 TS 函数；vanilla.js 依赖已无使用方，是否移除待定。
