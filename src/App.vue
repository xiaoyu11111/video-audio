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
    // this.renderResize();
    // setTimeout(function () {
    //   var x = document.body.scrollWidth; //获取页面最大宽度
    //   document.body.scrollTo(x, 0);
    // }, 100);
    // window.addEventListener("resize", this.renderResize, false);
  },
  destroyed() {
    // window.removeEventListener("resize", this.renderResize, false);
  },
  methods: {
    renderResize() {
      var width = document.documentElement.clientWidth;
      var height = document.documentElement.clientHeight;
      this.isLandscape = width <= height;
      if (width > height) {
        document.body.style.width = width - 30 + "px";
        document.body.style.height = height + "px";
        document.body.style.position = "absolute";
        document.body.style.top = "0px";
        document.body.style.left = "0px";
        document.body.style.transform = "none";
      }
      if (width <= height) {
        document.body.style.width = height - 50 + "px";
        document.body.style.height = width - 20 + "px";
        document.body.style.position = "absolute";
        document.body.style.top = (height - width) / 2 + "px";
        document.body.style.left = 0 - (height - width) / 2 + 20 + "px";
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
html {
  overflow: auto;
}
body {
  overflow: auto;
  background-color: aliceblue;
  padding: 15px 15px;
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
