<template>
  <div
    id="palyer"
    ref="palyer"
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
  <div class="ctl">
    <input type="file" @change="fileChange" ref="img" />
  </div>
  <div class="thumb-container">
    <ul class="thumb-list">
      <li
        v-for="(image, i) of images"
        v-bind:key="i"
        @click="changeImage(image)"
      >
        <img :src="image" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import PanoPlayer from "./PanoPlayer";
import image1 from "../../assets/1.jpg";
import image2 from "../../assets/2.jpg";
import image3 from "../../assets/3.jpg";
import {
  ref,
  defineComponent,
  onMounted,
  onUnmounted,
  watch,
  reactive,
} from "vue";
export default defineComponent({
  name: "PanoPlayer",
  setup: () => {
    const palyer = ref<HTMLElement | null>(null);
    const panoPlayer = new PanoPlayer(2);
    onMounted(async () => {
      panoPlayer.mountTo(palyer.value).start();
      panoPlayer.loadImage(image1);
    });

    onUnmounted(() => {
      panoPlayer.destory();
    });

    const img = ref({});
    // watch(img, () => {
    //   // panoPlayer.loadImage(img.value);
    // });

    function fileChange(e: any) {
      if (e.target.files?.length > 0) {
        let reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onloadend = function () {
          let data = this.result as string;
          panoPlayer.loadImage(data);
        };
      }
    }
    function changeImage(image: string) {
      panoPlayer.loadImage(image);
    }

    let images = reactive([image1, image2, image3]);
    return { images, palyer, fileChange, changeImage };
  },
});
</script>

<style scoped>
.ctl {
  z-index: 1;
  width: 64px;
  height: 64px;
  position: absolute;
  bottom: 120px;
  right: 30px;
  background: #666;
}
.thumb-container {
  z-index: 0;
  width: 100%;
  height: 80px;
  position: absolute;
  bottom: 10px;
  overflow: hidden;
}
.thumb-list {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  list-style: none;
}
.thumb-list li {
  width: 100px;
  height: 80px;
  padding: 0 2px;
}
.thumb-list li img {
  width: 100px;
  height: 80px;
  background-size: contain;
  border-radius: 5px;
}
</style>
