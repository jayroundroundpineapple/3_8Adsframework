import { _decorator, Component, Node, AudioSource, EventTouch, tween, Vec2, Vec3, UITransform, macro, Skeleton, sp, Prefab, Label, Mask, UIOpacity, utils } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
import { Macro, dingColor } from './Macro';
import { ParkingCarItem } from './ParkingCarItem';
import RESSpriteFrame from '../RESSpriteFrame';
import MoneyChange from '../utils/MoneyChange';
import Anim from '../utils/Anim';
import { Utils } from '../utils/Utils';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Node)
    private resultNode: Node = null;
    @property(Node)
    private citieBtn: Node = null;
    @property(Node)
    private citieNode: Node = null;
    @property(Node)
    private freshBtn: Node = null;
    @property(Node)
    private doubleNode: Node = null;
    @property(Node)
    private doubleLight: Node = null;
    @property(Node)
    private bgNode: Node = null;
    @property(Label)
    private moneyLabel: Label = null;
    @property(Prefab)
    private moneyPrefab: Prefab = null;
    @property(Node)
    private finger: Node = null;
    @property(Node)
    private targetPosNode: Node = null;
    @property(Node)
    private targetPosNode2: Node = null;
    @property(Node)
    private CarNode1: Node = null;
    @property(Node)
    private CarNode2: Node = null;
    @property(Node)
    private dingziContent: Node = null;
    @property(Node)
    private parkingCar0: Node = null;
    @property(Node)
    private parkingCar1: Node = null;

    amount: number = 0;
    GameAudioSource: AudioSource = null;
    blockArr: Node[] = [];
    private parkingCarArr: Node[] = [];
    public static instance: GameUI = null;
    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化
    private moneyChange: MoneyChange = null;
    // 钉子管理系统
    private blockNailsMap: Map<Node, Node[]> = new Map(); // 面板节点 -> 该面板下的钉子数组
    private nailColorMap: Map<Node, dingColor> = new Map(); // 钉子节点 -> 钉子颜色

    protected onLoad(): void {
        PlayerAdSdk.init();
        // 添加触摸事件监听器，等待用户第一次点击
        this.node.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        this.CarNode1.on(Node.EventType.TOUCH_START, this.moveCar1, this)
        // 初始化钉子系统
        this.initNailsSystem();
        //一开始停车位里面有2辆车
        this.parkingCarArr.push(this.parkingCar0);
        this.parkingCarArr.push(this.parkingCar1);
    }
    start() {
        GameUI.instance = this;
        (window as any).gameUI = this;
        // 初始化完成后自动开始游戏
        this.initAudio()
        this.resultNode.active = false;
        this.moneyChange = new MoneyChange(this.moneyLabel, false, this.amount);
        this.moneyChange.prefix = '$';
        this.moneyLabel.string = this.moneyChange.prefix + this.amount.toString();
        Utils.setScale(this.finger, 1.1, 0.2, true);
    }
    public static getInstance(): GameUI {
        if (!GameUI.instance) {
            GameUI.instance = new GameUI();
        }
        return GameUI.instance;
    }
    moveCar1() {
        this.finger.active = false;
        this.CarNode1.off(Node.EventType.TOUCH_START, this.moveCar1, this);
        this.parkingCarArr.push(this.CarNode1);
        this.GameAudioSource.playOneShot(RESSpriteFrame.instance.clickAudioClip, 1);

        let targetPos = this.targetPosNode.parent.getComponent(UITransform).convertToWorldSpaceAR(this.targetPosNode.position);
        targetPos = this.CarNode1.parent.getComponent(UITransform).convertToNodeSpaceAR(targetPos);

        // 使用通用函数移动车辆（从左边路径）
        this.moveCarToSlot(this.CarNode1, targetPos, dingColor.RED, () => {
            let targetPos = this.moneyLabel.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.moneyLabel.node.position);
            targetPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(targetPos);
            this.amount += 20;
            let pos: Vec2 = new Vec2(targetPos.x, targetPos.y);
            this.scheduleOnce(() => {
                this.GameAudioSource.playOneShot(RESSpriteFrame.instance.cashAudioClip, 1);
            }, 0.2)
            Anim.ins().ShowFlyAni(this.moneyPrefab, this.node, 10,
                pos, () => { }, this, [this.moneyChange], this.amount, () => {
                    this.finger.setPosition(new Vec3(202,38, 0));
                    this.finger.active = true
                    // 移动完成后，设置 CarNode2 的点击事件
                    this.CarNode2.on(Node.EventType.TOUCH_START, this.moveCar2, this);
                });
            
        });
    }

    moveCar2() {
        this.finger.active = false
        this.CarNode2.off(Node.EventType.TOUCH_START, this.moveCar2, this);
        this.parkingCarArr.push(this.CarNode2);
        this.GameAudioSource.playOneShot(RESSpriteFrame.instance.clickAudioClip, 1);

        let targetPos = this.targetPosNode2.parent.getComponent(UITransform).convertToWorldSpaceAR(this.targetPosNode2.position);
        targetPos = this.CarNode2.parent.getComponent(UITransform).convertToNodeSpaceAR(targetPos);

        this.moveCarToSlotFromRight(this.CarNode2, targetPos, dingColor.GREEN, () => {
            let targetPos = this.moneyLabel.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.moneyLabel.node.position);
            targetPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(targetPos);
            this.amount += 30;
            let pos: Vec2 = new Vec2(targetPos.x, targetPos.y);
            this.scheduleOnce(() => {
                this.GameAudioSource.playOneShot(RESSpriteFrame.instance.cashAudioClip, 1);
            }, 0.2)
            Anim.ins().ShowFlyAni(this.moneyPrefab, this.node, 20,
                pos, () => { }, this, [this.moneyChange], this.amount, () => {
                    this.showCitieFunc();
                });
        });
    }
    /**指引点击磁铁 */
    showCitieFunc() {
        this.citieBtn.active = true;
        let mask = this.citieBtn.getChildByName('mask')
        mask.active = true;
        this.citieBtn.on(Node.EventType.TOUCH_START, this.onCitieBtnTouch, this);
        let MaskOpacity = mask.getComponent(UIOpacity)
        tween(MaskOpacity).repeatForever(
            tween(MaskOpacity)
                .to(0.3, { opacity: 0 })
                .to(0.3, { opacity: 255 })
                .start()
        ).start();
    }
    onCitieBtnTouch() {
        this.citieBtn.getChildByName('mask').active = false;
        this.citieBtn.getChildByName('numlb').getComponent(Label).string = '1';
        this.GameAudioSource.playOneShot(RESSpriteFrame.instance.clickAudioClip, 1);
        this.citieBtn.off(Node.EventType.TOUCH_START, this.onCitieBtnTouch, this);
        Utils.setScale(this.citieBtn, 1.1, 0.15, false);
        let opacity = this.citieNode.getComponent(UIOpacity)
        this.scheduleOnce(() => {
            tween(this.citieNode)
                .to(0.5, {
                    scale: new Vec3(1, 1, 1),
                    position: new Vec3(0, 0, 0)
                })
                .delay(0.1)
                .call(() => {
                    Anim.ins().shakeEffect(this.citieNode, 1.5);
                    tween(opacity)
                        .to(0.2, { opacity: 100 })
                        .to(0.2, { opacity: 255 })
                        .to(0.3, { opacity: 0 })
                        .call(() => {
                            this.citieNode.active = false;
                            this.installNailsToCar(dingColor.BLUE);
                            let targetPos = this.moneyLabel.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.moneyLabel.node.position);
                            targetPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(targetPos);
                            this.amount += 100;
                            let pos: Vec2 = new Vec2(targetPos.x, targetPos.y);
                            this.scheduleOnce(() => {
                                this.GameAudioSource.playOneShot(RESSpriteFrame.instance.cashAudioClip, 1);
                            }, 0.2)
                            Anim.ins().ShowFlyAni(this.moneyPrefab, this.node, 10,
                                pos, () => { }, this, [this.moneyChange], this.amount, () => {
                                    this.showFresh();
                                });
                        })
                        .start();
                })
                .start();
        }, 0.1)
    }
    showFresh(){
        this.freshBtn.active = true;
        let mask = this.freshBtn.getChildByName('mask')
        mask.active = true;
        this.freshBtn.on(Node.EventType.TOUCH_START, this.onFreshBtnTouch, this);
        let MaskOpacity = mask.getComponent(UIOpacity)
        tween(MaskOpacity).repeatForever(
            tween(MaskOpacity)
                .to(0.3, { opacity: 0 })
                .to(0.3, { opacity: 255 })
                .start()
        ).start();
    }
    onFreshBtnTouch(){
        this.freshBtn.off(Node.EventType.TOUCH_START, this.onFreshBtnTouch, this);
        this.freshBtn.getChildByName('mask').active = false;
        this.freshBtn.getChildByName('numlb').getComponent(Label).string = '1';
        Utils.setScale(this.freshBtn, 1.1, 0.15, false);
        tween(this.doubleLight)
        .to(0.7, {
            scale: new Vec3(1, 1, 1),
            position: new Vec3(0, 0, 0)
        })
        .call(()=>{
            let opacity = this.doubleLight.getComponent(UIOpacity)
            tween(opacity)
            .to(0.2, { opacity: 100 })
            .to(0.2, { opacity: 255 })
            .to(0.3, { opacity: 0 })
            .call(()=>{
                this.doubleLight.active = false;
            })
            .start();
        })
        .start()

        tween(this.doubleNode)
        .to(0.7, {
            scale: new Vec3(1, 1, 1),
            position: new Vec3(0, 0, 0)
        })
        .delay(0.6)
        .to(0.3, {
            scale: new Vec3(0, 0, 1),
        },{easing: 'quadOut'})
        .call(()=>{
            this.amount += 150
            this.moneyChange.play(this.amount, 0.6, () => {
                this.showResult()
            });
        })
        .start();
    }
    showResult(){
        Utils.showPopup(this.resultNode, 0.3, 'backOut', () => {
            this.GameAudioSource.playOneShot(RESSpriteFrame.instance.cherrUpAudioClip, 1);
        });
    }
    /**
     * 通用函数：从左边路径移动车辆到车位
     * @param carNode 车辆节点
     * @param targetPos 目标车位位置（Vec3）
     * @param carColor 车辆颜色
     * @param onComplete 完成回调
     */
    private moveCarToSlot(carNode: Node, targetPos: Vec3, carColor: dingColor, onComplete?: Function): void {
        tween(carNode)
            .to(0.2, { position: new Vec3(carNode.position.x, targetPos.y - Macro.PARKING_ROAD_GAP_Y, 0) })
            .call(() => {
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'left_middle_static', true);
            })
            .to(0.2, { position: new Vec3(Macro.PARKING_ROAD_LEFT_X, targetPos.y - Macro.PARKING_ROAD_GAP_Y, 0) })
            .call(() => {
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'up_middle_static', true);
            })
            .to(0.12, { position: new Vec3(Macro.PARKING_ROAD_LEFT_X, Macro.PARKING_ROAD_BOTTOM_Y, 0) })
            .call(() => {
                carNode.setScale(-1, 1, 1);
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'left_middle_static', true);
            })
            .to(0.2, { position: new Vec3(targetPos.x, Macro.PARKING_ROAD_BOTTOM_Y, 0) })
            .call(() => {
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'up_middle_static', true);
                carNode.setScale(1, 1, 1);
            })
            .to(0.12, { position: new Vec3(targetPos.x, targetPos.y, 0), eulerAngles: new Vec3(0, 0, Macro.PARKING_ROAD_ANGLE) })
            .delay(0.05)
            .call(() => {
                carNode.angle = Macro.PARKINGSPine_ROAD_ANGLE;
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'parking_middle_appear', false);
            })
            .call(() => {
                // 停车完成后，将对应颜色的钉子装到车上
                this.installNailsToCar(carColor);
                if (onComplete) {
                    onComplete();
                }
            })
            .start();
    }

    /**
     * 通用函数：从右边路径移动车辆到车位
     * @param carNode 车辆节点
     * @param targetPos 目标车位位置（Vec3）
     * @param carColor 车辆颜色
     * @param onComplete 完成回调
     */
    private moveCarToSlotFromRight(carNode: Node, targetPos: Vec3, carColor: dingColor, onComplete?: Function): void {
        tween(carNode)
            .to(0.2, { position: new Vec3(Macro.PARKING_ROAD_RIGHT_X, carNode.position.y, 0) })
            .call(() => {
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'up_middle_static', true);
            })
            .to(0.2, { position: new Vec3(Macro.PARKING_ROAD_RIGHT_X, targetPos.y - Macro.PARKING_ROAD_GAP_Y, 0) })
            .call(() => {
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'left_middle_static', true);
            })
            .to(0.32, { position: new Vec3(Macro.PARKING_ROAD_LEFT_X, targetPos.y - Macro.PARKING_ROAD_GAP_Y, 0) })
            .call(() => {
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'up_middle_static', true);
            })
            .to(0.12, { position: new Vec3(Macro.PARKING_ROAD_LEFT_X, Macro.PARKING_ROAD_BOTTOM_Y, 0) })
            .call(() => {
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'left_middle_static', true);
                carNode.setScale(-1, 1, 1);
            })
            .to(0.2, { position: new Vec3(targetPos.x, Macro.PARKING_ROAD_BOTTOM_Y, 0) })
            .call(() => {
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'up_middle_static', true);
                carNode.setScale(1, 1, 1);
            })
            .to(0.12, { position: new Vec3(targetPos.x, targetPos.y, 0), eulerAngles: new Vec3(0, 0, Macro.PARKING_ROAD_ANGLE) })
            .delay(0.05)
            .call(() => {
                carNode.angle = Macro.PARKINGSPine_ROAD_ANGLE;
                carNode.getComponent(sp.Skeleton).setAnimation(0, 'parking_middle_appear', false);
            })
            .call(() => {
                // 停车完成后，将对应颜色的钉子装到车上
                this.installNailsToCar(carColor);
                if (onComplete) {
                    onComplete();
                }
            })
            .start();
    }
    private onFirstTouch(event: EventTouch): void {
        if (this.audioInitialized) {
            return;
        }
        this.node.off(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        this.audioManager.init(this.bgmNode, this.sfxNode); //播放bgm
        const newLocal = this;
        newLocal.audioInitialized = true;
    }
    private initAudio(): void {
        this.audioManager = AudioManager.getInstance();
        if (!this.bgmNode) {
            this.bgmNode = new Node('BGMNode');
            this.bgmNode.parent = this.node;
            this.bgmNode.addComponent(AudioSource);
        }
        if (!this.sfxNode) {
            this.sfxNode = new Node('SFXNode');
            this.sfxNode.parent = this.node;
            this.sfxNode.addComponent(AudioSource);
        }
        // 初始化音频管理器
        this.GameAudioSource = this.sfxNode.getComponent(AudioSource);
    }
    private initNailsSystem(): void {
        this.blockNailsMap.clear();
        this.nailColorMap.clear();
        this.blockArr = this.dingziContent.children;
        for (let i = 0; i < this.blockArr.length; i++) {
            const blockNode = this.blockArr[i];
            const nails: Node[] = [];
            const nailNodes = blockNode.children;
            for (let j = 0; j < nailNodes.length; j++) {
                const nailNode = nailNodes[j];
                const nailName = nailNode.name;
                if (nailName === '0' || nailName === '1' || nailName === '2') {
                    const color = parseInt(nailName) as dingColor;
                    nails.push(nailNode);
                    this.nailColorMap.set(nailNode, color);
                }
            }
            // 将面板和其钉子数组存入Map
            if (nails.length > 0) {
                this.blockNailsMap.set(blockNode, nails);
            }
        }
    }

    /**
     * 消除指定钉子
     * @param nailNode 要消除的钉子节点
     * @returns 是否成功消除
     */
    public removeNail(nailNode: Node): boolean {
        if (!nailNode || !nailNode.isValid) {
            return false;
        }

        // 找到该钉子所属的面板
        let targetBlock: Node | null = null;
        for (const [blockNode, nails] of this.blockNailsMap.entries()) {
            if (nails.includes(nailNode)) {
                targetBlock = blockNode;
                break;
            }
        }

        if (!targetBlock) {
            return false;
        }

        // 从Map中移除该钉子
        const nails = this.blockNailsMap.get(targetBlock);
        if (nails) {
            const index = nails.indexOf(nailNode);
            if (index > -1) {
                nails.splice(index, 1);
                this.nailColorMap.delete(nailNode);

                // 销毁钉子节点
                nailNode.destroy();

                // 检查该面板是否所有钉子都被消除
                if (nails.length === 0) {
                    // 所有钉子都被消除，面板往下掉
                    this.fallBlock(targetBlock);
                }

                return true;
            }
        }

        return false;
    }

    /**
     * 消除指定颜色的所有钉子
     * @param color 钉子颜色
     * @returns 消除的钉子数量
     */
    public removeNailsByColor(color: dingColor): number {
        let removedCount = 0;
        const nailsToRemove: Node[] = [];

        // 收集所有指定颜色的钉子
        for (const [nailNode, nailColor] of this.nailColorMap.entries()) {
            if (nailColor === color && nailNode.isValid) {
                nailsToRemove.push(nailNode);
            }
        }

        // 消除收集到的钉子
        for (const nailNode of nailsToRemove) {
            if (this.removeNail(nailNode)) {
                removedCount++;
            }
        }

        return removedCount;
    }

    /**
     * 面板往下掉
     * @param blockNode 要下落的面板节点
     */
    private fallBlock(blockNode: Node): void {
        if (!blockNode || !blockNode.isValid) {
            return;
        }
        // 从Map中移除该面板
        this.blockNailsMap.delete(blockNode);

        const fallDistance = 1500; // 下落距离
        const currentPos = blockNode.getPosition();
        const targetY = currentPos.y - fallDistance;

        // 使用tween让面板下落
        tween(blockNode)
            .delay(.9)
            .to(1.3, {
                position: new Vec3(currentPos.x, targetY, currentPos.z)
            }, {
                easing: 'sineIn' // 加速下落效果
            })
            .call(() => {
                // 下落完成后可以销毁节点或隐藏
                // blockNode.destroy(); // 如果需要销毁
                // 或者只是隐藏
                // blockNode.active = false;
            })
            .start();
    }

    /**
     * 检查面板是否所有钉子都被消除
     * @param blockNode 面板节点
     * @returns 是否所有钉子都被消除
     */
    public isBlockAllNailsRemoved(blockNode: Node): boolean {
        const nails = this.blockNailsMap.get(blockNode);
        return !nails || nails.length === 0;
    }

    /**
     * 获取面板的剩余钉子数量
     * @param blockNode 面板节点
     * @returns 剩余钉子数量
     */
    public getBlockRemainingNailsCount(blockNode: Node): number {
        const nails = this.blockNailsMap.get(blockNode);
        return nails ? nails.length : 0;
    }

    /**
     * 获取指定面板的所有钉子
     * @param blockNode 面板节点
     * @returns 钉子数组
     */
    public getBlockNails(blockNode: Node): Node[] {
        return this.blockNailsMap.get(blockNode) || [];
    }

    /**
     * 获取钉子的颜色
     * @param nailNode 钉子节点
     * @returns 钉子颜色
     */
    public getNailColor(nailNode: Node): dingColor | null {
        return this.nailColorMap.get(nailNode) || null;
    }

    /**
     * 获取所有面板节点
     * @returns 面板节点数组
     */
    public getAllBlocks(): Node[] {
        return Array.from(this.blockNailsMap.keys());
    }

    /**
     * 重置钉子系统（重新初始化）
     */
    public resetNailsSystem(): void {
        this.initNailsSystem();
    }

    /**
     * 将面板上指定颜色的钉子装到对应颜色的车上
     * @param targetColor 目标钉子颜色（如果不传，默认使用红色）
     */
    private installNailsToCar(targetColor: dingColor = dingColor.RED): void {
        // 收集所有指定颜色的钉子
        const targetNails: Node[] = [];
        for (const [nailNode, nailColor] of this.nailColorMap.entries()) {
            if (nailColor === targetColor && nailNode.isValid) {
                targetNails.push(nailNode);
            }
        }

        if (targetNails.length === 0) {
            return;
        }

        // 找到所有对应颜色的车辆
        const targetCars: ParkingCarItem[] = [];
        for (const carNode of this.parkingCarArr) {
            if (!carNode || !carNode.isValid) {
                continue;
            }
            const carItem = carNode.getComponent(ParkingCarItem);
            if (carItem && carItem.carColor === targetColor) {
                targetCars.push(carItem);
            }
        }

        if (targetCars.length === 0) {
            return;
        }

        // 按顺序给每辆车安装钉子
        let nailIndex = 0;
        let totalInstalledCount = 0;

        for (let carIndex = 0; carIndex < targetCars.length; carIndex++) {
            const carItem = targetCars[carIndex];

            if (carItem.isFull()) {
                continue;
            }

            // 给当前车辆安装钉子，直到装满或没有钉子了
            while (nailIndex < targetNails.length && !carItem.isFull()) {
                const nailNode = targetNails[nailIndex];

                // 从面板上移除钉子（不销毁）
                if (this.removeNailFromBlock(nailNode)) {
                    if (carItem.installNail(nailNode)) {
                        totalInstalledCount++;
                    } else {
                        nailNode.destroy();
                    }
                } else {
                    nailNode.destroy();
                }
                nailIndex++;
            }
            // 如果所有钉子都用完了，退出循环
            if (nailIndex >= targetNails.length) {
                break;
            }
        }
    }

    /**
     * 获取颜色名称
     */
    private getColorName(color: dingColor): string {
        switch (color) {
            case dingColor.RED:
                return '红色';
            case dingColor.GREEN:
                return '绿色';
            case dingColor.BLUE:
                return '蓝色';
            default:
                return '未知';
        }
    }

    /**
     * 从面板上移除钉子（不销毁，用于安装到车辆）
     * @param nailNode 要移除的钉子节点
     * @returns 是否成功移除
     */
    private removeNailFromBlock(nailNode: Node): boolean {
        if (!nailNode || !nailNode.isValid) {
            return false;
        }

        // 找到该钉子所属的面板
        let targetBlock: Node | null = null;
        for (const [blockNode, nails] of this.blockNailsMap.entries()) {
            if (nails.includes(nailNode)) {
                targetBlock = blockNode;
                break;
            }
        }

        if (!targetBlock) {
            return false;
        }

        // 从Map中移除该钉子（但不销毁节点）
        const nails = this.blockNailsMap.get(targetBlock);
        if (nails) {
            const index = nails.indexOf(nailNode);
            if (index > -1) {
                nails.splice(index, 1);
                this.nailColorMap.delete(nailNode);

                // 检查该面板是否所有钉子都被消除
                if (nails.length === 0) {
                    // 所有钉子都被消除，面板往下掉
                    this.fallBlock(targetBlock);
                }

                return true;
            }
        }

        return false;
    }
    cashoutFunc() {
        PlayerAdSdk.jumpStore();
        PlayerAdSdk.gameEnd();
    }
}

