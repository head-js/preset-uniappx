export enum ConnectivityType {
  Wifi = "wifi",
  Cellular = "cellular",
  Ethernet = "ethernet",
  Bluetooth = "bluetooth",
  Vpn = "vpn",
  None = "none",
  Unknown = "unknown",
}

const LABELS: Record<ConnectivityType, string> = {
  [ConnectivityType.Wifi]: "WIFI",
  [ConnectivityType.Cellular]: "CELLULAR",
  [ConnectivityType.Ethernet]: "ETHERNET",
  [ConnectivityType.Bluetooth]: "BLUETOOTH",
  [ConnectivityType.Vpn]: "VPN",
  [ConnectivityType.None]: "NONE",
  [ConnectivityType.Unknown]: "UNKNOWN",
};

export function connectivityLabel(type: ConnectivityType): string {
  return LABELS[type];
}

function mapNetworkType(networkType: string): ConnectivityType {
  switch (networkType) {
    case "wifi":
      return ConnectivityType.Wifi;
    case "2g":
    case "3g":
    case "4g":
    case "5g":
      return ConnectivityType.Cellular;
    case "ethernet":
      return ConnectivityType.Ethernet;
    case "none":
      return ConnectivityType.None;
    default:
      return ConnectivityType.Unknown;
  }
}

export class ConnectivityHelper {
  private currentConnectivity: ConnectivityType = ConnectivityType.Unknown;

  private handler: ((res: UniNamespace.OnNetworkStatusChangeSuccess) => void) | null =
    null;

  getCurrentConnectivity(): ConnectivityType {
    return this.currentConnectivity;
  }

  registerCallback(onChanged: (type: ConnectivityType) => void): void {
    this.unregisterCallback();

    const apply = (type: ConnectivityType, notify: boolean) => {
      const changed = type !== this.currentConnectivity;
      this.currentConnectivity = type;
      if (notify && changed) {
        onChanged(type);
      }
    };

    uni.getNetworkType({
      success: (res) => {
        apply(mapNetworkType(res.networkType), true);
      },
      fail: () => {
        apply(ConnectivityType.Unknown, true);
      },
    });

    this.handler = (res) => {
      const type = res.isConnected ? mapNetworkType(res.networkType) : ConnectivityType.None;
      apply(type, true);
    };
    uni.onNetworkStatusChange(this.handler);
  }

  unregisterCallback(): void {
    if (this.handler) {
      uni.offNetworkStatusChange(this.handler);
      this.handler = null;
    }
  }
}
