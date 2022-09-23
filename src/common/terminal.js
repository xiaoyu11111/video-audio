var worker;
var sampleImageData;
var sampleVideoData;
var outputElement;
var filesElement;
var running = false;
var isWorkerLoaded = false;
var isSupported = (function() {
  return document.querySelector && window.URL && window.Worker;
})();

function isReady() {
  return !running && isWorkerLoaded && sampleVideoData;
}

function startRunning() {
  // document.querySelector("#image-loader").style.visibility = "visible";
  outputElement.className = "";
  filesElement.innerHTML = "";
  running = true;
}
function stopRunning() {
  // document.querySelector("#image-loader").style.visibility = "hidden";
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

function retrieveSampleVideo(fileUrl) {
  var oReq = new XMLHttpRequest();
  oReq.open("GET", fileUrl, true);
  oReq.responseType = "arraybuffer";

  oReq.onload = function (oEvent) {
    var arrayBuffer = oReq.response;
    if (arrayBuffer) {
      sampleVideoData = new Uint8Array(arrayBuffer);
    }
  };

  oReq.send(null);
}

function parseArguments(text) {
  text = text.replace(/\s+/g, ' ');
  var args = [];
  // Allow double quotes to not split args.
  text.split('"').forEach(function(t, i) {
    t = t.trim();
    if ((i % 2) === 1) {
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
      files: [
        // {
        //   "name": "input.jpeg",
        //   "data": sampleImageData
        // },
        {
          "name": "input.mp3",
          "data": sampleVideoData
        }
      ]
    });
  }
}

function getDownloadLink(fileData, fileName) {
  if (fileName.match(/\.jpeg|\.gif|\.jpg|\.png/)) {
    var blob = new Blob([fileData]);
    var src = window.URL.createObjectURL(blob);
    var img = document.createElement('img');

    img.src = src;
    return img;
  }
  else {
    var a = document.createElement('a');
    a.download = fileName;
    var blob = new Blob([fileData]);
    var src = window.URL.createObjectURL(blob);
    a.href = src;
    a.id = 'download-url'
    a.textContent = '点击下载文件 ' + fileName + "!";
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
        arguments: ["-help"]
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
      buffers.forEach(function(file) {
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

document.addEventListener("DOMContentLoaded", function() {
  initWorker();
  let fileUrl = getParaByName("url");
  if (!fileUrl) {
    this.$message.error("链接不对");
    return;
  }
  fileUrl = "https://vkceyugu.cdn.bspapp.com" + decodeURIComponent(fileUrl);
  retrieveSampleVideo(fileUrl);
  // retrieveSampleImage();

  var inputElement = document.querySelector("#input");
  outputElement = document.querySelector("#output");
  filesElement = document.querySelector("#files");
  document.querySelector("#run").addEventListener("click", function() {
    runCommand(inputElement.value);
  });
});
