<template>
  <div id="#app">
    <!-- 视频显示 -->
    <!-- <videoView></videoView> -->

    <!-- 控制 -->
    <videoControl></videoControl>
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
  created() {
    this.renderResize();
    window.addEventListener("resize", this.renderResize, false);
  },
  destroyed() {
    window.removeEventListener("resize", this.renderResize, false);
  },
  methods: {
    renderResize() {
      var width = document.documentElement.clientWidth;
      var height = document.documentElement.clientHeight;
      if (width > height) {
        document.body.style.width = width + "px";
        document.body.style.height = height + "px";
        document.body.style.position = "absolute";
        document.body.style.top = "0px";
        document.body.style.left = "0px";
        document.body.style.transform = "none";
      }
      if (width <= height) {
        document.body.style.width = height + "px";
        document.body.style.height = width + "px";
        document.body.style.position = "absolute";
        document.body.style.top = (height - width) / 2 + "px";
        document.body.style.left = 0 - (height - width) / 2 + "px";
        document.body.style.transform = "rotate(90deg)";
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
  background-color: aliceblue;
  padding: 0 8px;
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
