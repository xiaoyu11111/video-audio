<template>
  <div>
    <div class="file">
      <input type="file" name="file"  @change="handleChange"
        accept=".mp4, .m4v, .3gp, .mpg, .flv, .f4v, .swf, .avi, .gif, .wmv, .rmvb, .mov, .mts, .m2t, .webm, .ogg, .mkv, .mp3, .mp2, .mp1, .wav, .aif, .aiff, .au, .ra, .rm, .ram, .mid, .rmi"
      >上传音视频文件</input>
    </div>
    <div class="tools-btn">
      <audioFormat :uploadfile="uploadfile" :sliceTimesArr="sliceTimesArr"/>
    </div>
    <div class="tools-btn">
      <el-button @click="playWave()" >播放/暂停</el-button>
      <span class="mgx10">总时长: {{this.animationTime}}s</span>
      <span>当前时间: {{this.curPlayingTime}}s</span>
      <el-row >
        <el-col :span="isMobile ? 6 : 3">播放速度:</el-col>
        <el-col :span="18"><el-input-number :precision="1" :step="0.1" :min="0" :max='2' v-model="audioRate" @change="changAudioRate"></el-input-number></el-col>
      </el-row>
      <el-row >
        <el-col :span="isMobile ? 6 : 3">时间进度:</el-col>
        <el-col :span="18">
          <el-slider
            v-model="sliderValue"
            :step="1"
            @change="stepChange"
          ></el-slider>
        </el-col>
      </el-row>
    </div>
    <div id="waveform"></div>
    <div id="wave-timeline"></div>
    <div class="tools-btn">
      <el-button @click="getAudioText()">语音转文字</el-button>
    </div>
    <el-input v-if="audioText" type="textarea" :autosize="{ minRows: 6, maxRows: 10}" v-model="audioText" disabled />
    <div class="tools-btn">
      输入语音对应的文字(行数：{{textLines}})
    </div>
    <el-input type="textarea" :autosize="{ minRows: 6, maxRows: 10}" v-model="customAudioText" placeholder="输入语音对应的文字"/>
    <div class="tools-btn">
      自动文字对应的时间(行数：{{peopleTimeArr.length}})
    </div>
    <el-input type="textarea" :autosize="{ minRows: 6, maxRows: 10}" v-model="customAudioTextTime" placeholder="自动文字对应的时间"/>
    <div class="tools-btn">
      生成动画脚本
    </div>
    <animationFlash :animationTime="animationTime1" :isMobile="isMobile" :customAudioTextTimes="customAudioTextTimes"/>
  </div>
