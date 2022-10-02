<template>
  <div>
    <div class="common-title">
      画布<el-button @click="resetCanvasSetting">重新生成</el-button>
      <el-button @click="saveCanvasSetting">保存</el-button>
      <el-button @click="setTextFlash">2、生成脚本</el-button>
    </div>
    <div class="canvas-container" id="canvas-container" :style="{ height }">
      <div class="canvas" id="canvas" :style="{ height: canvasHeight }"></div>
      <div 
        v-for="(sayList, index) in canvasSetting.peopleList"
        :key="index +'people'"
      >
        <div class="people" 
          v-for="(sayItem, i) in sayList"
          :key="i +'sayItem'"
          @mousedown="(e) => peopleDown(e, sayItem.title, index)"
          @touchstart="(e) => peopleDown(e, sayItem.title, index)"
          @mousemove="(e) => peopleMove(e, index, i)"
          @touchmove="(e) => peopleMove(e, index, i)"
          @mouseup="peopleUp"
          :style="{
            display: sayItem.action === 'other' && blueBgFlagLeft >= sayItem.start * 20 && blueBgFlagLeft <= sayItem.end * 20 ? 'block' : 'none',
            'box-shadow': selectPeople === sayItem.title ? 'inset 1px 2px 12px #f45' : 'none',
            zIndex: selectPeople === sayItem.title ? 1000 : 1,
            left: sayItem.location[0] + 'px',
            top: sayItem.location[1] + 'px',
          }"
        >
          {{ sayList[0].title}}
        </div>
      </div>
    </div>
    <div class="canvas-time-lines" id="canvas">
      <div class="time-lines-btn">
        <div
        class="canvas-lines-btn"
        v-for="(sayList, index) in canvasSetting.peopleList"
        :key="index+'lines-btn'"
        :style="{ 
          'box-shadow': selectPeople === sayList[0].title ? 'inset 1px 2px 12px #f45' : 'inset 1px 2px 12px rgb(138, 166, 241)'
        }"
        @click="setSelectPeople(sayList[0].title, index)"
      >
      {{ sayList[sayList.length - 1].formatTitle }}
      </div>
      </div>
      <div class="time-lines">
        <div
        class="canvas-lines"
        :style="{ width: timeLinesWidth }"
        v-for="(sayList, index) in canvasSetting.peopleList"
        :key="index+'canvas-lines'"
        @mousedown="goToLocation"
      >
        <!-- <div class="name-box">
          {{ sayList[0].title }}
        </div> -->
        <div class="sign-del-btn"
          v-if="selectPeople && !selectFrame && index === 0 && blueBgFlagLeft >= 60"
          :style="{ left: blueBgFlagLeft - 60 + 'px' }"
          @mousedown="insertFrameKey"
        >插入帧</div>
        <div
          class="sign-box"
          v-if="index === 0"
          :style="{ left: blueBgFlagLeft + 'px' }"
          @mousedown="blueBgDown"
          @touchstart="blueBgDown"
          @mousemove="blueBgMove"
          @touchmove="blueBgMove"
          @mouseup="blueBgUp"
        >
          {{(blueBgFlagLeft/20).toFixed(2)}}
          <div class="sign-box-content" />
        </div>
        <div 
          class="sign-del-btn"
          v-if="selectPeople && !selectFrame && index === 0 && blueBgFlagLeft < 60"
          :style="{ left: 90 + blueBgFlagLeft + 'px' }"
          @mousedown="insertFrameKey"
        >插入帧</div>
        <div class="sign-del-btn"
          v-if="selectFrame && index === 0"
          :style="{ left: (blueBgFlagLeft < 60 && !selectFrame ? 80 + 70 : 90) + blueBgFlagLeft + 'px' }"
          @mousedown="delFrameKey"
        >删除帧</div>
        <div
          class="calibration"
          v-for="num in animationTimeArr"
          :key="num + 'calibration'"
          :style="{
            left: num * 20 + 'px',
            height: num % 5 === 0 && num !== 0 ? '8px' : '5px',
          }"
        >
          {{ num % 5 === 0 && num !== 0 ? num : "" }}
        </div>
        <div
          v-for="obj in sayList"
          :class="obj.action === 'other' ? 'green-box' : 'red-box'"
          :key="obj.end + 'box'"
          :style="{
            width: (obj.end - obj.start) * 20 + 'px',
            left: obj.start * 20 + 'px',
            border: obj.action === 'other' && selectIndex === index && obj.start <= (blueBgFlagLeft/20).toFixed(2) && (blueBgFlagLeft/20).toFixed(2) < obj.end ? '2px solid yellow' : 'none'
          }"
        />
        <div
          v-for="(obj, index) in sayList"
          :key="obj.end + 'box1'"
        >
          <div
            v-for="frame in obj.frameKeys"
            :class="selectFrame.id === frame.id ? 'frame-select' : 'frame'"
            :key="frame.start + 'box'"
            :style="{
              left: frame.start * 20-5 + 'px',
            }"
            @mousedown="(e) => setSelectFrame(e,{...frame,changjingIndex: index})"
          >
          </div>
        </div>
      </div>
      </div>
      
    </div>
  </div>
