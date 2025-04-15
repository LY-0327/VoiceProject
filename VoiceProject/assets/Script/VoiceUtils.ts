export default class VoiceUtils {
    private static instance: VoiceUtils = null;
    public static getInstance() {
        if (VoiceUtils.instance == null) {
            VoiceUtils.instance = new VoiceUtils();
        }
        return VoiceUtils.instance;
    }

    private mediaRecorder: MediaRecorder = null;
    private audioChunks: Blob[] = [];
    private audioBlob: Blob = null;
    private audioUrl: string = null;
    private audio: HTMLAudioElement = null;
    private ws: WebSocket = null;

    constructor() {
        // 初始化录音功能
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };
                this.mediaRecorder.onstop = () => {
                    this.audioBlob = new Blob(this.audioChunks, {
                        type: "audio/webm",
                    });
                    this.audioUrl = URL.createObjectURL(this.audioBlob);
                    this.audio = new Audio(this.audioUrl);
                    this.audioChunks = []; // 清空录音数据
                    console.log('audioBlob',this.audioBlob);

                    this.uploadRecording();
                };
            })
            .catch((error) => {
                console.error("无法访问麦克风:", error);
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    console.log("浏览器支持 getUserMedia");
                } else {
                    console.error("浏览器不支持 getUserMedia");
                }
            });

    }

    public init(){
        // 初始化 WebSocket 连接
        if (cc.sys.isBrowser) {
            this.ws = new WebSocket("ws://192.168.170.166:3000");

            this.ws.onopen = () => {
                console.log("WebSocket 已连接");
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("收到服务端通知:", data);

                if (data.message === "File uploaded") {
                    this.playReceivedRecording(`http://192.168.170.166:3000${data.fileUrl}`);
                }
            };

            this.ws.onclose = () => {
                console.log("WebSocket 已断开");
            };

            this.ws.onerror = (error) => {
                console.error("WebSocket 错误:", error);
            };
        }
    }

    public startRecord() {
        if (cc.sys.isBrowser) {
            if (this.mediaRecorder && this.mediaRecorder.state === "inactive") {
                this.audioChunks = []; // 清空之前的录音数据
                this.mediaRecorder.start();
                console.log("开始录音...");
            }
        } else if (cc.sys.isNative) {
            if (cc.sys.os === cc.sys.OS_IOS) {
                jsb.reflection.callStaticMethod(
                    "AudioRecorder",
                    "startRecording",
                    "()V"
                );
            } else if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod(
                    "org/cocos2dx/javascript/AudioRecorder",
                    "startRecording",
                    "()V"
                );
            }
        }
    }
    public stopRecord() {
        if (cc.sys.isBrowser) {
            if (
                this.mediaRecorder &&
                this.mediaRecorder.state === "recording"
            ) {
                this.mediaRecorder.stop();
                console.log("停止录音...");
            }
        } else if (cc.sys.isNative) {
            if (cc.sys.os === cc.sys.OS_IOS) {
                jsb.reflection.callStaticMethod(
                    "AudioRecorder",
                    "stopRecording",
                    "()V"
                );
            } else if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod(
                    "org/cocos2dx/javascript/AudioRecorder",
                    "stopRecording",
                    "()V"
                );
            }
        }
    }

    public playRecord() {
        if (cc.sys.isBrowser) {
            if (this.audio) {
                this.audio.play();
                console.log("播放录音...");
            } else {
                console.warn("没有可播放的录音，请先录音！");
            }
        } else if (cc.sys.isNative) {
            if (cc.sys.os === cc.sys.OS_IOS) {
                jsb.reflection.callStaticMethod(
                    "AudioRecorder",
                    "playRecording",
                    "()V"
                );
            } else if (cc.sys.os === cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod(
                    "org/cocos2dx/javascript/AudioRecorder",
                    "playRecording",
                    "()V"
                );
            }
        }
    }

    uploadRecording() {
        if (this.audioBlob) {
            const formData = new FormData();
            formData.append("file", this.audioBlob, "recording.webm");

            fetch("http://192.168.170.166:3000/upload", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log("上传成功:", data);
                })
                .catch((error) => {
                    console.error("上传失败:", error);
                });
        } else {
            console.warn("没有可上传的录音文件！");
        }
    }

    playReceivedRecording(url: string) {
        const audio = new Audio(url);
        audio.play();
        console.log("播放接收到的录音...");
    }
}
