<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useSplashStore } from "@/stores/splash";

const splashStore = useSplashStore();

onLaunch(() => {
  console.log("App Launch");
  void splashStore.initialize().catch(() => undefined);
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style></style>
