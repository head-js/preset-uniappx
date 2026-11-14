type TabKey = "home" | "detail" | "profile" | "plan" | "phase";

interface CustomTabBarInstance {
  syncRoute?(route: string): void;
  setData(data: { selectedKey: TabKey }): void;
}

interface WechatPageInstance {
  route?: string;
  getTabBar?: () => CustomTabBarInstance | undefined;
}

const routeToTabKey: Record<string, TabKey> = {
  "pages/index/index": "home",
  "pages/detail/index": "detail",
  "pages/profile/index": "profile",
  "pages/plan/index": "plan",
  "pages/phase/index": "phase",
};

export function syncCustomTabBar() {
  const pages = getCurrentPages() as unknown as WechatPageInstance[];
  const currentPage = pages[pages.length - 1];
  const selectedKey = currentPage?.route
    ? routeToTabKey[currentPage.route]
    : undefined;

  const tabBar = currentPage.getTabBar?.();
  if (selectedKey && tabBar) {
    if (tabBar.syncRoute && currentPage.route) {
      tabBar.syncRoute(currentPage.route);
    } else {
      tabBar.setData({ selectedKey });
    }
  }
}
