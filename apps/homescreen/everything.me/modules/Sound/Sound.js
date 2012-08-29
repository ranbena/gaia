var Sound = new function() {
    var _name = "Sound", _this = this,
        srcs = [], audio = null, active = false;
    
    this.init = function(options) {
        srcs = options.src;
        if (!typeof srcs == "array") {
            srcs = [srcs];
        }
        
        loadSound(0);
                
        EventHandler.trigger(_name, "init");
    };
    
    this.play = function() {
        if (active && audio) {
            audio.play();
            EventHandler.trigger(_name, "play");
        }
    };
    
    function loadSound(srcIndex) {
        if (srcIndex < srcs.length) {
            audio = new Audio();
            audio.src = srcs[srcIndex];
            audio.onerror = function(){
                loadSound(srcIndex+1);
            };
            audio.load();
            active = true;
        } else {
            audio = null;
            active = false;
        }
    }
}

        
        