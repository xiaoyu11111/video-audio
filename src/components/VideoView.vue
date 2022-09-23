<template>
  <div class="playVideo">
    <!-- <p>{{this.$store.state.curVideo.fileUrl}}</p> -->
    <!-- <img src="../assets/quickKey.jpg" alt  class="quickey"/> -->
    <!-- <video src="../assets/demo.mp4" id="myVideo"></video> -->
    <!-- <audio id="myVideo1" controls>
      <source
        src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-e37cad50-87bf-4e22-8965-c7e9ed358a6c/9471eba0-ee6c-4e62-ad0c-b8f71f3395f1.mp3"
        type="audio/mp3"
      />
      您的浏览器不支持 audio 元素。
    </audio> -->
    <div class="audio green-audio-player">
      <div class="loading">
        <div class="spinner"></div>
      </div>
      <div class="play-pause-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="24"
          viewBox="0 0 18 24"
        >
          <path
            fill="#566574"
            fill-rule="evenodd"
            d="M18 12L0 24V0"
            class="play-pause-icon"
            id="playPause"
          />
        </svg>
      </div>

      <div class="controls">
        <span class="current-time">0:00</span>
        <div class="slider" data-direction="horizontal">
          <div class="progress">
            <div class="pin" id="progress-pin" data-method="rewind"></div>
          </div>
        </div>
        <span class="total-time">0:00</span>
      </div>

      <div class="volume">
        <div class="volume-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="#566574"
              fill-rule="evenodd"
              d="M14.667 0v2.747c3.853 1.146 6.666 4.72 6.666 8.946 0 4.227-2.813 7.787-6.666 8.934v2.76C20 22.173 24 17.4 24 11.693 24 5.987 20 1.213 14.667 0zM18 11.693c0-2.36-1.333-4.386-3.333-5.373v10.707c2-.947 3.333-2.987 3.333-5.334zm-18-4v8h5.333L12 22.36V1.027L5.333 7.693H0z"
              id="speaker"
            />
          </svg>
        </div>
        <div class="volume-controls hidden">
          <div class="slider" data-direction="vertical">
            <div class="progress">
              <div class="pin" id="volume-pin" data-method="changeVolume"></div>
            </div>
          </div>
        </div>
      </div>
      <audio id="myVideo">
        <source src="../assets/demo.wav" type="audio/mpeg" />
        您的浏览器不支持 audio 元素。
      </audio>
    </div>
  </div>
</template>

