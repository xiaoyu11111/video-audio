
// self.importScripts('ffmpeg.js');

// onmessage = function(e) {
//   console.log('ffmpeg_run', ffmpeg_run);
//   var files = e.data;
//   var retrun ;

//   console.log(files);
//   ffmpeg_run({
//    // arguments: ['-i', 'https://gw.alicdn.com/bao/uploaded/LB1l2iXISzqK1RjSZFjXXblCFXa.mp4?file=LB1l2iXISzqK1RjSZFjXXblCFXa.mp4', '-b:v', '64k', '-bufsize', '64k', '-vf', 'showinfo', '-strict', '-2', 'out.mp4'],
//   // arguments: ['-i', '/input/' + files[0].name  'out.mp4'],
//   // arguments: ['-version'],
//       //rguments: ['-i', '/input/' + files[0].name, '-b:v', '64k', '-bufsize', '64k', '-vf', 'showinfo', '-strict', '-2', 'out.mp4'],
// 	   arguments: ['-i', '/input/' + files[0].name, '-s' ,'360x240' , 'out.mpeg'],
//     files: files,
// 	retrun:retrun
//   }, function(results) {
// 	//var URL = this.window.URL || this.window.webkitURL;
//     console.log('result',results[0].data);
// 	var blob = new Blob([results[0].data], {type: "video/mpeg"});

// 	console.log(blob)
// 	var blobURL = URL.createObjectURL(blob);
// 	console.log(blobURL)
//    // self.postMessage(results[0].data, [results[0].data]);
//   });

// }


self.importScripts('ffmpeg.js');

var now = Date.now;

function print(text) {
  postMessage({
    'type' : 'stdout',
    'data' : text
  });
}

onmessage = function(event) {
  var retrun ;
  var message = event.data;

  if (message.type === "command") {
    console.log(message, 'message=================')
    var Module = {
      print: print,
      printErr: print,
      files: message.files || [],
      arguments: message.arguments || [],
      TOTAL_MEMORY: 268435456,
	    retrun:retrun
      // Can play around with this option - must be a power of 2
      // TOTAL_MEMORY: 268435456
    };

    postMessage({
      'type' : 'start',
      'data' : Module.arguments.join(" ")
    });

    postMessage({
      'type' : 'stdout',
      'data' : 'Received command: ' +
                Module.arguments.join(" ") +
                ((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")
    });

    var time = now();
    ffmpeg_run(Module, function(result) {
        //var URL = this.window.URL || this.window.webkitURL;
          var totalTime = now() - time;
          postMessage({
            'type' : 'stdout',
            'data' : 'Finished processing (took ' + totalTime + 'ms)'
          });

          postMessage({
            'type' : 'done',
            'data' : result,
            'time' : totalTime
          });
        // var blob = new Blob([results[0].data], {type: "video/mpeg"});

        // console.log(blob)
        // var blobURL = URL.createObjectURL(blob);
        // console.log(blobURL)
        // self.postMessage(results[0].data, [results[0].data]);

    });


  }
};

postMessage({
  'type' : 'ready'
});
