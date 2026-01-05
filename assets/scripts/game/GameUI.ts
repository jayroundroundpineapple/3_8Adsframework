import { _decorator, Component, Node, AudioSource, EventTouch, tween, Vec2, Vec3, UITransform, sp, Prefab, Label, Mask, UIOpacity, utils, Widget, director, Animation } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
import MoneyChange from '../utils/MoneyChange';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Node)
    private resultNode: Node = null;
   

    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化
    private moneyChange: MoneyChange = null;
   

    protected onLoad(): void {
        PlayerAdSdk.init();
        
    }
    start() {
        (window as any).gameUI = this;
        // 初始化完成后自动开始游戏
    }
    cashoutFunc() {
        PlayerAdSdk.jumpStore();
        PlayerAdSdk.gameEnd();
    }
}