<script>
export default {
  props: ["play", "stop"],
  created() {},
  mounted() {
    this.$nextTick(async () => {
      // let fileUrl = this.getParaByName("url");
      // if (!fileUrl) return;
      // fileUrl = "https://vkceyugu.cdn.bspapp.com" + decodeURIComponent(fileUrl);
      // var blob = await fetch(fileUrl).then((res) => res.blob());
      var audio = document.getElementById("myVideo");
      // const blob1 = new Blob([blob], { type: "audio/mp3" });
      // audio.src = window.URL.createObjectURL(blob1);
      setTimeout(() => {
        this.Event.$emit("allTime", audio.duration);
      }, [100]);
    });
    // // 开始和暂停播放视频
    // this.Event.$on("paly", (data) => {
    //   var vedio = document.getElementById("myVideo");
    //   if (data) {
    //     vedio.play(); //播放
    //   } else {
    //     vedio.pause(); //暂停
    //   }
    // });
    // //设置当前时间
    this.Event.$on("currentTime", (time) => {
      var x = document.getElementById("myVideo");
      x.currentTime = String(this.formData(time));
    });
    // // 分段播放
    this.Event.$on("subSectionPlay", (value) => {
      var x = document.getElementById("myVideo");
      x.currentTime = String(this.formData(value.startTime));
    });

    var audioPlayer = document.querySelector(".green-audio-player");
    var playPause = audioPlayer.querySelector("#playPause");
    var playpauseBtn = audioPlayer.querySelector(".play-pause-btn");
    var loading = audioPlayer.querySelector(".loading");
    var progress = audioPlayer.querySelector(".progress");
    var sliders = audioPlayer.querySelectorAll(".slider");
    var volumeBtn = audioPlayer.querySelector(".volume-btn");
    var volumeControls = audioPlayer.querySelector(".volume-controls");
    var volumeProgress = volumeControls.querySelector(".slider .progress");
    var player = audioPlayer.querySelector("audio");
    var currentTime = audioPlayer.querySelector(".current-time");
    var totalTime = audioPlayer.querySelector(".total-time");
    var speaker = audioPlayer.querySelector("#speaker");

    var draggableClasses = ["pin"];
    var currentlyDragged = null;

    window.addEventListener("mousedown", function (event) {
      if (!isDraggable(event.target)) return false;

      currentlyDragged = event.target;
      let handleMethod = currentlyDragged.dataset.method;

      this.addEventListener("mousemove", window[handleMethod], false);

      window.addEventListener(
        "mouseup",
        () => {
          currentlyDragged = false;
          window.removeEventListener("mousemove", window[handleMethod], false);
        },
        false
      );
    });

    playpauseBtn.addEventListener("click", togglePlay);
    player.addEventListener("timeupdate", updateProgress);
    player.addEventListener("volumechange", updateVolume);
    player.addEventListener("loadedmetadata", () => {
      totalTime.textContent = formatTime(player.duration);
    });
    player.addEventListener("canplay", makePlay);
    player.addEventListener("ended", function () {
      playPause.attributes.d.value = "M18 12L0 24V0";
      player.currentTime = 0;
    });

    volumeBtn.addEventListener("click", () => {
      volumeBtn.classList.toggle("open");
      volumeControls.classList.toggle("hidden");
    });

    window.addEventListener("resize", directionAware);

    sliders.forEach((slider) => {
      let pin = slider.querySelector(".pin");
      slider.addEventListener("click", window[pin.dataset.method]);
    });

    directionAware();

    function isDraggable(el) {
      let canDrag = false;
      let classes = Array.from(el.classList);
      draggableClasses.forEach((draggable) => {
        if (classes.indexOf(draggable) !== -1) canDrag = true;
      });
      return canDrag;
    }

    function inRange(event) {
      let rangeBox = getRangeBox(event);
      let rect = rangeBox.getBoundingClientRect();
      let direction = rangeBox.dataset.direction;
      if (direction == "horizontal") {
        var min = rangeBox.offsetLeft;
        var max = min + rangeBox.offsetWidth;
        if (event.clientX < min || event.clientX > max) return false;
      } else {
        var min = rect.top;
        var max = min + rangeBox.offsetHeight;
        if (event.clientY < min || event.clientY > max) return false;
      }
      return true;
    }

    function updateProgress() {
      var current = player.currentTime;
      var percent = (current / player.duration) * 100;
      progress.style.width = percent + "%";
      currentTime.textContent = formatTime(current);
    }

    function updateVolume() {
      volumeProgress.style.height = player.volume * 100 + "%";
      if (player.volume >= 0.5) {
        speaker.attributes.d.value =
          "M14.667 0v2.747c3.853 1.146 6.666 4.72 6.666 8.946 0 4.227-2.813 7.787-6.666 8.934v2.76C20 22.173 24 17.4 24 11.693 24 5.987 20 1.213 14.667 0zM18 11.693c0-2.36-1.333-4.386-3.333-5.373v10.707c2-.947 3.333-2.987 3.333-5.334zm-18-4v8h5.333L12 22.36V1.027L5.333 7.693H0z";
      } else if (player.volume < 0.5 && player.volume > 0.05) {
        speaker.attributes.d.value =
          "M0 7.667v8h5.333L12 22.333V1L5.333 7.667M17.333 11.373C17.333 9.013 16 6.987 14 6v10.707c2-.947 3.333-2.987 3.333-5.334z";
      } else if (player.volume <= 0.05) {
        speaker.attributes.d.value = "M0 7.667v8h5.333L12 22.333V1L5.333 7.667";
      }
    }

    function getRangeBox(event) {
      let rangeBox = event.target;
      let el = currentlyDragged;
      if (event.type == "click" && isDraggable(event.target)) {
        rangeBox = event.target.parentElement.parentElement;
      }
      if (event.type == "mousemove") {
        rangeBox = el.parentElement.parentElement;
      }
      return rangeBox;
    }

    function getCoefficient(event) {
      let slider = getRangeBox(event);
      let rect = slider.getBoundingClientRect();
      let K = 0;
      if (slider.dataset.direction == "horizontal") {
        let offsetX = event.clientX - slider.offsetLeft;
        let width = slider.clientWidth;
        K = offsetX / width;
      } else if (slider.dataset.direction == "vertical") {
        let height = slider.clientHeight;
        var offsetY = event.clientY - rect.top;
        K = 1 - offsetY / height;
      }
      return K;
    }

    function rewind(event) {
      if (inRange(event)) {
        player.currentTime = player.duration * getCoefficient(event);
      }
    }

    function changeVolume(event) {
      if (inRange(event)) {
        player.volume = getCoefficient(event);
      }
    }

    function formatTime(time) {
      var min = Math.floor(time / 60);
      var sec = Math.floor(time % 60);
      return min + ":" + (sec < 10 ? "0" + sec : sec);
    }
    const _this = this;
    function togglePlay() {
      if (player.paused) {
        playPause.attributes.d.value = "M0 0h6v24H0zM12 0h6v24h-6z";
        player.play();
        _this.play();
      } else {
        playPause.attributes.d.value = "M18 12L0 24V0";
        player.pause();
        _this.stop();
      }
    }

    function makePlay() {
      playpauseBtn.style.display = "block";
      loading.style.display = "none";
    }

    function directionAware() {
      if (window.innerHeight < 250) {
        volumeControls.style.bottom = "-54px";
        volumeControls.style.left = "54px";
      } else if (audioPlayer.offsetTop < 154) {
        volumeControls.style.bottom = "-164px";
        volumeControls.style.left = "-3px";
      } else {
        volumeControls.style.bottom = "52px";
        volumeControls.style.left = "-3px";
      }
    }
  },
  methods: {
    getParaByName(name) {
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
    },
    formData(time) {
      var h = time.split(":")[0];
      var m = time.split(":")[1];
      var s = time.split(":")[2];
      var ms = time.split(".")[1];
      return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + "." + ms;
    },
  },
};
</script>

