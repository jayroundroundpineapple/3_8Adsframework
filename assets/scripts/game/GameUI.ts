import { _decorator, Component, Node, AudioSource, EventTouch, tween, Vec2, Vec3, UITransform, sp, Prefab, Label, Mask, UIOpacity, utils, Widget, director, Animation, Sprite, Color, Texture2D, ImageAsset, SpriteFrame, Graphics, instantiate, NodePool, Tween, AudioClip, random } from 'cc';
import { AudioManager } from '../utils/AudioManager';
import { PlayerAdSdk } from '../PlayerAdSdk';
import RESSpriteFrame from '../RESSpriteFrame';
import { Utils } from '../utils/Utils';
import NotifyEffect from '../utils/NotifyEffect';
const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
    @property(Node)
    private rocketFinger: Node = null
    @property(Prefab)
    private rocketPre: Prefab = null;
    @property(Node)
    private propNode: Node = null;
    @property(Node)
    private gameMask: Node = null;
    @property(Node)
    private spinUI: Node = null;
    @property(Node)
    private spinBtn: Node = null;
    @property(Node)
    private spinNode: Node = null;
    @property(Node)
    private guideFinger: Node = null;
    @property(Node)
    private resultNode: Node = null;
    @property(Node)
    private maskNode: Node = null;
    @property(SpriteFrame)
    private bulletSpriteArray: SpriteFrame[] = [];
    @property(Node)
    private shootNode0: Node = null;
    @property(Node)
    private shootNode1: Node = null;
    @property(Node)
    private targetNodePos: Node = null;
    @property(Prefab)
    private bulletPrefab: Prefab = null;
    @property(Sprite)
    pixelSprite: Sprite = null;
    @property(Sprite)
    private pixelSprite1: Sprite = null;
    @property(Prefab)
    private graphicsPrefab: Prefab = null;

    baseColors: Color[] = [new Color(41, 134, 51), new Color(67, 227, 7)];

    // 存储每个sprite的数据
    private spriteDataList: Array<{
        sprite: Sprite;
        graphicsNode: Node;
        graphics: Graphics;
        pixelData: Array<{ x: number, y: number, color: Color }>;
        rows: number;
        cols: number;
        baseColor: Color;
    }> = [];
    totalSpriteLbArr: Label[] = [];
    private currentSpriteIndex: number = 0; // 当前要填充的sprite索引
    private currentRow: number = 0; // 当前渲染到的行（从底部开始）
    private isRendering: boolean = false; // 是否正在渲染
    private isShooting: boolean = false; // 是否正在射击
    private pixelSize: number = 8; // 每个像素块的大小
    private shootCount: number = 0; // 当前已射击次数

    private bgmNode: Node = null; // 背景音乐节点
    private sfxNode: Node = null; // 音效节点
    private audioManager: AudioManager = null; // 音频管理器
    private audioInitialized: boolean = false; // 音频是否已初始化
    private bulletPool: NodePool = null; // 子弹池
    protected onLoad(): void {
        PlayerAdSdk.init();
        this.initAllPixelSprites();
        this.setFirstGuide();
        this.setupAudioNodes();
        this.setupGlobalClick();
    }
    initSpinUI() {
        this.spinUI.active = true;
        this.spinBtn.active = false
        this.spinNode.parent.scale = new Vec3(0, 0, 0);
        tween(this.spinNode.parent)
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                this.spinBtn.active = true;
                Utils.setScale(this.spinBtn, 1.1, 0.3, true);
                this.spinBtn.on(Node.EventType.TOUCH_START, this.
                    onSpinBtnClick, this);
            })
            .start()
    }
    onSpinBtnClick() {
        if (!this.audioInitialized) {
            this.initAudio();
        }
        Tween.stopAllByTarget(this.spinBtn);
        Utils.setScale(this.spinBtn, .9, 0.15, false, () => {
            this.spinBtn.active = false;
            AudioManager.getInstance().playSound('SpinWheel');
        });
        tween(this.spinNode)
            .to(3, { angle: 360 * 8 }, { easing: 'quadInOut' })
            .call(() => {
                let gift = this.spinNode.getChildByName("targetGift")
                Utils.setScale(gift, 1.2, 0.2, false, () => {
                    this.gameMask.scale = new Vec3(0, 0, 1);
                    this.gameMask.active = true
                    tween(this.gameMask)
                        .to(0.3, { scale: new Vec3(1, 1, 1) })
                        .call(() => {
                            this.setFirstGuide()
                            Utils.refreshScreen();
                        })
                        .start()
                })
                AudioManager.getInstance().playSound('SpinWheel_Prize');
            })
            .start()
    }
    start() {
        (window as any).gameUI = this;
        this.resultNode.active = this.maskNode.active = false;
        this.gameMask.active = true
        this.setFirstGuide()
        // this.initSpinUI();
        this.initBulletPool();
    }
    setFirstGuide() {
        this.guideFinger.setPosition(0, -100, 0);
        tween(this.guideFinger)
            .repeatForever(
                tween()
                    .to(0.3, { position: new Vec3(-60, 66, 0) })
                    .delay(0.1)
                    .to(0.15, { scale: new Vec3(.9, .9, 1) })
                    .to(0.15, { scale: new Vec3(1, 1, 1) })
                    .delay(0.1)
                    .to(0.3, { position: new Vec3(0, -100, 0) })
                    .delay(0.2)
                    .start()
            ).start()
    }
    setGuideAnim() {
        // 停止guideFinger节点上的所有tween动画
        Tween.stopAllByTarget(this.guideFinger);

        this.guideFinger.setPosition(150, -50, 0);
        this.guideFinger.active = true;
        tween(this.guideFinger)
            .repeatForever(
                tween()
                    .to(0.3, { position: new Vec3(65, 60, 0) })
                    .delay(0.1)
                    .to(0.15, { scale: new Vec3(.9, .9, 1) })
                    .to(0.15, { scale: new Vec3(1, 1, 1) })
                    .delay(0.1)
                    .to(0.3, { position: new Vec3(150, -50, 0) })
                    .delay(0.2)
                    .start()
            ).start()
    }
    initBulletPool(): void {
        this.bulletPool = new NodePool();
        const preloadCount = 20;
        for (let i = 0; i < preloadCount; i++) {
            const bullet = instantiate(this.bulletPrefab);
            this.bulletPool.put(bullet);
        }
    }
    /**
     * 发射子弹
     */
    private shootBullet(): void {
        if (this.currentSpriteIndex >= this.spriteDataList.length) {
            return;
        }

        let bulletNode: Node = null;
        if (this.bulletPool.size() > 0) {
            bulletNode = this.bulletPool.get();
        } else {
            bulletNode = instantiate(this.bulletPrefab);
        }
        
        // 确保子弹节点状态正确初始化
        bulletNode.active = true;
        bulletNode.setScale(1, 1, 1);
        if (bulletNode.children.length > 0) {
            bulletNode.children[0].active = true; 
        }
        if (bulletNode.children.length > 1) {
            bulletNode.children[1].active = true;
            bulletNode.children[1].scale = new Vec3(.3, .3, 1); 
            const animComponent = bulletNode.children[1].getComponent(Animation);
            if (animComponent) {
                animComponent.stop();
                animComponent.off(Animation.EventType.FINISHED);
            }
        }
        let shootBox = this.shootNode0.parent;
        bulletNode.children[0].getComponent(Sprite).spriteFrame = this.bulletSpriteArray[this.currentSpriteIndex];
        bulletNode.setParent(shootBox);
        if (this.currentSpriteIndex == 1) {
            bulletNode.setScale(-1, 1, 1)
        }
        let nowPos = this.targetNodePos.parent.getComponent(UITransform).convertToWorldSpaceAR(this.targetNodePos.position.clone());
        bulletNode.parent = shootBox;
        nowPos = shootBox.getComponent(UITransform).convertToNodeSpaceAR(nowPos);
        bulletNode.setPosition(nowPos);
        bulletNode.active = true;

        const spriteNode = this.spriteDataList[this.currentSpriteIndex].sprite.node;
        let targetPos = spriteNode.position.clone();

        const spriteParentTransform = spriteNode.parent.getComponent(UITransform);
        if (spriteParentTransform) {
            targetPos = spriteParentTransform.convertToWorldSpaceAR(targetPos);
        }
        let shootNode = this.currentSpriteIndex == 0 ? this.shootNode0 : this.shootNode1;
        const shootBoxTransform = shootBox.getComponent(UITransform);
        if (shootBoxTransform) {
            targetPos = shootBoxTransform.convertToNodeSpaceAR(targetPos);
        }
        let angle = this.currentSpriteIndex == 0 ? -12 : 0;
        let animName = this.currentSpriteIndex == 0 ? 'shoot0' : 'shoot1';
        tween(shootNode)
            .to(0.15, { angle: angle })
            .to(0.1, { angle: 0 })
            .start();
        shootNode.getComponent(Animation).play(animName);
        tween(bulletNode).stop();
        AudioManager.getInstance().playSound('click');
        tween(bulletNode)
            .to(0.08, { position: targetPos })
            .call(() => {
                bulletNode.children[0].active = false;
                let animName = this.currentSpriteIndex == 0 ? 'boom1' : 'boom0';
                let ranDomNum = Utils.getRandomInt(1, 6);
                if (ranDomNum >= 4) {
                    bulletNode.children[1].getComponent(Animation).play(animName);
                    bulletNode.children[1].getComponent(Animation).on(Animation.EventType.FINISHED, () => {
                        this.recycleBullet(bulletNode);
                    }, this);
                } else {
                    this.recycleBullet(bulletNode);
                }
                this.renderCurrentRow();
                this.shootCount++;
                this.shootNextRow();
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
        
        // 停止子节点的动画
        if (bulletNode.children.length > 1) {
            const animComponent = bulletNode.children[1].getComponent(Animation);
            if (animComponent) {
                animComponent.stop();
                animComponent.off(Animation.EventType.FINISHED);
            }
        }
        
        // 重置子弹状态
        bulletNode.active = false;
        bulletNode.setPosition(0, 0, 0);
        bulletNode.setScale(1, 1, 1);
        
        // 重置子节点状态
        if (bulletNode.children.length > 0) {
            bulletNode.children[0].active = true; // 子弹本体
        }
        if (bulletNode.children.length > 1) {
            bulletNode.children[1].active = true; // 爆炸效果
            bulletNode.children[1].scale = new Vec3(.3, .3, 1); // 重置爆炸效果大小
        }
        
        // 回收到对象池
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

        // 为gunNode添加点击事件
        if (this.shootNode0) {
            this.shootNode0.on(Node.EventType.TOUCH_END, this.onGunNodeClick, this);
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
        this.pixelSize = 8; // 每个像素块的大小

        // 设置Graphics节点的位置和尺寸
        let graphicsTransform = graphicsNode.getComponent(UITransform);
        if (!graphicsTransform) {
            graphicsTransform = graphicsNode.addComponent(UITransform);
        }
        graphicsTransform.width = width;
        graphicsTransform.height = height;
        graphicsTransform.setAnchorPoint(0.5, 0.5);
        graphicsNode.setPosition(0, 0, 0);

        graphics.clear();

        const cols = Math.ceil(width / this.pixelSize);
        const rows = Math.ceil(height / this.pixelSize);

        const startX = -width / 2;
        const startY = height / 2 - this.pixelSize;

        // 预生成所有像素数据
        const pixelData: Array<{ x: number, y: number, color: Color }> = [];
        let opacityArr = [164, 195, 255];
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

        this.spriteDataList.push({
            sprite: sprite,
            graphicsNode: graphicsNode,
            graphics: graphics,
            pixelData: pixelData,
            rows: rows,
            cols: cols,
            baseColor: baseColor
        });
        let spirteNode = this.spriteDataList[index].sprite.node;

        if (spirteNode.parent) {
            const siblings = spirteNode.parent.children;
            for (let i = 0; i < siblings.length; i++) {
                const sibling = siblings[i];
                if (sibling.name === 'totalNum') {
                    const label = sibling.getComponent(Label);
                    this.totalSpriteLbArr.push(label);
                    if (label) {
                        label.string = `${this.spriteDataList[index].rows}`;
                    }
                    break;
                }
            }
        }

        let node = index == 0 ? this.shootNode0 : this.shootNode1;
        node.getChildByName('bolletNum').getComponent(Label).string = `${this.spriteDataList[index].rows}`;
    }

    /**
     * gunNode点击事件处理
     */
    private onGunNodeClick(event: EventTouch): void {
        AudioManager.getInstance().playSound('click');
        Tween.stopAllByTarget(this.guideFinger);
        this.guideFinger.active = false;
        this.shootNode0.off(Node.EventType.TOUCH_END, this.onGunNodeClick, this);
        this.shootNode1.off(Node.EventType.TOUCH_END, this.onGunNodeClick, this);
        if (!this.audioInitialized) {
            this.initAudio();
        }

        // 如果正在射击或渲染，忽略点击
        if (this.isShooting || this.isRendering) {
            return;
        }

        // 检查是否还有未填充的sprite
        if (this.currentSpriteIndex >= this.spriteDataList.length) {
            console.log('所有sprite都已填充完成');
            return;
        }
        this.startShootSequence();
    }

    /**
     * 开始射击序列：gunNode移动到目标位置，然后开始射击
     */
    private startShootSequence(): void {
        this.isShooting = true;

        // 计算targetNodePos在gunNode父节点坐标系中的位置
        let currentTargetNodePos = this.targetNodePos;
        let targetPos = currentTargetNodePos.position.clone();
        const targetParentTransform = currentTargetNodePos.parent.getComponent(UITransform);
        if (targetParentTransform) {
            targetPos = targetParentTransform.convertToWorldSpaceAR(targetPos);
        }
        let currentShootNode = this.currentSpriteIndex == 0 ? this.shootNode0 : this.shootNode1;
        const gunParentTransform = currentShootNode.parent.getComponent(UITransform);
        if (gunParentTransform) {
            targetPos = gunParentTransform.convertToNodeSpaceAR(targetPos);
        }

        tween(currentShootNode).stop();
        currentShootNode.setScale(1, 1, 1);
        tween(currentShootNode)
            .parallel(
                tween().to(0.35, { position: targetPos }),
                tween()
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
                    .to(0.05, { scale: new Vec3(.85, .85, 1) })
            )
            .delay(0.05)
            .call(() => {
                this.startShooting();
            })
            .start();
    }

    /**
     * 开始射击循环
     */
    private startShooting(): void {
        if (this.currentSpriteIndex >= this.spriteDataList.length) {
            this.isShooting = false;
            return;
        }

        const currentData = this.spriteDataList[this.currentSpriteIndex];
        this.currentRow = currentData.rows - 1; // 从最后一行（底部）开始
        this.shootCount = 0; // 重置射击计数

        // 开始第一次射击
        this.shootNextRow();
    }

    /**
     * 射击下一行
     */
    private shootNextRow(): void {
        if (this.currentSpriteIndex >= this.spriteDataList.length) {
            this.isShooting = false;
            return;
        }

        const currentData = this.spriteDataList[this.currentSpriteIndex];

        // 检查是否已经射击完所有行
        if (this.shootCount >= currentData.rows) {
            this.onSpriteFilled();
            return;
        }

        this.shootBullet();
    }

    /**
     * 渲染当前行（从底部开始）
     */
    private renderCurrentRow(): void {
        if (this.currentSpriteIndex >= this.spriteDataList.length) {
            return;
        }

        const currentData = this.spriteDataList[this.currentSpriteIndex];

        // 检查行索引是否有效
        if (this.currentRow < 0 || this.currentRow >= currentData.rows) {
            return;
        }

        // 渲染当前行的所有像素
        const startIndex = this.currentRow * currentData.cols;
        const endIndex = Math.min(startIndex + currentData.cols, currentData.pixelData.length);

        for (let i = startIndex; i < endIndex; i++) {
            const pixel = currentData.pixelData[i];
            currentData.graphics.fillColor = pixel.color;
            currentData.graphics.rect(pixel.x, pixel.y, this.pixelSize, this.pixelSize);
            currentData.graphics.fill();
        }

        // 向上移动一行（递减）
        this.totalSpriteLbArr[this.currentSpriteIndex].string = `${this.currentRow}`;
        let node = this.currentSpriteIndex == 0 ? this.shootNode0 : this.shootNode1;
        node.getChildByName('bolletNum').getComponent(Label).string = `${this.currentRow}`;
        this.currentRow--;
        if (this.currentRow < 0) {
            this.totalSpriteLbArr[this.currentSpriteIndex].node.active = false;
            node.getChildByName('bolletNum').getComponent(Label).node.active = false;
        }
    }

    /**
     * 当前sprite填充完成
     */
    private onSpriteFilled(): void {
        this.isShooting = false;
        this.isRendering = false;

        //shootNode移走动画
        let shootNode = this.currentSpriteIndex == 0 ? this.shootNode0 : this.shootNode1;
        shootNode.getComponent(Animation).pause();
        tween(shootNode).stop();
        tween(shootNode)
            .delay(0.1)
            .parallel(
                tween().by(0.35, { position: new Vec3(-300, 100, 0) }),
                tween()
                    .to(0.25, { scale: new Vec3(1.2, 1.2, 1) })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
            )
            .start();
        this.currentSpriteIndex++;
        if (this.currentSpriteIndex == 1) {
            //提示点击火箭改色
            this.setRocketAnim();
        }
        if(this.currentSpriteIndex == this.spriteDataList.length){
            setTimeout(() => {
                this.showResultUI();
            }, 300);
        }
        // // 如果还有下一个sprite，等待下次点击
        // if (this.currentSpriteIndex < this.spriteDataList.length) {
        //     console.log(`准备填充下一个 sprite ${this.currentSpriteIndex}，点击gunNode开始`);
        // } else {
        //     console.log('所有sprite都已填充完成');
        // }
    }
    showResultUI(){
        this.maskNode.active = true
        NotifyEffect.NormalShowUI(this.resultNode,RESSpriteFrame.instance.comeOutAudioClip,0,true,()=>{
            AudioManager.getInstance().playSound('Win_001');
        })
    }
    setRocketAnim() {
        this.propNode.on(Node.EventType.TOUCH_END, this.onRocketClick, this);
        this.rocketFinger.active = true;
        this.rocketFinger.setPosition(-25, 440, 0)
        tween(this.rocketFinger)
            .repeatForever(
                tween()
                    .to(0.3, { position: new Vec3(-80, 325, 0) })
                    .delay(0.1)
                    .to(0.15, { scale: new Vec3(-.9, .9, 1) })
                    .to(0.15, { scale: new Vec3(-1, 1, 1) })
                    .delay(0.1)
                    .to(0.3, { position: new Vec3(-25, 440, 0) })
                    .delay(0.2)
                    .start()
            ).start()
    }
    /**改色 */
    onRocketClick() {
        this.rocketFinger.active = false;
        Tween.stopAllByTarget(this.propNode);
        AudioManager.getInstance().playSound('click');
        this.propNode.off(Node.EventType.TOUCH_END, this.onRocketClick, this);
        this.propNode.getChildByName("btn").children[0].getComponent(Label).string = 'x0';
        tween(this.propNode).stop();
        Utils.setScale(this.propNode, 1.1, 0.2, false, () => {
            let rocket = instantiate(this.rocketPre);
            rocket.setParent(this.propNode);
            rocket.setScale(.8, .8, 1);
            rocket.setPosition(0, 50, 0);
            rocket.active = true;
            let spriteNode = this.spriteDataList[this.currentSpriteIndex].sprite.node;
            let targetPos = spriteNode.parent.getComponent(UITransform).convertToWorldSpaceAR(spriteNode.position.clone());
            targetPos = this.propNode.getComponent(UITransform).convertToNodeSpaceAR(targetPos);
            tween(rocket)
                .to(0.3, { position: targetPos })
                .delay(0.2)
                .call(() => {
                    AudioManager.getInstance().playSound('ding');
                    spriteNode.getComponent(Sprite).grayscale = false;
                    this.setGuideAnim()
                    this.shootNode1.on(Node.EventType.TOUCH_END, this.onGunNodeClick, this);
                })
                .start()
        });
    }
    cashoutFunc() {
        PlayerAdSdk.jumpStore();
        PlayerAdSdk.gameEnd();
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onGlobalClick, this);

        if (this.shootNode0) {
            this.shootNode0.off(Node.EventType.TOUCH_END, this.onGunNodeClick, this);
        }

        if (this.bulletPool) {
            this.bulletPool.clear();
            this.bulletPool = null;
        }
    }
}

