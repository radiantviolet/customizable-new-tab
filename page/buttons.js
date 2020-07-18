window.addEventListener("load", function(){
    var imageButtons = document.querySelectorAll(".image-button");
    var textButtons = document.querySelectorAll(".text-button");
    var scaleToggles = document.querySelectorAll(".scale-wrapper > div");
    var toggles = document.querySelectorAll(".simple-toggle-wrap .control");
    var settingsInputs = document.querySelectorAll(".settings-list input");
    var settingSelects = document.querySelectorAll(".settings-list select");

    for(var imgBtn of imageButtons){
        imgBtn.addEventListener("click", function(){
            pressEvent(this);
        });
    }
    for(var tBtn of textButtons){
        tBtn.addEventListener("click", function(){
            pressEvent(this);
        });
    }
    for(var sTg of scaleToggles){
        sTg.addEventListener("click", function(){
            loadScale(this.id);
        });
    }
    eItems.windowLayer.addEventListener("click", function(e){
        if(e.target === eItems.windowLayer){
            closeWindow();
        }
    });
    for(var toggle of toggles){
        toggle.onclick = function(){
            processToggle(this.id);
        }
    }
    for(var inp of settingsInputs){
        inp.onchange = function(){
            modifyViewSetting(getSettingsById(this.id), this.value);
            if(viewSettings.autoNightMode == "true"){
                if(this.dataset.autoNm == "true"){
                    isItNight();
                }
            }
        }
    }
    for(var slc of settingSelects){
        slc.onchange = function(){
            var value = this[this.selectedIndex].id;
            if(this.id == "sort-type"){
                browser.runtime.sendMessage({
                    "body": value,
                    "kind": "sort-items"
                })
            }
            if(this.id == "entrance-animation"){
                global.loadedCount = 0;
                global.firstTimeAnimation = true;
                rebuildPage();
            }

            modifyViewSetting(getSettingsById(this.id), value);
        }
    }
});

function pressEvent(elem){
    if(elem.id){
        if((elem.id == "btn-settings")||(elem.id == "btn-close-settings")){
            eItems.wrapper.classList.toggle("show-settings");
        }
        else if(elem.id == "btn-make-backup"){
            browser.storage.local.get(function(items){
                eItems.taBackup.value = JSON.stringify(items, false, 2);
            });
        }
        else if(elem.id == "btn-read-backup"){
            browser.runtime.sendMessage({
                "body": eItems.taBackup.value,
                "kind": "restore-backup"
            })
        }
        else if(elem.id == "btn-close-window"){
            closeWindow();
        }
        else if(elem.id == "btn-edit"){
            if(global.mode != "edit"){
                changeMode("edit");
            }
            else{
                changeMode("view");
                rebuildPage();
            }
        }
        else if(elem.id == "btn-kill"){
            if(global.mode != "delete"){
                changeMode("delete");
            }
            else{
                changeMode("view");
            }
        }
        else if(elem.id == "btn-save-site"){
            var source = {};
            source.id = document.getElementById("wd-site-id").value;
            source.title = document.getElementById("wd-site-name").value;
            source.url = document.getElementById("wd-site-address").value;
            source.order = document.getElementById("wd-site-order").value;
            source.icon = document.getElementById("wd-site-file-b64").value;

            if(global.newColor){
                source.accent = hexToRgb(document.getElementById("wd-accent").value);
            }

            browser.runtime.sendMessage({
                "body": {
                    "source": source,
                    "id": source.id,
                },
                "kind": "write-fav-outside"
            });
        }
        else if(elem.id == "btn-delete-ok"){
            var deleteID = document.getElementById("wd-delete-id").value;
            browser.runtime.sendMessage({
                "body": deleteID,
                "kind": "delete-fav-outside"
            })
        }
        else if(elem.id == "btn-delete-cancel"){
            closeWindow();
        }
        else if(elem.id == "btn-default-font"){
            modifyViewSetting("fontFamily", defaultSettings["fontFamily"]);
            renderParameter("fontFamily");
        }
        else if(elem.id == "btn-about"){
            openWindow('about');
        }
        else if(elem.id == "btn-localization"){
            openWindow('help-localize');
        }
        else if(elem.dataset.call){
            openWindow(elem.dataset.call);
        }
    }
}

function changeMode(newMode){
    global.mode = newMode;
    if(newMode === "view"){
        document.querySelector(".toolbelt").removeAttribute("data-action");
        favZoneWrapper.removeAttribute("data-action");
        actionProcess.innerText = "";
    }
    else{
        document.querySelector(".toolbelt").dataset.action = newMode;
        favZoneWrapper.dataset.action = newMode;
        actionProcess.innerText = actionStrings[newMode];
    }
}

