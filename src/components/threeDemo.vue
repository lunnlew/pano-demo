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
</template>

<script lang="ts">
import * as THREE from "three";
import tu1 from "../assets/1.jpg";
import { ref, defineComponent, onMounted, onUnmounted, reactive } from "vue";
export default defineComponent({
  name: "threeDemo",
  setup: () => {
    // 球半径
    let radius = ref(2);

    // 场景
    const scene = new THREE.Scene();

    // 几何物体
    const geometry = new THREE.SphereBufferGeometry(radius.value, 64, 64);
    geometry.scale(-1, 1, 1); // 球面反转，由外表面改成内表面贴图

    // 照相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // 照相机 位置 球心
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;
    // 照相机焦点目标
    let camera_target = ref(new THREE.Vector3(radius.value, 0, 0));

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    /** 加载纹理素材 */
    async function loadTexture(url: string) {
      const loader = new THREE.TextureLoader();
      const texture: THREE.Texture = await new Promise((resolve, reject) => {
        // load a resource
        loader.load(
          url,
          function (texture: THREE.Texture) {
            resolve(texture);
          },

          // onProgress callback currently not supported
          undefined,

          // onError callback
          function (err: any) {
            reject(err);
          }
        );
      });
      return texture;
    }

    /** 当浏览器窗口大小变化时触发 */
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    /** 当鼠标滚轮滚动时触发 */
    function onDocumentMouseWheel(event: { deltaY: number }) {
      //相机的视觉随着鼠标滚动的距离拉进或者远离
      camera.fov += event.deltaY * 0.05;
      camera.updateProjectionMatrix();
    }

    // 经纬度
    let lat = ref(0);
    let lng = ref(0);

    /** 当鼠标移动时触发 */
    function onDocumentMouseMove(event: any) {
      lng.value -= (event.movementX / radius.value) * 0.01;
      lat.value += (event.movementY / radius.value) * 0.01;
    }

    /** 当手指移动开始时触发 */
    let startX = 0;
    let startY = 0;
    let startX1 = 0;
    let startY1 = 0;
    function onDocumentTouchStart(event: any) {
      if (event.changedTouches.length == 1) {
        startX = event.changedTouches[0].pageX;
        startY = event.changedTouches[0].pageY;
      } else if (event.changedTouches.length == 2) {
        startX = event.changedTouches[0].pageX;
        startY = event.changedTouches[0].pageY;
        startX1 = event.changedTouches[1].pageX;
        startY1 = event.changedTouches[1].pageY;
      }
    }

    /** 当手指移动结束时触发 */
    function onDocumentTouchEnd(event: any) {
      startX = 0;
      startY = 0;
      // startX1 = 0;
      // startY1 = 0;
    }

    function getDistance(
      start: { x: number; y: number },
      stop: { x: number; y: number }
    ) {
      return Math.sqrt(
        Math.pow(stop.x - start.x, 2) + Math.pow(stop.y - start.y, 2)
      );
    }

    function getScale(
      start: { x: number; y: number }[],
      stop: { x: number; y: number }[]
    ) {
      return getDistance(start[0], start[1]) / getDistance(stop[0], stop[1]);
    }

    /** 当手指移动中触发 */
    function onDocumentTouchMove(event: any) {
      let points = event.changedTouches;
      // 单指移动 球体滚动
      if (points.length == 1) {
        let moveEndX = points[0].pageX;
        let moveEndY = points[0].pageY;
        let movementX = moveEndX - startX;
        let movementY = moveEndY - startY;
        startX = moveEndX;
        startY = moveEndY;
        lng.value -= (movementX / radius.value) * 0.01;
        lat.value += (movementY / radius.value) * 0.01;
      } else if (points.length == 2) {
        let newStartX = points[0].pageX;
        let newStartY = points[0].pageY;
        let newStartX1 = points[1].pageX;
        let newStartY1 = points[1].pageY;
        // 双指缩放
        let scale = getScale(
          [
            { x: startX, y: startY },
            { x: startX1, y: startY1 },
          ],
          [
            {
              x: newStartX,
              y: newStartY,
            },

            {
              x: newStartX1,
              y: newStartY1,
            },
          ]
        );

        camera.fov += scale * 0.01;
        camera.updateProjectionMatrix();
      }
    }

    // 陀螺仪相关
    let direction = ref<string | number>(0);
    let last_abg = reactive({
      alpha: 0,
      beta: 0,
      gamma: 0,
    });
    function onDeviceorientation(evt: any) {
      // 角度变动
      let change_lng = (evt.alpha - last_abg.alpha) * 0.01;
      let change_lat = (evt.beta - last_abg.beta) * 0.01;

      // 更新变动
      switch (direction.value) {
        case 0:
          lng.value -= change_lng;
          lat.value += change_lat;
          break;
        case 90:
          break;
        case -90:
          break;
      }

      // 上次的角度位置
      last_abg.alpha = evt.alpha;
      last_abg.beta = evt.beta;
    }
    function onOrientationchange(event: any) {
      direction.value = window.orientation;
    }

    // 自动绘制
    function auto_animate() {
      // lng.value += 0.003; // 每帧加一个偏移量
      // 改变相机的对焦点
      camera_target.value.x =
        radius.value * Math.cos(lat.value) * Math.cos(lng.value);
      camera_target.value.y = radius.value * Math.sin(lat.value);
      camera_target.value.z =
        radius.value * Math.cos(lat.value) * Math.sin(lng.value);
      camera.lookAt(camera_target.value); // 对焦

      // cube.rotation.x += 0.003;
      // cube.rotation.y += 0.003;
      renderer.render(scene, camera);

      requestAnimationFrame(auto_animate);
    }

    onMounted(async () => {
      const material = new THREE.MeshBasicMaterial({
        map: await loadTexture(tu1),
      });

      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      img.value?.appendChild(renderer.domElement);

      auto_animate();

      window.addEventListener("resize", onWindowResize, false);
      window.addEventListener("wheel", onDocumentMouseWheel, false);
      window.addEventListener("mousemove", onDocumentMouseMove, false);
      window.addEventListener("touchmove", onDocumentTouchMove, false);
      window.addEventListener("touchstart", onDocumentTouchStart, false);
      window.addEventListener("touchend", onDocumentTouchEnd, false);
      // window.addEventListener("deviceorientation", onDeviceorientation, false);
      // window.addEventListener("orientationchange", onOrientationchange, false);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("wheel", onDocumentMouseWheel);
      window.removeEventListener("mousemove", onDocumentMouseMove);
      window.removeEventListener("touchmove", onDocumentTouchMove);
      window.removeEventListener("touchstart", onDocumentTouchStart);
      window.removeEventListener("touchend", onDocumentTouchEnd);
      // window.removeEventListener("deviceorientation", onDeviceorientation);
      // window.removeEventListener("orientationchange", onOrientationchange);
    });

    const img = ref<HTMLElement | null>(null);
    return { img };
  },
});
</script>

<style scoped>
</style>
