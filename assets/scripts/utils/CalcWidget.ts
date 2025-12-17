import { _decorator, Component, UITransform, Widget } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export class CalcWidget extends Component {
    @property({type:Boolean})
    public isLeft:boolean = true

    start() {
        this.fitFunc();
        // view.setResizeCallback(() => {
        //     this.fitFunc();
        // })
    }
    private fitFunc(){
        this.node.active = screen.width > screen.height ? true : false
        let widget = this.node.getComponent(Widget)
        // if(widget == null)return
        if(this.isLeft){
            widget.left = (((screen.width - 720 ) / 2) - this.node.getComponent(UITransform).width) / 2
        }else{
            widget.right = (((screen.width - 720 ) / 2) - this.node.getComponent(UITransform).width) / 2
        }
    }
}
