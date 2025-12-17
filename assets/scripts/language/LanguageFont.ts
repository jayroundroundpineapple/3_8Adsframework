import { _decorator, assetManager, Component, Enum, Label, loader, resources, TTFFont } from "cc";

const {ccclass, property} = _decorator;
enum FontType {
    Medium = 0,
    MuseoSansRounded900 = 1
}
@ccclass
export class LanguageFont extends Component {
    @property({
        type: Enum(FontType),
        tooltip:  '选择显示文本的字体类型',
        displayName: '字体类型'
    })
    fontIndex: FontType = FontType.Medium;
   

    protected onLoad(): void {
       
    }

    protected start(): void {
        // let font = this.fontIndex == 0 ? 'Medium' : 'MuseoSansRounded900'
        // loader.loadRes(`/ttf/${font}`,TTFFont,(error,res)=>{
        //     if(error){
        //         return
        //     }else{
        //         this.node.getComponent(Label).font = res
        //     }
        // })
    }
    initFont(fontIndex:number){
        const fontNames = ['Medium', 'MuseoSansRounded900'];
        const fontName = fontNames[fontIndex] || fontNames[0]; // 默认使用Medium
        resources.load(`/ttf/${fontName}`,TTFFont,(error,res)=>{
            if(error){
                return
            }else{
                this.node.getComponent(Label).font = res
            }
        })
        // loader.loadRes(`/ttf/${fontName}`,TTFFont,(error,res)=>{
        //     if(error){
        //         return
        //     }else{
        //         this.node.getComponent(Label).font = res
        //     }
        // })     
    }

    protected onEnable(): void {
    }
}
