import { instantiate, Prefab, Sprite, tween, v2, Vec2 } from "cc";
import { LanguageManager } from "../language/LanguageManager";
import RESSpriteFrame from "../RESSpriteFrame";
import MoneyChange from "./MoneyChange";
import { Utils } from "./Utils";
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
            var img: Node = instantiate(prefab);
            let sprite: Sprite = img.getComponent(Sprite);
            img.parent = parent;
            img.opacity = 255;
            img.x = halfX;
            img.y = halfY;

            if (screen.width > screen.height) {
                img.scale = Utils.limit(1.4, 1.7);
            } else {
                img.scale = Utils.limit(0.7, 0.9);
            }
            img.scale = .3;

            // //加载标题
            // loader.loadRes(`common/moneyIcon`, SpriteFrame, function (err, spriteFrame) {
            //     // loader.loadRes(`common/usdIcon${Utils.limitInteger(0, 3)}`, SpriteFrame, function (err, spriteFrame) {
            //     if (err) return;
            //     sprite.spriteFrame = spriteFrame;
            // });
            delay = 0.08 + i * 0.02;
            showMS = Utils.getRadian(Utils.limit(0, 18) * 20);
            X = halfX + Math.cos(showMS) * Utils.limit(8, 25) * 10;
            Y = halfY + Math.sin(showMS) * Utils.limit(8, 25) * 6;

            tween(img).delay(delay).to(0.2 + delay,
                { x: X + Utils.limit(-10, 10), y: Y + Utils.limit(-2, 4) }, { easing: 'backOut' })
                .delay(0.05).to(0.3, { x: endPoint.x, y: endPoint.y })
                .to(0.2, { opacity: 0 })
                .call((than, target) => {
                    if (state.moneyChangeFlag && MoneyChangeArr != null) {
                        state.musicID = audioEngine.play(RESSpriteFrame.instance.numberAddAudioClip, false, 1);
                        state.moneyChangeFlag = false;
                        if (Money != null) {
                            // MoneyChange.play(LanguageManager.instance.formatUnit(Money),0.8,()=>{
                            //     if(moneyCb!=null)moneyCb()
                            // },this)
                            [...MoneyChangeArr].forEach((item, index) => {
                                item.play(LanguageManager.instance.formatUnit(Money), 0.8, () => {
                                    if (index == [...MoneyChangeArr].length-1 ) {
                                        if (moneyCb != null) moneyCb();
                                    }
                                }, this);
                            });
                        }
                    }
                    this.onEffectComplete(target, state);
                }, this, img).start();
        }
    }

    private onEffectComplete(img: Node, state: FlyAniState): void {
        if (img && img.parent) {
            img.destroy();
            state.count++;
            // Sound.ins().playaddCoin();
            // Sound.ins().playsound_usd();
            loader.loadRes(`music/addCoin`, AudioClip, function (err, AudioClip) {
                if (err) return;

                audioEngine.play(AudioClip, false, 1);
            });

            if (state.count == state.staLen) {
                state.musicID && audioEngine.pause(state.musicID);
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
     * @param ActionArr 动作数组
     * @param isRepeatForever 是否循环播放
     */
   public sequenceAnim(node: Node, ActionArr: any, isRepeatForever: boolean = false, callback?: Function) {
    let seq = sequence([...ActionArr])
    if (isRepeatForever) {
        let repeat = repeatForever(seq)
        node.runAction(repeat)
    } else {
        if (callback) {
            let func = callFunc(callback, this)
            seq = sequence([...ActionArr, func])
        }
        node.runAction(seq)
    }
}
    public shakeEffect(node:Node,duration) {
        node.runAction(
            repeatForever(
                sequence(
                    moveTo(0.02, v2(5, 7)),
                    moveTo(0.02, v2(-6, 7)),
                    moveTo(0.02, v2(-13, 3)),
                    moveTo(0.02, v2(3, -6)),
                    moveTo(0.02, v2(-5, 5)),
                    moveTo(0.02, v2(2, -8)),
                    moveTo(0.02, v2(-8, -10)),
                    moveTo(0.02, v2(3, 10)),
                    moveTo(0.02, v2(0, 0))
                )
            )
        );
        setTimeout(() => {
            node.stopAllActions();
            node.setPosition(0,0);
        }, duration*1000);
    }
}