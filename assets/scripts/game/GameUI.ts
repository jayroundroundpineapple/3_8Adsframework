import { _decorator, Component, Node, AudioSource, EventTouch, director, Director, PhysicsSystem2D, tween, Vec3, UITransform, macro, Skeleton, sp } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
import { Macro, dingColor } from './Macro';
import { ParkingCarItem } from './ParkingCarItem';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Node)
    private finger: Node = null;
    @property(Node)
    private targetPosNode: Node = null;
    @property(Node)
    private CarNode1: Node = null;
    @property(Node)
    private dingziContent:Node = null;

    blockArr:Node[] = [];
    private parkingCarArr: Node[] = [];
    private static instance: GameUI = null;
    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化
    
    // 钉子管理系统
    private blockNailsMap: Map<Node, Node[]> = new Map(); // 面板节点 -> 该面板下的钉子数组
    private nailColorMap: Map<Node, dingColor> = new Map(); // 钉子节点 -> 钉子颜色
    
    protected onLoad(): void {
        // PhysicsSystem2D.instance.enable = true
        PlayerAdSdk.init();
        // 添加触摸事件监听器，等待用户第一次点击
        this.node.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        this.CarNode1.on(Node.EventType.TOUCH_START,this.moveCar1,this)
        
        // 初始化钉子系统
        this.initNailsSystem();
    }
    public static getInstance(): GameUI {
        if (!GameUI.instance) {
            GameUI.instance = new GameUI();
        }
        return GameUI.instance;
    }
    moveCar1(){
        let targetPos = this.targetPosNode.parent.getComponent(UITransform).convertToWorldSpaceAR(this.targetPosNode.position);
        targetPos = this.CarNode1.parent.getComponent(UITransform).convertToNodeSpaceAR(targetPos);
        //获取车位的相对坐标
        tween(this.CarNode1)
        .to(0.2, { position: new Vec3(this.CarNode1.position.x, targetPos.y - Macro.PARKING_ROAD_GAP_Y, 0) })
        .call(()=>{
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'left_middle_static', true);
        })
        .to(0.2, { position: new Vec3(Macro.PARKING_ROAD_LEFT_X, targetPos.y - Macro.PARKING_ROAD_GAP_Y, 0) })
        .call(()=>{
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'up_middle_static', true);
        })
        .to(0.12, { position: new Vec3(Macro.PARKING_ROAD_LEFT_X, Macro.PARKING_ROAD_BOTTOM_Y, 0) })
        .call(()=>{
            this.CarNode1.setScale(-1, 1, 1);
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'left_middle_static', true);
        })
        .to(0.2, { position: new Vec3(targetPos.x, Macro.PARKING_ROAD_BOTTOM_Y, 0) })
        .call(()=>{
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'up_middle_static', true);
            this.CarNode1.setScale(1, 1, 1);
        })
        .to(0.12, { position: new Vec3(targetPos.x, targetPos.y, 0),eulerAngles: new Vec3(0, 0, Macro.PARKING_ROAD_ANGLE) })
        .delay(0.05)
        .call(()=>{
            this.CarNode1.angle = Macro.PARKINGSPine_ROAD_ANGLE;
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'parking_middle_appear', false);
        })
        .call(() => {
            // 停车完成后，将红色钉子装到车上
            this.installNailsToCar();
        })
        .start();
    }
    start() {
        GameUI.instance = this;
        (window as any).gameUI = this;
        // 初始化完成后自动开始游戏
    }
    /**
     * 第一次触摸屏幕时调用（初始化音频系统）
     */
    private onFirstTouch(event: EventTouch): void {
        if (this.audioInitialized) {
            return;
        }
        // 初始化音频系统
        this.initAudio();
        this.audioInitialized = true;
        this.node.off(Node.EventType.TOUCH_START, this.onFirstTouch, this);
    }
    
    /**
     * 初始化音频系统
     */
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
        // 初始化音频管理器（会自动播放背景音乐）
        this.audioManager.init(this.bgmNode, this.sfxNode);
        // this.sfxNode.getComponent(AudioSource).playOneShot(RESSpriteFrame.instance.clickAudioClip, 1);
    }
    cashoutFunc(){
        PlayerAdSdk.jumpStore();
        PlayerAdSdk.gameEnd();
    }

    private initNailsSystem(): void {
        if (!this.dingziContent) {
            console.warn('[GameUI] dingziContent节点未设置');
            return;
        }

        this.blockNailsMap.clear();
        this.nailColorMap.clear();

        this.blockArr = this.dingziContent.children;
        
        for (let i = 0; i < this.blockArr.length; i++) {
            const blockNode = this.blockArr[i];
            const nails: Node[] = [];

            // 遍历该面板下的所有子节点（钉子）
            const nailNodes = blockNode.children;
            
            for (let j = 0; j < nailNodes.length; j++) {
                const nailNode = nailNodes[j];
                const nailName = nailNode.name;

                // 钉子的名字是 "0", "1", "2" 分别代表红色、绿色、蓝色
                if (nailName === '0' || nailName === '1' || nailName === '2') {
                    const color = parseInt(nailName) as dingColor;
                    nails.push(nailNode);
                    this.nailColorMap.set(nailNode, color);
                }
            }

            // 将面板和其钉子数组存入Map
            if (nails.length > 0) {
                this.blockNailsMap.set(blockNode, nails);
                console.log(`[GameUI] 面板 ${blockNode.name} 有 ${nails.length} 个钉子`);
            }
        }

        console.log(`[GameUI] 钉子系统初始化完成，共 ${this.blockNailsMap.size} 个面板`);
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
            console.warn('[GameUI] 未找到钉子所属的面板');
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

        console.log(`[GameUI] 面板 ${blockNode.name} 所有钉子已消除，开始下落`);

        // 从Map中移除该面板
        this.blockNailsMap.delete(blockNode);

        // 计算下落距离（可以自定义，这里设置为屏幕外）
        const fallDistance = 1000; // 下落距离
        const currentPos = blockNode.getPosition();
        const targetY = currentPos.y - fallDistance;

        // 使用tween让面板下落
        tween(blockNode)
            .to(0.5, { 
                position: new Vec3(currentPos.x, targetY, currentPos.z) 
            }, {
                easing: 'sineIn' // 加速下落效果
            })
            .call(() => {
                // 下落完成后可以销毁节点或隐藏
                // blockNode.destroy(); // 如果需要销毁
                // 或者只是隐藏
                // blockNode.active = false;
                console.log(`[GameUI] 面板 ${blockNode.name} 下落完成`);
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
     * 将面板上的红色钉子装到车上
     */
    private installNailsToCar(): void {
        // 获取车辆组件
        const carItem = this.CarNode1.getComponent(ParkingCarItem);
        if (!carItem) {
            console.warn('[GameUI] CarNode1 上未找到 ParkingCarItem 组件');
            return;
        }

        // 检查车辆是否已满
        if (carItem.isFull()) {
            console.log('[GameUI] 车辆已装满钉子');
            return;
        }

        // 收集所有红色钉子
        const redNails: Node[] = [];
        for (const [nailNode, nailColor] of this.nailColorMap.entries()) {
            if (nailColor === dingColor.RED && nailNode.isValid) {
                redNails.push(nailNode);
            }
        }

        if (redNails.length === 0) {
            console.log('[GameUI] 没有找到红色钉子');
            return;
        }

        console.log(`[GameUI] 找到 ${redNails.length} 个红色钉子，开始安装到车辆`);

        // 逐个安装钉子到车辆
        let installedCount = 0;
        for (const nailNode of redNails) {
            if (carItem.isFull()) {
                break;
            }

            // 从面板上移除钉子（不销毁）
            if (this.removeNailFromBlock(nailNode)) {
                // 安装到车辆
                if (carItem.installNail(nailNode)) {
                    installedCount++;
                } else {
                    // 如果安装失败，销毁钉子
                    nailNode.destroy();
                }
            }
        }

        console.log(`[GameUI] 成功安装 ${installedCount} 个红色钉子到车辆`);
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
            console.warn('[GameUI] 未找到钉子所属的面板');
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
}

