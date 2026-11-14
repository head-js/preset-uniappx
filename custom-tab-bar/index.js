const WEBVIEW_TARGET = "https://uniapp.dcloud.net.cn/";

const TAB_ITEMS = {
  home: {
    key: "home",
    text: "Home",
    iconPath: "/static/tabbar/home.png",
    selectedIconPath: "/static/tabbar/home-selected.png",
  },
  detail: {
    key: "detail",
    text: "Detail",
    iconPath: "/static/tabbar/detail.png",
    selectedIconPath: "/static/tabbar/detail-selected.png",
  },
  webview: {
    key: "webview",
    text: "",
    iconPath: "/static/tabbar/webview.png",
  },
  profile: {
    key: "profile",
    text: "Profile",
    iconPath: "/static/tabbar/profile.png",
    selectedIconPath: "/static/tabbar/profile-selected.png",
  },
  plan: {
    key: "plan",
    text: "Plan",
    iconPath: "/static/tabbar/plan.png",
    selectedIconPath: "/static/tabbar/plan-selected.png",
  },
  phase: {
    key: "phase",
    text: "Phase",
    iconPath: "/static/tabbar/phase.png",
    selectedIconPath: "/static/tabbar/phase-selected.png",
  },
};

const PRIMARY_ITEMS = [
  TAB_ITEMS.home,
  TAB_ITEMS.detail,
  TAB_ITEMS.webview,
  TAB_ITEMS.profile,
];

const PRIMARY_LOADING_ITEMS = [TAB_ITEMS.home, TAB_ITEMS.profile];
const SECONDARY_ITEMS = [TAB_ITEMS.plan, TAB_ITEMS.phase];

const ROUTE_TO_TAB_KEY = {
  "pages/index/index": "home",
  "pages/detail/index": "detail",
  "pages/profile/index": "profile",
  "pages/plan/index": "plan",
  "pages/phase/index": "phase",
};

function getCurrentRoute() {
  const pages = getCurrentPages();
  return pages[pages.length - 1]?.route;
}

function getScreenKey(route) {
  return route === "pages/plan/index" || route === "pages/phase/index"
    ? "secondary"
    : "primary";
}

function mockFetchTabItems() {
  let timer;
  const promise = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve([
        TAB_ITEMS.home,
        TAB_ITEMS.detail,
        TAB_ITEMS.webview,
        TAB_ITEMS.profile,
      ]);
    }, 500);
  });

  return { promise, timer };
}

Component({
  data: {
    selectedKey: "home",
    screenKey: "primary",
    navigating: false,
    color: "#7A7E83",
    selectedColor: "#007AFF",
    items: PRIMARY_LOADING_ITEMS,
  },

  lifetimes: {
    attached() {
      this.syncRoute(getCurrentRoute());
      this.loadItems();
    },

    detached() {
      this.detachedState = true;
      if (this.mockFetchTimer) {
        clearTimeout(this.mockFetchTimer);
        this.mockFetchTimer = undefined;
      }
      if (this.navigationTimer) {
        clearTimeout(this.navigationTimer);
        this.navigationTimer = undefined;
      }
    },
  },

  methods: {
    async loadItems() {
      const request = mockFetchTabItems();
      this.mockFetchTimer = request.timer;
      const items = await request.promise;
      this.mockFetchTimer = undefined;
      if (!this.detachedState) {
        this.configLoaded = true;
        if (this.data.screenKey === "primary") {
          this.setData({ items });
        }
      }
    },

    syncRoute(route) {
      const selectedKey = route ? ROUTE_TO_TAB_KEY[route] : undefined;
      const screenKey = getScreenKey(route);
      const items = screenKey === "secondary"
        ? SECONDARY_ITEMS
        : this.configLoaded
          ? PRIMARY_ITEMS
          : PRIMARY_LOADING_ITEMS;

      this.setData({
        screenKey,
        items,
        ...(selectedKey ? { selectedKey } : {}),
      });
    },

    handleTap(event) {
      const key = event.currentTarget.dataset.key;

      if (this.data.navigating) {
        return;
      }

      if (key === "webview") {
        this.navigate("navigateTo", {
          url: `/pages/webview/index?url=${encodeURIComponent(WEBVIEW_TARGET)}`,
        });
        return;
      }

      const tabRoutes = {
        home: "/pages/index/index",
        detail: "/pages/detail/index",
        profile: "/pages/profile/index",
        plan: "/pages/plan/index",
        phase: "/pages/phase/index",
      };
      const url = tabRoutes[key];

      if (!url || key === this.data.selectedKey) {
        return;
      }

      this.navigate("switchTab", { url });
    },

    navigate(method, options) {
      this.setData({ navigating: true });

      let released = false;
      const release = () => {
        if (released) {
          return;
        }
        released = true;
        clearTimeout(this.navigationTimer);
        this.navigationTimer = undefined;
        this.setData({ navigating: false });
      };

      this.navigationTimer = setTimeout(release, 2000);
      wx[method]({
        ...options,
        complete: release,
      });
    },
  },
});
