import { _decorator, assetManager, Color, color, Component, Enum, Label, loader, resources, RichText, sys, TTFFont } from "cc";
import { LanguageManager } from "./LanguageManager";

const { ccclass, property } = _decorator;
enum FontType {
    Medium = 0,
    MuseoSansRounded900 = 1
}
@ccclass
export class LanguageCount extends Component {
    @property({
        type: Enum(FontType),
        tooltip:  '选择显示文本的字体类型',
        displayName: '字体类型'
    })
    fontIndex: FontType = FontType.Medium;
    @property({ type: Boolean, tooltip:  '是否自动配置货币' })
    autoPrefix: boolean = true
    // 添加是否自动配置文本颜色的属性
    @property({ type: Boolean, tooltip:  '是否自动配置文本颜色' })
    autoTextColor: boolean = false;
    @property({ type: Boolean, tooltip:  '是否自动配置货币后缀' })
    autoEndfix: boolean = false
    @property({ type: Number, tooltip:  '数字' })
    languageNum: number = 0;
    @property({ type: String, tooltip:  '前缀' })
    prefix: string = ''
    @property({ type: String, tooltip:  '后缀' })
    endFix: string = ''
    private lable: Label | RichText = null;

    protected onLoad(): void {
        if (this.getComponent(Label))
            this.lable = this.getComponent(Label);
        else if (this.getComponent(RichText))
            this.lable = this.getComponent(RichText);
    }

    protected start(): void {
        this.ChangeLanguage();
        let font = this.fontIndex == 0 ? 'Medium' : 'MuseoSansRounded900'
        resources.load(`/ttf/${font}`,TTFFont,(error,res)=>{
            if(error){
                return
            }else{
                this.node.getComponent(Label).font = res
            }
        })
        // loader.loadRes(`/ttf/${font}`,TTFFont,(error,res)=>{
        //     if(error){
        //         return
        //     }else{
        //         this.node.getComponent(Label).font = res
        //     }
        // })
    }

    protected onEnable(): void {
        this.ChangeLanguage();
    }

    private ChangeLanguage(): void {
        if (!this.lable)
            return;
        let mgr = LanguageManager.instance;
        let unit = mgr.getText(10001)
        if (this.autoPrefix) {
            this.lable.string = `${this.prefix}${unit}${mgr.formatUnit(this.languageNum)}${this.endFix}`;
        } else {
            this.lable.string = `${this.prefix}${mgr.formatUnit(this.languageNum)}${this.endFix}`;
        }
        if (this.autoEndfix) {
            this.lable.string = `${this.prefix}${mgr.formatUnit(this.languageNum)}${this.endFix}${unit}`;
        }
        // 根据是否自动配置文本颜色设置颜色
        if (this.autoTextColor) {
            // 假设国家代码可以通过某种方式从 LanguageManager 获取
            let country = sys.languageCode.split('-')[1]
            if (country = 'cn') {
                country = 'us'
            }
            switch (country) {
                case 'us':
                case 'de':
                case 'fr':
                case 'mx':
                    if (this.lable instanceof Label) {
                        this.lable.color = color('#133983');
                    }
                    break;
                case 'br':
                    if (this.lable instanceof Label) {
                        this.lable.color = color('#32bcad');
                    }
                    break;
                case 'kr':
                    if (this.lable instanceof Label) {
                        this.lable.color = color('#232323');
                    }
                    break;
                case 'jp':
                    if (this.lable instanceof Label) {
                        this.lable.color = color('#fe0034');
                    }
                    break;
                case 'tr':
                    if (this.lable instanceof Label) {
                        this.lable.color = color('#50abd9');
                    }
                    break;
                default:
                    if (this.lable instanceof Label) {
                        this.lable.color = Color.WHITE;
                    }
            }
        }
    }
}
