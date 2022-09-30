<template>
  <div>
    <div class="common-title">
      画布<el-button @click="resetCanvasSetting">重新生成</el-button>
    </div>
    <div class="canvas-container" id="canvas-container" :style="{ height }">
      <div class="canvas" id="canvas" :style="{ height: canvasHeight }"></div>
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
      canvasSetting: [],
    };
  },
  mounted() {
    this.height =
      (document.getElementById("canvas-container").offsetWidth * 9) / 16 + "px";
    this.canvasHeight =
      (document.getElementById("canvas").offsetWidth * 9) / 16 + "px";
    try {
      let canvasSetting = localStorage.getItem("canvasSetting");
      this.canvasSetting = JSON.parse(canvasSetting);
    } catch (error) {}
  },
  methods: {
    resetCanvasSetting() {
      console.log(
        _.map(this.audioSettings[0]?.peopleDictList || [], (arr) => {
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
        }),
        "=================="
      );
      this.canvasSetting = _.map(
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
  .canvas {
    width: 70%;
    border: 1px solid #ccc;
  }
}
</style>
