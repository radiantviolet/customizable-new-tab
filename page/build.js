function rebuildPage(){
    if(favZoneWrapper.querySelector(".fav-link")){
        while(favZoneWrapper.querySelector(".fav-link")){
            favZoneWrapper.removeChild(favZoneWrapper.querySelector(".fav-link"));
        }
    }
    browser.storage.local.get(function(items){
        for(var itemID in items){
            if(itemID.substr(0, 3) == "fav"){
                items[itemID].id = itemID;
            }
            else{
                delete items[itemID];
            }
        }

        global.totalSites = Object.keys(items).length;

        if(global.totalSites > 0){
            if(global.randAnimations.indexOf(viewSettings.animation)>-1){
                fillNumArray(global.animationOrder, global.totalSites);
            }
    
            var itemArray = Object.values(items);
            itemArray.sort((a, b) => parseInt(a.order) - parseInt(b.order));
    
            global.initialOrder = itemArray.map(x => x.id).slice();
    
            for(var i=0; i<itemArray.length; i++){
                buildLink(itemArray[i].id, itemArray[i]);
            }
        }    
    });
}

function applyViewSettings(){
    favZone.className = viewSettings.prefScale;
    document.body.style.fontFamily = viewSettings.fontFamily;

    loadScale(viewSettings.prefScale);
    renderSettings();
}

function loadViewSettings(){
    browser.storage.local.get("viewOptions", function(items){
        if(Object.keys(items).indexOf("viewOptions")<0){
            items.viewOptions = {};
        }

        for(var param of Object.keys(defaultSettings)){
            if(!items.viewOptions[param]){
                items.viewOptions[param] = defaultSettings[param];
            }
        }

        Object.assign(viewSettings, items.viewOptions);

        applyViewSettings();
    });
}

function saveViewSettings(){
    browser.runtime.sendMessage({
        "kind": "write-view-options",
        "body": viewSettings
    })
}

