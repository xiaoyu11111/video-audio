// 旧代码，引用ffmpeg-all-codecs
// importScripts('./ffmpeg-all-codecs.js');

// var now = Date.now;

// function print(text) {
//   postMessage({
//     'type' : 'stdout',
//     'data' : text
//   });
// }

// onmessage = function(event) {

//   var message = event.data;

//   if (message.type === "command") {

//     var Module = {
//       print: print,
//       printErr: print,
//       files: message.files || [],
//       arguments: message.arguments || [],
//       TOTAL_MEMORY: 268435456
//       // Can play around with this option - must be a power of 2
//       // TOTAL_MEMORY: 268435456
//     };

//     postMessage({
//       'type' : 'start',
//       'data' : Module.arguments.join(" ")
//     });

//     postMessage({
//       'type' : 'stdout',
//       'data' : 'Received command: ' +
//                 Module.arguments.join(" ") +
//                 ((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")
//     });

//     var time = now();
//     var result = ffmpeg_run(Module);

//     var totalTime = now() - time;
//     postMessage({
//       'type' : 'stdout',
//       'data' : 'Finished processing (took ' + totalTime + 'ms)'
//     });

//     postMessage({
//       'type' : 'done',
//       'data' : result,
//       'time' : totalTime
//     });
//   }
// };

// postMessage({
//   'type' : 'ready'
// });


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
    var Module = {
      print: print,
      printErr: print,
      files: message.files || [],
      arguments: message.arguments || [],
      TOTAL_MEMORY: 268435456,
	    retrun:retrun
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
  });
  }
};

postMessage({
  'type' : 'ready'
});
