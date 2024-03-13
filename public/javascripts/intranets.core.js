var Intranets = {}
Intranets.load = (url, data, callback, method="POST") => {

  var params = typeof data == 'string' ? data : Object.keys(data).map(
    function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
  ).join('&');

  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open(method, url);
  xhr.onreadystatechange = function () {
    if (xhr.readyState > 3 && xhr.status == 200) { callback(xhr.responseText); }
  };
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(params);
  return xhr;
}
Intranets.collections = {};
var dialog = document.querySelector('dialog#datacollection_form');
if (dialog && !dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}
if (dialog) {
  dialog.querySelector('.close').addEventListener('click', function () {
    dialog.close();
  });
}
Intranets.collections.add = () => {
  dialog.showModal();
}
Intranets.structure = {};
Intranets.structure.dialog_delete = document.querySelector('dialog.structure__delete');
if (Intranets.structure.dialog_delete && !Intranets.structure.dialog_delete.showModal) {
  dialogPolyfill.registerDialog(Intranets.structure.dialog_delete);
  Intranets.structure.dialog_delete.querySelector('.close').addEventListener('click', function () {
    Intranets.structure.dialog_delete.close();
  });

}
Intranets.structure.dialog_delete_show = () => {
  Intranets.structure.dialog_delete.showModal();
};

Intranets.pages = {};

var components_list_dialog = document.querySelector('dialog#components_list');
if (components_list_dialog && !components_list_dialog.showModal) {
  dialogPolyfill.registerDialog(components_list_dialog);
}

if (components_list_dialog) {
  components_list_dialog.querySelector('.close').addEventListener('click', function () {
    Intranets.pages.closeComponents();
  });
}
Intranets.pages.currentPageIdInsert = 0;
Intranets.pages.openComponents = (pages_id) => {
  Intranets.pages.currentPageIdInsert = pages_id;
  components_list_dialog.showModal();
  
Intranets.pages.propretiesStatus(false);
}
Intranets.pages.closeComponents = () => {
  Intranets.pages.currentPageIdInsert = 0;
  components_list_dialog.close();
}

Intranets.pages.addComponentInPage = (element) => {
  let data ={
    pages_parent: Intranets.pages.currentPageIdInsert,
    element: element
  }
  Intranets.load('/admin/pages/components', data, (result)=>{
    if(result.result == true){
      Intranets.pages.reloadTree();
    }
  })
}

Intranets.pages.deleteComponent = (pages_id) => {
  if(confirm("Do you want really delete this component ?")){

    let data ={
      pages_id: pages_id
    }
    Intranets.load('/admin/pages/components', data, (result)=>{
      if(result.result == true){
      }
      Intranets.pages.reloadTree();
    }, "delete")
  }
}

Intranets.pages.duplicateComponents = (pages_id) => {
  if(confirm("Do you want really duplicate this component ?")){

    let data ={
      pages_id: pages_id
    }
    Intranets.load('/admin/pages/components?id='+pages_id, data, (result)=>{
      if(result.result == true){
      }
      Intranets.pages.reloadTree();
    }, "get")
  }
}

Intranets.pages.reloadTree = ()=>{

  let tree_editor = window.parent.document.getElementById('tree');
  tree_editor.contentWindow.location.reload();
}
Intranets.pages.editComponent = (pages_id)=>{
  let propreties = window.parent.document.getElementById('propreties');
  propreties.src = `/admin/pages/propreties?id=${pages_id}`;
  
Intranets.pages.propretiesStatus(true);
}
Intranets.pages.propretiesStatus = (isOpen)=>{
  let values = isOpen == true ? '30%, 70%':'100%, 0%';
  let frameset_editor = window.parent.document.getElementById('frameset_editor');
  frameset_editor.setAttribute('rows', values);
}