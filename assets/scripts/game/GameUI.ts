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
    private pixelData: Array<{x: number, y: number, color: Color}> = []; // 存储所有像素数据
    private currentRow: number = 0; // 当前渲染到的行（从底部开始）
    private isRendering: boolean = false; // 是否正在渲染
    private rows: number = 0; // 总行数
    private cols: number = 0; // 总列数
    private pixelSize: number = 15; // 每个像素块的大小

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
     * 使用Graphics在pixelSprite上绘制像素块
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
        this.pixelSize = 15; // 每个像素块的大小

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

        // 计算需要绘制的像素块数量，确保填满整个区域
        // 使用Math.ceil确保能覆盖整个区域
        this.cols = Math.ceil(width / this.pixelSize);
        this.rows = Math.ceil(height / this.pixelSize);

        // 计算起始位置（从左上角开始，因为锚点在中心）
        const startX = -width / 2;
        const startY = height / 2 - this.pixelSize; // 从顶部开始，向下绘制

        // 预生成所有像素数据，但不立即绘制
        this.pixelData = [];
        let opacityArr = [194,195,255]
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = startX + col * this.pixelSize;
                const y = startY - row * this.pixelSize; // Y轴向下递减

                // 随机选择一种透明度
                const opacityIndex = Math.floor(Math.random() * 3);
                const opacity = opacityArr[opacityIndex];

                // 使用基础颜色，但应用不同的透明度
                const color = new Color(this.baseColor.r, this.baseColor.g, this.baseColor.b, opacity);

                this.pixelData.push({ x, y, color });
            }
        }

        // 添加点击事件监听
        this.pixelSprite.node.on(Node.EventType.TOUCH_END, this.onPixelSpriteClick, this);

        console.log(`[GameUI] 已准备 ${this.cols * this.rows} 个像素块 (${this.cols}列 x ${this.rows}行)，等待点击开始渲染`);
    }

    /**
     * 点击事件处理，开始逐行渲染
     */
    private onPixelSpriteClick(event: EventTouch): void {
        if (this.isRendering) {
            return; // 如果正在渲染，忽略点击
        }
        this.startRenderAnimation();
    }

    /**
     * 开始逐行动画渲染（从底部开始）
     */
    private startRenderAnimation(): void {
        if (this.isRendering) {
            return;
        }

        this.isRendering = true;
        this.currentRow = this.rows - 1; // 从最后一行（底部）开始
        this.schedule(this.renderNextRow, 0.01); // 每0.01秒渲染一行
    }

    /**
     * 渲染下一行（从底部到顶部）
     */
    private renderNextRow(): void {
        // 检查是否渲染完成（从底部到顶部，所以currentRow会递减到-1）
        if (this.currentRow < 0) {
            this.unschedule(this.renderNextRow);
            this.isRendering = false;
            return;
        }

        // 渲染当前行的所有像素（从底部开始）
        const startIndex = this.currentRow * this.cols;
        const endIndex = Math.min(startIndex + this.cols, this.pixelData.length);

        for (let i = startIndex; i < endIndex; i++) {
            const pixel = this.pixelData[i];
            this.graphics.fillColor = pixel.color;
            this.graphics.rect(pixel.x, pixel.y, this.pixelSize, this.pixelSize);
            this.graphics.fill();
        }

        // 向上移动一行（递减）
        this.currentRow--;
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

    protected onDestroy(): void {
        // 清理事件监听和定时器
        if (this.pixelSprite && this.pixelSprite.node) {
            this.pixelSprite.node.off(Node.EventType.TOUCH_END, this.onPixelSpriteClick, this);
        }
        if (this.isRendering) {
            this.unschedule(this.renderNextRow);
        }
    }
}

