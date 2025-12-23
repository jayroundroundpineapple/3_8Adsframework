import { AudioClip, instantiate, Prefab, Sprite, tween, Vec2, Vec3, Node, screen, resources, UIOpacity, AudioSource } from "cc";
import { LanguageManager } from "../language/LanguageManager";
import RESSpriteFrame from "../RESSpriteFrame";
import MoneyChange from "./MoneyChange";
import { Utils } from "./Utils";
import { AudioManager } from "./AudioManager";
// 定义一个状态对象类
class FlyAniState {
    count: number = 0;
    staLen: number;
    fun: Function;
    thisObj: any;
    musicID: any = null;
    moneyChangeFlag: boolean = true;

    constructor(staLen: number, fun: Function, thisObj: any) {
        this.staLen = staLen;
        this.fun = fun;
        this.thisObj = thisObj;
    }
}

export default class Anim {
    public static _instance: Anim;

    public static ins(): Anim {
        if (!Anim._instance) {
            Anim._instance = new Anim();
        }
        return Anim._instance;
    }

    private prefab: Prefab[];

    /**最大数量 */
    private MusicID:any = null
    private maxNum: number = 40;
    private count: number = 0;
    private _staLen: number = 0;
    public MoneychangeFlag:boolean = true
    private _fun: Function;
    private _thisObj: any;


    /**
     * 播放飞的动画
     * @param len 数量
     * @param endPoint 飞到的位置
     * @param 设置金币起始位置
     * @param comFun 执行结束
     * @param thisObj this指向
     * @param MoneyChangeArr 金币文本
     * @param Money 金币数额moneyCb
     * @param moneyCb 金钱动画结束回调
     * 
     */
    public ShowFlyAni(prefab: Prefab, parent, len: number, endPoint: Vec2,comFun: Function = null, thisObj: any = null,MoneyChangeArr?:MoneyChange[],Money?:number,moneyCb?:Function,originPos?:Vec2) {
        // 创建一个新的状态对象
        const state = new FlyAniState(len, comFun, thisObj);
        let halfX: number = 0;
        let halfY: number = 0;
        if (originPos != null) {
            halfX = originPos.x;
            halfY = originPos.y;
        }
        let X, Y, showMS, delay;

        for (var i = 0; i < len; i++) {
            let img: Node = instantiate(prefab);
            let sprite: Sprite = img.getComponent(Sprite);
            
            img.setParent(parent);
            console.log('imgIsValid',img.isValid,'parentIsValid',parent.isValid);
            // 设置透明度
            let uiOpacity = img.getComponent(UIOpacity) || img.addComponent(UIOpacity);
            uiOpacity.opacity = 255;
            // 设置位置
            img.setPosition(halfX, halfY, 0);

            // 设置缩放
            let scaleValue = 0.3;
            if (screen.windowSize.width > screen.windowSize.height) {
                scaleValue = Utils.limit(1.4, 1.7) * 0.3;
            } else {
                scaleValue = Utils.limit(0.7, 0.9) * 0.3;
            }
            img.setScale(scaleValue, scaleValue, 1);
            delay = 0.08 + i * 0.02;
            showMS = Utils.getRadian(Utils.limit(0, 18) * 20);
            X = halfX + Math.cos(showMS) * Utils.limit(8, 25) * 10;
            Y = halfY + Math.sin(showMS) * Utils.limit(8, 25) * 6;

            const targetX = X + Utils.limit(-10, 10);
            const targetY = Y + Utils.limit(-2, 4);
            const finalX = endPoint.x;
            const finalY = endPoint.y;
            
            tween(img)
                .delay(delay)
                .to(0.2 + delay, { position: new Vec3(targetX, targetY, 0) }, { easing: 'backOut' })
                .delay(0.05)
                .to(0.3, { position: new Vec3(finalX, finalY, 0) })
                .call(() => {
                    // 检查节点和父节点是否有效
                    if (!img || !img.isValid) {
                        console.warn('[Anim] 节点无效，可能已被销毁', {
                            img: img,
                            imgIsValid: img ? img.isValid : 'img is null',
                            parent: parent,
                            parentIsValid: parent ? parent.isValid : 'parent is null'
                        });
                        return;
                    }
                    
                    // 检查父节点是否有效（如果父节点被销毁，子节点也会无效）
                    if (!parent || !parent.isValid) {
                        console.warn('[Anim] 父节点无效，节点将被销毁', {
                            parent: parent,
                            parentIsValid: parent ? parent.isValid : 'parent is null',
                            imgIsValid: img.isValid
                        });
                        if (img.isValid) {
                            img.destroy();
                        }
                        return;
                    }
                    
                    let uiOpacity = img.getComponent(UIOpacity);
                    if (uiOpacity) {
                        // 淡出动画
                        tween(uiOpacity)
                            .to(0.2, { opacity: 0 })
                            .call(() => {
                                // 再次检查节点是否有效
                                if (!img || !img.isValid) {
                                    return;
                                }
                                
                                // 处理金钱变化
                                if (state.moneyChangeFlag && MoneyChangeArr != null) {
                                    state.moneyChangeFlag = false;
                                    if (Money != null) {
                                        [...MoneyChangeArr].forEach((item, index) => {
                                            const moneyValue = typeof Money === 'number' ? Money : Number(Money) || 0;
                                            item.play(moneyValue, 0.8, () => {
                                                if (index == [...MoneyChangeArr].length-1 ) {
                                                    if (moneyCb != null) moneyCb();
                                                }
                                            }, this);
                                        });
                                    }
                                }
                                // 销毁节点
                                this.onEffectComplete(img, state);
                            })
                            .start();
                    } else {
                        // 如果没有 UIOpacity 组件，直接处理金钱变化并销毁
                        if (state.moneyChangeFlag && MoneyChangeArr != null) {
                            state.moneyChangeFlag = false;
                            if (Money != null) {
                                [...MoneyChangeArr].forEach((item, index) => {
                                    const moneyValue = typeof Money === 'number' ? Money : Number(Money) || 0;
                                    item.play(moneyValue, 0.8, () => {
                                        if (index == [...MoneyChangeArr].length-1 ) {
                                            if (moneyCb != null) moneyCb();
                                        }
                                    }, this);
                                });
                            }
                        }
                        // 销毁节点
                        this.onEffectComplete(img, state);
                    }
                })
                .start();
        }
    }

