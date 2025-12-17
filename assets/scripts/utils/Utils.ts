import { Node, tween, Vec3, screen } from 'cc';

export class Utils {
    /**
 * 获取一个区间的随机数(帧数)
 * @param $from 最小值
 * @param $end 最大值
 * @returns {number}
 */
    public static limitInteger($from: number, $end: number): number {
        return Math.round(this.limit($from, $end));
    }
    /**
 * 获取一个区间的随机数
 * @param $from 最小值
 * @param $end 最大值
 * @returns {number}
 */
    public static limit($from: number, $end: number): number {
        $from = Math.min($from, $end);
        $end = Math.max($from, $end);
        let range: number = $end - $from;
        return $from + Math.random() * range;
    }
    /**汇率浮点数处理 */
    public static getFloatNum(a: number, b: number) {
        let aLen = a.toString().split(".")[1]?.length || 0
        let bLen = b.toString().split(".")[1]?.length || 0
        let powLen = Math.max(aLen, bLen)
        let power = Math.pow(10, powLen)
        const compare = (n) => {
            let result = Math.round(n)
            return n - result < Number.EPSILON ? result : n    //最小浮点数之间的差值
        }
        return compare(a * power) * compare(b * power) / power / power
    }
    /**
     * 角度值转换为弧度制
     * @param angle
     */
    public static getRadian(angle: number): number {
        return angle / 180 * Math.PI;
    }
    public static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 弹窗出现动画（scale 从小到大）
     * @param node 弹窗节点
     * @param duration 动画时长（秒），默认 0.3
     * @param easing 缓动函数，默认 'backOut'
     * @param onComplete 动画完成回调
     */
    public static showPopup(
        node: Node,
        duration: number = 0.3,
        easing: any = 'backOut',
        onComplete?: () => void
    ): void {
        if (!node) {
            console.error('[Utils] showPopup: node 不能为空');
            return;
        }
        node.setScale(0, 0, 1);
        node.active = true;
        tween(node)
            .to(duration, { scale: new Vec3(1, 1, 1) }, { easing: easing })
            .call(() => {
                if (onComplete) {
                    onComplete();
                }
            })
            .start();
    }

    /**
     * 弹窗隐藏动画（scale 从大到小）
     * @param node 弹窗节点
     * @param duration 动画时长（秒），默认 0.3
     * @param easing 缓动函数，默认 'backIn'
     * @param onComplete 动画完成回调
     */
    public static hidePopup(
        node: Node,
        duration: number = 0.3,
        easing: any = 'linear',
        onComplete?: () => void
    ): void {
        if (!node) {
            console.error('[Utils] hidePopup: node 不能为空');
            return;
        }
        tween(node)
            .to(duration, { scale: new Vec3(0, 0, 1) }, { easing: easing })
            .call(() => {
                node.active = false;
                if (onComplete) {
                    onComplete();
                }
            })
            .start();
    }

    /**
     * 弹窗切换显示/隐藏
     * @param node 弹窗节点
     * @param show 是否显示，true=显示，false=隐藏
     * @param duration 动画时长（秒），默认 0.3
     */
    public static togglePopup(
        node: Node,
        show: boolean,
        duration: number = 0.3
    ): void {
        if (show) {
            this.showPopup(node, duration);
        } else {
            this.hidePopup(node, duration);
        }
    }
    public static setScale(node: Node, scale: number, duration: number = 0.07, cb: Function = null): void {
        tween(node)
            .to(duration, { scale: new Vec3(scale, scale, 1) })
            .to(duration, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                cb && cb();
            })
            .start();
    }
    /**
     * 获取当前屏幕方向
     * @returns true 表示竖屏，false 表示横屏
     */
    public static isVertical(): boolean {
        const windowSize = screen.windowSize;
        return windowSize.height > windowSize.width;
    }
    /**
     * 获取当前屏幕宽高比
     * @returns 宽度/高度的比值
     */
    public static getAspectRatio(): number {
        const windowSize = screen.windowSize;
        return windowSize.width / windowSize.height;
    }
}