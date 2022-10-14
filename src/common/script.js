// 批量导出元件名称
var persons = ['动作']
var lib = fl.getDocumentDOM().library.items;
var getNames = []
for(var i=0;i < lib.length;i++) {
   var name = lib[i].name
   // 文件夹下
   //for(var j=0;j < persons.length;j++) {
     // if(name.indexOf(persons[j]+'/') > -1 && name.indexOf('场景特效其他') == -1) {
      //   getNames.push("'" + name.replace(persons[j] + '/', '')+"'")
      //}  
   //}
   if (name.indexOf(persons[0]) > -1 && name.indexOf('/') == -1) {
      getNames.push("'" + name.replace('动作', '')+"'")
   }
}
fl.trace(getNames)

// 批量重命名
var doc = fl.getDocumentDOM();
var uxi = doc.xmlPanel(fl.configURI + "Commands/xynames.xml");
if(uxi.dismiss == "accept")
{
   var arr1 = uxi.prefixName.split('|')
   var persons = [] //arr1[0].split(',')
   var changePersons =[] //arr1[1].split(',')
persons = ['女普通7','女普通8']
changePersons = ['女普通10','女普通9']
   var lib = fl.getDocumentDOM().library.items;
   for(var i=0;i < lib.length;i++) {
      var nameArr = lib[i].name.split('/')
      var name = nameArr[nameArr.length - 1]
      for(var j=0;j < persons.length;j++) {
         if(persons[j] && name.indexOf(persons[j]) > -1 ) {
            fl.getDocumentDOM().library.selectItem(lib[i].name);
            fl.getDocumentDOM().library.renameItem(name.replace(persons[j], changePersons[j]))
         }  
      }  
   }
}






