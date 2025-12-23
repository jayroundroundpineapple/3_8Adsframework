import { _decorator, Component, Node, AudioSource, EventTouch, director, Director, PhysicsSystem2D, tween, Vec3, UITransform, macro, Skeleton, sp } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
import { Macro } from './Macro';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Node)
    private finger: Node = null;
    @property(Node)
    private targetPosNode: Node = null;
    @property(Node)
    private CarNode1: Node = null;
    

    private parkingCarArr: Node[] = [];
    private static instance: GameUI = null;
    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化
    
    protected onLoad(): void {
        // PhysicsSystem2D.instance.enable = true
        PlayerAdSdk.init();
        // 添加触摸事件监听器，等待用户第一次点击
        this.node.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        this.CarNode1.on(Node.EventType.TOUCH_START,this.moveCar1,this)
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
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'left_small_static', true);
        })
        .to(0.2, { position: new Vec3(Macro.PARKING_ROAD_LEFT_X, targetPos.y - Macro.PARKING_ROAD_GAP_Y, 0) })
        .call(()=>{
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'up_small_static', true);
        })
        .to(0.12, { position: new Vec3(Macro.PARKING_ROAD_LEFT_X, Macro.PARKING_ROAD_BOTTOM_Y, 0) })
        .call(()=>{
            this.CarNode1.setScale(-1, 1, 1);
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'left_small_static', true);
        })
        .to(0.2, { position: new Vec3(targetPos.x, Macro.PARKING_ROAD_BOTTOM_Y, 0) })
        .call(()=>{
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'up_small_static', true);
            this.CarNode1.setScale(1, 1, 1);
        })
        .to(0.12, { position: new Vec3(targetPos.x, targetPos.y, 0),eulerAngles: new Vec3(0, 0, Macro.PARKING_ROAD_ANGLE) })
        .delay(0.05)
        .call(()=>{
            this.CarNode1.angle = Macro.PARKINGSPine_ROAD_ANGLE;
            this.CarNode1.getComponent(sp.Skeleton).setAnimation(0, 'parking_small_appear', false);
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
}

