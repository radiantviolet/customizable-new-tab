function spawnNotice(urlString, kind){
    var noticeBody = document.createElement("DIV");

    noticeBody.style.opacity = 0;
    noticeBody.style.transition = "1s opacity";

    noticeBody.style.position = "fixed";
    noticeBody.style.zIndex = 2147483647;

    noticeBody.style.bottom = "auto";
    noticeBody.style.top = "12px";
    noticeBody.style.left = "auto";
    noticeBody.style.right = "12px";

    if(kind == "error" ){
        noticeBody.style.backgroundColor = "rgb(208, 16, 16)";
    }
    else{
        noticeBody.style.backgroundColor = "rgb(60, 93, 221)";
    }
    noticeBody.style.color = "rgb(255, 255, 255)";
    noticeBody.style.fontFamily = "Arial, Helvetica, sans-serif";
    noticeBody.style.fontSize = "12px";

    noticeBody.style.padding = "8px";
    noticeBody.style.maxWidth = "300px";
    noticeBody.style.borderRadius = "4px";

    noticeBody.innerText = urlString;
    document.body.appendChild(noticeBody);
    
    setTimeout(function(){
        noticeBody.style.opacity = 1;
    }, 100);

    setTimeout(function(){
        noticeBody.style.opacity = 0;
    }, 2900);

    setTimeout(function(){
        document.body.removeChild(noticeBody);
    }, 4000);
}

browser.runtime.onMessage.addListener(function(msg) {
    spawnNotice(msg.message, msg.kind);
});