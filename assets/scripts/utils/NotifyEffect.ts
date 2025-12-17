/**
 * 弹窗特效类
 */

import { AudioClip, tween, Node, Vec3, AudioSource } from "cc"
import { AudioManager } from "./AudioManager"

export default class NotifyEffect {
    /**
     * 弹窗接口
     * @param delay 弹窗延迟时间
     * @param canPlayerMusic 能否播放音频
     * @returns {number}
     */
    public static NormalShowUI(node: Node, audio: AudioClip, delay: number, canPlayMusic: boolean, callback: Function = null, StartScale: number = 1, EndScale: number = 1, time1: number = 0.3, time2: number = 0.3) {
        setTimeout(() => {
            if (canPlayMusic && audio) {
                const audioManager = AudioManager.getInstance();
                if (audioManager) {
                    // 如果 AudioManager 已初始化，使用它播放
                    audioManager.playSound('', 1);
                } else {
                    // 否则创建临时 AudioSource
                    const audioNode = new Node('TempAudio');
                    audioNode.setParent(node.parent || node);
                    const audioSource = audioNode.addComponent(AudioSource);
                    audioSource.clip = audio;
                    audioSource.loop = false;
                    audioSource.play();
                    setTimeout(() => {
                        if (audioNode && audioNode.isValid) {
                            audioNode.destroy();
                        }
                    }, (audio.getDuration() || 1) * 1000);
                }
            }
            node.setScale(0, 0, 1);
            node.active = true;
            tween(node)
                .to(time1, { scale: new Vec3(StartScale, StartScale, 1) }, { easing: 'quadOut' })
                .to(time2, { scale: new Vec3(EndScale, EndScale, 1) }, { easing: 'quadOut' })
                .call(() => {
                    if (callback) callback();
                })
                .start();
        }, delay * 1000);
    }
    /**?
     * 震动弹窗接口
     * @param duartion 动画持续时间 0则为永久
     * @param shakeSpeed 震动速度时间默认0.04
     * @param shakeWake 震幅默认为1倍
     */
    public static shakeShowUI(node: Node, audio: AudioClip, duartion: number = 0, scale: number = 1.2, shakeSpeed: number = 0.04, shakeWake: number = 1) {
        const originalPos = node.position.clone();
        const posX = originalPos.x;
        const posY = originalPos.y;
        
        // 创建震动位置数组
        const shakePositions = [
            new Vec3(posX + 5 * shakeWake, posY + 7 * shakeWake, 0),
            new Vec3(posX + -6 * shakeWake, posY + 7 * shakeWake, 0),
            new Vec3(posX + -13 * shakeWake, posY + 3 * shakeWake, 0),
            new Vec3(posX + 3 * shakeWake, posY - 6 * shakeWake, 0),
            new Vec3(posX + -5 * shakeWake, posY + 5 * shakeWake, 0),
            new Vec3(posX + 2 * shakeWake, posY - 8 * shakeWake, 0),
            new Vec3(posX + -8 * shakeWake, posY - 10 * shakeWake, 0),
            new Vec3(posX + 3 * shakeWake, posY + 10 * shakeWake, 0),
            originalPos
        ];
        
        // 创建震动动画序列
        let shakeTween = tween(node).delay(0.15);
        for (let i = 0; i < shakePositions.length; i++) {
            shakeTween = shakeTween.to(shakeSpeed, { 
                position: shakePositions[i],
                scale: new Vec3(scale, scale, 1)
            });
        }
        shakeTween = shakeTween.delay(0.15).to(0.2, { scale: new Vec3(1, 1, 1) });
        
        shakeTween.repeatForever().start();
        
        if (duartion != 0) {
            setTimeout(() => {
                tween(node).stop();
                node.setScale(1, 1, 1);
                node.setPosition(originalPos);
            }, duartion * 1000);
        }
    }
    /**?
     * Q弹动态弹窗  
     * @param StartScaleX 初始缩放
     * @param StartRatio 初始宽高比
     * @param MidRatio 宽高比2
     * @param EndRatio 宽高比3
     */
    public static FlexShowUI(node: Node, StartScale: number = 1, StartRatio: number = 0.85, MidRatio: number = 1.15, EndRatio: number = 0.85) {
        node.setScale(0, 0, 1);
        node.active = true;
        let startScaleX = StartScale, startScaleY = StartScale, midScaleX = StartScale, midScaleY = StartScale, endScaleX = StartScale, endScaleY = StartScale;
        startScaleY = startScaleX / StartRatio;
        midScaleX = midScaleY * MidRatio;
        midScaleY = 0.75;
        endScaleY = endScaleX / EndRatio;
        tween(node)
            .to(0.2, { scale: new Vec3(startScaleX, startScaleY, 1) }, { easing: 'quadOut' })
            .to(0.25, { scale: new Vec3(midScaleX, midScaleY, 1) }, { easing: 'linear' })
            .to(0.12, { scale: new Vec3(endScaleX, endScaleY, 1) }, { easing: 'linear' })
            .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'linear' })
            .start();
    }
    /**
     * 弹窗  大变小
     */
    public static FarShowUI(node: Node, startScale: number = 1.5, midScale: number = 0.85, endScale: number = 1.15, time: number = 0.5) {
        node.setScale(startScale, startScale, 1);
        node.active = true;
        tween(node)
            .to(time, { scale: new Vec3(midScale, midScale, 1) }, { easing: 'quadIn' })
            .to(time, { scale: new Vec3(endScale, endScale, 1) }, { easing: 'quadOut' })
            .to(time, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
            .start();
    }
    /**?
    * 震动接口  
    * @param shakeOffset 偏移量
    * @param shakeCount 震动次数
    * @param shakeDuration 速度
    */
    public static shakeUI1(node: Node, shakeOffset: number = 30, shakeCount: number = 4, shakeDuration = 0.05) {
        const originalPos = node.position.clone();
        tween(node)
            .repeat(shakeCount,
                tween()
                    .by(shakeDuration, { position: new Vec3(shakeOffset, shakeOffset, 0) })
                    .by(shakeDuration, { position: new Vec3(-shakeOffset, -shakeOffset, 0) })
            )
            .call(() => {
                node.setPosition(originalPos);
            })
            .start();
    }
    /**?
         * 震动放大接口  
         * @param shakeAngle 角度
         * @param shakeCount 震动次数
         * @param shakeDuration 速度
         * @param scaleFactor 放大倍数
         */
    public static shakeAndScaleNode(node: Node, shakeAngle: number, shakeCount: number, shakeDuration: number, scaleFactor: number) {
        const originalScale = node.scale.clone();
        const targetScale = new Vec3(originalScale.x * scaleFactor, originalScale.y * scaleFactor, originalScale.z);
        const originalAngle = node.eulerAngles.z || 0;
        
        tween(node)
            .to(shakeDuration, { scale: targetScale }) // 放大
            .repeat(shakeCount,
                tween()
                    .to(shakeDuration, { eulerAngles: new Vec3(0, 0, originalAngle + shakeAngle) })
                    .to(shakeDuration, { eulerAngles: new Vec3(0, 0, originalAngle) })
                    .to(shakeDuration, { eulerAngles: new Vec3(0, 0, originalAngle - shakeAngle) })
                    .to(shakeDuration, { eulerAngles: new Vec3(0, 0, originalAngle) })
            )
            .to(shakeDuration, { scale: originalScale }) // 恢复原始大小
            .start();
    }
}
