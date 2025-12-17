import { _decorator, Component, Label, RichText } from "cc";
import { LanguageManager } from "./LanguageManager";

const {ccclass, property} = _decorator;

@ccclass
export class LanguageComponent extends Component {

    @property(Number)
    languageId: number = 0;
    @property({type:Boolean,tooltip: '是否需要自定义配置%s'})
    IsCustom:boolean = false
    @property({type:Boolean,tooltip: '是否需要前缀'})
    IsPrefix:boolean = false
     @property({type:String,tooltip: '前缀'})
    prefix:string = ''
    @property({type:Boolean,tooltip: '是否需要后缀'})
    IsEndprefix:boolean = false
     @property({type:String,tooltip: '后缀'})
    endPrefix:string = ''
    @property({type:Number,tooltip: '配置的数字'})
    cusTomNum:number = 0
    private lable: Label | RichText = null;
    private formatArgs: any[] = null;

    protected onLoad(): void {
        if (this.getComponent(Label))
            this.lable = this.getComponent(Label);
        else if (this.getComponent(RichText))
            this.lable = this.getComponent(RichText);
    }

    protected start(): void {
        this.ChangeLanguage();
    }

    protected onEnable(): void {
        this.ChangeLanguage();
    }

    public ChangeLanguage(): void {
        if (!this.lable)
            return;
        
        let mgr = LanguageManager.instance;
        //this.formatArgs != null
        if (this.IsCustom && this.cusTomNum){
            this.lable.string = mgr.getText(this.languageId,this.cusTomNum);
            if(this.IsPrefix){
                this.lable.string = `${this.prefix}${mgr.getText(this.languageId,this.cusTomNum)}`
            }
            if(this.IsEndprefix){
                this.lable.string = `${mgr.getText(this.languageId,this.cusTomNum)}${this.endPrefix}`
            }
        } else {
            this.lable.string = `${mgr.getText(this.languageId)}`
            if(this.IsPrefix)this.lable.string = `${this.prefix}${mgr.getText(this.languageId)}`
            if(this.IsEndprefix)this.lable.string = `${mgr.getText(this.languageId)}${this.endPrefix}`
            if(this.IsEndprefix && this.IsPrefix) this.lable.string = `${this.prefix}${mgr.getText(this.languageId)}${this.endPrefix}`
        }
    }

    public ChangeNormalId(textId: number, ...args: any[]): void {
        this.languageId = textId;
        if (args.length <= 0) {
            this.formatArgs = null;
        } else {
            this.formatArgs = args;
        }

        this.ChangeLanguage();
    }

    public SetFormatText(...args: any[]): void {
        this.formatArgs = args;
        this.ChangeLanguage();
    }
}
