import { _decorator, Component, Node, AudioSource, EventTouch, tween, Vec2, Vec3, UITransform, sp, Prefab, Label, Mask, UIOpacity, utils, Widget, director, Animation, Sprite, Color, Texture2D, ImageAsset, SpriteFrame, Graphics, instantiate } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Sprite)
    pixelSprite: Sprite = null; 
    @property(Prefab)
    private graphicsPrefab: Prefab = null;
    

    baseColor: Color = Color.RED; // 基础颜色，可以在编辑器中设置

    private graphicsNode: Node = null; // Graphics节点
    private graphics: Graphics = null; // Graphics组件

    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化

    protected onLoad(): void {
        PlayerAdSdk.init();
        this.initPixelSprite();
    }

    /**
     * 初始化像素填充功能
     * 使用Graphics在pixelSprite上绘制2x2的像素块
     */
    private initPixelSprite(): void {
        
        this.graphicsNode = instantiate(this.graphicsPrefab);
        this.pixelSprite.node.addChild(this.graphicsNode);

        // 获取Graphics组件（prefab中应该已经配置了Graphics组件）
        this.graphics = this.graphicsNode.getComponent(Graphics);
        if (!this.graphics) {
            console.warn('[GameUI] graphicsPrefab中缺少Graphics组件，尝试添加');
            this.graphics = this.graphicsNode.addComponent(Graphics);
        }

        // 获取pixelSprite的尺寸
        const transform = this.pixelSprite.node.getComponent(UITransform);
        if (!transform) {
            console.warn('[GameUI] pixelSprite节点缺少UITransform组件');
            return;
        }

        const width = 400;
        const height = 300;
        const pixelSize = 5; // 每个像素块的大小

        // 设置Graphics节点的位置和尺寸
        let graphicsTransform = this.graphicsNode.getComponent(UITransform);
        if (!graphicsTransform) {
            graphicsTransform = this.graphicsNode.addComponent(UITransform);
        }
        graphicsTransform.width = width;
        graphicsTransform.height = height;
        // 设置锚点在中心，与sprite对齐
        graphicsTransform.setAnchorPoint(0.5, 0.5);
        this.graphicsNode.setPosition(0, 0, 0);

        // 清除之前的绘制
        this.graphics.clear();

        // 定义三种透明度（0-255）
        const opacities = [255, 200, 150]; // 完全不透明、稍微透明、更透明

        // 计算需要绘制的像素块数量
        const cols = Math.floor(width / pixelSize); // 200列
        const rows = Math.floor(height / pixelSize); // 150行

        // 计算起始位置（从左上角开始，因为锚点在中心）
        const startX = -width / 2;
        const startY = height / 2 - pixelSize; // 从顶部开始，向下绘制

        // 绘制所有像素块
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * pixelSize;
                const y = startY - row * pixelSize; // Y轴向下递减

                // 随机选择一种透明度
                const opacityIndex = Math.floor(Math.random() * opacities.length);
                const opacity = opacities[opacityIndex];

                // 使用基础颜色，但应用不同的透明度
                const color = new Color(this.baseColor.r, this.baseColor.g, this.baseColor.b, opacity);

                // 绘制矩形
                this.graphics.fillColor = color;
                this.graphics.rect(x, y, pixelSize, pixelSize);
                this.graphics.fill();
            }
        }

        console.log(`[GameUI] 已绘制 ${cols * rows} 个像素块 (${cols}列 x ${rows}行)`);
    }
    start() {
        (window as any).gameUI = this;
    }
    onTouchEnd(event: EventTouch) {
        
    }
    cashoutFunc() {
        PlayerAdSdk.jumpStore();
        PlayerAdSdk.gameEnd();
    }
}

