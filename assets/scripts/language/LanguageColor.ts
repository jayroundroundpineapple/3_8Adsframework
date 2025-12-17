import { _decorator, Component, Label, RichText, sys, Color } from "cc";

const {ccclass, property} = _decorator;

@ccclass
export default class LanguageColor extends Component {

    @property({ type: Boolean, tooltip: '是否自动配置文本颜色' })
    autoTextColor: boolean = false;
    
    private lable: Label | RichText = null;

    protected onLoad(): void {
        if (this.node.getComponent(Label))
            this.lable = this.getComponent(Label);
        else if (this.getComponent(RichText))
            this.lable = this.getComponent(RichText);
    }
    start () {
        if (this.autoTextColor) {
            // 假设国家代码可以通过某种方式从 LanguageManager 获取
            let country = sys.languageCode.split('-')[1]
            if (country === 'cn') {
                country = 'us'
            }
            switch (country) {
                case 'us':
                case 'de':
                case 'fr':
                case 'mx':
                        if (this.lable instanceof Label) {
                            this.lable.color = Color.fromHEX(new Color(), '#133983');
                        } else if (this.lable instanceof RichText) {
                            this.lable.fontColor = Color.fromHEX(new Color(), '#133983');
                        }
                    break;
                case 'br':
                    if (this.lable instanceof Label) {
                        this.lable.color = Color.fromHEX(new Color(), '#32bcad');
                    } else if (this.lable instanceof RichText) {
                        this.lable.fontColor = Color.fromHEX(new Color(), '#32bcad');
                    }
                    break;
                case 'kr':
                    if (this.lable instanceof Label) {
                        this.lable.color = Color.fromHEX(new Color(), '#232323');
                    } else if (this.lable instanceof RichText) {
                        this.lable.fontColor = Color.fromHEX(new Color(), '#232323');
                    }
                    break;
                case 'jp':
                    if (this.lable instanceof Label) {
                        this.lable.color = Color.fromHEX(new Color(), '#fe0034');
                    } else if (this.lable instanceof RichText) {
                        this.lable.fontColor = Color.fromHEX(new Color(), '#fe0034');
                    }
                    break;
                case 'tr':
                    if (this.lable instanceof Label) {
                        this.lable.color = Color.fromHEX(new Color(), '#50abd9');
                    } else if (this.lable instanceof RichText) {
                        this.lable.fontColor = Color.fromHEX(new Color(), '#50abd9');
                    }
                    break;
                default:
                    if (this.lable instanceof Label) {
                        this.lable.color = Color.fromHEX(new Color(), '#133983');
                    } else if (this.lable instanceof RichText) {
                        this.lable.fontColor = Color.fromHEX(new Color(), '#133983');
                    }
            }
        }
    }
}
