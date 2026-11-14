import { APP_ID } from '@/utils/package-info';

function uuid4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STORAGE_KEY = `${APP_ID}.LOCAL_UUID`;

export interface DeviceInfo {
  localUuid: string;
}

export class DeviceInfoHelper {
  private currentInfo: DeviceInfo = {
    localUuid: "unknown",
  };

  getCurrentDeviceInfo(): DeviceInfo {
    let localUuid = uni.getStorageSync(STORAGE_KEY);
    if (typeof localUuid !== "string" || localUuid.length === 0) {
      localUuid = uuid4();
      uni.setStorageSync(STORAGE_KEY, localUuid);
    }
    this.currentInfo = { localUuid };
    return this.currentInfo;
  }

  getDisplayString(): string {
    const info = this.getCurrentDeviceInfo();
    return `LOCAL_UUID: ${info.localUuid}`;
  }
}