</template>
<script>
import _ from "lodash";
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
        changjings: [],
      },
      blueBgFlagLeft: 0,
      selectPeople: '',
      selectIndex: '',
      selectFrame: '',
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
      this.timeLinesWidth = 20 * canvasSetting.animationTime + "px";
    } catch (error) {}
  },
  methods: {
    setTextFlash() {

    },
    saveCanvasSetting() {
      localStorage.setItem("canvasSetting", JSON.stringify(this.canvasSetting));
    },
    resetCanvasSetting() {
      this.timeLinesWidth = 20 * this.animationTime + "px";
      const peopleList = _.map(
        this.audioSettings[0]?.peopleDictList || [],
        (arr) => {
          let sayList = [];
          this.changjings.map((item, i) => {
            _.map(item.people, (p, index) => {
              if (p[0] === arr[0]) {
                const width = document.getElementById("canvas-container").offsetWidth - 20
                const heigth = document.getElementById("canvas-container").offsetHeight - 40
                const x = Math.random() * (width - 20 + 1) + 20 - 20
                const y = Math.random() * (heigth - 40 + 1) + 40 - 40
                // location 左上角, 生成flash脚本要变成中间位置
                sayList.push({
                  id: Math.random().toFixed(10),
                  action: "other",
                  location: [x, y],
                  start:
                    item.startTime > (item.peopleTimes[index] || 0)
                      ? item.startTime
                      : (item.peopleTimes[index] || 0),
                  end: this.changjings[i + 1]?.startTime || this.animationTime,
                  formatTitle: arr[0],
                  title: arr[0]
                });
              }
            });
          });
          _.filter(this.customAudioTextTimes, (item) => {
            if (item.title === arr[1]) {
              sayList.push({
                ...item,
                id: Math.random().toFixed(10),
                action: "say",
                formatTitle: arr[0] + "(" + arr[1] + ")",
                title: arr[0],
                location: []
              });
            }
          });
          return sayList;
        }
      );
      const canvasSetting = {
        peopleList,
        animationTime: this.animationTime,
        changjings: this.changjings,
      };
      this.canvasSetting = canvasSetting;
      localStorage.setItem("canvasSetting", JSON.stringify(canvasSetting));
    },
    delFrameKey(e) {
      e.stopPropagation()
      if (!this.selectFrame) return
      const data = _.map(this.canvasSetting.peopleList[this.selectIndex], (item, index) => {
        if (this.selectFrame.changjingIndex === index) {
          let frameKeys = item.frameKeys
          return {
            ...item,
            frameKeys: _.filter(frameKeys, item => item.id !== this.selectFrame.id)
          }
        }
        return item
      })
      const peopleList = this.canvasSetting.peopleList
      peopleList[this.selectIndex] = [...data]
      this.selectFrame = ''
      this.canvasSetting.peopleList = [...peopleList]
    },
    insertFrameKey(e) {
      e.stopPropagation()
      if (!this.selectPeople) return this.$message.error("请先选择人物");
      const time = (this.blueBgFlagLeft/20).toFixed(2)
      const id = Math.random().toFixed(10)
      const data = _.map(this.canvasSetting.peopleList[this.selectIndex], (item, changjingIndex) => {
        if (item.action == 'other' && time >= item.start && time <= item.end) {
          let frameKeys = item.frameKeys
          if (_.isEmpty(frameKeys)) {
            frameKeys=[{start: time, location: item.location, id}]
            this.selectFrame = {...frameKeys[0], changjingIndex}
          } else {
            if (time > frameKeys[frameKeys.length -1].start) {
              frameKeys=[...frameKeys, {start: time, location: frameKeys[frameKeys.length -1].location, id}]
              this.selectFrame = {...frameKeys[frameKeys.length -1],changjingIndex}
            } else if(time < frameKeys[0].start) {
              frameKeys=[{start: time, location: frameKeys[0].location, id}, ...frameKeys]
              this.selectFrame = {...frameKeys[0],changjingIndex}
            } else {
              const index = _.sortedIndexBy(frameKeys, { 'start': time }, 'start');
              this.selectFrame = {start: time, location: frameKeys[index-1].location, id, changjingIndex}
              frameKeys = [
                ...frameKeys.slice(0, index),
                {
                    start: time, location: frameKeys[index-1].location, id
                },
                ...frameKeys.slice(index)
              ]
            }
          }
          return {
            ...item,
            frameKeys
          }
        }
        return item
      })
      const peopleList = this.canvasSetting.peopleList
      peopleList[this.selectIndex] = [...data]
      this.canvasSetting.peopleList = [...peopleList]
    },
    setSelectFrame(e, frame){
      this.selectFrame = frame
    },
    peopleDown(e, title, index) {
      e.stopPropagation()
      this.setSelectPeople(title, index)
      this.peopleFlag = true;
      this.nPeopleInitX = e.clientX || e.targetTouches[0].clientX
      this.nPeopleInitY = e.clientY || e.targetTouches[0].clientY
      this.nPeopleInitLeft = e.target.offsetLeft;
      this.nPeopleInitTop = e.target.offsetTop;
    },
    peopleMove(e, parentIndex, index) {
      e.stopPropagation()
      e.preventDefault();
      if (!this.peopleFlag) {
        return;
      }
      let nX = (e.clientX || e.targetTouches[0].clientX) - this.nPeopleInitX + this.nPeopleInitLeft;
      let nY = (e.clientY || e.targetTouches[0].clientY) - this.nPeopleInitY + this.nPeopleInitTop;
      const width = document.getElementById("canvas-container").offsetWidth - 40
      const heigth = document.getElementById("canvas-container").offsetHeight - 80
      if (nX <= 0) {
        nX = 0
      }
      if (nX >= width) {
        nX = width
      }
      if (nY <= 0) {
        nY = 0
      }
      if (nY >= heigth) {
        nY = heigth
      }
      this.canvasSetting.peopleList[parentIndex][index].location = [nX, nY]
      e.target.style.left = nX + 'px'
      e.target.style.top = nY + 'px'
    },
    peopleUp(e) {
      e.stopPropagation()
      this.peopleFlag = false;
    },
    //时间进度条移动
    blueBgDown(e) {
      e.stopPropagation()
      this.blueBgFlag = true;
      this.nInitX = e.clientX || e.targetTouches[0].clientX
      this.nInitLeft = e.target.offsetLeft;
    },
    blueBgMove(e) {
      e.stopPropagation()
      e.preventDefault();
      if (!this.blueBgFlag) {
        return;
      }
      let nX = (e.clientX || e.targetTouches[0].clientX) - this.nInitX + this.nInitLeft;
      if (nX <= 0) {
        nX = 0
      }
      this.blueBgFlagLeft = nX;
    },
    blueBgUp(e) {
      e.stopPropagation()
      this.blueBgFlag = false;
    },
    goToLocation(e) {
      e.stopPropagation()
      e.preventDefault();
      const dom = document.getElementsByClassName("time-lines")[0]
      let nX = dom.scrollLeft + e.clientX-15-70
      if (nX <= 0) {
        nX = 0
      }
      if (this.selectFrame && Math.abs((nX/20).toFixed(2)) + 0.25 >= Math.abs(this.selectFrame.start) && Math.abs(this.selectFrame.start) >= Math.abs((nX/20).toFixed(2)) - 0.25) {
        this.selectFrame = this.selectFrame
      } else {
        this.selectFrame = ''
      }
      this.blueBgFlagLeft = nX;
    },
    setSelectPeople(val, index) {
      this.selectPeople = val
      this.selectIndex = index
    }
  },
};
</script>
<style lang="less">
.canvas-container {
  position: relative;
  max-width: 500px;
  margin: 10px 0;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #d5e4d785;
  border: 1px solid #8aa6f1;
  border-radius: 2px;
  user-select: none;
  .canvas {
    width: 70%;
    border: 1px solid #ccc;
    background-color: #d5e4d785;
    border: 1px solid #8aa6f1;
    border-radius: 2px;
  }
  .people {
    position: absolute;
    width: 40px;
    height: 80px;
    background: url('../assets/girl.png') no-repeat;
    background-size: cover;
  }
}