</template>
<script>
import WaveSurfer from "wavesurfer.js";
import Timeline from "wavesurfer.js/dist/plugin/wavesurfer.timeline.js";
import Regions from "wavesurfer.js/dist/plugin/wavesurfer.regions.js";
import _ from "lodash";
import videoView from "./VideoView";
import audioFormat from "./AudioFormat";
import animationFlash from "./AnimationFlash";
export default {
  components: {
    videoView,
    audioFormat,
    animationFlash,
  },
  props: ["isLandscape"],
  data() {
    return {
      sliderValue: 0,
      isMobile: false,
      textArr: [], // 语音转文字数组
      uploadfile: null, // 上传的文件
      animationTime: 0, // 动画时长
      animationTime1: 0,
      wavesurfer: null,
      curPlayingTime: 0,
      audioRate: 1,
      customAudioText: "",
      textLines: 0, // 行数
      peopleTimeArr: [],
      customAudioTextTimes: [],
      sliceTimesArr: [],
    };
  },
  computed: {
    customAudioTextTime() {
      localStorage.setItem("customAudioText", this.customAudioText);
      const data = this.customAudioText
        .replace(/：/gi, ":")
        .split("\n")
        .filter((item) => item);
      this.textLines = data.length;
      const list = _.map(this.peopleTimeArr, (arr, i) => {
        const title = _.includes(data[i], ":")
          ? data[i]?.split(":")?.[0]?.trim()
          : "旁白";
        return {
          title,
          start: arr[0],
          end: arr[1],
        };
      });
      this.customAudioTextTimes = list;
      return JSON.stringify(list);
    },
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
      const textArr1 = localStorage.getItem("textArr");
      if (!textArr1) {
        textArr = [];
      } else {
        textArr = JSON.parse(textArr1);
      }
    } catch (error) {}
    this.textArr = textArr;
    this.customAudioText = localStorage.getItem("customAudioText") || "";
    this.isMobile =
      navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      ) !== null;
  },
  mounted() {
    var wavesurfer = WaveSurfer.create({
      mediaType: "video",
      backgroundColor: "rgb(105,160,174, 0.1)",
      container: "#waveform",
      waveColor: "violet",
      barWidth: 2,
      responsive: true,
      scrollParent: true,
      progressColor: "purple",
      plugins: [
        Timeline.create({
          container: "#wave-timeline",
          primaryColor: "blue",
          secondaryColor: "red",
          primaryFontColor: "blue",
          secondaryFontColor: "red",
        }),
        Regions.create({}),
      ],
    });
    this.wavesurfer = wavesurfer;
    let fileUrl = this.getParaByName("url");
    if (!fileUrl) return;
    fileUrl = "https://vkceyugu.cdn.bspapp.com" + decodeURIComponent(fileUrl);
    wavesurfer.load(fileUrl);
    const _this = this;
    wavesurfer.on("ready", function () {
      _this.animationTime = wavesurfer.getDuration().toFixed(2);
      const canvasBarArr = _this.getCanvasBars(wavesurfer);
      const allTime = wavesurfer.getDuration();
      _this.getTextTime(canvasBarArr, allTime);
    });
    wavesurfer.on("audioprocess", function () {
      _this.curPlayingTime = wavesurfer.getCurrentTime().toFixed(2);
    });
    wavesurfer.on("seek", function () {
      _this.curPlayingTime = wavesurfer.getCurrentTime().toFixed(2);
    });
  },
  methods: {
    getTextTime(canvasBarArr, allTime) {
      canvasBarArr = _.map(canvasBarArr, (item) => (item > 0 ? 1 : 0));
      const oneBarTime = allTime / canvasBarArr.length;
      const oneSecondBar = canvasBarArr.length / allTime;
      let data = _.filter(
        canvasBarArr
          .join()
          .split(
            "," +
              new Array(Math.floor(oneSecondBar * 2)).fill(0).join(",") +
              ","
          ),
        (item) => item
      );
      let preLength = 0;
      let sliceTimesArr = [0];
      _.compact(
        _.map(data, (str, i) => {
          preLength +=
            str.split(",").length +
            (i === 0 ? 0 : Math.floor(oneSecondBar * 2));
          if (i === data.length - 1) {
            return null;
          }
          sliceTimesArr.push(
            ...[
              preLength * oneBarTime,
              preLength * oneBarTime +
                Math.floor(oneSecondBar * 2) * oneBarTime,
            ]
          );
        })
      );
      sliceTimesArr.push(this.animationTime);
      this.sliceTimesArr = _.chunk(sliceTimesArr, 2);
      let preTime = 0;
      const peopleTimeArr = _.map(data, (str, index) => {
        let firstTime = false;
        let timeArr = [];
        str.split(",").map((num, i) => {
          if (!firstTime) {
            firstTime = !!num;
            if (firstTime) {
              timeArr[0] = oneBarTime * (i + 1) + preTime;
            }
          }
        });
        timeArr[1] = oneBarTime * str.split(",").length + preTime;
        preTime = timeArr[1];
        return timeArr;
      });
      this.peopleTimeArr = peopleTimeArr;
      if (_.last(peopleTimeArr)?.[1]) {
        this.animationTime1 = _.last(peopleTimeArr)?.[1];
      }
    },
    getCanvasBars(wavesurfer) {
      var nominalWidth = Math.round(
        wavesurfer.getDuration() *
          wavesurfer.params.minPxPerSec *
          wavesurfer.params.pixelRatio
      );
      var parentWidth = wavesurfer.drawer.getWidth();
      var width = nominalWidth; // always start at 0 after zooming for scrolling : issue redraw left part

      var start = 0;
      var end = Math.max(start + parentWidth, width); // Fill container
      if (
        wavesurfer.params.fillParent &&
        (!wavesurfer.params.scrollParent || nominalWidth < parentWidth)
      ) {
        width = parentWidth;
        start = 0;
        end = width;
      }
      var peaks = wavesurfer.backend.getPeaks(width, start, end);
      var absmax = 1;
      var hasMinVals = true;
      var halfH = 192;
      var peakIndexScale = hasMinVals ? 2 : 1;
      var length = peaks.length / peakIndexScale;
      var bar = wavesurfer.params.barWidth * wavesurfer.params.pixelRatio;
      var gap =
        wavesurfer.params.barGap === null
          ? Math.max(wavesurfer.params.pixelRatio, bar / 2)
          : Math.max(
              wavesurfer.params.pixelRatio,
              wavesurfer.params.barGap * wavesurfer.params.pixelRatio
            );
      var step = bar + gap;
      var scale = length / width;
      var first = start;
      var last = end;
      var peakIndex = first;
      var arr = [];
      for (peakIndex; peakIndex < last; peakIndex += step) {
        // search for the highest peak in the range wavesurfer bar falls into
        var peak = 0;
        var peakIndexRange = Math.floor(peakIndex * scale) * peakIndexScale; // start index
        var peakIndexEnd =
          Math.floor((peakIndex + step) * scale) * peakIndexScale;
        do {
          // do..while makes sure at least one peak is always evaluated
          var newPeak = Math.abs(peaks[peakIndexRange]); // for arrays starting with negative values
          if (newPeak > peak) {
            peak = newPeak; // higher
          }
          peakIndexRange += peakIndexScale; // skip every other value for negatives
        } while (peakIndexRange < peakIndexEnd); // calculate the height of wavesurfer bar according to the highest peak found
        var h = Math.round((peak / absmax) * halfH);
        arr.push(h);
      }
      return arr;
    },
    changAudioRate(value) {
      this.wavesurfer.setPlaybackRate(value);
    },
    stepChange(value) {
      this.wavesurfer.seekAndCenter(value / 100);
    },
    playWave() {
      this.wavesurfer.playPause();
    },
    getParaByName(name) {
      var search = window.location.search;
      search = search.substr(1);
      if (typeof name === "undefined") return search;
      var searchArr = search.split("&");
      for (var i = 0; i < searchArr.length; i++) {
        var searchStr = searchArr[i];
        searchArr[i] = searchStr.split("=");
        if (searchArr[i][0] == name) {
          return searchStr.replace(name + "=", "");
        }
      }
      return "";
    },
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
      this.uploadfile = e.target.files;
      // this.uploadfile = e.target.files[0];
      this.wavesurfer.loadBlob(e.target.files[0]);
      const _this = this;
      this.wavesurfer.on("ready", function () {
        _this.animationTime = wavesurfer.getDuration().toFixed(2);
      });
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
        t += (e.result.text || "") + "\n";
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
        localStorage.setItem("textArr", JSON.stringify(textArr));
        recognizer.stopContinuousRecognitionAsync();
      };

      recognizer.startContinuousRecognitionAsync();
    },
  },
  watch: {},
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
        height: 15px;
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
  padding: 11px 16px;
  color: #fff;
  font-size: 14px;
}
.file input {
  position: absolute;
  font-size: 0.8rem;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.file:hover {
  background: #68b1fb;
  color: #fff;
  text-decoration: none;
}
.tools-btn {
  margin: 5px 0;
}
.mgx10 {
  margin: 0 10px;
}
</style>
