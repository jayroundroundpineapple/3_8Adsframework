import { _decorator, Component, Node, Vec3, Prefab, instantiate } from 'cc';
import { Macro, CarType, dingColor } from './Macro';
const { ccclass, property } = _decorator;

/**
 * 停车位车辆组件
 * 管理车辆上的钉子
 */
@ccclass('ParkingCarItem')
export class ParkingCarItem extends Component {
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

    // 当前已装的钉子数组
    private installedNails: Node[] = [];
    // 当前钉子索引（下一个要装的钉子位置）
    private currentNailIndex: number = 0;

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
        this.currentNailIndex = 0;

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

            // 检查是否是钉子节点（名字是 "0", "1", "2"）
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

        console.log(`[ParkingCarItem] 车辆 ${this.node.name} 初始化完成，已装 ${this.getInstalledNailCount()} 个钉子`);
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
            console.warn(`[ParkingCarItem] 车辆 ${this.node.name} 钉子已满，无法安装`);
            return false;
        }

        // 检查钉子颜色是否匹配
        const nailName = nailNode.name;
        if (nailName !== '0' && nailName !== '1' && nailName !== '2') {
            console.warn(`[ParkingCarItem] 无效的钉子节点`);
            return false;
        }

        const nailColor = parseInt(nailName) as dingColor;
        if (nailColor !== this.carColor) {
            console.warn(`[ParkingCarItem] 钉子颜色 ${nailColor} 与车辆颜色 ${this.carColor} 不匹配`);
            return false;
        }

        // 获取钉子位置
        const nailPositions = this.getNailPositions();
        const targetPos = nailPositions[this.currentNailIndex];

        // 设置钉子位置和父节点
        nailNode.setParent(this.node);
        nailNode.setPosition(targetPos);
        nailNode.setScale(Macro.CAR_DI_SCALE, Macro.CAR_DI_SCALE, 1);

        // 记录钉子
        this.installedNails[this.currentNailIndex] = nailNode;
        this.currentNailIndex++;

        console.log(`[ParkingCarItem] 车辆 ${this.node.name} 安装第 ${this.currentNailIndex} 个钉子成功`);

        return true;
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

