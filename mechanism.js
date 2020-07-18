var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const colorThief = new ColorThief();

var sortTypes = {
    "name-asc": "title",
    "name-desc": "-title"
}

var favFields = ["title", "url", "order", "icon", "accent"];

var VOallowedValues = {
    "fontFamily": "noHTML",
    "prefScale": ["scale-large-icons", "scale-small-icons", "scale-large-list", "scale-small-list"],
    "glow": ["true", "false"],
    "nightMode": ["true", "false"],
    "autoNightMode": ["true", "false"],
    "autoNMbeginHours": "hours",
    "autoNMbeginMinutes": "minutes",
    "autoNMendHours": "hours",
    "autoNMendMinutes": "minutes",
    "compactMode": ["true", "false"],
    "animation": ["none", "fall-rand", "fall-order", "fade-rand", "fade-order", "grow-rand", "grow-order"],
    "sort": ["user-defined", "name-asc", "name-desc"]
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

var tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

browser.menus.create({
    id: "custom-new-tab-push-site",
    title: browser.i18n.getMessage("ContextMenuButtonTitle"),
    contexts: ["tab", "all"],
    documentUrlPatterns: ["*://*/*"]
});

browser.menus.onClicked.addListener((info, tab) => {
    if(info.menuItemId == "custom-new-tab-push-site"){
        getFavoriteByURL(tab.url, function(result){
            if(result.error){
                getUniqueID(function(generatedID){
                    writeFavoritebyTab("fav"+generatedID, tab);
                });
            }
            else{
                writeFavoritebyTab(result["id"], tab, result.body);
            }
        });
    }
});

const toDataURL = url => fetch(url)
    .then(response => response.blob())
    .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
}))

function isValidURL(u){
    if(/(http(s?)):\/\//i.test(u)){
        return true;
    }
    else{
        return false;
    }
}


