import * as THREE from "three";

/**
 * 全景应用交互控制器
 * 实现陀螺仪相关事件动作
 */
class DeviceOrientationControl {

    /**
     * PerspectiveCamera 照相机
     */
    protected camera!: THREE.PerspectiveCamera;

    /**
     * 陀螺仪历史角度值
     */
    protected last_abg: { alpha: number; beta: number; } = { alpha: 0, beta: 0 }

    /**
     * 照相机的焦点角度
     */
    protected camera_target_angle: { lng: number, lat: number } = { lng: 0, lat: 0 }

    /**
     * 屏幕方向角
     */
    protected screenOrientation: number = 0

    /**
     * 设备方向角
     */
    protected deviceOrientation: { alpha: number, beta: number, gamma: number } = {
        alpha: 0,
        beta: 90,
        gamma: 0
    };

    /**
     * 全景播放器交互控制器构造函数
     * @param camera 照相机
     */
    constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera
    }

    /**
     * 设备方向事件
     */
    onOrientationchange() {
        let orientation = 0
        // TODO 此处暂未处理字符值
        if (typeof window.orientation === 'string') {
            orientation = 0
        }
        this.screenOrientation = orientation || 0;
    }

    /**
     * 设备角度事件
     */
    onDeviceorientation(evt: any) {
        this.deviceOrientation = evt
    }

    /**
     * 注册事件
     */
    initEvent() {
        window.addEventListener("orientationchange", this.onOrientationchange.bind(this), false);
        window.addEventListener("deviceorientation", this.onDeviceorientation.bind(this), false);
    }

    /**
     * 移除注册的事件
     */
    removeEvent() {
        window.removeEventListener("orientationchange", this.onOrientationchange);
        window.removeEventListener("deviceorientation", this.onDeviceorientation);
    }

    /**
     * 更新照相机角度
     */
    update() {
        return {
            deviceOrientation: this.deviceOrientation,
            screenOrientation: this.screenOrientation
        }
    }
}
export default DeviceOrientationControl