var result = undefined;

if(document.head.querySelector('[rel="apple-touch-icon"]')){
    result = document.head.querySelector('[rel="apple-touch-icon"]').href;
}
else if(document.head.querySelector('[rel="icon"]')){
    var allIcons = document.head.querySelectorAll('[rel="icon"]');
    var reslen = allIcons.length;
    var biggestImage = 0;
    result = allIcons[0].href;

    for(var i=0; i<reslen; i++){
        if(allIcons[i].sizes){
            if(allIcons[i].sizes != "any"){          
                var iconSizes = Array.from(allIcons[i].sizes.toString().split(" ")).map(x => x.split("x")[0]);
                var biggestSize = 0;
                for(var j=0; j<iconSizes.length; j++){
                    if(iconSizes[j] > biggestSize){
                        biggestSize = iconSizes[j]
                    }
                }
                if(biggestSize > biggestImage){
                    biggestImage = biggestSize;
                    result = allIcons[i].href;
                }
            }
        }
    }
    
}
else if(document.head.querySelector('[rel="shortcut icon"]')){
    result = document.head.querySelector('[rel="shortcut icon"]').href;
}

result;
