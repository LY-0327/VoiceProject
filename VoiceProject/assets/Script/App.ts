import VoiceUtils from "./VoiceUtils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class App extends cc.Component {


    start() {
        VoiceUtils.getInstance().init();
    }

    private onclickStartRecord() {
        VoiceUtils.getInstance().startRecord();
    }

    private onclickStopRecord() {
        VoiceUtils.getInstance().stopRecord();
    }

    private onclickPlayRecord() {
        VoiceUtils.getInstance().playRecord();
    }
}
