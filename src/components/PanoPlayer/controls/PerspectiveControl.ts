import { Scene, PerspectiveCamera, WebGLRenderer } from "three";

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

/**
 * 全景应用交互控制器
 * 实现鼠标、触摸、键盘及陀螺仪相关事件动作
 */
class PerspectiveControl {
    /**
     * 鼠标按键、触摸及键盘按键模拟的距离
     */
    protected movement: { x: number; y: number; } = { x: 0, y: 0 }
    /**
     * PerspectiveCamera 照相机
     */
    protected camera!: PerspectiveCamera;
    /**
     * 照相机的焦点角度
     */
    protected camera_target_angle: { lng: number, lat: number } = { lng: 0, lat: 0 }
    /**
     * 渲染器
     */
    protected renderer: WebGLRenderer;
    /**
     * 是否是用户交互事件中
     */
    protected isUserInteractive: boolean = false

    /**
     * 是否多指触摸模式
     */
    protected muliteTouchMode: boolean = false
    /**
     * 触摸的历史位置
     */
    protected lastPonits: Array<{ pageX: number, pageY: number }> = []

    /**
     * 是否按键交互中
     */
    protected isUseKey: boolean = false
    /**
     * 是否按下了左键
     */
    protected onKeyLeft: boolean = false;
    /**
     * 是否按下了右键
     */
    protected onKeyRight: boolean = false;
    /**
     * 是否按下了上键
     */
    protected onKeyUp: boolean = false;
    /**
     * 是否按下了下键
     */
    protected onKeyDown: boolean = false;

    /**
     * 是否按下了Shift键
     */
    protected onKeyShift: boolean = false;

    /**
     * 陀螺仪历史角度值
     */
    protected last_abg: { alpha: number; beta: number; } = { alpha: 0, beta: 0 }

