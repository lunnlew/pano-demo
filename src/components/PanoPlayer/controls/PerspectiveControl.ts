import * as THREE from "three";

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
    let s = getDistance(start[0], start[1])
    let e = getDistance(stop[0], stop[1])
    if (s - e > 0) {
        return s / e;
    } else {
        return -e / s;
    }
}

/**
 * 全景应用交互控制器
 * 实现鼠标、触摸、键盘相关事件动作
 */
class PerspectiveControl {

    /**
     * 鼠标按键、触摸及键盘按键模拟的距离
     */
    protected movement: {
        x: number;
        y: number;
    } = { x: 0, y: 0 }

    /**
    * 鼠标按键、触摸位置值标准化后的值
    */
    protected mouse: {
        x: number;
        y: number;
    } = { x: 0, y: 0 }

    /**
     * PerspectiveCamera 照相机
     */
    protected camera!: THREE.PerspectiveCamera;

    /**
     * 照相机的焦点角度
     */
    protected camera_target_angle: { lng: number, lat: number } = { lng: 0, lat: 0 }

    /**
     * radius 球半径
     */
    protected radius: number = 0;

    /**
     * 渲染器
     */
    protected renderer: THREE.WebGLRenderer;

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
     * 全景播放器交互控制器构造函数
     * @param renderer 渲染对象
     * @param radius 球半径
     */
    constructor(renderer: THREE.WebGLRenderer, radius: number) {
        this.renderer = renderer
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 0;
        this.radius = radius
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
            x: event.movementX * this.radius / 2.5,
            y: event.movementY * this.radius / 2.5
        }
        this.mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
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
        this.mouse = {
            x: 0,
            y: 0
        }
    }

    /**
     * 触摸触发事件处理
     */
    onDocumentTouchStart(event: any) {
        this.muliteTouchMode = event.touches.length > 1
        this.isUserInteractive = true
        this.lastPonits = []
        for (let t of event.touches) {
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
            let currentPoint = <{ pageX: number, pageY: number }>Array.from(event.touches).pop()
            this.lastPonits[0] = currentPoint
            this.movement = {
                x: currentPoint.pageX - lastPoint?.pageX,
                y: currentPoint.pageY - lastPoint?.pageY
            }
            this.mouse = {
                x: (currentPoint.pageX / window.innerWidth) * 2 - 1,
                y: -(currentPoint.pageY / window.innerHeight) * 2 + 1
            }
        } else {
            // 双指 缩放
            let lastPoint1 = this.lastPonits[0]
            let lastPoint2 = this.lastPonits[1]
            let points = event.touches
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
            let fov = this.camera.fov + scale;
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
        this.mouse = {
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
     * 球面距离对应角度
     */
    convertDistanceToAngle() {
        this.camera_target_angle.lng -= (this.movement.x / this.radius) * 0.01;
        this.camera_target_angle.lat += (this.movement.y / this.radius) * 0.01;
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
    update() {
        if (this.isUserInteractive) {
            if (this.isUseKey) {
                this.updateKeyAngle()
            } else if (!this.muliteTouchMode) {
                this.convertDistanceToAngle()
            }
        }
        return this.camera_target_angle
    }

    /**
     * 获取raycaster直线和所有模型相交的数组集合
     * @param objects 模型
     * @returns 
     */
    getIntersects(objects: THREE.Object3D[]) {
        var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5).unproject(this.camera);
        var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());
        var intersects = raycaster.intersectObjects(objects);
        return intersects
    }

    /**
     * 照相机
     */
    getCamera() {
        return this.camera
    }
}
export default PerspectiveControl