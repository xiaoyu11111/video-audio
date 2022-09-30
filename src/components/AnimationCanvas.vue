<template>
  <div>
    <div class="common-title">
      画布<el-button @click="resetCanvasSetting">重新生成</el-button>
    </div>
    <div class="canvas-container" id="canvas-container" :style="{ height }">
      <div class="canvas" id="canvas" :style="{ height: canvasHeight }"></div>
    </div>
    <div class="time-lines" id="canvas">
      <div
        class="canvas-lines"
        :style="{ width: timeLinesWidth }"
        v-for="(sayList, index) in canvasSetting.peopleList"
        :key="index"
        @mousedown="goToLocation"
      >
        <div class="name-box">
          {{ sayList[0].title }}
        </div>
        <div
          class="sign-box"
          v-if="index === 0"
          :style="{ left: blueBgFlagLeft + 'px' }"
          @mousedown="blueBgDown"
          @touchstart="blueBgDown"
          @mousemove="blueBgMove"
          @touchmove="blueBgMove"
          @mouseup="blueBgUp"
        >
          {{(blueBgFlagLeft/20).toFixed(2)}}
          <div class="sign-box-content" />
        </div>
        <div
          class="calibration"
          v-for="num in animationTimeArr"
          :key="num + 'calibration'"
          :style="{
            left: num * 20 + 'px',
            height: num % 5 === 0 && num !== 0 ? '8px' : '5px',
          }"
        >
          {{ num % 5 === 0 && num !== 0 ? num : "" }}
        </div>
        <div
          v-for="obj in sayList"
          :class="obj.action === 'other' ? 'green-box' : 'red-box'"
          :key="obj.end + 'box'"
          :style="{
            width: (obj.end - obj.start) * 20 + 'px',
            left: obj.start * 20 + 'px',
          }"
        />
      </div>
    </div>
  </div>
</template>
<script>
import _ from "lodash";
export default {
  props: [
    "animationTime",
    "isMobile",
    "customAudioTextTimes",
    "changjings",
    "audioSettings",
  ],
  data() {
    return {
      height: "0px",
      canvasHeight: "0px",
      timeLinesWidth: "0px",
      canvasSetting: {
        peopleList: [],
        animationTime: 0,
        changjings: [],
      },
      blueBgFlagLeft: 0,
    };
  },
  computed: {
    animationTimeArr() {
      return _.range(Math.ceil(this.canvasSetting.animationTime));
    },
  },
  mounted() {
    this.height =
      (document.getElementById("canvas-container").offsetWidth * 9) / 16 + "px";
    this.canvasHeight =
      (document.getElementById("canvas").offsetWidth * 9) / 16 + "px";
    try {
      let canvasSetting = JSON.parse(localStorage.getItem("canvasSetting"));
      this.canvasSetting = canvasSetting;
      this.timeLinesWidth = 20 * canvasSetting.animationTime + "px";
    } catch (error) {}
  },
  methods: {
    resetCanvasSetting() {
      this.timeLinesWidth = 20 * this.animationTime + "px";
      const peopleList = _.map(
        this.audioSettings[0]?.peopleDictList || [],
        (arr) => {
          let sayList = [];
          _.filter(this.customAudioTextTimes, (item) => {
            if (item.title === arr[1]) {
              sayList.push({
                ...item,
                action: "say",
                title: arr[0] + "(" + arr[1] + ")",
              });
            }
          });
          this.changjings.map((item, i) => {
            _.map(item.people, (p, index) => {
              if (p[0] === arr[0]) {
                sayList.push({
                  action: "other",
                  start:
                    item.startTime > (item.peopleTimes[index] || 0)
                      ? item.startTime
                      : (item.peopleTimes[index] || 0),
                  end: this.changjings[i + 1]?.startTime || this.animationTime,
                  title: arr[0],
                });
              }
            });
          });
          return sayList;
        }
      );
      const canvasSetting = {
        peopleList,
        animationTime: this.animationTime,
        changjings: this.changjings,
      };
      this.canvasSetting = canvasSetting;
      localStorage.setItem("canvasSetting", JSON.stringify(canvasSetting));
    },
    //时间进度条移动
    blueBgDown(e) {
      e.stopPropagation()
      this.blueBgFlag = true;
      this.nInitX = e.clientX || e.targetTouches[0].clientX
      this.nInitLeft = e.target.offsetLeft;
    },
    blueBgMove(e) {
      e.stopPropagation()
      e.preventDefault();
      if (!this.blueBgFlag) {
        return;
      }
      let nX = (e.clientX || e.targetTouches[0].clientX) - this.nInitX + this.nInitLeft;
      if (nX <= 0) {
        nX = 0
      }
      this.blueBgFlagLeft = nX;
    },
    blueBgUp(e) {
      e.stopPropagation()
      this.blueBgFlag = false;
    },
    goToLocation(e) {
      e.stopPropagation()
      e.preventDefault();
      const dom = document.getElementsByClassName("time-lines")[0]
      let nX = dom.scrollLeft + e.clientX-15
      if (nX <= 0) {
        nX = 0
      }
      this.blueBgFlagLeft = nX;
    }
  },
};
</script>
<style lang="less">
.canvas-container {
  max-width: 500px;
  margin: 10px 0;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #d5e4d785;
  border: 1px solid #8aa6f1;
  border-radius: 2px;
  .canvas {
    width: 70%;
    border: 1px solid #ccc;
    background-color: #d5e4d785;
    border: 1px solid #8aa6f1;
    border-radius: 2px;
  }
}
.time-lines {
  user-select: none;
  overflow: auto;
  padding: 40px 0 0 0px;
}
.canvas-lines {
  position: relative;
  line-height: 40px;
  height: 40px;
  margin-bottom: 16px;
  background-color: #d5e4d785;
  border: 1px solid rgb(138, 166, 241);
  box-shadow: inset 1px 2px 12px rgb(138, 166, 241);
  border-radius: 2px;
  .name-box {
    position: absolute;
    top: 1px;
    height: 38px;
  }
  .calibration {
    position: absolute;
    bottom: 0px;
    height: 5px;
    width: 1px;
    font-size: 12px;
    line-height: 29px;
    background-color: black;
  }
  .sign-box {
    position: absolute;
    left: 0;
    top: -30px;
    width: 80px;
    height: 30px;
    background-color: #8aa6f1;
    cursor: pointer;
    border-radius: 5px;
    z-index: 100;
    text-align: center;
    line-height: 30px;
    .sign-box-content {
      border-left: 1px dashed red;
      height: 70px;
      width: 0px;
      position: absolute;
      top: 4px;
    }
  }
  .red-box,
  .green-box {
    position: absolute;
    top: 1px;
    height: 38px;
  }
  .green-box::before,
  .red-box::before {
    position: absolute;
    content: " ";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border: 2px solid #f45;
    box-shadow: inset 1px 2px 12px #f45;
    z-index: 11;
    border-radius: 2px;
  }
  .green-box::before {
    border: 2px solid rgb(101, 240, 147);
    box-shadow: inset 1px 2px 12px rgb(101, 240, 147);
  }
}
</style>
