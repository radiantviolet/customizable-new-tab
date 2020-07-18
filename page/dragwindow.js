var windowOffsetX, windowOffsetY;
var endCoorX, endCoorY;

window.addEventListener("load", function(){
    eItems.windowHeader.addEventListener("mousedown", function(){
        eItems.window.setAttribute("draggable", true);
    });
    eItems.window.addEventListener("dragstart", e => {
        windowOffsetX = e.pageX - eItems.window.offsetLeft;
        windowOffsetY = e.pageY - eItems.window.offsetTop;
    });
    eItems.windowLayer.addEventListener("dragover", e => {
        endCoorX = e.pageX;
        endCoorY = e.pageY;
    });
    eItems.window.addEventListener("dragend", function(){
        moveWindow(endCoorX, endCoorY, windowOffsetX, windowOffsetY);
    });
    window.addEventListener('resize', function(){;
        moveWindow(eItems.window.offsetLeft, eItems.window.offsetTop, 0, 0);
    });
});

function moveWindow(eX, eY, fX, fY){
    eItems.window.setAttribute("draggable", false);

    var winX = eX - fX;
    var winY = eY - fY;

    winX = Math.max(0, Math.min(window.innerWidth - wOW, winX));
    winY = Math.max(0, Math.min(window.innerHeight - wOH, winY));

    eItems.window.style.left = winX + "px";
    eItems.window.style.top = winY + "px";
}