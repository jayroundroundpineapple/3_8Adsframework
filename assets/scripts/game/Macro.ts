import { Vec3 } from "cc";

export enum CarType {
    SMALL = 0,
    MIDDLE = 1,
    BIG = 2,
}
export enum dingColor {
    RED = 0,
    GREEN = 1,
    BLUE = 2,
}
export enum carDirection {
    LEFT = 0,
    RIGHT = 1,
    UP = 2,
    DOWN = 3,
}

export class Macro {
    /** 车位与道路的间距 */
    public static readonly PARKING_ROAD_GAP_Y = 150;
    /**停车场最左边的X坐标 */
    public static readonly PARKING_ROAD_LEFT_X = -300;
    /**停车场最右边的X坐标 */
    public static readonly PARKING_ROAD_RIGHT_X = 310;
    /**停车位下边跑道Y */
    public static readonly PARKING_ROAD_BOTTOM_Y = 560;
     /**自定义停车位下边跑道Y */
     public static readonly CUSTOM_PARKING_ROAD_BOTTOM_Y = -65;
    /**移动车位角度 */
    public static readonly PARKING_ROAD_ANGLE = 25;
     /**停车spine车位角度 */
    public static readonly PARKINGSPine_ROAD_ANGLE = 2.5;
    /**车辆离开角度1 */
    public static readonly CAR_LEAVE_ANGLE1 = -195;
    /**车辆横向离开角度 */
    public static readonly CAR_LEAVE_ANGLE2 = -108;
    /**小车的4个钉子位置 */
    public static readonly SMALL_CAR_DINGZIPOS_ARR = [
        new Vec3(-10, 8, 0),
        new Vec3(9, 13, 0),
        new Vec3(-3, -9, 0),
        new Vec3(16, -4, 0),
    ];
    public static readonly MIDDLE_CAR_DINGZIPOS_ARR = [
        new Vec3(-12.5, 21.5, 0),
        new Vec3(5.5, 26.5, 0),
        new Vec3(-5.5, 4.5, 0),
        new Vec3(12.5, 9.5, 0),
        new Vec3(1.5, -11.5, 0),
        new Vec3(20, -6.5, 0)
    ];
    public static readonly BIG_CAR_DINGZIPOS_ARR = [
        new Vec3(-10, 8, 0),
        new Vec3(9, 13, 0),
        new Vec3(-3, -9, 0),
        new Vec3(16, -4, 0),
    ];
    /**小车钉子scale */
    public static readonly CAR_DI_SCALE = 0.45;
}