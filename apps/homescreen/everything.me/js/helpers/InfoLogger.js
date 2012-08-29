var InfoLogger = new function(){
    var _this = this,
        enabled = false,
        container = document.body,
        text = "infologger",
        params = "",
        url = "http://{apiHost}/everything/2.1/Logger/info?text="+text;
    
    this.init = function(apiHost, params){
        url = url.replace("{apiHost}", apiHost);
        for (var k in params){
            url += "&" + k + "=" + encodeURIComponent(params[k]);
        }
        enabled = true;
    };
    
    this.log = function(params){
        if (!enabled) { return false; }
        
        var img = document.createElement("img");
        img.style.position = "absolute";
        img.style.zIndex = "0";
        img.style.left = "0";
        img.style.top = "0";
        img.style.visibility = "hidden";
        img.style.width = "0";
        img.style.height = "0";
        img.src = url+"&params=["+JSON.stringify(params)+"]";
        container.appendChild(img);
    };
    
    this.postLog = function(params) {
        if (!enabled) { return false; }
        
        var request = new XMLHttpRequest();
        var src = url + "&params=[" + encodeURIComponent(JSON.stringify(params)) + "]";
        request.open("POST", src, true);
        request.send();
    };
}