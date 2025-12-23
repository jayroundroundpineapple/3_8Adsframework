import { _decorator, Component, Node, Vec3, Prefab, instantiate, tween, UITransform, sp } from 'cc';
import { Macro, CarType, dingColor } from './Macro';
import { GameUI } from './GameUI';
import RESSpriteFrame from '../RESSpriteFrame';
const { ccclass, property } = _decorator;

/**
 * 停车位车辆组件
 * 管理车辆上的钉子
 */
@ccclass('ParkingCarItem')
export class ParkingCarItem extends Component {
    @property({
        type:Boolean,
        tooltip: '是否是自己设置停车场内的车辆,默认是false'
    })
    public isSelfSet:boolean = false;

    @property({
        type: Number,
        tooltip: '车位索引（第几个车位）'
    })
    public slotIndex: number = 0;

    @property({
        type: Number,
        tooltip: '车辆颜色（对应钉子颜色）'
    })
    public carColor: dingColor = dingColor.RED;

    @property({
        type: Number,
        tooltip: '车辆类型（0=小车，1=中车，2=大车）'
    })
    public carType: CarType = CarType.SMALL;

    @property({
        type: Prefab,
        tooltip: '钉子预制体（可选，如果需要动态创建钉子）'
    })
    public nailPrefab: Prefab = null;
    @property({
        type: Number,
        tooltip: '当前钉子索引（用于下一个要装的钉子位置）'
    })
    public currentNailIndex:number = 0;
    // 当前已装的钉子数组
    private installedNails: Node[] = [];
    

    protected onLoad(): void {
        this.initCar();
    }

    /**
     * 初始化车辆
     */
    private initCar(): void {
        // 根据车辆类型初始化钉子位置
        const maxNails = this.getMaxNails();
        this.installedNails = new Array(maxNails).fill(null);
        // 如果车辆已经有钉子（编辑器预设），需要记录它们
        this.initExistingNails();
    }

