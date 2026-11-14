export const APP_NAME = "Preset App";
export const APP_ID = "com.lisitede.preset.app";
export const APP_VERSION = "1.0.0";

export interface AppPackageInfo {
  appName: string;
  appId: string;
  appVersion: string;
}

export class PackageInfoHelper {
  private currentInfo: AppPackageInfo = {
    appName: APP_NAME,
    appId: APP_ID,
    appVersion: APP_VERSION,
  };

  getCurrentAppPackageInfo(): AppPackageInfo {
    return this.currentInfo;
  }

  getDisplayString(): string {
    const info = this.getCurrentAppPackageInfo();
    return `App Name: ${info.appName}\nApp Id: ${info.appId}\nApp Version: ${info.appVersion}`;
  }
}
