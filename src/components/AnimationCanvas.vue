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
      >
        <div class="name-box">
          {{ sayList[0].title }}
        </div>
        <div
          class="calibration"
          v-for="num in animationTimeArr"
          :key="num"
          :style="{
            left: num * 10 + 'px',
            height: num % 5 === 0 && num !== 0 ? '8px' : '5px',
          }"
        >
          {{ num % 5 === 0 && num !== 0 ? num : "" }}
        </div>
        <div
          class="box"
          v-for="obj in sayList"
          :key="obj.end"
          :style="{
            width: (obj.end - obj.start) * 10 + 'px',
            left: obj.start * 10 + 'px',
          }"
        />
      </div>
    </div>
  </div>
</template>
<script>
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
      },
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
      this.timeLinesWidth = 10 * canvasSetting.animationTime + "px";
    } catch (error) {}
  },
  methods: {
    resetCanvasSetting() {
      this.timeLinesWidth = 10 * this.animationTime + "px";
      const peopleList = _.map(
        this.audioSettings[0]?.peopleDictList || [],
        (arr) => {
          let sayList = [];
          _.filter(this.customAudioTextTimes, (item) => {
            if (item.title === arr[1]) {
              sayList.push({
                ...item,
                title: arr[1],
              });
            }
          });
          return sayList;
        }
      );
      const canvasSetting = {
        peopleList,
        animationTime: this.animationTime,
      };
      this.canvasSetting = canvasSetting;
      localStorage.setItem("canvasSetting", JSON.stringify(canvasSetting));
    },
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
  overflow: auto;
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
  .box {
    position: absolute;
    top: 1px;
    height: 38px;
  }
  .box::before {
    position: absolute;
    content: " ";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border: 1px solid #f45;
    box-shadow: inset 1px 2px 12px #f45;
    z-index: 11;
    border-radius: 2px;
  }
}
</style>