    /**
     * 全景播放器交互控制器构造函数
     * @param renderer 渲染对象
     * @param radius 球半径
     */
    constructor(renderer: WebGLRenderer, radius: number) {
        this.renderer = renderer
        this.camera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 0;
        this.camera.lookAt(radius, 0, 0);
    }
    /**
     * 注册事件
     */
    initEvent() {
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        window.addEventListener('wheel', this.onDocumentMouseWheel.bind(this), false);
        window.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        window.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);
        window.addEventListener('mouseup', this.onDocumentMouseUp.bind(this), false);
        window.addEventListener('touchstart', this.onDocumentTouchStart.bind(this), false);
        window.addEventListener('touchmove', this.onDocumentTouchMove.bind(this), false);
        window.addEventListener('touchend', this.onDocumentTouchEnd.bind(this), false);
        window.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);
        window.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
        window.addEventListener("deviceorientation", this.onDeviceorientation.bind(this), false);
    }
    /**
     * 移除注册的事件
     */
    removeEvent() {
        window.removeEventListener("resize", this.onWindowResize);
        window.removeEventListener("wheel", this.onDocumentMouseWheel);
        window.removeEventListener("mousemove", this.onDocumentMouseMove);
        window.removeEventListener("mousedown", this.onDocumentMouseDown);
        window.removeEventListener("mouseup", this.onDocumentMouseUp);
        window.removeEventListener("touchstart", this.onDocumentTouchStart);
        window.removeEventListener("touchmove", this.onDocumentTouchMove);
        window.removeEventListener("touchend", this.onDocumentTouchEnd);
        window.removeEventListener("keydown", this.onDocumentKeyDown);
        window.removeEventListener("keyup", this.onDocumentKeyUp);
        window.removeEventListener("deviceorientation", this.onDeviceorientation);
    }
    /**
     * 窗口大小事件处理
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    /**
     * 鼠标滚轮事件处理
     */
    onDocumentMouseWheel(event: { deltaY: number }) {
        let fov = this.camera.fov + event.deltaY * 0.05;
        // 限制视角范围
        if (fov > 160) {
            fov = 160
        }
        if (fov < 10) {
            fov = 10
        }
        this.camera.fov = fov
        this.camera.updateProjectionMatrix();
    }
    /**
     * 鼠标移动事件处理
     */
    onDocumentMouseMove(event: any) {
        if (!this.isUserInteractive) return
        this.movement = {
            x: event.movementX,
            y: event.movementY
        }
    }
    /**
     * 鼠标按下事件处理
     */
    onDocumentMouseDown() {
        this.isUserInteractive = true
    }
    /**
     * 鼠标释放事件处理
     */
    onDocumentMouseUp() {
        this.isUserInteractive = false
        this.movement = {
            x: 0,
            y: 0
        }
    }
    /**
     * 触摸触发事件处理
     */
    onDocumentTouchStart(event: any) {
        this.muliteTouchMode = event.changedTouches.length > 1
        this.isUserInteractive = true
        this.lastPonits = []
        for (let t of event.changedTouches) {
            this.lastPonits.push({
                pageX: t.pageX,
                pageY: t.pageY,
            })
        }
    }
    /**
     * 触摸中事件处理
     */
    onDocumentTouchMove(event: any) {
        if (!this.muliteTouchMode) {
            // 单指 移动
            let lastPoint = this.lastPonits[0]
            let currentPoint = <{ pageX: number, pageY: number }>Array.from(event.changedTouches).pop()
            this.lastPonits[0] = currentPoint
            this.movement = {
                x: currentPoint.pageX - lastPoint?.pageX,
                y: currentPoint.pageY - lastPoint?.pageY
            }
        } else {
            // 双指 缩放
            let lastPoint1 = this.lastPonits[0]
            let lastPoint2 = this.lastPonits[1]
            let points = event.changedTouches
            let newPoint1 = points[0]
            let newPoint2 = points[1]
            let scale = getScale(
                [
                    { x: lastPoint1.pageX, y: lastPoint1.pageY },
                    { x: lastPoint2.pageX, y: lastPoint2.pageY },
                ],
                [
                    { x: newPoint1.pageX, y: newPoint1.pageY },
                    { x: newPoint2.pageX, y: newPoint2.pageY },
                ]
            );
            this.camera.fov += scale * 0.01;
            this.camera.updateProjectionMatrix();
        }
    }
    /**
     * 触摸事件结束事件处理
     */
    onDocumentTouchEnd(event: any) {
        this.muliteTouchMode = false
        this.isUserInteractive = false
        this.lastPonits = []
        this.movement = {
            x: 0,
            y: 0
        }
    }
    /**
     * 键盘按键按下事件处理
     */
    onDocumentKeyDown(event: any) {
        var keyCode = event.keyCode || event.which || event.charCode;
        switch (keyCode) {
            case 65: /*a*/
            case 37: /*left*/ this.onKeyLeft = true; this.onKeyRight = false;
                break;
            case 68: /*d*/
            case 39: /*right*/ this.onKeyRight = true; this.onKeyLeft = false;
                break;
            case 87: /*w*/
            case 38: /*up*/ this.onKeyUp = true; this.onKeyDown = false;
                break;
            case 83: /*s*/
            case 40: /*down*/ this.onKeyDown = true; this.onKeyUp = false;
                break;
            case 16: /*Shift*/ this.onKeyShift = true;
                break;
            default: break;
        }
        this.isUseKey = this.onKeyLeft || this.onKeyRight || this.onKeyUp || this.onKeyDown
        this.isUserInteractive = true
    }
    /**
     * 键盘按键释放事件处理
     */
    onDocumentKeyUp(event: any) {
        var keyCode = event.keyCode || event.which || event.charCode;
        switch (keyCode) {

            case 65: /*a*/
            case 37: /*left*/ this.onKeyLeft = false; break;

            case 68: /*d*/
            case 39: /*right*/ this.onKeyRight = false; break;

            case 87: /*w*/
            case 38: /*up*/ this.onKeyUp = false; break;

            case 83: /*s*/
            case 40: /*down*/ this.onKeyDown = false; break;

            case 16: /*L_Shift*/ this.onKeyShift = false; break;
            default: break;
        }
        this.isUseKey = this.onKeyLeft || this.onKeyRight || this.onKeyUp || this.onKeyDown
        this.isUserInteractive = this.isUseKey || this.onKeyShift
    }
    /**
     * 陀螺仪事件处理
     */
    onDeviceorientation(evt: any) {
        // 新的角度变动
        let change_lng = 0
        let change_lat = 0
        // evt.gamma
        // 更新变动差值
        switch (window.orientation) {
            case 0: {
                change_lng = evt.alpha - this.last_abg.alpha;
                change_lat = evt.beta - this.last_abg.beta
                this.last_abg.alpha = evt.alpha;
                this.last_abg.beta = evt.beta;
            }
            case 90: {
                change_lng = evt.alpha - this.last_abg.alpha;
                change_lat = evt.beta - this.last_abg.beta - 90
                this.last_abg.alpha = evt.alpha;
                this.last_abg.beta = evt.beta - 90;
            }
        }

        this.camera_target_angle.lng -= change_lng * 0.01;
        this.camera_target_angle.lat += change_lat * 0.01;
    }
    /**
     * 球面距离对应角度
     */
    convertDistanceToAngle(radius: number) {
        this.camera_target_angle.lng -= (this.movement.x / radius) * 0.01;
        this.camera_target_angle.lat += (this.movement.y / radius) * 0.01;
    }
    /**
     * 更新按键旋转角度
     */
    updateKeyAngle() {
        let dlat = 1
        let dlng = 1
        if (this.onKeyShift) {
            dlat = 5
            dlng = 5
        }
        if (this.onKeyDown) {
            this.camera_target_angle.lat += dlat * 0.01
        }
        if (this.onKeyUp) {
            this.camera_target_angle.lat -= dlat * 0.01
        }
        if (this.onKeyLeft) {
            this.camera_target_angle.lng -= dlng * 0.01
        }
        if (this.onKeyRight) {
            this.camera_target_angle.lng += dlng * 0.01
        }
    }
    /**
     * 更新照相机角度
     */
    update(radius: number) {
        if (this.isUserInteractive) {
            if (this.isUseKey) {
                this.updateKeyAngle()
            } else {
                this.convertDistanceToAngle(radius)
            }
        }
        let { lng, lat } = this.camera_target_angle
        let x = radius * Math.cos(lat) * Math.cos(lng);
        let y = radius * Math.sin(lat);
        let z = radius * Math.cos(lat) * Math.sin(lng);
        this.camera.lookAt(x, y, z);
    }
    /**
     * 渲染任务
     */
    render(scene: Scene) {
        this.renderer.render(scene, this.camera);
    }
}
export default PerspectiveControl