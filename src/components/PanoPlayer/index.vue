<template>
  <div
    id="img"
    ref="img"
    style="
      position: absolute;
      z-index: 0;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    "
  ></div>
  <div class="info" v-html="info"></div>
</template>

<script lang="ts">
import PanoPlayer from "./PanoPlayer";
import image from "../../assets/1.jpg";
import { ref, defineComponent, onMounted, onUnmounted, reactive } from "vue";
export default defineComponent({
  name: "PanoPlayer",
  setup: () => {
    const panoPlayer = new PanoPlayer(100, image);
    let info = ref("");
    onMounted(async () => {
      panoPlayer.mountTo(img.value).start();
    });

    onUnmounted(() => {
      panoPlayer.destory();
    });

    const img = ref<HTMLElement | null>(null);
    return { img, info };
  },
});
</script>

<style scoped>
.info {
  z-index: 1;
  width: 100px;
  height: 50px;
  position: absolute;
  top: 0;
  right: 0;
  background: #ccc;
}
</style>
