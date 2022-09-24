<template>
  <div>
    <div class="file">
      <input type="file" name="file"  @change="handleChange"
        accept=".mp3, .wav, .ogg, .acc"
      >上传音频文件</input>
    </div>
    <videoView :play="play" :stop="stop" :uploadfile="uploadfile"/>
    <audioFormat :uploadfile="uploadfile"/>
    <footer v-if="!isMobile">
      <div class="menu">
        <div class="controlMenu">
          <el-button @click="getAudioText()" size="mini">获取文案</el-button>
        </div>
        <div class="rule">
          <div class="block slider">
            <el-slider
              v-model="value2"
              :step="20"
              show-stops
              @change="stepChange"
            ></el-slider>
          </div>
        </div>
      </div>
      <div class="controlLine">
        <div class="dyc" id="pickeddeng">
          <div class="canFa" @mouseup="blueBgUp">
            <canvas
              id="canvas"
              :width="canvasWidth"
              height="80"
              @click="sliderBlueButton"
            ></canvas>
            <div
              class="signcircle"
              v-for="(item, index) in makeSignList"
              :key="index"
              :style="`left:${item.left}`"
              @click="signClick(item, index)"
            ></div>
            <div
              class="blueBg"
              id="blueBg"
              ref="timeMove"
              @mousedown="blueBgDown"
              @mousemove="blueBgMove"
              @mouseup="blueBgUp"
            >
              {{ timeCurrentLeft }}
              <span class="turnDowm"></span>
            </div>
          </div>
          <div class="imgbackground" :style="`width:${imgWidth};`" />
        </div>
      </div>
    </footer>
    <footer v-if="isMobile">
      <div class="menu">
        <div class="controlMenu">
          <el-button size="mini" @click="getAudioText()">获取文案</el-button>
        </div>
        <div class="rule">
          <div class="block slider">
            <el-slider
              v-model="value2"
              :step="20"
              show-stops
              @change="stepChange"
            ></el-slider>
          </div>
        </div>
      </div>
      <div class="controlLine">
        <div class="dyc" id="pickeddeng">
          <div class="canFa">
            <canvas
              id="canvas"
              :width="canvasWidth"
              height="80"
              @touchstart="sliderBlueButton"
            ></canvas>
            <div
              class="signcircle"
              v-for="(item, index) in makeSignList"
              :key="index"
              :style="`left:${item.left}`"
              @touchstart="signClick(item, index)"
            ></div>
            <div
              class="blueBg"
              id="blueBg"
              ref="timeMove"
              @touchstart="blueBgDown"
              @touchmove.prevent="blueBgMove"
              @touchend="blueBgUp"
            >
              {{ timeCurrentLeft }}
              <span class="turnDowm"></span>
            </div>
          </div>
          <div class="imgbackground" :style="`width:${imgWidth};`" />
        </div>
      </div>
    </footer>
    <el-input type="textarea" autosize v-model="audioText" disabled />
    <animationFlash :animationTime="animationTime"/>
  </div>
