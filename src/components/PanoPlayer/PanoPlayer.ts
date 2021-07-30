import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module"
import PerspectiveControl from "./controls/PerspectiveControl"
import DeviceOrientationControl from "./controls/DeviceOrientationControl"

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
     * THREE.MeshBasicMaterial 贴图
     */
    protected material!: THREE.MeshBasicMaterial;

    /**
     * PerspectiveControl 全景交互控制器
     */
    protected perspectiveControl!: PerspectiveControl;

    /**
     * DeviceOrientationControl 陀螺仪交互控制器
     */
    protected deviceOrientationControl!: DeviceOrientationControl;

    /**
     * 是否启用帧率状态面板
     */
    protected enableStats: boolean = true

    /**
     * Stats 帧率状态面板
     */
    protected stats!: Stats;

    /**
     * 是否挂载
     */
    protected mounted: any;

    /**
     * 全景播放器构造函数
     * @param radius 球半径
     */
    constructor(radius: number) {
        // 全景半径
        this.radius = radius;

        this.initScene()
        this.initRenderer()
        this.initGeometry()
        this.initControl()
    }

    /**
     * 加载全景图片
     * @param texture_resourse 全景图片资源
     */
    async loadImage(texture_resourse: string) {
        const loader = new THREE.TextureLoader();
        if (!this.material) {
            let texture = loader.load(texture_resourse)
            this.material = new THREE.MeshBasicMaterial({
                map: texture
            });
            const cube = new THREE.Mesh(this.geometry, this.material);
            cube.position.set(0, 0, 0)
            this.scene.add(cube);
        } else {
            this.material.map?.dispose()
            this.material.map = loader.load(texture_resourse)
        }
    }

    /**
     * 启动全景应用
     */
    async start() {
        let that = this
        this.initStats()
        this.initEvent()
        this.mountDom()

        let camera = that.perspectiveControl.getCamera()
        /**
         * 动画循环
         */
        function animate() {
            that.renderer.render(that.scene, camera);
            let deviceOrientation = that.deviceOrientationControl.update()
            let camera_target_angle = that.perspectiveControl.update()
            that.updateCamera(camera, deviceOrientation, camera_target_angle)
            if (that.enableStats) {
                that.stats.begin()
                that.stats.end()
            }
            requestAnimationFrame(animate)
        }
        animate()
    }

    /**
     * 更新照相机视角
     * @param camera 照相机上下文
     * @param param1 设备与屏幕旋转角
     * @param camera_target_angle 视角交互旋转角
     */
    updateCamera(camera: THREE.PerspectiveCamera, { deviceOrientation, screenOrientation }: { deviceOrientation: { alpha: number; beta: number; gamma: number; }; screenOrientation: number; }, camera_target_angle: { lng: any; lat: any; }) {
        // 设备z轴旋转角
        var alpha = deviceOrientation.alpha ? THREE.MathUtils.degToRad(deviceOrientation.alpha) : 0;
        // 设备x轴旋转角
        var beta = deviceOrientation.beta ? THREE.MathUtils.degToRad(deviceOrientation.beta) : 0;
        // 设备y轴旋转角
        var gamma = deviceOrientation.gamma ? THREE.MathUtils.degToRad(deviceOrientation.gamma) : 0;
        // 屏幕旋转角
        var orient = screenOrientation ? THREE.MathUtils.degToRad(screenOrientation) : 0;

        // 表示设备旋转
        var q0 = new THREE.Quaternion(0, -Math.sqrt(0.5), 0, Math.sqrt(0.5));
        var euler = new THREE.Euler();
        euler.set(beta, alpha, - gamma, 'YXZ');
        camera.quaternion.setFromEuler(euler);
        camera.quaternion.multiply(q0);

        // 表示屏幕旋转
        var q1 = new THREE.Quaternion();
        var zee = new THREE.Vector3(0, 0, 1);
        camera.quaternion.multiply(q1.setFromAxisAngle(zee, - orient));

        // 表示视野旋转
        let { lng, lat } = camera_target_angle
        var euler1 = new THREE.Euler();
        euler1.set(lat, -lng, 0, 'YXZ');
        var quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(euler1)
        camera.quaternion.multiply(quaternion);
    }

    /**
     * 挂载dom
     * @returns 
     */
    mountDom() {
        if (this.mounted) return
        this.dom?.appendChild(this.renderer.domElement);
        this.mounted = true
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
     * 初始化交互控制器
     */
    initControl() {
        this.perspectiveControl = new PerspectiveControl(this.renderer, this.radius)
        this.deviceOrientationControl = new DeviceOrientationControl()
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
        this.deviceOrientationControl.initEvent()
    }

    /**
     * 指定全景应用挂载位置
     */
    mountTo(dom: HTMLElement | null) {
        this.dom = dom
        return this
    }

    /**
     * 全景应用资源释放
     */
    destory() {
        this.material.map?.dispose()
        this.perspectiveControl.removeEvent()
        this.deviceOrientationControl.removeEvent()
        this.renderer.domElement.remove()
    }
}

export default PanoPlayer