.canvas-time-lines {
  display: flex;
  position: relative;
  user-select: none;
}

.time-lines-btn,
.time-lines {
  position: relative;
  user-select: none;
  min-width: 70px;
  overflow: auto;
  padding: 40px 0 0 0px;
}

.canvas-lines-btn,
.canvas-lines {
  position: relative;
  line-height: 40px;
  height: 40px;
  margin-bottom: 16px;
  background-color: #d5e4d785;
  border: 1px solid rgb(138, 166, 241);
  box-shadow: inset 1px 2px 12px rgb(138, 166, 241);
  border-radius: 2px;
  z-index: 20;
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
  .sign-del-btn,
  .sign-box {
    position: absolute;
    left: 0;
    top: -30px;
    width: 80px;
    height: 30px;
    background-color: #8aa6f1;
    cursor: pointer;
    border-radius: 5px;
    z-index: 100;
    text-align: center;
    line-height: 30px;
    .sign-box-content {
      border-left: 1px dashed red;
      height: 70px;
      width: 0px;
      position: absolute;
      top: 4px;
    }
  }
  .sign-del-btn {
    width: 50px
  }
  .red-box,
  .green-box {
    position: absolute;
    top: 1px;
    height: 38px;
  }
  .green-box::before,
  .red-box::before {
    position: absolute;
    content: " ";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border: 2px solid #579df3;
    box-shadow: inset 1px 2px 12px #579df3;
    z-index: 11;
    border-radius: 2px;
  }
  .green-box::before {
    border: 2px solid rgb(101, 240, 147);
    box-shadow: inset 1px 2px 12px rgb(101, 240, 147);
  }
  .frame-select,
  .frame {
    position: absolute;
    width: 10px;
    height: 40px;
    background-image: url('../assets/frame.png');
    background-repeat: no-repeat;
    background-position-x: -3px;
    background-size: 18px 40px;
    z-index: 20;
  }
  .frame-select {
    background-image: url('../assets/frame-select.png');
  }

}

.canvas-lines-btn {
  width: 60px;
  font-size: 12px;
  line-height: 20px;
}

</style>
