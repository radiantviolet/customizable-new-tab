window.addEventListener("load", function(){
    var fields = ["title", "placeholder"];

    var localizationItems = Array.from(document.querySelectorAll("[data-localization]"));

    for(var loc of localizationItems){
        if(browser.i18n.getMessage(camelCase(loc.dataset.localization) + "innerText")){
            loc.innerText = browser.i18n.getMessage(camelCase(loc.dataset.localization) + "innerText");
        }
        for(var fld of fields){
            if(browser.i18n.getMessage(camelCase(loc.dataset.localization) + fld)){
                loc.setAttribute(fld, browser.i18n.getMessage(camelCase(loc.dataset.localization) + fld));
            }
        }
    }
});

function camelCase(str){
    return Array.from(str.split("-")).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join("");
}