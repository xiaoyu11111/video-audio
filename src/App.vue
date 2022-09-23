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
