var global = {};
global.mode = "view";
global.newColor = true;
global.originalOrder;
global.newOrder;
global.totalSites = 0;
global.animationOrder = [];
global.randAnimations = ["fall-rand", "fade-rand", "grow-rand"];
global.delayStep = 0.05;
global.draggable;
global.initialOrder;
global.firstTimeAnimation = true;
global.loadedCount = 0;

var actionStrings = {
  "edit": browser.i18n.getMessage("ActionStringEdit"),
  "delete": browser.i18n.getMessage("ActionStringDelete")
}

var reverseToggles = [
  "accent-toggle"
]

var windowHeaders = {
  "add": browser.i18n.getMessage("WindowHeaderAdd"),
  "delete": browser.i18n.getMessage("WindowHeaderDelete"),
  "about": browser.i18n.getMessage("WindowHeaderAbout"),
  "help-localize": browser.i18n.getMessage("WindowHeaderHelpLocalize")
}

var settings = {
  "glow": {
    "type": "toggle",
    "id": "glow-toggle"
  },
  "autoNightMode": {
    "type": "toggle",
    "id": "auto-night-theme-toggle"
  },
  "autoNMbeginHours": {
    "type": "input",
    "id": "begin-hh"
  },
  "autoNMbeginMinutes": {
    "type": "input",
    "id": "begin-mm"
  },
  "autoNMendHours": {
    "type": "input",
    "id": "end-hh"
  },
  "autoNMendMinutes": {
    "type": "input",
    "id": "end-mm"
  },
  "nightMode": {
    "type": "toggle",
    "id": "night-theme-toggle"
  },
  "compactMode": {
    "type": "toggle",
    "id": "compact-toggle"
  },
  "animation": {
    "type": "select",
    "id": "entrance-animation"
  },
  "fontFamily": {
    "type": "input",
    "id": "font-family"
  },
  "sort": {
    "type": "select",
    "id": "sort-type"
  }
}

var defaultSettings = {
  "fontFamily": "Ubuntu, Arial, Helvetica, sans-serif",
  "prefScale": "scale-large-icons",
  "glow": "true",
  "nightMode": "false",
  "autoNightMode": "true",
  "autoNMbeginHours": "22",
  "autoNMbeginMinutes": "59",
  "autoNMendHours": "08",
  "autoNMendMinutes": "00",
  "compactMode": "false",
  "animation": "none",
  "sort": "user-defined"
}

var viewSettings = {};
var favZone, favZoneWrapper, dummyLink, bottomToolbar, actionProcess;
var eItems = {};
var wOW, wOH;
var notifyTimer;

var eCtx;

window.onload = function(){
    favZone = document.getElementById("fav-zone");
    favZoneWrapper = document.getElementById("fav-zone-wrapper");
    dummyLink = document.getElementById("dummy-link");
    actionProcess = document.querySelector(".action-process");
    editableLinks = document.getElementById("edit-links");

    loadViewSettings();
    rebuildPage();

    eItems.wrapper = document.querySelector(".wrapper");
    eItems.taBackup = document.getElementById("ta-backup");
    eItems.window = document.getElementById("window");
    eItems.windowTitle = document.getElementById("window-title");
    eItems.windowHeader = document.getElementById("window-header");
    eItems.windowBody = document.getElementById("window-main");
    eItems.windowLayer = document.getElementById("window-layer");
    
    browser.runtime.onMessage.addListener((data) => {
        if(data.kind === "reload-after-backup"){
          global.loadedCount = 0;
          global.firstTimeAnimation = true;
          document.getElementById("ta-backup").value = "";
          rebuildPage();
          loadViewSettings();
        }
        else if(data.kind === "error"){
          notify(data.body, "error");
        }
        else if(data.kind === "fav-id-found"){
          loadIntoWindow(data.body, "add");
        }
        else if(data.kind === "reload-after-writing"){
          closeWindow();
          rebuildPage();
        }
    });

    if(document.querySelector(".simple-toggle-wrap .control")){
      var allCtrl = Array.from(document.querySelectorAll(".simple-toggle-wrap .control"));

      allCtrl.forEach(function(ctrl){
          ctrl.addEventListener("click", function(){
              this.parentElement.classList.toggle("selected");
          });
      });
    }

    isItNight();
    setInterval(function(){
      isItNight();
    }, 10000);
}

function moveDummyLink(oldSlot, newSlot){
    if(document.querySelector(".fav-link")){
        var rawArray = Array.from(document.querySelectorAll(".fav-link"));
        var elemArray = [];

        for(var elem of rawArray){
          elemArray[parseInt(elem.style.order)] = elem;
        }

        arrayMove(elemArray, oldSlot, newSlot);
        dummyLink.style.order = newSlot;

        for(var elem of elemArray){
          elem.style.order = elemArray.indexOf(elem);
        }
    }
}

function getBase64fromFile(file, callback) {
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    callback(reader.result);
  };
  reader.onerror = function (error) {
    void(0);
  };
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgbArray) {
  var r = parseInt(rgbArray[0]);
  var g = parseInt(rgbArray[1]);
  var b = parseInt(rgbArray[2]);
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    parseInt(result[1], 16) + ", " +
    parseInt(result[2], 16) + ", " +
    parseInt(result[3], 16)
  : null;
}

function parseBool(str){
  if(str.typeof == "bool"){
    return str;
  }
  else{
    if(str == "true"){ return true; }
    else if(str == "false"){ return false; }
    else{ return undefined; }
  }
}

function isItNight(){
  if(viewSettings.autoNightMode == "true"){
    var date = new Date;
    var currentTime = date.getHours() * 60 + date.getMinutes();
    var beginTime = parseInt(viewSettings.autoNMbeginHours) * 60 + parseInt(viewSettings.autoNMbeginMinutes);
    var endTime = parseInt(viewSettings.autoNMendHours) * 60 + parseInt(viewSettings.autoNMendMinutes);
    var inInterval = false;
  
    if(beginTime >= endTime){
      if((currentTime >= beginTime)||(currentTime < endTime)){
        inInterval = true;
      }
    }
    else{
      if((currentTime >= beginTime)&&(currentTime < endTime)){
        inInterval = true;
      }
    }
  
    if(inInterval){
      processToggle("night-theme-toggle", true);
    }
    else{
      processToggle("night-theme-toggle", false);
    }
  }
}

function notify(text, kind){
  var notification = document.querySelector(".notification");
  notification.innerText = text;
  notification.className = "notification";
  notification.className += " " + kind;
  notification.dataset.active = "true";

  if(notifyTimer){
    clearTimeout(notifyTimer);
  }

  setTimeout(function(){
    notification.dataset.active = "false";
  }, 5000);
}

function compareArrays(arr1, arr2){
  var identical = 0;

  arr1.sort();
  arr2.sort();

  if(arr1.length != arr2.length){
    return false;
  }
  else{
    for(var i=0; i<arr1.length; i++){
      if(arr1[i] === arr2[i]){
        identical++;
      }
      if(i == arr1.length - 1){
        if(identical == arr1.length){
          return true;
        }
        else{
          return false;
        }
      }
    }
  }
}

function arrayMove(arr, from, to) {
  arr.splice(to, 0, arr.splice(from, 1)[0]);
};