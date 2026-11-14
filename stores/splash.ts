import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { DeviceInfoHelper } from "~device-info";

export type SplashPhase =
  | "idle"
  | "initializing"
  | "ready"
  | "error";

interface PrivacySettingResult {
  needAuthorization: boolean;
  privacyContractName?: string;
}

interface PrivacyApi {
  getPrivacySetting?: (options: {
    success: (result: PrivacySettingResult) => void;
    fail: (error: unknown) => void;
  }) => void;
  requirePrivacyAuthorize?: (options: {
    success: () => void;
    fail: (error: unknown) => void;
  }) => void;
}

function getPrivacyApi(): PrivacyApi | undefined {
  // 微信隐私 API 只在 mp-weixin 运行时存在，其他端直接跳过。
  const runtime = globalThis as typeof globalThis & { wx?: PrivacyApi };
  return runtime.wx;
}

function logSplash(message: string, detail?: unknown): void {
  if (detail === undefined) {
    console.log(`[Splash] ${message}`);
  } else {
    console.log(`[Splash] ${message}`, detail);
  }
}

export const useSplashStore = defineStore("splash", () => {
  const deviceInfoHelper = new DeviceInfoHelper();
  const localUuid = ref<string | undefined>();
  const phase = ref<SplashPhase>("idle");
  const errorMessage = ref("");
  const ready = computed(() => phase.value === "ready");

  let initializePromise: Promise<void> | undefined;
  let localUuidInitialized = false;

  function initializeLocalUuidAfterConsent(): void {
    if (localUuidInitialized) {
      return;
    }

    localUuid.value = deviceInfoHelper.getCurrentDeviceInfo().localUuid;
    localUuidInitialized = true;
    logSplash("localUuid initialized after consent");
  }

  function getPrivacySetting(
    privacyApi: PrivacyApi | undefined,
  ): Promise<PrivacySettingResult | undefined> {
    const query = privacyApi?.getPrivacySetting;
    if (!query) {
      return Promise.resolve(undefined);
    }

    return new Promise((resolve, reject) => {
      query({
        success: (result) => {
          logSplash("privacy setting received", result);
          resolve(result);
        },
        fail: (error) => {
          logSplash("privacy setting query failed", error);
          reject(error);
        },
      });
    });
  }

  async function checkPrivacy(): Promise<void> {
    const privacyApi = getPrivacyApi();
    logSplash("privacy check started", {
      hasGetPrivacySetting: Boolean(privacyApi?.getPrivacySetting),
      hasRequirePrivacyAuthorize: Boolean(privacyApi?.requirePrivacyAuthorize),
    });

    const setting = await getPrivacySetting(privacyApi);
    if (privacyApi?.requirePrivacyAuthorize) {
      await new Promise<void>((resolve, reject) => {
        privacyApi.requirePrivacyAuthorize!({
          success: () => {
            logSplash("privacy authorization completed without showing a prompt");
            resolve();
          },
          fail: (error) => {
            logSplash("privacy authorization failed", error);
            reject(error);
          },
        });
      });
      return;
    }

    if (setting?.needAuthorization) {
      throw new Error("Privacy authorization API is unavailable");
    }

    if (setting && !setting.needAuthorization) {
      logSplash("privacy authorization API unavailable; setting does not require authorization", {
        privacyContractName: setting.privacyContractName ?? null,
      });
      return;
    }

    if (!setting) {
      logSplash("privacy API unavailable; skipping privacy gate");
    }
  }

  function initialize(): Promise<void> {
    if (initializePromise) {
      return initializePromise;
    }

    phase.value = "initializing";
    errorMessage.value = "";
    initializePromise = checkPrivacy()
      .then(() => {
        initializeLocalUuidAfterConsent();
        phase.value = "ready";
      })
      .catch((error: unknown) => {
        initializePromise = undefined;
        phase.value = "error";
        errorMessage.value = error instanceof Error ? error.message : String(error);
        throw error;
      });

    return initializePromise;
  }

  function retry(): Promise<void> {
    initializePromise = undefined;
    return initialize();
  }

  return {
    localUuid,
    phase,
    errorMessage,
    ready,
    initialize,
    retry,
  };
});