<style lang="less">
.playVideo {
  display: flex;
  justify-content: center;
  .quickey {
    width: 500px;
    height: auto;
  }
  .playVedio {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }
  .playVedio video {
    height: 100%;
    width: auto;
  }
  #myVideo {
    width: 100%;
    max-width: 640px;
  }

  .audio.green-audio-player {
    width: 100vw;
    min-width: 300px;
    height: 56px;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.07);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 24px;
    padding-right: 24px;
    border-radius: 4px;
    user-select: none;
    -webkit-user-select: none;
    background-color: #fff;
  }
  .audio.green-audio-player .play-pause-btn {
    display: none;
    cursor: pointer;
  }
  .audio.green-audio-player .spinner {
    width: 18px;
    height: 18px;
    background-image: url(../assets/loading.png);
    background-size: cover;
    background-repeat: no-repeat;
    animation: spin 0.4s linear infinite;
  }
  .audio.green-audio-player .slider {
    flex-grow: 1;
    background-color: #d8d8d8;
    cursor: pointer;
    position: relative;
  }
  .audio.green-audio-player .slider .progress {
    background-color: #44bfa3;
    border-radius: inherit;
    position: absolute;
    pointer-events: none;
  }
  .audio.green-audio-player .slider .progress .pin {
    height: 16px;
    width: 16px;
    border-radius: 8px;
    background-color: #44bfa3;
    position: absolute;
    pointer-events: all;
    box-shadow: 0px 1px 1px 0px rgba(0, 0, 0, 0.32);
  }
  .audio.green-audio-player .controls {
    font-family: "Roboto", sans-serif;
    font-size: 16px;
    line-height: 18px;
    color: #55606e;
    display: flex;
    flex-grow: 1;
    justify-content: space-between;
    align-items: center;
    margin-left: 24px;
    margin-right: 24px;
  }
  .audio.green-audio-player .controls .slider {
    margin-left: 16px;
    margin-right: 16px;
    border-radius: 2px;
    height: 4px;
  }
  .audio.green-audio-player .controls .slider .progress {
    width: 0;
    height: 100%;
  }
  .audio.green-audio-player .controls .slider .progress .pin {
    right: -8px;
    top: -6px;
  }
  .audio.green-audio-player .controls span {
    cursor: default;
  }
  .audio.green-audio-player .volume {
    position: relative;
  }
  .audio.green-audio-player .volume .volume-btn {
    cursor: pointer;
  }
  .audio.green-audio-player .volume .volume-btn.open path {
    fill: #44bfa3;
  }
  .audio.green-audio-player .volume .volume-controls {
    width: 30px;
    height: 135px;
    background-color: rgba(0, 0, 0, 0.62);
    border-radius: 7px;
    position: absolute;
    left: -3px;
    bottom: 52px;
    flex-direction: column;
    align-items: center;
    display: flex;
  }
  .audio.green-audio-player .volume .volume-controls.hidden {
    display: none;
  }
  .audio.green-audio-player .volume .volume-controls .slider {
    margin-top: 12px;
    margin-bottom: 12px;
    width: 6px;
    border-radius: 3px;
  }
  .audio.green-audio-player .volume .volume-controls .slider .progress {
    bottom: 0;
    height: 100%;
    width: 6px;
  }
  .audio.green-audio-player .volume .volume-controls .slider .progress .pin {
    left: -5px;
    top: -8px;
  }

  svg,
  img {
    display: block;
  }

  html,
  body {
    height: 100%;
  }

  body {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f8ffae;
    background: -webkit-linear-gradient(-65deg, #43c6ac, #f8ffae);
    background: linear-gradient(-65deg, #43c6ac, #f8ffae);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @keyframes spin {
    from {
      transform: rotateZ(0);
    }
    to {
      transform: rotateZ(1turn);
    }
  }
}
</style>