function buildLink(itemID, item){
    if(document.getElementById(itemID)){
        var removeMe = document.getElementById(itemID);
        removeMe.parentElement.removeChild(removeMe);
    }

    var itemContainer = document.createElement("A");
    itemContainer.id = itemID;
    itemContainer.className = "fav-link";
    itemContainer.href = item.url;
    itemContainer.title = item.url;

    itemContainer.onclick = function(e){
        if(global.mode != "view"){
            e.preventDefault();
            catchClick(e.target);
        }
    };

    itemContainer.style.order = global.initialOrder.indexOf(itemContainer.id);
    if(item.order != itemContainer.style.order){
        browser.runtime.sendMessage({
            "favID": itemContainer.id,
            "parName": "order",
            "parNewValue": itemContainer.style.order,
            "kind": "set-parameter"
        });
    }

    if(viewSettings.animation != "none"){
        if(global.firstTimeAnimation == true){
            var clearClass;
            var animName = viewSettings.animation.split("-")[0];
            itemContainer.classList.add(animName);
            if(viewSettings.animation.split("-")[1] == "rand"){
                clearClass = global.animationOrder.indexOf(parseInt(itemContainer.style.order)) * global.delayStep * 1000;
            }
            else{
                clearClass = parseInt(itemContainer.style.order) * global.delayStep * 1000;
            }
            itemContainer.style.animationDelay = clearClass/1000 + "s";
            itemContainer.onanimationend = () => {
                itemContainer.classList.remove(animName);
            }
            global.loadedCount++;
            
            if(global.loadedCount == global.totalSites){
                global.firstTimeAnimation = false;
            }
        }
    }

    var itemCapsule = document.createElement("DIV");
    itemCapsule.className = "fav-capsule";

    var itemAccent = document.createElement("DIV");
    itemAccent.className = "fav-accent";
    itemAccent.style.backgroundImage = "radial-gradient(circle at center, rgba(" + item.accent + ", 0.4) 0%, transparent 70%)";

    var itemIMG = document.createElement("IMG");
    itemIMG.src = item.icon;
    itemIMG.className = "fav-icon";

    var itemInfo = document.createElement("DIV");
    itemInfo.className = "fav-info";

    var itemTitle = document.createElement("DIV");
    itemTitle.innerText = item.title;
    itemTitle.className = "fav-title";
    itemTitle.title = item.title;

    var itemHint = document.createElement("DIV");
    itemHint.innerText = item.url;
    itemHint.title = item.url;
    itemHint.className = "fav-url";

    itemContainer.ondragenter = function(){
        if(this != global.draggable){
            moveDummyLink(global.draggable.style.order, this.style.order);
        }
    }

    itemContainer.ondragstart = function(e){
        global.draggable = e.target;
        global.originalOrder = Array.from(document.querySelectorAll(".fav-link")).map(x => x.style.order + x.id);
        window.requestAnimationFrame(function(){
            e.target.style.display = "none";
            dummyLink.className = "dummy-link show";
            moveDummyLink(global.draggable.style.order, e.target.style.order);
        });
    }

    itemContainer.ondragend = function(){
        this.style.removeProperty("display");
        dummyLink.className = "dummy-link";

        global.newOrder = Array.from(document.querySelectorAll(".fav-link")).map(x => x.style.order + x.id);

        if(!compareArrays(global.originalOrder, global.newOrder)){
            var flArray = Array.from(document.querySelectorAll(".fav-link"));
            for(var i=0; i<flArray.length; i++){
                browser.runtime.sendMessage({
                    "favID": flArray[i].id,
                    "parName": "order",
                    "parNewValue": flArray[i].style.order,
                    "kind": "set-parameter"
                });
            }
            if(viewSettings.sort != "user-defined"){
                modifyViewSetting("sort", "user-defined");
                renderParameter("sort");
                notify(browser.i18n.getMessage("SortingResetDrag"), "success");
            }
        }
    }

    var closeBtn = document.createElement("DIV");
    closeBtn.className = "delete-fav";
    closeBtn.onclick = function(e){
        deleteFav(e.target.closest(".fav-link").id);
    }

    itemInfo.appendChild(itemTitle);
    itemInfo.appendChild(itemHint);

    itemCapsule.appendChild(itemAccent);
    itemCapsule.appendChild(itemIMG);
    itemCapsule.appendChild(closeBtn);

    itemContainer.appendChild(itemCapsule);
    itemContainer.appendChild(itemInfo);

    favZoneWrapper.appendChild(itemContainer);
}

function catchClick(el){
    var lnk = el.closest("a");
    if(global.mode == "edit"){
        openWindow("add", lnk.id);
    }
}

function deleteFav(eID){
    openWindow("delete", eID);
}

function loadScale(scaleType){
    var scaleIndicators = document.querySelectorAll(".scale-wrapper > div");
    for(var sI of scaleIndicators){
        sI.dataset.active = "false";
        if(sI.id == scaleType){
            sI.dataset.active = "true";
            viewSettings.prefScale = scaleType;
            saveViewSettings();

            favZone.className = viewSettings.prefScale.split("scale-")[1];
        }
    }
}

function renderSettings(){
    var params = Array.from(Object.keys(settings));

    for(var param of params){
        renderParameter(param);
    }
}

function renderParameter(param){
    var stID = settings[param].id;

    if(settings[param].type == "toggle"){
        processToggle(stID, parseBool(viewSettings[param]));
    }
    else if(settings[param].type == "input"){
        document.getElementById(stID).value = viewSettings[param];
    }
    else if(settings[param].type == "select"){
        document.getElementById(viewSettings[param]).selected = true;
    }
}

function saveSettings(paramID, value){
    settings[paramID]["value"] = value;
    
    saveViewSettings();
}

function fillNumArray(arr, max){
    while(arr.length < max){
        var rN = getRandomInt(0, max);
        if(arr.indexOf(rN) === -1) arr.push(rN);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}