</template>
<script>
import videoView from "./VideoView";
import audioFormat from "./AudioFormat";
import animationFlash from "./AnimationFlash";
export default {
  components: {
    videoView,
    audioFormat,
    animationFlash
  },
  props: ["isLandscape"],
  data() {
    return {
      turnFlag: "",
      radio: 1,
      //   底部dyc
      topMoveBox: null, //移动的蓝色时间盒子
      number: 5, //刻度对应秒数
      maxTimeLong: 360000, //除以10 即为刻度尺 个 刻度
      videoLongTime: "00:00:00",
      value2: 100, //选择刻度尺刻度大小
      canvas: null,
      canvasWidth: 60000,
      cxt: null,
      clickmsg: "打入点", //打入打出
      config: {},
      timeCurrentLeft: "00:00:00:00", //当前距离左侧时间
      clickCurrentTime: null, //点击距离

      timeId: null, //计算定时器
      clickIn: null, //打入定时器
      scrollId: null, //滚动定时器
      subTimeId: null, //分段播放移动计时器

      subPlayValue: null, //分段播放数据
      moveLeft: -40, //移动中bgleft坐标
      cutCoverList: [], //裁剪列表
      makeSignList: [], //标记列表
      coverBoxWidth: "0px",
      clickCurrentLeft: null, //点击打入时，距离左侧位置
      videoLong: 600,
      imgWidth: "0px", //图片的宽度
      pickeddeng: null,
      bofangFlag: true, //播放flag
      signFlag: false, //标记flag
      target: 1400, //目标位置
      // 盒子拖拽部分
      downFlag: false, //按下的标志
      offsetStart: null,
      offsetEnd: null,
      currentRunMsg: "run",
      signIndex: null, //当前点击标记的index
      signLeft: "0px",
      signText: "标记1",

      // 快速选段
      quickChoseTime: 6,

      mainImgUrl: "../assets/demo.jpg", //底部封面图
      mainFlag: false, //是否选择了视频
      numberFlag: "00", //00 拆分  01合并
      spliceMsg: "拆分提交",
      countNumber: 1,
      firstCutVideo: {}, //页面拆分相关数据
      blueBgFlag: false,
      timeMoveNumber: 0, // 控制滚动数字
      isMobile: false,
      textArr: [], // 语音转文字数组
      uploadfile: null, // 上传的文件
      animationTime: 0 // 动画时长
    };
  },
  computed: {
    audioText() {
      let str = "";
      this.textArr.map((item, i) => {
        if (i === this.textArr.length - 1) {
          str +=
            "(" +
            item.offset +
            ")," +
            item.text +
            "(" +
            (item.offset + item.duration).toFixed(2) +
            ")";
          return item;
        }
        str += "(" + item.offset + ")," + item.text;
        return item;
      });
      return str;
    },
  },
  created() {
    let textArr = [];
    try {
      const textArr1 = localStorage.getItem('textArr');
      if (!textArr1) {
        textArr = [];
      } else {
        textArr = JSON.parse(textArr1);
      }
    } catch (error) {}
    this.textArr = textArr;
    this.Event.$on("allTime", (data) => {
      this.animationTime = data.toFixed(1)
      this.videoLongTime = this.setTime(data);
      // this.canvasWidth = parseInt(this.imgWidth);
      this.videoLong = data;
      this.maxTimeLong = Math.ceil(data) * 100;
      this.imgWidth = (this.videoLong / this.number) * 100 + "px";
      this.target = parseFloat(this.imgWidth) - 40;
    });
    this.isMobile =
      navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      ) !== null;
  },
  mounted() {
    this.initCancas()
  },
  methods: {
    initCancas() {
      var canvas = document.getElementById("canvas");
      this.canvas = canvas;
      var cxt = canvas.getContext("2d");
      cxt.fillStyle = "#fff";
      this.cxt = cxt;
      var config = {
        height: 200,
        width: this.canvasWidth,
        // 刻度尺相关
        start: "00:00:00",
        end: "00:20:10",
        size: 300, // 刻度尺总刻度数
        // unit:10,
        x: 20, // 刻度尺x坐标位置
        y: 70, // 刻度尺y坐标位置
        w: 10, // 刻度线的间隔
        h: 10, // 刻度线基础长度

        // 事件相关
        mousedown: false,
        // start: []
      };
      this.config = config;
      this.showCanvas();
      const timeMove = document.getElementsByClassName("blueBg")[0];
      this.topMoveBox = timeMove;
      timeMove.style.left = "-40px";
      // 设置图片盒子宽度
      this.imgWidth = (this.videoLong / this.number) * 100 + "px";
      this.pickeddeng = document.getElementById("pickeddeng");
    },
    handleChange(e) {
      this.uploadfile = e.target.files[0]
    },
    getAudioText() {
      const url = document.getElementById("download-url");
      if (!url || !url.href) {
        this.$message.error("请先执行命令, 生成wav文件");
        return;
      }
      const loading = this.$loading({
        lock: true,
        text: "生成文案中",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
        customClass: "audio-text-loading",
      });
      this.stt(loading);
    },
    async trancodeWav() {
      var blob = await fetch(document.getElementById("download-url").href).then(
        (res) => res.blob()
      );
      return new File([blob], "audio.wav", { type: "audio/x-wav" });
    },
    async getAuthToken(skip = false) {
      if (!skip && !this._isExpiration()) {
        return localStorage.getItem("ssmlToken");
      }
      const res = await fetch(
        "https://e37cad50-87bf-4e22-8965-c7e9ed358a6c.bspapp.com/text-to-speech/get-person-token-for-speech"
      ).then((res) => res.json());
      if (res.token.length > 50) {
        const token = res.token;
        localStorage.setItem(
          "data_expiration",
          `${Date.parse(new Date()) + 180000}`
        );
        localStorage.setItem("ssmlToken", token);
        return token;
      }
      return null;
    },
    _isExpiration() {
      // 当前时间
      var timestamp = Date.parse(new Date());
      // 缓存中的过期时间
      var data_expiration = localStorage.getItem("data_expiration");
      // 如果缓存中没有data_expiration，说明也没有token，还未登录
      if (data_expiration) {
        // 如果超时了，清除缓存，重新登录
        if (+timestamp > +data_expiration) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    },
    async stt(loading) {
      const _this = this;
      const file = await this.trancodeWav();
      let sdk = window.SpeechSDK;
      var authorizationToken = await this.getAuthToken();
      var serviceRegion = "eastus";
      let audioConfig = sdk.AudioConfig.fromWavFileInput(file);
      var speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
        authorizationToken,
        serviceRegion
      );
      speechConfig.speechRecognitionLanguage = "zh-CN";
      speechConfig.setServiceProperty(
        "punctuation",
        "explicit",
        sdk.ServicePropertyChannel.UriQueryParameter
      );
      let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      let t = "";
      let textArr = [];
      recognizer.recognizing = (s, e) => {
        // console.log(
        //   `转换中: Text=${e.result.text}`,
        //   e.result.privDuration / 10000000
        // );
      };

      recognizer.recognized = (s, e) => {
        t += e.result.text + "\n";
        loading.text = `生成文案中: ${t}`;
        textArr.push({
          offset: e.result.privOffset / 10000000,
          duration: e.result.privDuration / 10000000,
          text: e.result.text,
        });
        if (e.result.reason == ResultReason.RecognizedSpeech) {
          console.log(`RECOGNIZED: Text=${e.result.text}`);
        } else if (e.result.reason == ResultReason.NoMatch) {
          console.log("NOMATCH: Speech could not be recognized.");
        }
      };

      recognizer.canceled = (s, e) => {
        console.log(`CANCELED: Reason=${e.reason}`);
        loading.close();
        if (e.reason == CancellationReason.Error) {
          console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
          console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
          console.log(
            "CANCELED: Did you update the key and location/region info?"
          );
        }

        recognizer.stopContinuousRecognitionAsync();
      };

      recognizer.sessionStopped = (s, e) => {
        loading.close();
        _this.textArr = textArr;
        localStorage.setItem('textArr', JSON.stringify(textArr));
        recognizer.stopContinuousRecognitionAsync();
      };

      recognizer.startContinuousRecognitionAsync();
    },
    //时间进度条移动
    blueBgDown() {
      this.stop();
      this.blueBgFlag = true;
    },
    blueBgMove(e) {
      if (!this.blueBgFlag) {
        return;
      }
      this.sliderBlueButton(e);
    },
    blueBgUp() {
      this.blueBgFlag = false;
    },
    sliderBlueButton(e) {
      var pickeddeng = document.getElementById("pickeddeng");
      var finleft =
        pickeddeng.scrollLeft +
        (this.isMobile
          ? this.isLandscape
            ? e.changedTouches[0].pageY
            : e.changedTouches[0].pageX
          : this.isLandscape
          ? e.pageY
          : e.pageX) -
        60;
      if (finleft > parseFloat(this.imgWidth) - 40 || finleft < -40) {
        this.stop();
        //this.$message.error("超过限制区域");
        return;
      }
      document.getElementById("blueBg").style.left = finleft + "px";
      this.timeCurrentLeft = this.setDetailTime(
        parseFloat(
          Math.floor(
            (this.number / 100) * (this.topMoveBox.offsetLeft + 40) * 100
          ) / 100
        ).toFixed(2)
      );
      this.Event.$emit("currentTime", this.timeCurrentLeft);
    },
    signClick(item, index) {
      console.log(item);
    },
    // 播放
    play() {
      if (this.currentRunMsg == "clickIn") {
        this.running();
        return;
      }
      this.currentRunMsg = "run";
      this.running();
    },
    running() {
      this.bofangFlag = false;
      this.Event.$emit("paly", true); //播放视频
      if (this.currentRunMsg == "clickIn") {
        this.clickIninterval();
        return;
      }
      const timeMove = document.getElementsByClassName("blueBg")[0];
      // var target = this.target;
      timeMove.style.left = this.target + "px";

      this.timeId = setInterval(() => {
        this.moveLeft = window.getComputedStyle(timeMove).left;
        // console.log(this.moveLeft);
        this.timeMoveNumber = parseInt(parseInt(this.moveLeft) / 1600);
        if (parseFloat(this.moveLeft) / 1400 > this.countNumber) {
          this.countNumber = parseInt(parseFloat(this.moveLeft) / 1400) + 1;
        }
        if (parseFloat(this.moveLeft) + 40 > parseFloat(this.imgWidth)) {
          clearInterval(this.timeId);
          timeMove.style.left = this.moveLeft;
          this.stop();
          timeMove.style.transition = "none";
        }
        this.timeCurrentLeft = this.setDetailTime(
          parseFloat(
            Math.floor((this.number / 100) * (timeMove.offsetLeft + 40) * 100) /
              100
          ).toFixed(2)
        );
      }, 20);
      var pxecachS = this.number / 100; // 对应的每px所需要的秒
      // console.log(parseInt(target), parseInt(this.moveLeft), pxecachS);
      var timeCount =
        (parseInt(this.target) - parseInt(this.moveLeft)) * pxecachS;
      // console.log(timeCount);
      timeMove.style.transition = `all ${timeCount}s linear`;
    },
    // 暂停
    stop() {
      this.Event.$emit("paly", false); //暂停视频
      this.bofangFlag = true;
      // this.zanting();
      const timeMove = document.getElementsByClassName("blueBg")[0];
      this.moveLeft = window.getComputedStyle(timeMove).left;
      timeMove.style.left = this.moveLeft;
      timeMove.style.transition = `none`;
      clearInterval(this.timeId);
      clearInterval(this.clickIn);
      clearInterval(this.subTimeId);
      clearInterval(this.scrollId);
    },

    prevPage() {
      // 上一帧
      this.stop();
      const timeMove = document.getElementById("blueBg");
      var movePX = (100 / this.number / 100) * 10;
      var currentLeft = parseFloat(window.getComputedStyle(timeMove).left);
      if (currentLeft <= -40) {
        timeMove.style.left = "-40px";
        timeMove.style.transition = "none";
        this.timeCurrentLeft = this.setDetailTime(
          parseFloat(
            Math.floor((this.number / 100) * (timeMove.offsetLeft + 40) * 100) /
              100
          ).toFixed(2)
        );
        return;
      }
      var fininal = currentLeft - movePX;
      timeMove.style.left = fininal + "px";
      this.timeCurrentLeft = this.getStartEndTime(fininal + 40);
      this.Event.$emit("currentTime", this.timeCurrentLeft); //触发上一帧下一帧
    },

    nextpage() {
      // 下一帧
      this.stop();
      const timeMove = document.getElementById("blueBg");
      var movePX = (100 / this.number / 100) * 10;
      var currentLeft = parseFloat(window.getComputedStyle(timeMove).left);
      if (currentLeft >= parseFloat(this.imgWidth) - 40) {
        timeMove.style.left = parseFloat(this.imgWidth) - 40 + "px";
        timeMove.style.transition = "none";
        this.timeCurrentLeft = this.setDetailTime(
          parseFloat(
            Math.floor((this.number / 100) * (timeMove.offsetLeft + 40) * 100) /
              100
          ).toFixed(2)
        );
        return;
      }
      var fininal = currentLeft + movePX;
      timeMove.style.left = fininal + "px";
      this.timeCurrentLeft = this.getStartEndTime(fininal + 40);
      this.Event.$emit("currentTime", this.timeCurrentLeft);
    },

    // 打入计时器
    clickIninterval() {
      if (this.currentRunMsg == "run") {
        clearInterval(this.timeId);
      }
      this.currentRunMsg = "clickIn";
      const timeMove = document.getElementsByClassName("blueBg")[0];
      var target = this.target;
      this.clickIn = setInterval(() => {
        // console.log("clickIn");
        this.moveLeft = window.getComputedStyle(timeMove).left;

        this.timeMoveNumber = parseInt(parseInt(this.moveLeft) / 1600); //赋值让底部滚动
        if (parseFloat(this.moveLeft) / 1400 > this.countNumber) {
          this.countNumber = parseInt(parseFloat(this.moveLeft) / 1400) + 1;
        }
        // console.log(this.moveLeft, this.imgWidth);
        if (parseFloat(this.moveLeft) + 40 >= parseFloat(this.imgWidth)) {
          clearInterval(this.clickIn);
          this.timeMove();
          this.clickmsg = "打入点";
          timeMove.style.left = this.moveLeft;
          timeMove.style.transition = "none";
          this.stop();
        }
        if (this.cutCoverList.length > 0) {
          var current = this.cutCoverList[this.cutCoverList.length - 1];
          var coverBoxWidth =
            parseFloat(this.moveLeft) - parseFloat(this.clickCurrentLeft + 40);

          current.width = coverBoxWidth + "px";
          current.timeLong = this.getStartEndTime(coverBoxWidth);
        }

        this.timeCurrentLeft = this.setDetailTime(
          parseFloat(
            Math.floor((this.number / 100) * (timeMove.offsetLeft + 40) * 100) /
              100
          ).toFixed(2)
        );
      }, 10);
      var pxecachS = this.number / 100; // 对应的每px所需要的秒
      // console.log(parseInt(target), parseInt(this.moveLeft), pxecachS);
      var timeCount = (parseInt(target) - parseInt(this.moveLeft)) * pxecachS;
      // console.log(timeCount);
      timeMove.style.left = target + "px";
      timeMove.style.transition = `all ${timeCount}s linear`;
    },
    //改变刻度
    stepChange() {
      // 鼠标松开时触发
      // console.log(this.value2);
      var number = this.number;
      // var moveLeft = parseFloat(document.getElementById("blueBg").style.left);
      switch (this.value2) {
        case 0:
          this.number = 600;
          break;
        case 20:
          this.number = 120;
          break;
        case 40:
          this.number = 30;
          break;
        case 60:
          this.number = 10;
          break;
        case 80:
          this.number = 5;
          break;
        case 100:
          this.number = 1;
          break;
        default:
          break;
      }
      // 修改拆条宽度
      for (var i = 0; i < this.cutCoverList.length; i++) {
        this.cutCoverList[i].left =
          parseFloat(
            (number * parseFloat(this.cutCoverList[i].left)) / this.number
          ) + "px";
        this.cutCoverList[i].width =
          parseFloat(
            (number * parseFloat(this.cutCoverList[i].width)) / this.number
          ) + "px";
      }
      var moveBox = document.getElementById("blueBg");
      var moveBoxLeft = document.getElementById("blueBg").style.left;
      moveBox.style.left =
        parseFloat((number * parseFloat(moveBoxLeft)) / this.number) + "px";
      this.timeCurrentLeft = this.setDetailTime(
        parseFloat(
          Math.floor(
            (this.number / 100) * (this.topMoveBox.offsetLeft + 40) * 100
          ) / 100
        ).toFixed(2)
      );
      this.showCanvas();
      this.imgWidth = (this.videoLong / this.number) * 100 + "px";
      this.stop();
    },
    // 获取总秒树
    getCountS(time) {
      var hour = time.split(":")[0];
      var min = time.split(":")[1];
      var s = time.split(".")[0].split(":")[2];
      var ms = time.split(".")[1];
      return parseFloat(
        parseInt(hour) * 3600 + parseInt(min * 60) + s + "." + ms
      );
    },
    showCanvas() {
      var that = this;

      this.drawCan(this.cxt, this.config, that.number);

      // 鼠标按下时 记录状态及位置
      this.canvas.addEventListener("dblclick", function (e) {
        var scrollpd = document.getElementById("pickeddeng");
        var scrollLeft = scrollpd.scrollLeft;

        if (e.offsetX > parseInt(scrollLeft) + 1400) {
          that.$message.error("超过最大位置，请选择左侧位置~");
          return;
        }
        that.stop();
        that.clickCurrentTime = e.offsetX;
        var timeMove = document.getElementById("blueBg");
        timeMove.style.left = e.offsetX - 60 + "px";

        that.timeCurrentLeft = that.setDetailTime(
          parseFloat(
            Math.floor((that.number / 100) * (timeMove.offsetLeft + 40) * 100) /
              100
          ).toFixed(2)
        );

        that.config.mousedown = true;
        that.config.start = [e.offsetX, e.offsetY];
        that.bofangFlag = true;
        that.Event.$emit("currentTime", that.timeCurrentLeft);
        // console.log(e.offsetX, e.offsetY)
      });
      // 鼠标放开时 重置状态
      this.canvas.addEventListener("mouseup", function (e) {
        that.config.mousedown = false;
        that.config.x += e.offsetX - that.config.start[0];
        // console.log(that.config.x);
        if (that.config.x > 10) {
          that.config.x = 20;
          that.drawCan(that.cxt, that.config, that.number);
        }
      });
      // 鼠标划出canvas时 重置状态
      this.canvas.addEventListener("mouseout", function (e) {
        that.config.mousedown = false;
      });
      // 鼠标移动时 改变位置
      // this.canvas.addEventListener("mousemove", function(e) {
      //   // 如果鼠标左键被按下 可以拖动
      //   if (that.config.mousedown) {
      //     that.config.x += e.offsetX - that.config.start[0];
      //     console.log(e.offsetY);
      //     that.config.start = [e.offsetX, e.offsetY];
      //     that.drawCan(that.cxt, that.config, that.number);
      //   }
      // });
    },
    drawCan(cxt, config, number) {
      var size = 36000; //size/10则生成多少个刻度
      var x = config.x || 0;
      var y = config.y || 0;
      var w = config.w || 5;
      var h = config.h || 10;
      var offset = 3; // 上面数字的偏移量
      // 画之前清空画布
      cxt.clearRect(0, 0, config.width, config.height);
      // 设置画笔属性
      cxt.strokeStyle = "#fff";
      cxt.lineWidth = 1;
      cxt.font = 12;
      // console.log(size);
      for (var i = 0; i <= size; i++) {
        // 开始一条路径
        cxt.beginPath();
        // 移动到指定位置
        cxt.moveTo(x + i * w, y);
        // 满10刻度时刻度线长一些 并且在上方表明刻度
        if (i % 10 == 0 && this.number == 1) {
          // 区间为 1 s
          offset = 20;
          cxt.fillText(this.setTime(i / 10), x + i * w - offset, y - h * 2.5);
          cxt.lineTo(x + i * w, y - h * 2);
        }

        if (i % 10 == 0 && this.number == 5) {
          // 区间为 5 s
          offset = 20;
          cxt.fillText(this.setTime(i / 2), x + i * w - offset, y - h * 2.5);
          cxt.lineTo(x + i * w, y - h * 2);
        }
        if (i % 10 == 0 && this.number == 10) {
          // 区间为 10 s
          offset = 20;
          // console.log(i * number, x + i * w - offset, y - h * 2.5)
          // 按照第一个参数递增
          cxt.fillText(this.setTime(i), x + i * w - offset, y - h * 2.5);
          cxt.lineTo(x + i * w, y - h * 2);
        }
        if (i % 10 == 0 && this.number == 30) {
          // 区间为 30 s
          offset = 20;
          cxt.fillText(this.setTime(i * 3), x + i * w - offset, y - h * 2.5);
          cxt.lineTo(x + i * w, y - h * 2);
        }
        if (i % 10 == 0 && this.number == 120) {
          // 区间为 120 s
          offset = 20;
          cxt.fillText(this.setTime(i * 12), x + i * w - offset, y - h * 2.5);
          cxt.lineTo(x + i * w, y - h * 2);
        }
        if (i % 10 == 0 && this.number == 600) {
          // 区间为 600 s
          offset = 20;
          cxt.fillText(this.setTime(i * 60), x + i * w - offset, y - h * 2.5);
          cxt.lineTo(x + i * w, y - h * 2);
        } else {
          // 满5刻度时的刻度线略长于1刻度的
          cxt.lineTo(x + i * w, y - (i % 5 === 0 ? 1.5 : 1) * h);
        }

        // 画出路径
        cxt.stroke();
      }
      // var myj=0
      // for(var i=0;i<this.maxTimeLong;i+=this.number){
      //   myj++;
      //   cxt.fillText(i, x + i * w - offset,45);
      //   console.log(i, x + i * w - offset,45)
      // }

      // if (i % 10 == 0) {
      //   // 计算偏移量
      //   offset = 20;
      //   // console.log(i/10)
      //   // offset = (String(i / 10).length * 6) / 2;
      //   // console.log(cxt.fillText(i / 10, x + i * w - offset, y - h * 2.5))
      //   // cxt.fillText(i / 10, x + i * w - offset, y - h * 2.5);
      //   // cxt.fillText("00:00:23", x + i * w - offset, y - h * 2.5)
      //   cxt.lineTo(x + i * w, y - h * 2);
      // } else {
      //   // 满5刻度时的刻度线略长于1刻度的
      //   cxt.lineTo(x + i * w, y - (i % 5 === 0 ? 1.5 : 1) * h);
      // }
    },
    setTime(time) {
      var secondTime = parseInt(time); // 秒
      var minuteTime = 0; // 分
      var hourTime = 0; // 小时
      if (secondTime > 60) {
        //如果秒数大于60，将秒数转换成整数
        //获取分钟，除以60取整数，得到整数分钟
        minuteTime = parseInt(secondTime / 60);
        //获取秒数，秒数取佘，得到整数秒数
        secondTime = parseInt(secondTime % 60);
        //如果分钟大于60，将分钟转换成小时
        if (minuteTime > 60) {
          //获取小时，获取分钟除以60，得到整数小时
          hourTime = parseInt(minuteTime / 60);
          //获取小时后取佘的分，获取分钟除以60取佘的分
          minuteTime = parseInt(minuteTime % 60);
        }
      }
      hourTime = hourTime < 10 ? String("0" + hourTime) : hourTime;
      minuteTime = minuteTime < 10 ? String("0" + minuteTime) : minuteTime;
      secondTime = secondTime < 10 ? String("0" + secondTime) : secondTime;
      return hourTime + ":" + minuteTime + ":" + secondTime;
    },
    setDetailTime(time) {
      // console.log(time)
      var detail = null;
      if (time % 1 == 0) {
        detail = "00";
      } else {
        detail = String(parseFloat(parseInt(time * 100) / 100)).split(".")[1]; // 秒
      }
      if (String(detail).length == 1) {
        detail = String(detail + "0");
      }
      var secondTime = parseInt(time); // 秒
      var minuteTime = 0; // 分
      var hourTime = 0; // 小时
      if (secondTime >= 60) {
        //如果秒数大于60，将秒数转换成整数
        //获取分钟，除以60取整数，得到整数分钟
        minuteTime = parseInt(secondTime / 60);
        //获取秒数，秒数取佘，得到整数秒数
        secondTime = parseInt(secondTime % 60);
        //如果分钟大于60，将分钟转换成小时
        if (minuteTime >= 60) {
          //获取小时，获取分钟除以60，得到整数小时
          hourTime = parseInt(minuteTime / 60);
          //获取小时后取佘的分，获取分钟除以60取佘的分
          minuteTime = parseInt(minuteTime % 60);
        }
      }
      hourTime = hourTime < 10 ? String("0" + hourTime) : hourTime;
      minuteTime = minuteTime < 10 ? String("0" + minuteTime) : minuteTime;
      secondTime = secondTime < 10 ? String("0" + secondTime) : secondTime;
      return hourTime + ":" + minuteTime + ":" + secondTime + "." + detail;
    },
    timeMove() {
      const timeMove = document.getElementsByClassName("blueBg")[0];
      if (this.clickmsg == "打出点") {
        // 添加结束时间
        var currentBox = this.cutCoverList[this.cutCoverList.length - 1];
        var start = this.getCountS(currentBox.startTime);
        var end = this.getCountS(
          this.getStartEndTime(
            parseFloat(currentBox.left) + parseFloat(currentBox.width)
          )
        );
        if (end - start < 3) {
          this.$message.error("最短剪辑3秒");
          this.clickmsg = "打入点";
          return;
        }
        currentBox.endTime = this.getStartEndTime(
          parseFloat(currentBox.left) + parseFloat(currentBox.width)
        );

        clearInterval(this.clickIn);
        this.currentRunMsg = "run";
        this.running();
        // this.timeId = setInterval(() => {
        //   this.moveLeft = window.getComputedStyle(timeMove).left;
        //   this.timeCurrentLeft = this.setDetailTime(
        //     parseFloat(
        //       Math.floor(
        //         (this.number / 100) * (timeMove.offsetLeft + 40) * 100
        //       ) / 100
        //     ).toFixed(2)
        //   );
        //   this.coverBoxWidth =parseFloat(this.moveLeft) - parseFloat(this.clickCurrentLeft);
        // }, 10);
      } else if (this.clickmsg == "打入点") {
        // this.bofangFlag = false;
        clearInterval(this.timeId);
        this.currentRunMsg = "clickIn";
        this.running();
        // return;
        var target = this.target;
        this.clickCurrentLeft = window.getComputedStyle(timeMove).left;
        // console.log(this.clickCurrentLeft)
        // 添加覆盖盒子
        this.$set(this.cutCoverList, this.cutCoverList.length, {
          clickFlag: true,
          text: "拆条" + parseInt(parseInt(this.cutCoverList.length) + 1),
          left: parseFloat(this.clickCurrentLeft) + 40 + "px",
          width: "0px",
          startTime: this.getStartEndTime(
            parseFloat(this.clickCurrentLeft) + 40
          ),
        });
        // clearInterval(this.timeId);
      }
    },
    getStartEndTime(leftPX) {
      return this.setDetailTime(
        parseFloat(
          Math.floor((this.number / 100) * leftPX * 100) / 100
        ).toFixed(2)
      );
    },
    // 回到起点
    backTostart() {
      this.stop();
      this.Event.$emit("currentTime", this.timeCurrentLeft);
      const timeMove = document.getElementById("blueBg");
      const scrollpd = document.getElementById("pickeddeng");
      scrollpd.scrollLeft = 0;
      timeMove.style.left = "-40px";
      timeMove.style.transition = "none";
      this.timeCurrentLeft = this.setDetailTime(
        parseFloat(
          Math.floor((this.number / 100) * (timeMove.offsetLeft + 40) * 100) /
            100
        ).toFixed(2)
      );
    },

    //回到尾部
    backToend() {
      this.stop();
      this.Event.$emit("currentTime", this.timeCurrentLeft);
      const timeMove = document.getElementById("blueBg");
      const scrollpd = document.getElementById("pickeddeng");
      if (parseInt(this.imgWidth) > 1400) {
        scrollpd.scrollLeft = parseInt(this.imgWidth) - 1400;
      } else {
        scrollpd.scrollLeft = 0;
      }
      timeMove.style.left = parseFloat(this.imgWidth) - 40 + "px";
      timeMove.style.transition = "none";
      this.timeCurrentLeft = this.setDetailTime(
        parseFloat(
          Math.floor((this.number / 100) * (timeMove.offsetLeft + 40) * 100) /
            100
        ).toFixed(2)
      );
    },
  },
  watch: {
    timeMoveNumber(val, old) {
      this.pickeddeng.scrollLeft = val * 1600;
    },
    videoLong(val, old) {
      this.maxTimeLong = (Math.floor(val / this.number) + 1) * 10;
    },
    maxTimeLong(val, old) {
      this.showCanvas();
    },
    imgWidth(val, old) {
      this.target = parseFloat(val) - 40;
    }
  },
};
</script>
<style lang="less">
.autuSplice {
  .el-dialog {
    > div:nth-of-type(2) {
      text-align: center;
    }
    .el-radio-group {
      margin: 20px 0;
    }
  }
  .round {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-pack: distribute;
    justify-content: left;
    -ms-flex-wrap: nowrap;
    flex-wrap: nowrap;
    line-height: 40px;
    width: 300px;
    margin: 30px auto;
  }
}
footer {
  width: 100%;
  border-top: 2px solid #1d1e22;

  .menu {
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: center;
    background: #1d1e22;
    .controlMenu {
      padding: 5px 10px 5px 0;
      display: flex;
      box-sizing: border-box;
      align-items: center;
      .item {
        &::after {
          content: "";
          display: block;
          width: 1px;
          height: 20px;
          position: absolute;
          top: 5px;
          right: -10px;
          background-color: #ccc;
        }
        &:hover {
          color: #fff;
        }
        span {
          font-size: 20px;
        }
      }
      .contorlBtn {
        margin: 0 0 0 20px;
        display: flex;
        &::after {
          width: 0;
        }
        button {
          color: #fff;
          border: 0;
        }
        button:nth-child(1) {
          background: -webkit-linear-gradient(
            #8164d0,
            #3d67cd
          ); /* Safari 5.1 - 6.0 */
          background: -o-linear-gradient(
            #8164d0,
            #3d67cd
          ); /* Opera 11.1 - 12.0 */
          background: -moz-linear-gradient(
            #8164d0,
            #3d67cd
          ); /* Firefox 3.6 - 15 */
          background: linear-gradient(#8164d0, #3d67cd); /* 标准的语法 */
          &:hover {
            background: -webkit-linear-gradient(
              #967fd7,
              #6282d5
            ); /* Safari 5.1 - 6.0 */
            background: -o-linear-gradient(
              #967fd7,
              #6282d5
            ); /* Opera 11.1 - 12.0 */
            background: -moz-linear-gradient(
              #967fd7,
              #6282d5
            ); /* Firefox 3.6 - 15 */
            background: linear-gradient(#967fd7, #6282d5); /* 标准的语法 */
          }
        }
        button:nth-child(2) {
          background: -webkit-linear-gradient(
            #fa9710,
            #ff5f1e
          ); /* Safari 5.1 - 6.0 */
          background: -o-linear-gradient(
            #fa9710,
            #ff5f1e
          ); /* Opera 11.1 - 12.0 */
          background: -moz-linear-gradient(
            #fa9710,
            #ff5f1e
          ); /* Firefox 3.6 - 15 */
          background: linear-gradient(#fa9710, #ff5f1e); /* 标准的语法 */
          &:hover {
            background: -webkit-linear-gradient(
              #fba83a,
              #ff7d45
            ); /* Safari 5.1 - 6.0 */
            background: -o-linear-gradient(
              #fba83a,
              #ff7d45
            ); /* Opera 11.1 - 12.0 */
            background: -moz-linear-gradient(
              #fba83a,
              #ff7d45
            ); /* Firefox 3.6 - 15 */
            background: linear-gradient(#fba83a, #ff7d45); /* 标准的语法 */
          }
        }
      }
    }
    .videoContorl {
      display: flex;
      color: #8c97b1;
      align-items: center;
      .timeLong {
        display: flex;
        justify-content: space-between;
        height: 30px;
        margin-right: 5px;
        em {
          font-style: normal;
          font-size: 20px;
          line-height: 30px;
          white-space: nowrap;
        }
        span {
          width: 100px;
          font-size: 20px;
          line-height: 30px;
          border: 1px solid #515257;
          border-radius: 10px;
          text-align: center;
        }
      }
      i {
        font-size: 20px;
        cursor: pointer;
        margin: 0 15px;
        &:hover {
          color: #f25915;
        }
      }
    }
    .rule {
      display: flex;
      box-sizing: border-box;
      align-items: center;
      width: 60%;
      max-width: 300px;
      .slider {
        width: 100%;
      }
      > span {
        height: 30px;
        margin-right: 20px;
        position: relative;
        font-size: 20px;
        color: #707070;
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        &:hover {
          color: #fff;
        }
        span {
          font-size: 20px;
        }
      }
    }
  }
  .controlLine {
    position: relative;
    width: 100%;
    .signshowImg {
      width: 150px;
      height: 100px;
      background: #fff;
      position: absolute;
      top: -121px;
      z-index: 30;
      text-align: center;
      padding: 10px;
      transform: translateX(-50%);
      .text {
        font-size: 13px;
        color: #666;
      }
      > img {
        height: 80px;
        width: 100%;
      }
      .signDetail {
        width: 15px;
        height: 15px;
        color: #fff;
        background-color: #e92322;
        position: absolute;
        right: 10px;
        top: 10px;
        font-size: 13px;
        text-align: center;
        line-height: 15px;
        cursor: pointer;
      }
      .signClose {
        width: 15px;
        height: 15px;
        color: #fff;
        background-color: #e92322;
        position: absolute;
        right: 10px;
        top: 26px;
        font-size: 13px;
        text-align: center;
        line-height: 15px;
        cursor: pointer;
      }
    }
    .dyc {
      position: relative;
      overflow: auto;
      background: #1d1e22;
      &::-webkit-scrollbar {
        height: 10px;
      }
      /*滚动条滑块*/
      &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
        background: #535353;
        width: 30px;
      }
      /*滚动条轨道*/
      &::-webkit-scrollbar-track {
        box-shadow: inset 0 0 1px rgba(0, 0, 0, 0);
        border-radius: 10px;
        background: #ccc;
      }
      .canFa {
        position: relative;
        .signcircle {
          width: 8px;
          height: 8px;
          background: orange;
          border-radius: 50%;
          position: absolute;
          top: 60px;
          cursor: pointer;
        }
        // overflow: hidden;
      }
      .imgbackground {
        left: 20px;
        height: 30px;
        background-repeat: repeat !important;
        background-size: contain !important;
        background: url("../assets/demo.jpg");
        position: relative;
        // .coverlistActive {
        //   // border-left: 3px solid #
        // }
        .coverlist {
          background: rgba(23, 149, 255, 0.3);
          position: absolute;
          top: 0;
          height: 100px;
          display: flex;
          flex-wrap: nowrap;
          box-sizing: border-box;
          overflow: hidden;
          border: 1px solid;
          &:hover {
            border: 1px solid #ccc;
          }
          .dragLeft {
            width: 16px;
            height: 100px;
            line-height: 100px;
            color: #fff;
            font-size: 14px;
            position: absolute;
            left: 0px;
            cursor: e-resize;
            text-align: center;
          }
          .dragRight {
            text-align: center;
            width: 16px;
            height: 100px;
            line-height: 100px;
            color: #fff;
            font-size: 14px;
            position: absolute;
            right: 0px;
            cursor: w-resize;
          }

          > div {
            > div {
              font-size: 13px;
              color: #fff;
              cursor: pointer;
              width: 60px;
              margin: auto;
            }
            width: 100%;
            height: 100%;
            margin: 0 auto 0;
            padding: 20px;
            box-sizing: border-box;
            text-align: center;
            // line-height: 50px;
            // display: flex;
            // flex-wrap: nowrap;
            // justify-content: center;
            overflow: hidden;
            span {
              color: #fff;
              font-size: 14px;
              cursor: pointer;
            }
          }
        }
      }
    }
    .blueBg {
      position: absolute;
      // height: 40px;
      cursor: move;
      box-sizing: content-box;
      text-align: center;
      line-height: 30px;
      width: 104px;
      padding: 0px 10px;
      border-radius: 5px;
      top: 0;
      left: -32px;
      background: rgba(23, 149, 255);
      color: #fff;
    }
    .turnDowm {
      position: absolute;
      width: 0;
      height: 0;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-style: solid;
      border-width: 10px 5px 0 5px;
      border-color: #007bff transparent transparent transparent;
    }
    .block {
      width: 150px;
      margin: auto;
    }
  }
}
.audio-text-loading {
  .el-loading-spinner {
    top: 10%;
    height: 95%;
    overflow: auto;
  }
}
.file {
  position: relative;
  display: inline-block;
  background: #409eff;
  border-radius: 2px;
  padding: 4px 16px;
  color: #fff;
  font-size: 14px;
}
.file input {
  position: absolute;
  font-size: 0.8rem;
  right: 0;
  top: 0;
  opacity: 0;
  cursor: pointer;
}
.file:hover {
  background: #68b1fb;
  color: #fff;
  text-decoration: none;
}
</style>
