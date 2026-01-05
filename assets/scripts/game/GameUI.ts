import { _decorator, Component, Node, AudioSource, EventTouch, tween, Vec2, Vec3, UITransform, sp, Prefab, Label, Mask, UIOpacity, utils, Widget, director, Animation, Sprite, Color, Texture2D, ImageAsset, SpriteFrame } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Node)
    private resultNode: Node = null;
    @property(Sprite)
    lineArtSprite: Sprite = null; // 线稿Sprite
    @property(Color)
    targetColor: Color = new Color(255, 255, 255); // 要填充的颜色
    @property({
        type: [Color],
        tooltip: '可选的颜色列表，用于不同区域上色'
    })
    colorPalette: Color[] = []; // 颜色调色板

    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化

    private texture2D: Texture2D = null; // 可写的纹理
    private pixelData: Uint8Array = null; // 存储像素的RGBA数据
    private textureWidth: number = 0;
    private textureHeight: number = 0;
    private currentColorIndex: number = 0; // 当前使用的颜色索引
    private fillLayerSprite: Sprite = null; // 填充层Sprite（用于显示填充颜色）
    private originalSpriteFrame: SpriteFrame = null; // 保存原始线稿SpriteFrame

    protected onLoad(): void {
        PlayerAdSdk.init();
        
    }
    start() {
        (window as any).gameUI = this;
        // 初始化完成后自动开始游戏
        this.initPixel()
    }
    initPixel(){
        // 保存原始线稿SpriteFrame（不修改它）
        this.originalSpriteFrame = this.lineArtSprite.spriteFrame;
        
        // 获取原始纹理的尺寸
        const originalTexture = this.originalSpriteFrame.texture;
        this.textureWidth = originalTexture.width;
        this.textureHeight = originalTexture.height;

        // 创建填充层节点（叠加在线稿上）
        const fillLayerNode = new Node('FillLayer');
        fillLayerNode.setParent(this.lineArtSprite.node);
        fillLayerNode.setPosition(Vec3.ZERO);
        fillLayerNode.setScale(Vec3.ONE);
        
        // 添加UITransform组件（必须，否则无法接收触摸事件）
        const fillLayerTransform = fillLayerNode.addComponent(UITransform);
        const lineArtTransform = this.lineArtSprite.node.getComponent(UITransform);
        if (lineArtTransform) {
            // 复制线稿节点的尺寸和锚点
            fillLayerTransform.setContentSize(lineArtTransform.width, lineArtTransform.height);
            fillLayerTransform.setAnchorPoint(lineArtTransform.anchorX, lineArtTransform.anchorY);
        }
        
        // 添加Sprite组件到填充层
        this.fillLayerSprite = fillLayerNode.addComponent(Sprite);
        
        // 创建新的像素数据数组（初始化为透明，用于绘制）
        this.pixelData = new Uint8Array(this.textureWidth * this.textureHeight * 4);
        // 初始化为完全透明（用户点击后会填充颜色）
        for (let i = 0; i < this.pixelData.length; i += 4) {
            this.pixelData[i] = 0;     // R
            this.pixelData[i + 1] = 0; // G
            this.pixelData[i + 2] = 0; // B
            this.pixelData[i + 3] = 0; // A (完全透明)
        }

        // 创建新的可写纹理
        this.texture2D = new Texture2D();
        this.texture2D.reset({
            width: this.textureWidth,
            height: this.textureHeight,
            format: Texture2D.PixelFormat.RGBA8888
        });

        // 上传初始像素数据到纹理
        this.texture2D.uploadData(this.pixelData);

        // 创建新的 SpriteFrame 并设置为填充层显示
        const newSpriteFrame = new SpriteFrame();
        newSpriteFrame.texture = this.texture2D;
        // 复制原始 SpriteFrame 的其他属性
        newSpriteFrame.rect = this.originalSpriteFrame.rect.clone();
        this.fillLayerSprite.spriteFrame = newSpriteFrame;
        
        // 设置填充层的混合模式，使其叠加显示
        this.fillLayerSprite.type = Sprite.Type.SIMPLE;

        // 绑定点击事件到线稿节点（因为填充层可能被遮挡，直接绑定到线稿节点更可靠）
        // 或者同时绑定到两个节点
        this.lineArtSprite.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.fillLayerSprite.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        
        console.log("像素绘制系统初始化完成，线稿尺寸:", this.textureWidth, "x", this.textureHeight);
    }
    onTouchEnd(event: EventTouch) {
        console.log("onTouchEnd 被调用");
        
        // 将点击位置转换为纹理内的像素坐标
        const uiTransform = this.lineArtSprite.node.getComponent(UITransform);
        if (!uiTransform) {
            console.log("uiTransform is null");
            return;
        }
        
        // 获取UI坐标
        const uiPos = event.getUILocation();
        console.log("点击UI坐标:", uiPos.x, uiPos.y);
        // 转换为线稿节点的本地坐标
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(uiPos.x, uiPos.y, 0));
        
        // 转换为纹理像素坐标（考虑锚点和缩放）
        const spriteWidth = uiTransform.width;
        const spriteHeight = uiTransform.height;
        const anchorX = uiTransform.anchorX;
        const anchorY = uiTransform.anchorY;
        
        // 计算相对于纹理的像素坐标
        // 注意：Y轴需要翻转（UI坐标Y向下，纹理坐标Y向上）
        // 先计算归一化坐标（0-1范围）
        const normalizedX = (localPos.x / spriteWidth) + anchorX;
        const normalizedY = 1 - ((localPos.y / spriteHeight) + anchorY);
        
        // 转换为像素坐标
        const pixelX = Math.floor(normalizedX * this.textureWidth);
        const pixelY = Math.floor(normalizedY * this.textureHeight);
        
        // 确保坐标在有效范围内
        const clampedX = Math.max(0, Math.min(pixelX, this.textureWidth - 1));
        const clampedY = Math.max(0, Math.min(pixelY, this.textureHeight - 1));
        
        console.log(`坐标转换: normalized(${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)}), pixel(${pixelX}, ${pixelY}), clamped(${clampedX}, ${clampedY})`);

        console.log(`点击位置: UI(${uiPos.x}, ${uiPos.y}), Local(${localPos.x}, ${localPos.y}), Pixel(${pixelX}, ${pixelY})`);

        // 使用修正后的坐标
        const finalPixelX = clampedX;
        const finalPixelY = clampedY;
        
        // 边界检查（应该不会触发，因为已经clamp了）
        if (finalPixelX < 0 || finalPixelX >= this.textureWidth || finalPixelY < 0 || finalPixelY >= this.textureHeight) {
            console.log("点击位置超出边界");
            return;
        }

        // 检查是否点击在线稿区域内（通过检查原始线稿的透明度）
        const originalTexture = this.originalSpriteFrame.texture;
        // 注意：这里需要读取原始纹理的像素来判断是否在线稿内
        // 简化处理：直接允许填充，让用户在线稿区域内点击

        // 获取当前要使用的颜色（如果有调色板，从调色板中选择；否则使用 targetColor）
        const fillColor = this.getCurrentColor();
        console.log(`填充颜色: R=${fillColor.r}, G=${fillColor.g}, B=${fillColor.b}, A=${fillColor.a}`);

        // 执行泛洪填充（填充相同颜色的区域）
        const filledCount = this.floodFill(finalPixelX, finalPixelY, this.textureWidth, this.textureHeight, fillColor);
        console.log(`填充了 ${filledCount} 个像素`);
        
        // 更新纹理数据
        this.texture2D.uploadData(this.pixelData);
    }

    /**
     * 获取当前要使用的颜色
     */
    private getCurrentColor(): Color {
        if (this.colorPalette && this.colorPalette.length > 0) {
            return this.colorPalette[this.currentColorIndex % this.colorPalette.length];
        }
        return this.targetColor;
    }

    /**
     * 设置当前使用的颜色索引（用于切换不同区域的颜色）
     */
    public setColorIndex(index: number): void {
        if (this.colorPalette && this.colorPalette.length > 0) {
            this.currentColorIndex = index % this.colorPalette.length;
        }
    }

    /**
     * 设置目标颜色（直接设置颜色值）
     */
    public setTargetColor(color: Color): void {
        this.targetColor = color;
    }

    // 泛洪算法：填充指定坐标的连通区域
    // 返回填充的像素数量
    floodFill(x: number, y: number, width: number, height: number, fillColor?: Color): number {
        const color = fillColor || this.getCurrentColor();
        const startIndex = (y * width + x) * 4;
        
        // 边界检查
        if (x < 0 || x >= width || y < 0 || y >= height) {
            console.log(`边界检查失败: x=${x}, y=${y}, width=${width}, height=${height}`);
            return 0;
        }
        
        // 获取初始像素的颜色（RGBA）
        const startR = this.pixelData[startIndex];
        const startG = this.pixelData[startIndex + 1];
        const startB = this.pixelData[startIndex + 2];
        const startA = this.pixelData[startIndex + 3];

        console.log(`初始像素 [${x}, ${y}]: R=${startR}, G=${startG}, B=${startB}, A=${startA}`);
        console.log(`目标颜色: R=${color.r}, G=${color.g}, B=${color.b}, A=${color.a}`);

        // 如果已经是目标颜色，跳过
        if (startR === color.r && startG === color.g && startB === color.b && startA === color.a) {
            console.log("初始像素已经是目标颜色，跳过");
            return 0;
        }

        // 允许填充透明区域（startA < 100）或已有颜色的区域
        // 但需要检查是否在线稿区域内（通过检查原始线稿）
        // 这里简化处理：允许填充所有区域

        const queue: Vec2[] = [];
        queue.push(new Vec2(x, y));
        const visited = new Set<string>(); // 用于避免重复处理
        let filledCount = 0;
        let checkedCount = 0; // 调试：检查的像素数量

        while (queue.length > 0) {
            const pos = queue.shift()!;
            const key = `${pos.x},${pos.y}`;
            
            // 边界检查
            if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) {
                continue;
            }
            
            // 如果已经访问过，跳过
            if (visited.has(key)) {
                continue;
            }
            
            const idx = (pos.y * width + pos.x) * 4;
            const currentR = this.pixelData[idx];
            const currentG = this.pixelData[idx + 1];
            const currentB = this.pixelData[idx + 2];
            const currentA = this.pixelData[idx + 3];
            checkedCount++;
            
            // 检查当前像素是否和初始颜色一致（允许透明区域）
            // 如果当前像素已经是目标颜色，跳过
            if (currentR === color.r && currentG === color.g && currentB === color.b && currentA === color.a) {
                continue;
            }
            
            // 如果当前像素和初始像素颜色一致，则填充
            if (currentR === startR && 
                currentG === startG && 
                currentB === startB && 
                currentA === startA) {
                
                // 标记为已访问
                visited.add(key);
                
                // 设置为目标颜色
                this.pixelData[idx] = color.r;
                this.pixelData[idx + 1] = color.g;
                this.pixelData[idx + 2] = color.b;
                this.pixelData[idx + 3] = color.a;
                filledCount++;

                // 向上下左右扩展
                if (pos.x > 0) queue.push(new Vec2(pos.x - 1, pos.y));
                if (pos.x < width - 1) queue.push(new Vec2(pos.x + 1, pos.y));
                if (pos.y > 0) queue.push(new Vec2(pos.x, pos.y - 1));
                if (pos.y < height - 1) queue.push(new Vec2(pos.x, pos.y + 1));
            }
        }
        
        console.log(`填充完成: 检查了 ${checkedCount} 个像素，填充了 ${filledCount} 个像素`);
        return filledCount;
    }
    cashoutFunc() {
        PlayerAdSdk.jumpStore();
        PlayerAdSdk.gameEnd();
    }
}

