# video

## 安装依赖
```
npm install
```

### 运行
```
npm run serve
```
## demo地址

```
http://docs.fst1994.com/wm/demo/index.html   
```

## 界面截图
![图片例](http://guzhen.fst1994.com/res/img/202010/09/2d7f647d880f4ed3.jpg)

### videoCut 2.0 中支持以下功能

+ 视频分段剪辑，打入打出点；

+ canvas刻度尺 调整不同时间刻度,并适配剪辑的短视频宽度

+ 支持对每段剪辑视频的编辑，拖拽，改变宽度以及左侧距离

+ 双击刻度尺调整当前时间位置

+ 支持对某一段视频进行删除修改标题

+ 支持对拆条视频左右微调

+ 反选当前剪切的视频片段

+  自动拆分视频，平均拆分视频

+ 支持视频 上一帧，下一帧

+ 内置部分快捷供快捷使用 具体参照例子


### 变量存放地址 

+ 拆条列表  VideoControl.vue中  cutCoverList数组中  单个拆条存储了开始时间，结束时间，时长间隔，left距离，拆条宽度等

### author:QQ-780602604   Wechat：deng9466   email: pickeddeng@163.com