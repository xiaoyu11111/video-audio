<template>
  <div>
    <el-tag @click="runCommand(1)" :color="active == 1 ? '#c5d8ed' : '#d9ecff'"
      >转码为wav</el-tag
    >
    <el-tag @click="runCommand(2)" :color="active == 2 ? '#c5d8ed' : '#d9ecff'"
      >裁剪掉静音</el-tag
    >
    <el-tag @click="runCommand(3)" :color="active == 3 ? '#c5d8ed' : '#d9ecff'"
      >普通裁剪</el-tag
    >
    <el-tag @click="runCommand(4)" :color="active == 4 ? '#c5d8ed' : '#d9ecff'"
      >智能裁剪</el-tag
    >
    <el-tag @click="runCommand(5)" :color="active == 4 ? '#c5d8ed' : '#d9ecff'"
      >音频合并</el-tag
    >
    <el-input v-model="commandText" placeholder="请输入命令" id="input">
      <el-button slot="append" type="primary" id="run">执行命令</el-button>
    </el-input>
    <el-input type="textarea" :rows="5" v-if="active === 5" v-model="audioUrlText" placeholder="请输入音频链接" id="audioUrl"></el-input>
    <el-input type="textarea" :rows="2" placeholder="命令执行详情" disabled id="output">
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
  props: ["uploadfile", "sliceTimesArr"],
  data() {
    return {
      active: 1,
      showDownload: false,
      inputFileName: "/input/input.mp3",
      audioUrlText: '',
      commandText: `-i "/input/input.mp3" -ab 48k -ar 8000 -ac 1 output.wav`,
    };
  },
  watch: {
    uploadfile(val, old) {
      const _this = this;
      if (val) {
        this.inputFileName = `/input/${val[0].name}`;
        this.commandText = `-i "/input/${val[0].name}" -ab 48k -ar 8000 -ac 1 output.wav`;
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
    var loading = null
    // var loading = _this.$loading({
    //   lock: true,
    //   text: "准备中",
    //   spinner: "el-icon-loading",
    //   background: "rgba(0, 0, 0, 0.7)",
    // });
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

    async function runCommand(text) {
      if (isReady()) {
        startRunning();
        var args = parseArguments(text);
        if (_this.active === 5) {
          const fileList = _this.audioUrlText.replace(/['"’‘“”]/gi,'').split(';')
          text = ''
          fileList.map((item,i) => {
            text += `-i "/input/input${i}.mp3" `
          })
          text += `-filter_complex "[0:0][1:0] concat=n=${fileList.length}:v=0:a=1[a]" -map [a] 合成.wav`
          if (fileList.length === 1) {
            text = `-i "/input/input0.mp3" -ab 48k -ar 8000 -ac 1 合成.wav`
          }
          args = parseArguments(text);
          const data = await _this.retrieveSampleVideo(fileList, true);
          worker.postMessage({
            type: "command",
            arguments: args,
            files: data
          });
          return
        }
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
          // worker.postMessage({
          //   type: "command",
          //   arguments: ["-help"],
          // });
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
    runCommand(num) {
      this.active = num;
      if (num === 1) {
        this.commandText = `-i "${this.inputFileName}" -ab 48k -ar 8000 -ac 1 output.wav`;
      }
      if (num === 2) {
        this.commandText = `-i "${this.inputFileName}" -af silenceremove=stop_periods=-1:stop_duration=2:stop_threshold=-90dB output.wav`;
      }
      if (num === 4) {
        let command = "";
        this.sliceTimesArr.map((arr, i) => {
          command += `between(t,${arr[0]},${arr[1]})${
            i !== this.sliceTimesArr.length - 1 ? "+" : ""
          }`;
        });
        this.commandText = `-i "${this.inputFileName}" -vf "select='${command}',setpts=N/FRAME_RATE/TB" -af "aselect='${command}',asetpts=N/SR/TB" output.wav`;
      }
      if (num === 3) {
        this.commandText = `-i "${this.inputFileName}" -vf "select='between(t,1,2)',setpts=N/FRAME_RATE/TB" -af "aselect='between(t,1,2)',asetpts=N/SR/TB" output.wav`;
      }
      if (num === 5) {
        this.commandText = `
        -i "/input/input.mp3" -i "/input/input.mp3"  -i "/input/input.mp3" -filter_complex "[0:0][1:0] concat=n=3:v=0:a=1[a]" -map [a] 合成.wav`
      }
    },
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
    async retrieveSampleVideo(fileUrl, isMore) {
      const _this = this;
      if (isMore) {
        let sampleVideoDatas = []
        return new Promise(function(resolve, reject) {
          fileUrl.map(async (url, i) => {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", url, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function (oEvent) {
              var arrayBuffer = oReq.response;
              if (arrayBuffer) {
                sampleVideoDatas = [...sampleVideoDatas, new File([arrayBuffer], `input${i}.mp3`)];
              }
              if (sampleVideoDatas.length === fileUrl.length) {
                resolve(sampleVideoDatas)
              }
            };
            oReq.send(null);
          })
        })
      }
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