function openWindow(parentId, favID){
    wOW = eItems.window.offsetWidth;
    wOH = eItems.window.offsetHeight;

    eItems.windowLayer.classList.toggle("show");
    eItems.windowTitle.innerText = windowHeaders[parentId];
    if(eItems.window.dataset.current){
        document.getElementById("win-"+eItems.window.dataset.current).append(...eItems.windowBody.childNodes);
    }
    eItems.windowBody.append(...document.getElementById("win-"+parentId).childNodes);
    eItems.window.dataset.current = parentId;
    moveWindow(window.innerWidth/2, window.innerHeight/2, eItems.window.offsetWidth/2, eItems.window.offsetHeight/2);

    if(parentId == "add"){
        processToggle("accent-toggle", false);

        eCtx = eItems.windowBody.querySelector("canvas").getContext("2d");
        for(var inp of Array.from(eItems.windowBody.querySelectorAll("input"))){
            inp.value = "";
        }
        eItems.windowBody.querySelector("canvas").className = "";
        if(favID){
            document.getElementById("wd-site-id").value = favID;
            browser.runtime.sendMessage({
                "body": favID,
                "kind": "get-fav-by-id"
            });
        } 
        
        eCtx.canvas.width = 64;
        eCtx.canvas.height = 64;

        eCtx.clearRect(0, 0, 64, 64);
        
        eItems.windowBody.querySelector("canvas").className = "visible";
        
        document.getElementById("wd-file").onchange = function(){
            var getFile = document.getElementById("wd-file").files[0];
            getBase64fromFile(getFile, function(newB64){
                document.getElementById("wd-site-file-b64").value = newB64;
                loadImage(newB64, eCtx);
            });
        }
    }
    else if(parentId == "delete"){
        for(var inp of Array.from(eItems.windowBody.querySelectorAll("input"))){
            inp.value = "";
        }
        document.getElementById("wd-delete-id").value = favID;
        browser.runtime.sendMessage({
            "body": favID,
            "kind": "get-fav-by-id"
        });
    }

}

function loadIntoWindow(dataObj){
    if(eItems.window.dataset.current == "add"){
        processToggle("accent-toggle", true);

        var hexColor = rgbToHex(Array.from(dataObj.body.accent.split(", ")));

        document.getElementById("wd-site-name").value = dataObj.body.title;
        document.getElementById("wd-site-address").value = dataObj.body.url;
        document.getElementById("wd-site-order").value = dataObj.body.order;
        document.getElementById("wd-site-file-b64").value = dataObj.body.icon;
        document.getElementById("wd-accent").value = hexColor;
    
        loadImage(dataObj.body.icon, eCtx);
    }
    if(eItems.window.dataset.current == "delete"){
        document.getElementById("wd-delete-prompt").innerText = browser.i18n.getMessage("DeletePrompt", dataObj.body.title);
    }
    moveWindow(window.innerWidth/2, window.innerHeight/2, eItems.window.offsetWidth/2, eItems.window.offsetHeight/2);
}

function loadImage(b64string, ctx){
    var tempImg = new Image();

    tempImg.onload = function(){
        ctx.clearRect(0, 0, 64, 64);
        ctx.drawImage(tempImg, 0, 0, tempImg.width, tempImg.height, 0, 0, 64, 64);
    }
    tempImg.src = b64string;
}

function closeWindow(){
    eItems.windowLayer.classList.remove("show");
}

function getSettingsById(sID){
    var wentThrough = 0;
    for(var field of Object.keys(settings)){
        if(settings[field].id == sID){
            return field;
        }
        wentThrough++;
        if(wentThrough == Object.keys(settings).length){
            return undefined;
        }
    }
}

function modifyViewSetting(setting, value){
    if(viewSettings[setting]){
        viewSettings[setting] = value;
    
        if(setting == "glow"){
            favZoneWrapper.dataset.glow = value;
        }
        else if(setting == "nightMode"){
            document.body.dataset.night = value;
        }
        else if(setting == "fontFamily"){
            document.body.style.fontFamily = value;
        }

        saveViewSettings();
    }
}

function processToggle(eID, forcedValue){
    var toggleBody = document.getElementById(eID);

    if(forcedValue != undefined){
        if(forcedValue == true){
            if(reverseToggles.indexOf(eID)<0){
                toggleBody.className = "control selected";
            }
            else{
                toggleBody.className = "control";
            }
        }
        else{
            if(reverseToggles.indexOf(eID)<0){
                toggleBody.className = "control";
            }
            else{
                toggleBody.className = "control selected";
            }
        }
    }
    else{
        toggleBody.classList.toggle("selected");
    }

    var sID = getSettingsById(eID);
    if(sID){
        if(forcedValue != undefined){
            modifyViewSetting(sID, forcedValue.toString());
        }
        else{
            var newBool = !parseBool(viewSettings[sID])
            modifyViewSetting(sID, newBool.toString());
        }
    }

    if(eID == "accent-toggle"){
        if(forcedValue != undefined){
            global.newColor = forcedValue;
            eItems.window.dataset.pickColors = global.newColor;
        }
        else{
            global.newColor = !global.newColor;
            eItems.window.dataset.pickColors = global.newColor;
        }
    }
    else if(eID == "auto-night-theme-toggle"){
        if(forcedValue != undefined){
            document.getElementById("settings-zone").dataset.nightShow = forcedValue;
        }
        else{
            document.getElementById("settings-zone").dataset.nightShow = parseBool(viewSettings.autoNightMode);
        }
        if(viewSettings.autoNightMode == "true"){
            isItNight();
        }
    }
    else if(eID == "compact-toggle"){
        if(forcedValue != undefined){
            favZone.dataset.compactMode = forcedValue;
        }
        else{
            favZone.dataset.compactMode = parseBool(viewSettings.compactMode);
        }
    }
}