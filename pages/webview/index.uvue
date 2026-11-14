<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const url = ref("");

onLoad((options) => {
  const raw = (options as Record<string, string | undefined>).url ?? "";
  try {
    url.value = raw ? decodeURIComponent(raw) : "";
  } catch {
    url.value = raw;
  }
  if (!url.value) {
    uni.showToast({ title: "Missing url", icon: "none" });
  }
});
</script>

<template>
  <web-view v-if="url" :src="url" />
</template>
