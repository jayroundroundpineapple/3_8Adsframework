import { _decorator, Component, Node, AudioSource, EventTouch } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Node)
    private finger: Node = null;

    private static instance: GameUI = null;
    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化
    
    protected onLoad(): void {
        PlayerAdSdk.init();
        // 添加触摸事件监听器，等待用户第一次点击
        this.node.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
    }
    public static getInstance(): GameUI {
        if (!GameUI.instance) {
            GameUI.instance = new GameUI();
        }
        return GameUI.instance;
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

