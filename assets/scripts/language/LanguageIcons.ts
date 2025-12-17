import { LanguageManager } from "./LanguageManager";
import { _decorator, assetManager, Component, director, Enum, loader, resources, Sprite, SpriteFrame, sys } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export class LanguageIcons extends Component {

    @property({ type: Boolean })
    public isFollowLanage: boolean = true;

    @property({ type: String, tooltip:  'pay文件夹下的路径名,全部按语言缩写配置' })
    public srcName: string = ''

    private icon: Sprite = null;
    public static instance: LanguageIcons = null;

    onLoad() {
        LanguageIcons.instance = this
        this.icon = this.node.getComponent(Sprite);
        
    }

    start() {
        this.updateIcon();
        if(LanguageManager.instance.isTest){
            let testCountry = LanguageManager.instance.testCountry
            LanguageManager.instance.setTestLanguage(testCountry)
        }
    }

    public updateIcon(isTest:boolean = false,testCountry:string = 'us'): void {
        if (this.icon == null) return;
        let lang = ''
        if (sys.language == 'zh') {
            lang = 'us'
        } else {
            lang = sys.language
        }
        let res = `${this.srcName}/${lang}`;
        if(sys.language == 'zh'){
            res = `${this.srcName}/${lang}`
        }else{
            let country = sys.languageCode.split('-')[1]
            res = `${this.srcName}/${country}`
        }
        if(isTest){
            res = `${this.srcName}/${testCountry}`
        }
        resources.load(`/pay/${res}`, SpriteFrame, (error, res) => {
            if(error){
                return
            }else{
                this.icon.spriteFrame = res
            }
        })
        // loader.loadRes(`/pay/${res}`, SpriteFrame, (error, res) => {
        //     if (error) {
        //         console.log("error = ", error);
        //         return;
        //     }
        //     this.icon.spriteFrame = res;
        // });
    }
    onDestroy() {
        director.off('language-changed', this.updateIcon, this);
    }
}
