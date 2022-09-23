<template>
  <div id="#app">
    <!-- 视频显示 -->
    <!-- <videoView></videoView> -->

    <!-- 控制 -->
    <videoControl :isLandscape="isLandscape"></videoControl>
  </div>
</template>
<script>
import videoView from "./components/VideoView";
import videoControl from "./components/VideoControl";
import "./common/speech-sdk";
export default {
  components: {
    videoView,
    videoControl,
  },
  data() {
    return {
      isLandscape: false,
    };
  },
  created() {
    const _this = this;
    document.addEventListener("DOMContentLoaded", function () {
      _this.renderResize();
    });
    window.addEventListener("resize", this.renderResize, false);
  },
  destroyed() {
    window.removeEventListener("resize", this.renderResize, false);
  },
  methods: {
    renderResize() {
      var width = document.documentElement.clientWidth;
      var height = document.documentElement.clientHeight;
      this.isLandscape = width <= height;
      var dom = document.getElementById("#app");
      if (width > height) {
        dom.style.width = width + "px";
        dom.style.height = height + "px";
        dom.style.position = "absolute";
        dom.style.top = "0px";
        dom.style.left = "0px";
        dom.style.transform = "none";
      }
      if (width <= height) {
        dom.style.width = height - 40 + "px";
        dom.style.height = width + "px";
        dom.style.position = "absolute";
        dom.style.top = (height - width) / 2 + "px";
        dom.style.left = 0 - (height - width) / 2 + 30 + "px";
        dom.style.transform = "rotate(90deg)";
      }
    },
  },
};
</script>
<style lang="less">
* {
  margin: 0;
  padding: 0;
}
body {
  overflow: auto;
  background-color: aliceblue;
  padding: 0 15px;
}
textarea {
  width: calc(100% - 16px);
  padding: 8px;
  border: none;
}
.el-message-box {
  width: 100% !important;
}
</style>
