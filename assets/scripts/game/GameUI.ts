import { _decorator, Component, Node, AudioSource, EventTouch, tween, Vec2, Vec3, UITransform, sp, Prefab, Label, Mask, UIOpacity, utils, Widget, director, Animation, Sprite, Color, Texture2D, ImageAsset, SpriteFrame, Graphics, instantiate, NodePool } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
import RESSpriteFrame from '../RESSpriteFrame';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Node)
    private gunNode: Node = null;
    @property(Prefab)
    private bulletPrefab: Prefab = null;
    @property(Sprite)
    pixelSprite: Sprite = null; 
    @property(Sprite)
    private pixelSprite1: Sprite = null;
    @property(Prefab)
    private graphicsPrefab: Prefab = null;
    
    baseColors: Color[] = [new Color(51, 143, 29), new Color(67, 227, 7)]; 

    // 存储每个sprite的数据
    private spriteDataList: Array<{
        sprite: Sprite;
        graphicsNode: Node;
        graphics: Graphics;
        pixelData: Array<{x: number, y: number, color: Color}>;
        rows: number;
        cols: number;
        baseColor: Color;
    }> = [];

    private currentSpriteIndex: number = 0; // 当前要填充的sprite索引
    private currentRow: number = 0; // 当前渲染到的行（从底部开始）
    private isRendering: boolean = false; // 是否正在渲染
    private pixelSize: number = 15; // 每个像素块的大小

    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化
    private bulletPool: NodePool = null; // 子弹池
    protected onLoad(): void {  
        PlayerAdSdk.init();
        this.initAllPixelSprites();
        this.setupAudioNodes();
        this.setupGlobalClick();
    }
    start() {
        (window as any).gameUI = this;
        this.initBulletPool();
    }
    initBulletPool(): void {
        this.bulletPool = new NodePool();
        const preloadCount = 20;
        for (let i = 0; i < preloadCount; i++) {
            const bullet = instantiate(this.bulletPrefab);
            this.bulletPool.put(bullet);
        }
    }
    shootBullet(): void {
        let bulletNode: Node = null;
        if (this.bulletPool.size() > 0) {
            bulletNode = this.bulletPool.get();
        } else {
            bulletNode = instantiate(this.bulletPrefab);
        }
        bulletNode.setParent(this.gunNode);
        bulletNode.setPosition(0, 0, 0);
        bulletNode.active = true;

        const spriteNode = this.spriteDataList[this.currentSpriteIndex].sprite.node;
        let targetPos = spriteNode.position.clone();
       
        const spriteParentTransform = spriteNode.parent.getComponent(UITransform);
        if (spriteParentTransform) {
            targetPos = spriteParentTransform.convertToWorldSpaceAR(targetPos);
        }
     
        const gunTransform = this.gunNode.getComponent(UITransform);
        if (gunTransform) {
            targetPos = gunTransform.convertToNodeSpaceAR(targetPos);
        }

        tween(bulletNode).stop();

        // 播放子弹移动动画
        tween(bulletNode)
            .to(0.2, { position: targetPos })
            .call(() => {
                this.startRenderAnimation()
                this.recycleBullet(bulletNode);
            })
            .start();
    }

    /**
     * 回收子弹到对象池
     */
    private recycleBullet(bulletNode: Node): void {
        if (!bulletNode || !bulletNode.isValid) {
            return;
        }
        // 停止所有动画
        tween(bulletNode).stop();
        bulletNode.active = false;
        bulletNode.setPosition(0, 0, 0);
        if (this.bulletPool) {
            this.bulletPool.put(bulletNode);
        } else {
            bulletNode.destroy();
        }
    }
    private setupGlobalClick(): void {
        // 监听场景的触摸事件
        this.node.on(Node.EventType.TOUCH_END, this.onGlobalClick, this);
    }

    /**
     * 全局点击事件处理
     */
    private onGlobalClick(event: EventTouch): void {
        if (!this.audioInitialized) {
            this.initAudio();
            this.node.off(Node.EventType.TOUCH_END, this.onGlobalClick, this);
        }
    }
    private setupAudioNodes(): void {
        this.bgmNode = new Node('BGMNode');
        this.bgmNode.addComponent(AudioSource);
        this.node.addChild(this.bgmNode);

        this.sfxNode = new Node('SFXNode');
        this.sfxNode.addComponent(AudioSource);
        this.node.addChild(this.sfxNode);
    }
    private initAudio(): void {
        if (this.audioInitialized) {
            return;
        }
        this.audioManager = AudioManager.getInstance();
        this.audioManager.init(this.bgmNode, this.sfxNode);
        if (RESSpriteFrame.instance && RESSpriteFrame.instance.bgmAudioClip) {
            this.audioManager.playBGM();
        }
        this.audioInitialized = true;
    }
    /**
     * 初始化所有pixelSprite
     */
    private initAllPixelSprites(): void {
        //写死的两个节点
        const sprites: Sprite[] = [];
        if (this.pixelSprite) sprites.push(this.pixelSprite);
        if (this.pixelSprite1) sprites.push(this.pixelSprite1);
        // 为每个sprite初始化数据
        this.spriteDataList = [];
        for (let i = 0; i < sprites.length; i++) {
            const sprite = sprites[i];
            const baseColor = i < this.baseColors.length ? this.baseColors[i] : this.baseColors[0];
            this.initPixelSprite(sprite, baseColor, i);
        }

        // 为第一个sprite添加点击事件
        if (this.spriteDataList.length > 0) {
            this.spriteDataList[0].sprite.node.on(Node.EventType.TOUCH_END, this.onPixelSpriteClick, this);
        }
    }

    /**
     * 初始化单个pixelSprite
     */
    private initPixelSprite(sprite: Sprite, baseColor: Color, index: number): void {
        const graphicsNode = instantiate(this.graphicsPrefab);
        sprite.node.addChild(graphicsNode);

        // 获取Graphics组件
        let graphics = graphicsNode.getComponent(Graphics);
        const width = sprite.node.getComponent(UITransform).width;
        const height = sprite.node.getComponent(UITransform).height;
        this.pixelSize = 15; // 每个像素块的大小

        // 设置Graphics节点的位置和尺寸
        let graphicsTransform = graphicsNode.getComponent(UITransform);
        if (!graphicsTransform) {
            graphicsTransform = graphicsNode.addComponent(UITransform);
        }
        graphicsTransform.width = width;
        graphicsTransform.height = height;
        graphicsTransform.setAnchorPoint(0.5, 0.5);
        graphicsNode.setPosition(0, 0, 0);

        // 清除之前的绘制
        graphics.clear();

        // 计算需要绘制的像素块数量
        const cols = Math.ceil(width / this.pixelSize);
        const rows = Math.ceil(height / this.pixelSize);

        // 计算起始位置
        const startX = -width / 2;
        const startY = height / 2 - this.pixelSize;

        // 预生成所有像素数据
        const pixelData: Array<{x: number, y: number, color: Color}> = [];
        let opacityArr = [194, 195, 255];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * this.pixelSize;
                const y = startY - row * this.pixelSize;

                const opacityIndex = Math.floor(Math.random() * 3);
                const opacity = opacityArr[opacityIndex];
                const color = new Color(baseColor.r, baseColor.g, baseColor.b, opacity);

                pixelData.push({ x, y, color });
            }
        }

        // 保存sprite数据
        this.spriteDataList.push({
            sprite: sprite,
            graphicsNode: graphicsNode,
            graphics: graphics,
            pixelData: pixelData,
            rows: rows,
            cols: cols,
            baseColor: baseColor
        });
        console.log(`[GameUI] 已准备 sprite ${index}: ${cols * rows} 个像素块 (${cols}列 x ${rows}行)，颜色: RGB(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`);
    }

    /**
     * 点击事件处理，开始逐行渲染
     */
    private onPixelSpriteClick(event: EventTouch): void {
        // 首次点击时初始化音频
        if (!this.audioInitialized) {
            this.initAudio();
        }

        if (this.isRendering) {
            return; // 如果正在渲染，忽略点击
        }
        // 检查是否还有未填充的sprite
        if (this.currentSpriteIndex >= this.spriteDataList.length) {
            console.log('[GameUI] 所有sprite都已填充完成');
            return;
        }
        // this.startRenderAnimation();
        this.shootBullet();
    }

    /**
     * 开始逐行动画渲染（从底部开始）
     */
    private startRenderAnimation(): void {
        if (this.isRendering) {
            return;
        }

        // 检查当前sprite索引是否有效
        if (this.currentSpriteIndex >= this.spriteDataList.length) {
            return;
        }
        
        this.isRendering = true;
        const currentData = this.spriteDataList[this.currentSpriteIndex];
        this.currentRow = currentData.rows - 1; // 从最后一行（底部）开始
        // this.schedule(this.renderNextRow, 0.03); // 每0.01秒渲染一行
        this.renderNextRow();
    }

    /**
     * 渲染下一行（从底部到顶部）
     */
    private renderNextRow(): void {
        // 检查当前sprite索引是否有效
        if (this.currentSpriteIndex >= this.spriteDataList.length) {
            this.isRendering = false;
            return;
        }

        const currentData = this.spriteDataList[this.currentSpriteIndex];

        // 检查是否渲染完成（从底部到顶部，所以currentRow会递减到-1）
        if (this.currentRow < 0) {
            this.isRendering = false;
            // 切换到下一个sprite
            this.currentSpriteIndex++;
            // 如果还有下一个sprite，为其添加点击事件
            if (this.currentSpriteIndex < this.spriteDataList.length) {
                const nextData = this.spriteDataList[this.currentSpriteIndex];
                nextData.sprite.node.on(Node.EventType.TOUCH_END, this.onPixelSpriteClick, this);
                console.log(`[GameUI] 准备填充下一个 sprite ${this.currentSpriteIndex}，点击开始`);
            } else {
                console.log('[GameUI] 所有sprite都已填充完成');
            }
            return;
        }

        // 渲染当前行的所有像素（从底部开始）
        const startIndex = this.currentRow * currentData.cols;
        const endIndex = Math.min(startIndex + currentData.cols, currentData.pixelData.length);

        for (let i = startIndex; i < endIndex; i++) {
            const pixel = currentData.pixelData[i];
            currentData.graphics.fillColor = pixel.color;
            currentData.graphics.rect(pixel.x, pixel.y, this.pixelSize, this.pixelSize);
            currentData.graphics.fill();
        }

        // 向上移动一行（递减）
        this.currentRow--;
    }
    
    onTouchEnd(event: EventTouch) {
        
    }
    cashoutFunc() {
        PlayerAdSdk.jumpStore();
        PlayerAdSdk.gameEnd();
    }

    protected onDestroy(): void {
        // 清理全局点击监听
        this.node.off(Node.EventType.TOUCH_END, this.onGlobalClick, this);

        // 清理所有sprite的事件监听
        for (const data of this.spriteDataList) {
            if (data.sprite && data.sprite.node) {
                data.sprite.node.off(Node.EventType.TOUCH_END, this.onPixelSpriteClick, this);
            }
        }
        
        // 清理定时器
        if (this.isRendering) {
            this.unschedule(this.renderNextRow);
        }

        // 清理子弹对象池
        if (this.bulletPool) {
            this.bulletPool.clear();
            this.bulletPool = null;
        }
    }
}

