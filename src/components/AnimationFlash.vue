<template>
  <div>
    <el-form v-if="isMobile" :model="dynamicValidateForm" ref="dynamicValidateForm" label-width="60px" class="demo-dynamic">
      <el-form-item
        v-for="(changjing, index) in dynamicValidateForm.changjings"
        :label="'场景' + (index + 1)"
        :key="changjing.key"
        :prop="'changjings.' + index + '.title'"
        :rules="{
          required: true, message: '场景名不能为空', trigger: 'blur'
        }"
      >
      <el-row>
        <el-col :span="5">场景:</el-col>
        <el-col :span="19"><el-input v-model="changjing.title"></el-input></el-col>
      </el-row>
      <el-row v-if="index !== 0">
        <el-col :span="5">开始时间s:</el-col>
        <el-col :span="19"><el-input-number :precision="2" :min="0" v-model="changjing.startTime"></el-input-number></el-col>
      </el-row>
      <el-row>
          <el-col :span="5">场景特效:</el-col>
          <el-col v-for="(effect, index1) in changjing.effects" :span="8" :key="changjing + 1 + index1">
            <el-cascader :append-to-body="false" :options="effectOptions" clearable :value="effect" @change="(value)=>changeChangjingEffect(value, index, index1)"></el-cascader>
          </el-col>
          <el-col :offset="5" :span="19" class="effect-num"><span>个数</span><el-input-number :min="0" v-model="changjing.effectsNum" @change="(value) => changeChangjingEffectNum(value, index)"></el-input-number></el-col>
        </el-row>
        <el-row>
          <el-col v-for="(peopleitem, index1) in changjing.people" :span="24" :key="changjing + 2 + index1">
            <el-col v-if="index1 == 0" :span="5">人物:</el-col>
            <el-col :offset="index1 == 0 ? 0 : 5 " :span="8"><el-cascader :append-to-body="false" :options="peopleOptions" clearable :value="peopleitem" @change="(value)=>changeChangjingPeople(value, index, index1)"></el-cascader></el-col>
            <el-col :offset="5" :span="19" class="effect-num"><span>出场点(s)</span><el-input-number :precision="2" :min="0" v-model="changjing.peopleTimes[index1]" @change="(value) => changeChangjingPeopleTimes(value, index, index1)"></el-input-number></el-col>
          </el-col>
          <el-col :offset="5" :span="19" class="effect-num"><span>个数</span><el-input-number :min="1" v-model="changjing.peopleNum" @change="(value) => changeChangjingPeopleNum(value, index)"></el-input-number></el-col>
        </el-row>
        <el-button v-if="dynamicValidateForm.changjings.length > 1" @click.prevent="removechangjing(changjing)">删除场景</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm('dynamicValidateForm')">生成脚本</el-button>
        <el-button @click="addchangjing">新增场景</el-button>
        <el-button @click="resetForm()">重置</el-button>
      </el-form-item>
    </el-form>
    <el-form v-if="!isMobile" :model="dynamicValidateForm" ref="dynamicValidateForm" label-width="60px" class="demo-dynamic">
      <el-form-item
        v-for="(changjing, index) in dynamicValidateForm.changjings"
        :label="'场景' + (index + 1)"
        :key="changjing.key"
        :prop="'changjings.' + index + '.title'"
        :rules="{
          required: true, message: '场景名不能为空', trigger: 'blur'
        }"
      >
      <el-row>
        <el-col :span="3">场景:</el-col>
        <el-col :span="21"><el-input v-model="changjing.title"></el-input></el-col>
      </el-row>
      <el-row v-if="index !== 0">
        <el-col :span="3">开始时间(s):</el-col>
        <el-col :span="21"><el-input-number :precision="2" :min="0" v-model="changjing.startTime"></el-input-number></el-col>
      </el-row>
      <el-row>
          <el-col :span="3">场景特效:</el-col>
          <el-col v-for="(effect, index1) in changjing.effects" :span="4" :key="changjing + 1 + index1">
            <el-cascader :append-to-body="false" :options="effectOptions" clearable :value="effect" @change="(value)=>changeChangjingEffect(value, index, index1)"></el-cascader>
          </el-col>
          <el-col :offset="3" :span="21" class="effect-num"><span>个数</span><el-input-number :min="0" v-model="changjing.effectsNum" @change="(value) => changeChangjingEffectNum(value, index)"></el-input-number></el-col>
        </el-row>
        <el-row>
          <el-col v-for="(peopleitem, index1) in changjing.people" :span="24" :key="changjing + 2 + index1">
            <el-col v-if="index1 == 0" :span="3">人物:</el-col>
            <el-col :offset="index1 == 0 ? 0 : 3 " :span="4"><el-cascader :append-to-body="false" :options="peopleOptions" clearable :value="peopleitem" @change="(value)=>changeChangjingPeople(value, index, index1)"></el-cascader></el-col>
            <el-col :span="10" class="effect-num"><span>出场时间(s)</span><el-input-number :precision="2" :min="0" v-model="changjing.peopleTimes[index1]" @change="(value) => changeChangjingPeopleTimes(value, index, index1)"></el-input-number></el-col>
          </el-col>
          <el-col :offset="3" :span="21" class="effect-num"><span>个数</span><el-input-number :min="1" v-model="changjing.peopleNum" @change="(value) => changeChangjingPeopleNum(value, index)"></el-input-number></el-col>
        </el-row>
        <el-button v-if="dynamicValidateForm.changjings.length > 1" @click.prevent="removechangjing(changjing)">删除场景</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm('dynamicValidateForm')">生成脚本</el-button>
        <el-button @click="addchangjing">新增场景</el-button>
        <el-button @click="resetForm()">重置</el-button>
      </el-form-item>
    </el-form>
    <el-input type="textarea" autosize v-model="falshText" />
  </div>