function generateString(){
    var result = '';
    var characters  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for( var i=0; i<10; i++){
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}

function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

function sanitize(str) {
    if(typeof str === 'string'){
        return str.replace(/[&<>]/g, replaceTag);
    }
    else{
        return str;
    }
}

function isValidColor(strColor) {
    var s = new Option().style;
    s.color = strColor;

    return s.color == strColor.toLowerCase();
}

function isValidBase64Image(b64string){
    var isValid = false;
    if((b64string.startsWith("data:image"))&&(base64regex.test(b64string.split("base64,")[1]))){
        isValid = true;
    }
    return isValid;
}

function isValidImagePath(path){
    return path.startsWith("../graphics/");
}

function setTimeValue(type, value){
    if(type == "hours"){
        if(Math.abs(parseInt(value)) < 10){
            return "0" + Math.max(0, Math.min(parseInt(value), 23));
        }
        else{
            return "" + Math.max(0, Math.min(parseInt(value), 23));
        }
    }
    else if(type == "minutes"){
        if(Math.abs(parseInt(value)) < 10){
            return "0" + Math.max(0, Math.min(parseInt(value), 59));
        }
        else{
            return "" + Math.max(0, Math.min(parseInt(value), 59));
        }
    }
}

function handleImageAndColor(dataSource){
    return new Promise(function(resolve, reject){
        var resultObject = {};
        var dN = Math.floor(Math.random() * 3);
        var storedURL = "../graphics/_default_favicon_" + dN + ".png";
        defURL = storedURL;
        var gotImage = undefined;
        if(dataSource.gotImage){ gotImage = dataSource.gotImage }

        if(dataSource.icon){
            if(dataSource.icon.length > 0){
                defURL = dataSource.icon;
            }
        }
    
        getDataImage(defURL, gotImage).then(b64string => {
            resultObject.icon = b64string;
    
            //setting primary color
            if(isValidColor("rgb("+dataSource.accent+")")){
                resultObject.accent = dataSource.accent;
    
                resolve(resultObject);
            }
            else{
                var imageHelper = document.createElement("IMG");
                imageHelper.setAttribute('crossOrigin', '');
                imageHelper.src = resultObject.icon;

                imageHelper.addEventListener('error', function() {
                    imageHelper.src = storedURL;
                });
            
                imageHelper.addEventListener('load', function() {
                    var colorArray = colorThief.getColor(imageHelper);
                    resultObject.accent = colorArray.join(", ");
                    
                    resolve(resultObject);
                });
            }
        });
    });
}

function validateViewOptions(dataBody){
    return new Promise(function(resolve, reject){
        if(dataBody != null){
            if(typeof dataBody === 'object'){
                var newViewSettings = {};
            
                for(var dataField of Object.keys(dataBody)){
                    if(typeof dataBody[dataField] === 'string'){
                        if(VOallowedValues[dataField] == "noHTML"){
                            newViewSettings[dataField] = sanitize(dataBody[dataField]);
                        }
                        else if((VOallowedValues[dataField] == "hours")||(VOallowedValues[dataField] == "minutes")){
                            newViewSettings[dataField] = setTimeValue(VOallowedValues[dataField], dataBody[dataField]);
                        }
                        else{
                            if(VOallowedValues[dataField].indexOf(dataBody[dataField])>-1){
                                newViewSettings[dataField] = dataBody[dataField];
                            }
                        }
                    }
                    else{
                        newViewSettings[dataField] = defaultSettings[dataField];
                    }
                }
        
                resolve(newViewSettings);
            }
            else{
                resolve(defaultSettings);
            }
        }
        else{
            resolve(defaultSettings);
        }
    });
}

function validateBackup(obj){
    return new Promise(function(resolve, reject){
        //bare minimum
        var newObject = {};
        newObject.viewOptions = {};
        Object.assign(newObject.viewOptions, defaultSettings);

        //check if it exists and is an object
        if(obj != null){
            if(typeof obj === 'object'){
                //validate view settings
                validateViewOptions(obj.viewOptions).then(validatedVO => {
                    delete obj.viewOptions;
                    newObject.viewOptions = {};
                    Object.assign(newObject.viewOptions, validatedVO);

                    //check fav fields
                    var favFieldKeys = Object.keys(obj);
                    var expectedLength = Object.values(obj).filter(val => typeof val === 'object').length;
                    var collectCallbacks = 0;

                    for(var favField of favFieldKeys){
                        if(obj[favField] != null){
                            if(typeof obj[favField] === 'object'){
                                writeFavoritebyData(obj[favField], favField, function(result){
                                    if(result != "error"){
                                        var key = Object.keys(result)[0];
                                        newObject[key] = {};
                                        Object.assign(newObject[key], result[key]);
                                    }

                                    collectCallbacks++;
                                    if(collectCallbacks == expectedLength){
                                        resolve(newObject);
                                    }
                                });
                            }
                        }
                    }
                });
            }
            else{
                resolve(newObject);
            }
        }
        else{
            resolve(newObject);
        }
    });
}

function getFavoriteByID(id, callback){
    browser.storage.local.get(function(items){
        var match;
        var wentThrough = 0;
        for(var itemID of Object.keys(items)){
            if(itemID == id){
                match = itemID;
            }

            wentThrough += 1;
            if(wentThrough == Object.keys(items).length){
                if(match){
                    var responseObject = {};
                    responseObject["id"] = match;
                    responseObject["body"] = items[match];
                    callback(responseObject);
                }
                else{
                    callback({"error": true});
                }
            }
        }
    });
}

function getFavoriteByURL(checkUrl, callback){
    browser.storage.local.get(function(items){
        var match;
        var wentThrough = 0;
        for(var itemID of Object.keys(items)){
            if((items[itemID].url == checkUrl)){
                match = itemID;
            }

            wentThrough += 1;
            if(wentThrough == Object.keys(items).length){
                if(match){
                    var responseObject = {};
                    responseObject["id"] = match;
                    responseObject["body"] = items[match];
                    callback(responseObject);
                }
                else{
                    callback({"error": true});
                }
            }
        }
    });
}

function writeFavOutside(dataSource, id, callback){
    if(id == undefined){
        id = "";
    }
    getUniqueID(function(generatedID){
        if(id.length < 1){
            id = "fav"+generatedID;
        }
        writeFavoritebyData(dataSource, id, function(result){
            if(result != "error"){
                browser.storage.local.set(result).then(function(){
                    browser.storage.local.get("viewOptions").then(items => {
                        if(sortTypes[items.viewOptions.sort]){
                            sortFaves(items.viewOptions.sort, function(){    
                                callback();
                            });
                        }
                        else{
                            callback();
                        }
                    });
                });
            }
            else{
                callback();
            }
        });
    });
}

function writeFavoritebyData(dataSource, id, callback){
    //creating new memory cell
    var writeObject = {};
    writeObject[id] = {};

    //grabbing info from tab
    for(var key in Object.keys(dataSource)){
        if(dataSource[key] == null){
            dataSource.key = "";
        }
        else{
            dataSource.key += "";
        }
    }

    if((dataSource.url.length < 1)||(dataSource.title.length < 1)){
        callback("error");
        return;
    }

    writeObject[id].url = sanitize(dataSource.url);
    writeObject[id].title = sanitize(dataSource.title);

    if(!isNaN(parseInt(dataSource.order))){
        writeObject[id].order = dataSource.order;
    }
    else{
        writeObject[id].order = "-1";
    }

    handleImageAndColor(dataSource).then(result => {
        writeObject[id].accent = sanitize(result.accent);
        writeObject[id].icon = sanitize(result.icon);

        callback(writeObject);
    });
}

function writeFavoritebyTab(id, tab, info){
    browser.tabs.executeScript(tab.id, {file: './inject.js'}).then(gotImage => {
        if(typeof gotImage === 'string' || gotImage instanceof String){
            gotImage = sanitize(gotImage);
        }

        //creating new memory cell
        var writeObject = {};
        writeObject[id] = {};
    
        //grabbing info from tab
        if(tab.url){
            writeObject[id].url = sanitize(tab.url);
        }
        else{
            browser.tabs.sendMessage(tab.id, {
                "message": browser.i18n.getMessage("SiteAddContextError"),
                "kind": "error"
            });
            return;
        }
        writeObject[id].title = sanitize(tab.title);
    
        //if order already exists in memory
        if(info){
            writeObject[id].order = info.order;
        }
        else{
            writeObject[id].order = "-1";
        }

        if(tab.favIconUrl){ writeObject[id].icon = sanitize(tab.favIconUrl) }
        if(gotImage){ writeObject[id].gotImage = sanitize(gotImage) }

        handleImageAndColor(writeObject[id]).then(resultObject => {
            writeObject[id].icon = resultObject.icon;
            writeObject[id].accent = resultObject.accent;
            delete writeObject[id].gotImage;
            
            browser.storage.local.set(writeObject).then(function(){
                browser.storage.local.get("viewOptions").then(items => {
                    if(sortTypes[items.viewOptions.sort]){
                        sortFaves(items.viewOptions.sort, function(){
                            browser.tabs.sendMessage(tab.id, {
                                "message": browser.i18n.getMessage("SiteAddContextSuccess"),
                                "kind": "success"
                            });
                        });
                    }
                    else{
                        browser.tabs.sendMessage(tab.id, {
                            "message": browser.i18n.getMessage("SiteAddContextSuccess"),
                            "kind": "success"
                        });
                    }
                });
            });
        });
    });
}

function getUniqueID(callback){
    browser.storage.local.get(function(items){
        var stringSlot;
        var matched = true;
    
        while(matched){
            stringSlot = generateString();
            if(Object.keys(items).indexOf("fav"+stringSlot)<0){
                matched = false;
                callback(stringSlot);
                break;
            }
        }
    });
}

function getDataImage(defaultIcon, gotImage){
    return new Promise(function(resolve, reject){
        if((gotImage != undefined)&&(isValidURL(gotImage))){
            toDataURL(gotImage)
            .then(dataUrl => {
                if(dataUrl.startsWith("data:image")){
                    resolve(dataUrl);
                }
                else{
                    resolve(defaultIcon);
                }
            })
            .catch(err => {
                resolve(defaultIcon);
            });
        }
        else if(gotImage != undefined){
            if(typeof gotImage === 'string' || gotImage instanceof String){
                if(isValidBase64Image(gotImage)){
                    resolve(gotImage);
                }
                else{
                    resolve(defaultIcon);
                }
            }
            else{
                resolve(defaultIcon);
            }
        }
        else{
            resolve(defaultIcon);
        }
    });
}

browser.runtime.onMessage.addListener((data, sender) => {
    if(data.kind === "restore-backup"){
        var receivedData = sanitize(data.body);
        var receivedObject;
        try{
            receivedObject = JSON.parse(receivedData);
            validateBackup(receivedObject).then(resultObject => {
                if(resultObject != null){
                    browser.storage.local.clear().then(function(){
                        browser.storage.local.set(resultObject, 
                            function(){
                                browser.tabs.sendMessage(sender.tab.id, {
                                    "kind": "reload-after-backup"
                                });
                            }
                        );
                    });
                }
            });
        }
        catch(err){
            browser.tabs.sendMessage(sender.tab.id, {
                "kind": "error",
                "body": browser.i18n.getMessage("BackupRestorationError")
            });
        }
    }
    else if(data.kind === "set-parameter"){
        updateFavParameter(data.favID, data.parName, data.parNewValue);
    }
    else if(data.kind === "get-fav-by-id"){
        getFavoriteByID(data.body, function(newData){
            browser.tabs.sendMessage(sender.tab.id, {
                "kind": "fav-id-found",
                "body": newData
            });
        });
    }
    else if(data.kind === "write-fav-outside"){
        if((data.body.source.url.length >= 1)&&(data.body.source.title.length >= 1)){
            writeFavOutside(data.body.source, data.body.id, function(){
                browser.tabs.sendMessage(sender.tab.id, {
                    "kind": "reload-after-writing"
                });
            });
        }
        else{
            browser.tabs.sendMessage(sender.tab.id, {
                "kind": "error",
                "body": browser.i18n.getMessage("SiteAddOutsideError")
            });
        }
    }
    else if(data.kind === "delete-fav-outside"){
        getFavoriteByID(data.body, function(response){
            if(response.error){
                browser.tabs.sendMessage(sender.tab.id, {
                    "kind": "error",
                    "body": browser.i18n.getMessage("DeleteDamagedID")
                });
            }
            else{
                browser.storage.local.get(function(items){
                    var wentThrough = 0;
                    var newObject = {};
                    for(var itemID of Object.keys(items)){
                        if(itemID != data.body){
                            newObject[itemID] = items[itemID];
                        }

                        wentThrough++;
                        if(wentThrough == Object.keys(items).length){
                            browser.storage.local.clear().then(function(){
                                browser.storage.local.set(newObject).then(function(){
                                    browser.tabs.sendMessage(sender.tab.id, {
                                        "kind": "reload-after-writing"
                                    });
                                });
                            });
                        }
                    }
                });
            }
        });
    }
    else if(data.kind === "write-view-options"){
        validateViewOptions(data.body).then(newViewSettings => {
            browser.storage.local.set({
                "viewOptions": newViewSettings
            });
        });
    }
    else if(data.kind === "sort-items"){
        sortFaves(data.body, function(){
            browser.tabs.sendMessage(sender.tab.id, {
                "kind": "reload-after-writing"
            });
        });
    }
});

function sortFaves(sType, callback){
    if(sortTypes[sType]){
        var tempArray = [];
        var resultObject = {};
        browser.storage.local.get(function(items){
            for(var key of Object.keys(items)){
                if(key.startsWith("fav")){
                    items[key].id = key;
                    tempArray.push(items[key]);
                }
            }

            tempArray.sort(dynamicSort(sortTypes[sType]));

            for(var i=0; i<tempArray.length; i++){
                var newID = tempArray[i].id;
                resultObject[newID] = tempArray[i];
                delete resultObject[newID].id;
                resultObject[newID].order = i;
            }
            
            browser.storage.local.set(resultObject).then(function(){
                callback();
            });
        });
    }
}

function updateFavParameter(favID, parName, parNewValue){
    browser.storage.local.get(favID, function(item){
        if(Object.keys(item[favID].length > 0)){
            item[favID][parName] = parNewValue;
            browser.storage.local.set(item);
        }
    });
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        if(typeof a[property] == "string"){
            var result = (a[property].toLowerCase() < b[property].toLowerCase()) ? -1 : (a[property].toLowerCase() > b[property].toLowerCase()) ? 1 : 0;
        }
        else{
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        }
        return result * sortOrder;
    }
}