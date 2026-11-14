import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.uvue";
export function createApp() {
  const app = createSSRApp(App);
  app.use(createPinia());
  return {
    app,
  };
}