    /**
     * 初始化已存在的钉子（编辑器预设的钉子）
     */
    private initExistingNails(): void {
        const nailPositions = this.getNailPositions();
        const children = this.node.children;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const nailName = child.name;
            if (nailName === '0' || nailName === '1' || nailName === '2') {
                const nailColor = parseInt(nailName) as dingColor;
                // 检查钉子颜色是否匹配车辆颜色
                if (nailColor === this.carColor) {
                    // 找到对应的位置索引
                    const positionIndex = this.findNailPositionIndex(child.getPosition(), nailPositions);
                    if (positionIndex >= 0 && positionIndex < this.installedNails.length) {
                        this.installedNails[positionIndex] = child;
                        this.currentNailIndex = Math.max(this.currentNailIndex, positionIndex + 1);
                    }
                }
            }
        }
    }

    /**
     * 找到钉子位置索引
     */
    private findNailPositionIndex(nailPos: Vec3, positions: Vec3[]): number {
        const threshold = 5; // 位置容差
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const distance = Vec3.distance(nailPos, pos);
            if (distance < threshold) {
                return i;
            }
        }
        return -1;
    }

    /**
     * 获取最大钉子数量
     */
    public getMaxNails(): number {
        switch (this.carType) {
            case CarType.SMALL:
                return 4;
            case CarType.MIDDLE:
                return 6;
            case CarType.BIG:
                return 6; // 大车暂时也用6个
            default:
                return 4;
        }
    }

    /**
     * 获取钉子位置数组
     */
    public getNailPositions(): Vec3[] {
        switch (this.carType) {
            case CarType.SMALL:
                return Macro.SMALL_CAR_DINGZIPOS_ARR;
            case CarType.MIDDLE:
                return Macro.MIDDLE_CAR_DINGZIPOS_ARR;
            case CarType.BIG:
                return Macro.BIG_CAR_DINGZIPOS_ARR;
            default:
                return Macro.SMALL_CAR_DINGZIPOS_ARR;
        }
    }

    /**
     * 安装钉子到车辆上
     * @param nailNode 要安装的钉子节点
     * @returns 是否安装成功
     */
    public installNail(nailNode: Node): boolean {
        // 检查是否还有空位
        if (this.currentNailIndex >= this.getMaxNails()) {
            return false;
        }

        // 检查钉子颜色是否匹配
        const nailName = nailNode.name;
        if (nailName !== '0' && nailName !== '1' && nailName !== '2') {
            return false;
        }

        const nailColor = parseInt(nailName) as dingColor;
        if (nailColor !== this.carColor) {
            return false;
        }

        // 获取钉子位置
        const nailPositions = this.getNailPositions();
        const targetPos = nailPositions[this.currentNailIndex];
        
        // 记录这是否是最后一个钉子（安装后车辆会装满）
        const willBeFull = this.currentNailIndex + 1 >= this.getMaxNails();
        
        // 设置钉子位置和父节点
        let nowPos = nailNode.parent.getComponent(UITransform).convertToWorldSpaceAR(nailNode.position);
        nailNode.setParent(this.node);
        nowPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(nowPos);
        nailNode.setPosition(nowPos);
        let boderY = this.carColor === dingColor.GREEN ? 50 : 2;
        tween(nailNode)
        .delay(0.1)
        .to(0.4, { scale: new Vec3(1.1, 1.1, 1) ,position: new Vec3(nowPos.x + 3, nowPos.y + 80, 0)}, { easing: 'quadOut' })
        .delay(0.3)
        .to(0.4, { position: targetPos ,scale: new Vec3(Macro.CAR_DI_SCALE, Macro.CAR_DI_SCALE, 1) }, { easing: 'quadOut' })
        .call(()=>{
            nailNode.setScale(Macro.CAR_DI_SCALE, Macro.CAR_DI_SCALE, 1);
            
            // 钉子动画完成后，如果这是最后一个钉子（车辆已装满），则放大车辆
            if (willBeFull) {
                this.moveOutCar();
            }
        })
        .start();

        this.installedNails[this.currentNailIndex] = nailNode;
        this.currentNailIndex++;
        
        return true;
    }

    /**
     * 车辆装满钉子后离开停车场
     */
    private moveOutCar(): void {
        GameUI.instance.GameAudioSource.playOneShot(RESSpriteFrame.instance.goodAudioClip, 1);
        let posX = this.node.position.x;
        this.node.eulerAngles = new Vec3(0, 0, Macro.CAR_LEAVE_ANGLE1);
        let roadBottomY = this.isSelfSet ? Macro.CUSTOM_PARKING_ROAD_BOTTOM_Y : Macro.PARKING_ROAD_BOTTOM_Y;
        tween(this.node)
        .delay(0.05)
            .to(0.2, { position: new Vec3(posX, roadBottomY, 0)
            ,eulerAngles: new Vec3(0, 0, Macro.CAR_LEAVE_ANGLE1)})
            .to(0.1, {eulerAngles: new Vec3(0, 0, Macro.CAR_LEAVE_ANGLE2)})
            .by(0.5, { position: new Vec3(750, 0, 0) })
            .call(() => {
                
            })
            .start();
    }

    /**
     * 获取已安装的钉子数量
     */
    public getInstalledNailCount(): number {
        return this.installedNails.filter(nail => nail !== null).length;
    }

    /**
     * 检查是否已装满钉子
     */
    public isFull(): boolean {
        return this.currentNailIndex >= this.getMaxNails();
    }

    /**
     * 获取当前钉子索引（下一个要装的钉子位置）
     */
    public getCurrentNailIndex(): number {
        return this.currentNailIndex;
    }

    /**
     * 获取所有已安装的钉子
     */
    public getInstalledNails(): Node[] {
        return this.installedNails.filter(nail => nail !== null && nail.isValid);
    }

    /**
     * 移除指定位置的钉子
     * @param index 钉子位置索引
     * @returns 是否移除成功
     */
    public removeNail(index: number): boolean {
        if (index < 0 || index >= this.installedNails.length) {
            return false;
        }

        const nail = this.installedNails[index];
        if (nail && nail.isValid) {
            nail.destroy();
            this.installedNails[index] = null;
            
            // 更新当前索引
            if (index < this.currentNailIndex) {
                this.currentNailIndex = index;
            }
            
            return true;
        }

        return false;
    }

    /**
     * 清空所有钉子
     */
    public clearAllNails(): void {
        for (let i = 0; i < this.installedNails.length; i++) {
            if (this.installedNails[i] && this.installedNails[i].isValid) {
                this.installedNails[i].destroy();
            }
            this.installedNails[i] = null;
        }
        this.currentNailIndex = 0;
    }
}