    private onEffectComplete(img: Node, state: FlyAniState): void {
        // 检查节点是否有效，只要节点存在就销毁
        if (img && img.isValid) {
            img.destroy();
            console.log('销毁节点',img.isValid);
            state.count++;
            if (state.count == state.staLen) {
                // 停止音频
                if (state.musicID && state.musicID.isValid) {
                    const audioSource = state.musicID.getComponent(AudioSource);
                    if (audioSource) {
                        audioSource.stop();
                    }
                    state.musicID.destroy();
                    state.musicID = null;
                }
                state.moneyChangeFlag = true;
                if (state.fun != null) {
                    state.fun.call(state.thisObj);
                    state.fun = null;
                    state.thisObj = null;
                }
            }
        }
    }
   /**
     * @param node 动画节点
     * @param ActionArr 动作数组（tween 对象数组）
     * @param isRepeatForever 是否循环播放
     */
   public sequenceAnim(node: Node, ActionArr: any[], isRepeatForever: boolean = false, callback?: Function) {
    if (ActionArr.length === 0) return;
    
    // 将多个 tween 组合成一个序列
    let currentTween = ActionArr[0];
    for (let i = 1; i < ActionArr.length; i++) {
        currentTween = currentTween.then(ActionArr[i]);
    }
    
    if (callback) {
        currentTween.call(callback);
    }
    
    if (isRepeatForever) {
        currentTween.repeatForever().start();
    } else {
        currentTween.start();
    }
}
    public shakeEffect(node: Node, duration: number) {
        const originalPos = node.position.clone();
        const positions = [
            new Vec3(5, 7, 0),
            new Vec3(-6, 7, 0),
            new Vec3(-13, 3, 0),
            new Vec3(3, -6, 0),
            new Vec3(-5, 5, 0),
            new Vec3(2, -8, 0),
            new Vec3(-8, -10, 0),
            new Vec3(3, 10, 0),
            originalPos
        ];
        
        let shakeTween = tween(node).to(0.02, { position: positions[0] });
        for (let i = 1; i < positions.length; i++) {
            shakeTween = shakeTween.to(0.02, { position: positions[i] });
        }
        
        shakeTween.repeatForever().start();
        
        setTimeout(() => {
            tween(node).stop();
            node.setPosition(originalPos);
        }, duration * 1000);
    }
}