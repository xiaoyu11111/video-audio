<template>
  <div>
    <el-input v-model="commandText" placeholder="请输入命令" id="input">
      <el-button slot="append" type="primary" id="run">执行命令</el-button>
    </el-input>
    <el-input type="textarea" :rows="2" placeholder="请输入内容" id="output">
    </el-input>
    <el-button
      id="files"
      class="download-files"
      :style="{ display: showDownload ? 'block' : 'none' }"
    />
  </div>
</template>
<script>
export default {
  props: ["uploadfile"],
  data() {
    return {
      showDownload: false,
      commandText: "-i /input/input.mp3 -ab 48k -ar 8000 -ac 1 output.wav",
    };
  },
  watch: {
    uploadfile(val, old) {
      const _this = this;
      if (val) {
        this.commandText = `-i /input/${val[0].name} -ab 48k -ar 8000 -ac 1 output.wav`;
        _this.sampleVideoData = val;
      }
      // this.fileToArrayBuffer(val).then(arrayBuffer => {
      //   // _this.sampleVideoData = new Uint8Array(arrayBuffer)
      //   _this.sampleVideoData = new Uint8Array(arrayBuffer)
      // })
    },
  },
  mounted() {
    var worker;
    var sampleImageData;
    var outputElement;
    var filesElement;
    var running = false;
    var isWorkerLoaded = false;
    const _this = this;
    var loading = _this.$loading({
      lock: true,
      text: "准备中",
      spinner: "el-icon-loading",
      background: "rgba(0, 0, 0, 0.7)",
    });
    function isReady() {
      return !running && isWorkerLoaded && _this.sampleVideoData;
    }

    function startRunning() {
      loading = _this.$loading({
        lock: true,
        text: "执行中",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
      });
      outputElement.className = "";
      filesElement.innerHTML = "";
      running = true;
    }
    function stopRunning() {
      loading.close();
      running = false;
    }

    function retrieveSampleImage() {
      var oReq = new XMLHttpRequest();
      oReq.open("GET", "bigbuckbunny.jpg", true);
      oReq.responseType = "arraybuffer";

      oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response;
        if (arrayBuffer) {
          sampleImageData = new Uint8Array(arrayBuffer);
        }
      };

      oReq.send(null);
    }

    function parseArguments(text) {
      text = text.replace(/\s+/g, " ");
      var args = [];
      // Allow double quotes to not split args.
      text.split('"').forEach(function (t, i) {
        t = t.trim();
        if (i % 2 === 1) {
          args.push(t);
        } else {
          args = args.concat(t.split(" "));
        }
      });
      return args;
    }

    function runCommand(text) {
      if (isReady()) {
        startRunning();
        var args = parseArguments(text);
        console.log(args);
        worker.postMessage({
          type: "command",
          arguments: args,
          files: _this.sampleVideoData,
          // files: [
          //   // {
          //   //   "name": "input.jpeg",
          //   //   "data": sampleImageData
          //   // },
          //   {
          //     name: "input.mp3",
          //     data: _this.sampleVideoData,
          //   },
          // ],
        });
      }
    }

    function getDownloadLink(fileData, fileName) {
      if (fileName.match(/\.jpeg|\.gif|\.jpg|\.png/)) {
        var blob = new Blob([fileData]);
        var src = window.URL.createObjectURL(blob);
        var img = document.createElement("img");

        img.src = src;
        _this.showDownload = true;
        return img;
      } else {
        var a = document.createElement("a");
        a.download = fileName;
        var blob = new Blob([fileData]);
        var src = window.URL.createObjectURL(blob);
        a.href = src;
        a.id = "download-url";
        a.textContent = "点击下载文件 " + fileName + "!";
        _this.showDownload = true;
        return a;
      }
    }

    function initWorker() {
      worker = new Worker("worker-asm.js");
      worker.onmessage = function (event) {
        var message = event.data;
        if (message.type == "ready") {
          isWorkerLoaded = true;
          worker.postMessage({
            type: "command",
            arguments: ["-help"],
          });
        } else if (message.type == "stdout") {
          outputElement.textContent += message.data + "\n";
        } else if (message.type == "start") {
          outputElement.textContent = "Worker has received command\n";
        } else if (message.type == "done") {
          stopRunning();
          var buffers = message.data;
          if (buffers.length) {
            outputElement.className = "closed";
          }
          buffers.forEach(function (file) {
            filesElement.appendChild(getDownloadLink(file.data, file.name));
          });
        }
      };
    }

    function getParaByName(name) {
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
    }

    document.addEventListener("DOMContentLoaded", function () {
      initWorker();
      let fileUrl = getParaByName("url");
      if (fileUrl) {
        fileUrl =
          "https://vkceyugu.cdn.bspapp.com" + decodeURIComponent(fileUrl);
        _this.retrieveSampleVideo(fileUrl);
      }
      // retrieveSampleImage();
      var inputElement = document.querySelector("#input");
      outputElement = document.querySelector("#output");
      filesElement = document.querySelector("#files");
      document.querySelector("#run").addEventListener("click", function () {
        runCommand(inputElement.value);
      });
    });
  },
  methods: {
    fileToArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.onerror = () => {
          reject();
        };
        reader.readAsArrayBuffer(file);
      });
    },
    retrieveSampleVideo(fileUrl) {
      const _this = this;
      var oReq = new XMLHttpRequest();
      oReq.open("GET", fileUrl, true);
      oReq.responseType = "arraybuffer";

      oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response;
        if (arrayBuffer) {
          // _this.sampleVideoData = new Uint8Array(arrayBuffer);
          _this.sampleVideoData = [new File([arrayBuffer], "input.mp3")];
        }
      };

      oReq.send(null);
    },
  },
};
</script>
<style lang="less">
.download-files {
  width: 100%;
}
</style>
