import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module"
import PerspectiveControl from "./controls/PerspectiveControl"

/**
 * 全景播放应用
 */
class PanoPlayer {
    /**
     * THREE.WebGLRenderer 渲染器
     */
    renderer!: THREE.WebGLRenderer;
    /**
     * THREE.Scene 场景
     */
    scene!: THREE.Scene;
    /**
     * THREE.PerspectiveCamera 照相机
     */
    camera!: THREE.PerspectiveCamera;
    /**
     * HTMLElement
     */
    dom?: HTMLElement | null;
    /**
     * radius 球半径
     */
    protected radius: number = 0;
    /**
     * THREE.SphereBufferGeometry 几何体
     */
    protected geometry: THREE.SphereBufferGeometry | undefined;
    /**
     * Ttexture_resourse 全景图片资源
     */
    protected texture_resourse: string;
    /**
     * PerspectiveControl 全景交互控制器
     */
    protected perspectiveControl!: PerspectiveControl;
    /**
     * 是否启用帧率状态面板
     */
    protected enableStats: boolean = true
    /**
     * Stats 帧率状态面板
     */
    protected stats!: Stats;
    /**
     * 全景播放器构造函数
     * @param radius 球半径
     * @param texture_resourse 全景图片资源
     */
    constructor(radius: number, texture_resourse: string) {
        // 全景半径
        this.radius = radius;
        // 全景图片
        this.texture_resourse = texture_resourse;

        this.initScene()
        this.initRenderer()
        this.initGeometry()
        this.initControl()
    }
    /**
     * 启动全景应用
     */
    async start() {
        let that = this
        this.initStats()
        /**
         * 动画循环
         */
        function animate() {
            that.perspectiveControl.render(that.scene)
            that.perspectiveControl.update(that.radius)
            if (that.enableStats) {
                that.stats.begin()
                that.stats.end()
            }
            requestAnimationFrame(animate)
        }
        await this.composeMaterial()
        this.initEvent()
        animate()
    }
    /**
     * 初始化场景
     */
    initScene() {
        this.scene = new THREE.Scene();
    }
    /**
     * 渲染器
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    /**
     * 几何物体
     */
    initGeometry() {
        this.geometry = new THREE.SphereBufferGeometry(this.radius, 64, 64);
        // 球面反转，由外表面改成内表面贴图
        this.geometry.scale(-1, 1, 1);
    }
    /**
     * 组合场景素材
     */
    async composeMaterial() {
        const loader = new THREE.TextureLoader();
        const material = new THREE.MeshBasicMaterial({
            map: loader.load(this.texture_resourse)
        });
        const cube = new THREE.Mesh(this.geometry, material);
        this.scene.add(cube);
    }
    /**
     * 初始化交互控制器
     */
    initControl() {
        this.perspectiveControl = new PerspectiveControl(this.renderer, this.radius)
    }
    /**
     * 初始化帧率状态面板
     */
    initStats() {
        if (this.enableStats) {
            this.stats = Stats();
            this.stats.setMode(0);
            this.dom?.append(this.stats.dom);
        }
    }
    /**
     * 初始化全景事件
     */
    initEvent() {
        this.perspectiveControl.initEvent()
    }
    /**
     * 指定全景应用挂载位置
     */
    mountTo(dom: HTMLElement | null) {
        this.dom = dom
        dom?.appendChild(this.renderer.domElement);
        return this
    }
    /**
     * 全景应用资源释放
     */
    destory() {
        this.perspectiveControl.removeEvent()
        this.renderer.domElement.remove()
    }
}

export default PanoPlayer