</template>
<script>
  import _ from 'lodash'
  const defaultChangjing = [{
    title: '小溪边夕阳',
    startTime: 0,
    effectsNum: 2,
    effects: [[], []],
    peopleNum: 2,
    people: [[],[]],
    peopleTimes: []
  }]
export default {
  props: ['animationTime', 'isMobile'],
  data() {
    return { 
      effectOptions: [],
      peopleOptions: [],
      dynamicValidateForm: {
        changjings: defaultChangjing
      },
      finalChangjings: []
    };
  },
  created() {
    const location = [{
          value: '全',
          label: '全'
        }, {
          value: '上',
          label: '上'
        }, {
          value: '中',
          label: '中'
        }, {
          value: '下',
          label: '下'
        }]
    const arr = ['流线(水平)','流线(水平)1','流线(水平)2','流线(垂直)','流线(垂直)1','光圈','光圈1','光圈2','光圈3','下雨','闪电','雷电']
    this.effectOptions = arr.map(name => (
      {
        value: name,
        label: name,
        children: location
      }
    ))
    const people = ['乌龟', '小唐','小白龙','土地','蔡文姬','大牛','男1','男2','男3','男4','男5','男6','男7','男8','男9','boy','erdan','girl','laoban','mama','meimei','女1','女2','xz','悟空']
    this.peopleOptions = people.map(name => (
      {
        value: name,
        label: name
      }
    ))
    let curChangjings = defaultChangjing
    try {
      let changjings = localStorage.getItem('changjings')
      if (changjings) {
        curChangjings = JSON.parse(changjings)
      }
    } catch (error) {
      
    }
    this.dynamicValidateForm.changjings = curChangjings
  },
  methods: {
    changeChangjingEffect(value, index, index1) {
        const changjings = this.dynamicValidateForm.changjings
        changjings[index].effects[index1] = value
        this.dynamicValidateForm.changjings = [...changjings]
    },
    changeChangjingPeople(value, index, index1) {
      const changjings = this.dynamicValidateForm.changjings
      changjings[index].people[index1] = value
      this.dynamicValidateForm.changjings = [...changjings]
    },
    changeChangjingPeopleTimes(value, index, index1) {
      const changjings = this.dynamicValidateForm.changjings
      changjings[index].peopleTimes[index1] = value
      this.dynamicValidateForm.changjings = [...changjings]
    },
    changeChangjingPeopleNum(value, index) {
      if (index !== -1) {
        const changjings = this.dynamicValidateForm.changjings
        changjings[index].peopleNum = value
        const arr = changjings[index].people
        if (arr.length >= value) {
          changjings[index].people = arr.slice(0, value)
        }
        if (arr.length < value) {
          changjings[index].people = [...arr, ..._.range(value-arr.length)]
        }
        this.dynamicValidateForm.changjings = [...changjings]
      }
    },
    changeChangjingEffectNum(value, index) {
      if (index !== -1) {
        const changjings = this.dynamicValidateForm.changjings
        changjings[index].effectsNum = value
        const arr = changjings[index].effects
        if (arr.length >= value) {
          changjings[index].effects = arr.slice(0, value)
        }
        if (arr.length < value) {
          changjings[index].effects = [...arr, ..._.range(value-arr.length)]
        }
        this.dynamicValidateForm.changjings = [...changjings]
      }
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid, obj) => {
        if (valid) {
          const changjings = this.dynamicValidateForm.changjings
          localStorage.setItem('changjings', JSON.stringify(changjings))
          const finalChangjings = _.map(changjings, (item, i) => {
            const start = i == 0 ? 1 : Math.ceil(item.startTime * 30)
            return {
              title: '场景/'+item.title,
              start,
              people: _.compact(_.map(item.people, (arr, index) => {
                if (_.isEmpty(arr)) return null
                return {
                  title: arr[0], 
                  start: _.isNil(item.peopleTimes[index]) ? start : 
                  start > (Math.ceil(item.peopleTimes[index] * 30) || 1) ? start : (Math.ceil(item.peopleTimes[index] * 30) || 1)
                }
              })),
              effects: _.compact(_.map(item.effects, arr => {
                if (_.isEmpty(arr)) return null
                return {
                  title: arr[0], 
                  location: arr[1]
                }
              }))
            }
          })
          this.finalChangjings = [...finalChangjings]
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
    resetForm() {
      this.dynamicValidateForm.changjings = [{
        title: '小溪边夕阳',
        startTime: 0,
        effectsNum: 2,
        effects: [[], []],
        peopleNum: 2,
        people: [[],[]],
        peopleTimes: []
      }]
    },
    removechangjing(item) {
      var index = this.dynamicValidateForm.changjings.indexOf(item)
      if (index !== -1) {
        this.dynamicValidateForm.changjings.splice(index, 1)
      }
    },
    addchangjing() {
      this.dynamicValidateForm.changjings.push({
        ...defaultChangjing[0],
        key: Date.now()
      });
    }
  },
  computed:{
    falshText() {
  // var time = ${this.animationTime} // 动画时长
  // var changjing = ${JSON.stringify(this.finalChangjings)}
  
        return  `
  // C:\Users\Administrator\AppData\Local\Adobe\Animate 2022\zh_CN\Configuration\
  
  // var configDir = fl.configDirectory;
  // fl.trace(fl.configDirectory)
  //an.getDocumentDOM().scaleSelection(-1, 1);水平翻转
  var time = ${this.animationTime} // 动画时长
  var changjing = ${JSON.stringify(this.finalChangjings)}
  var canvasWidth = 1920 // 画布宽度
  var canvasHeight = 1080 // 画布高度
  var fs = 30 // 动画帧数
  // 位置坐标, 这里一般不需要改; key: 位置名称, value: [宽, 高, 中心点]
  var effectsLocationDict = {
    '上': [canvasWidth, 360, canvasWidth/2, 180],
    '中': [canvasWidth, 720, canvasWidth/2, canvasHeight/2],
    '下': [canvasWidth, 360, canvasWidth/2, canvasHeight - 180],
    '全': [canvasWidth, canvasHeight, canvasWidth/2, canvasHeight/2]
  }
  fl.getDocumentDOM().library.deleteItem('待删除')
  fl.getDocumentDOM().library.newFolder('待删除')
  fl.getDocumentDOM().addNewScene()
  fl.getDocumentDOM().editScene(0);
  fl.getDocumentDOM().deleteScene();
  var NumLayer = fl.getDocumentDOM().getTimeline().layerCount
  // 添加图层
  fl.getDocumentDOM().getTimeline().addNewLayer("场景", "normal", true);
  fl.getDocumentDOM().getTimeline().addNewLayer("场景特效", "normal", true);
  fl.getDocumentDOM().getTimeline().addNewLayer("camera", "normal", true);
  
  // 总帧
  var insertFrames = fs * time
  fl.getDocumentDOM().getTimeline().insertFrames(insertFrames, true, 0);
  
  var NumLayer = fl.getDocumentDOM().getTimeline().layerCount
  // 选择场景层
  var bgIndex = NumLayer - 2
  fl.getDocumentDOM().getTimeline().setSelectedLayers(bgIndex);
  
  // 添加场景
  for (var i = 0; i < changjing.length; i++) {
    if (i > 0) {
      fl.getDocumentDOM().getTimeline().convertToBlankKeyframes(changjing[i].start - 1);
    }
    fl.getDocumentDOM().getTimeline().setSelectedFrames(changjing[i].start-1, changjing[i].start-1);
    fl.getDocumentDOM().library.selectItem(changjing[i].title);
    fl.getDocumentDOM().library.addItemToDocument({x: canvasWidth/2, y: canvasHeight / 2});
    // 场景宽度比较小，等比放大
    var curBg = fl.getDocumentDOM().getTimeline().layers[bgIndex].frames[changjing[i].start-1].elements[0];
    var rate = canvasWidth / curBg.width
    var curBgWidth = curBg.width
    var curBgHeight = curBg.height
    if (curBgHeight * rate >= canvasHeight) {
      curBg.width = curBgWidth * rate
      curBg.height = curBgHeight * rate
    } else {
      curBg.width = curBgWidth * rate * canvasHeight/(curBgHeight * rate)
      curBg.height = canvasHeight
    }
  }
  
  // 选择camera层
  var cameraIndex = 0
  fl.getDocumentDOM().getTimeline().setSelectedLayers(cameraIndex);
  
  // 添加过渡效果
  for (var i = 0; i < changjing.length; i++) {
    if (i != 0) {
      fl.getDocumentDOM().getTimeline().convertToKeyframes(changjing[i].start - 11)
      fl.getDocumentDOM().getTimeline().convertToKeyframes(changjing[i].start + 9)
      fl.getDocumentDOM().getTimeline().setSelectedFrames(changjing[i].start-11,changjing[i].start-11);
      fl.getDocumentDOM().library.selectItem('场景/过渡页');
      fl.getDocumentDOM().library.addItemToDocument({x: canvasWidth/2, y: canvasHeight / 2});
      // 场景宽度比较小，等比放大
      var currentLayer = fl.getDocumentDOM().getTimeline().currentLayer
      var curBg = fl.getDocumentDOM().getTimeline().layers[currentLayer].frames[changjing[i].start-1].elements[0];
      var rate = canvasWidth / curBg.width
      var curBgWidth = curBg.width
      var curBgHeight = curBg.height
      if (curBgHeight * rate >= canvasHeight) {
        curBg.width = curBgWidth * rate
        curBg.height = curBgHeight * rate
      } else {
        curBg.width = curBgWidth * rate * canvasHeight/(curBgHeight * rate)
        curBg.height = canvasHeight
      }
      fl.getDocumentDOM().getTimeline().convertToKeyframes(changjing[i].start - 1)
      fl.getDocumentDOM().getTimeline().convertToKeyframes(changjing[i].start + 8)
      fl.getDocumentDOM().getTimeline().setSelectedFrames(changjing[i].start-2,changjing[i].start+1);
      fl.getDocumentDOM().getTimeline().createMotionTween();
      fl.getDocumentDOM().getTimeline().setSelectedFrames(changjing[i].start + 8,changjing[i].start + 8);
      fl.getDocumentDOM().setInstanceAlpha(0)
      fl.getDocumentDOM().getTimeline().setSelectedFrames(changjing[i].start - 11,changjing[i].start - 11);
      fl.getDocumentDOM().setInstanceAlpha(0)
    }
  }
  // 添加人物和特效层级
  var allPeople = []
  for (var i = 0; i < changjing.length; i++) {
      if (changjing[i].people) {
          for (var j = 0; j < changjing[i].people.length; j++) {
              if (allPeople.indexOf(changjing[i].people[j].title) === -1) {
                allPeople.push(changjing[i].people[j].title)
              }
          }
      }
  }
  for (var i = 0; i < allPeople.length; i++) {
    fl.getDocumentDOM().getTimeline().addNewLayer(allPeople[i]+"人物", "normal", false);
    fl.getDocumentDOM().getTimeline().addNewLayer(allPeople[i]+"特效", "normal", false);
  }
  // 添加人物和场景特效到对应的层级
  var layers = fl.getDocumentDOM().getTimeline().layers
  var layersDict = {}
  for (var i = 0; i < layers.length - 1; i++) {
    layersDict[layers[i].name] = i
  }
  for (var i = 1; i < layers.length - 2; i++) {
    fl.getDocumentDOM().getTimeline().setSelectedLayers(i);
    for (var j = 0; j < changjing.length; j++) {
      if (j > 0) {
        fl.getDocumentDOM().getTimeline().convertToKeyframes(changjing[j].start - 1);
      }
    }
  }
  for (var i = 0; i < changjing.length; i++) {
    // 添加人物
    for (var j = 0; j < changjing[i].people.length; j++) {
      var name = changjing[i].people[j].title
      var start = changjing[i].people[j].start
      fl.getDocumentDOM().getTimeline().setSelectedLayers(layersDict[name +"人物"]);
      if (start && start !== changjing[i].start) {
        fl.getDocumentDOM().getTimeline().convertToKeyframes(start-1)
      }
      fl.getDocumentDOM().getTimeline().setSelectedFrames(start || changjing[i].start-1, start || changjing[i].start-1);
      fl.getDocumentDOM().library.selectItem(name + '动作/' + name + '正面站姿');
      var addItemX = parseInt(Math.random()*(1920 -130 - 130 + 1)+130,10)
      var addItemY = parseInt(Math.random()*(1080 -302 - 302 + 1)+302,10)
      fl.getDocumentDOM().library.addItemToDocument({x: addItemX, y: addItemY});
      // 修改元件名
      var currentLayer = fl.getDocumentDOM().getTimeline().currentLayer
      fl.getDocumentDOM().selection = [fl.getDocumentDOM().getTimeline().layers[currentLayer].frames[start || changjing[i].start-1].elements[0]]
      var name = fl.getDocumentDOM().selection[0].libraryItem.name
      fl.getDocumentDOM().library.duplicateItem(name)
      var nameArr = name.split(' 复制')
      var newName = ''
      if (name.indexOf(' 复制') == -1) {
          newName = name+' 复制'
      } else {
          newName  = nameArr[0] + ' 复制 ' + (nameArr[1] ? (+nameArr[1] + 1) : 2)
      }
      fl.getDocumentDOM().swapElement(newName)
      fl.getDocumentDOM().library.selectItem(newName);
      fl.getDocumentDOM().library.moveToFolder('待删除');
    }
    // 添加场景特效
    fl.getDocumentDOM().getTimeline().setSelectedLayers(layersDict['场景特效']);
    for (var c = 0; c < changjing[i].effects.length; c++) {
      var name = changjing[i].effects[c].title
      var location = changjing[i].effects[c].location
      fl.getDocumentDOM().getTimeline().setSelectedFrames(changjing[i].start-1, changjing[i].start-1);
      fl.getDocumentDOM().library.selectItem('场景特效/' + name);
      fl.getDocumentDOM().library.addItemToDocument({x: effectsLocationDict[location][2], y: effectsLocationDict[location][3]});
      var currentLayer = fl.getDocumentDOM().getTimeline().currentLayer
      var curBg = fl.getDocumentDOM().getTimeline().layers[currentLayer].frames[changjing[i].start-1].elements[c];
      fl.getDocumentDOM().selection = [fl.getDocumentDOM().getTimeline().layers[currentLayer].frames[changjing[i].start-1].elements[c]]
      fl.getDocumentDOM().scaleSelection(effectsLocationDict[location][0]/curBg.width, effectsLocationDict[location][1]/curBg.height);
    }
  }
        `
      }
  }
};
</script>
<style lang="less">
.effect-num {
  > span {
    padding: 0px 5px;
  }
  .el-input-number {
    width: calc(100% - 80px);
    min-width: 100px;
    max-width: 150px;
  }
}
</style>
