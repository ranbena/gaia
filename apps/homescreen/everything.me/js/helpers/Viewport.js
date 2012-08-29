var Viewport = new function(){
    var _this = this, _name = "Viewport",
        $container, currentSource,
        styleEl = {},
        testHeight = {
            "portrait": 560,
            "landscape": 340
        },
        minHeight = {
            "portrait": 416,
            "landscape": 250
        },
        STORAGE_HEIGHT_KEY = "viewport-height",
        storedHeight,
        storedHeightTTL = 86400000, // 24h
        shouldRecalculate = false,
        fullscreen;
    
        this.STORAGE = "storage";
        this.ENV = "env";
        this.DETECTED = "detected";
        this.DISABLED = "disabled";
        
        var SCROLL_TOP = 1;
    
    this.init = function(cfg){
        $container = cfg.$container;
        logger = cfg.logger;
        fullscreen = cfg.fullscreen;
        
        storedHeight = 460; //getStoredHeight() || {};
        
        EventHandler.trigger(_name, "init");
    };
       
    this.setHeight = function(data){
        // get current orientation (portrait/landscape)
        var key = getOrientationKey();        
        !data && (data = {});
        
        if (styleEl[key]) {
            _this.hideAddressBar();
            setTimeout(_this.hideAddressBar, 1000);
            data.callback && data.callback();
            return false;
        }
        
        // if it's stored in localStorage or should be ignored (in order to retry)
        if (!storedHeight[key]){
            // get screen height from ENV
            var fixedHeight = Utils.getScreen().height; 
            if (fixedHeight){
                //set height and store
                setContainerHeight(fixedHeight, key, _this.ENV, data.callback);
                setStoredHeight(key, fixedHeight);
            }
            // if fullscreen is disabled, just use window.innerHeight
            else if (!fullscreen) {
                var height = window.innerHeight;
                setContainerHeight(height, key, _this.DISABLED, data.callback);
                setStoredHeight(key, height);
            }
            // calculate it
            else{
                // make it as high as possible and hide the addressbar
                _this.hideAddressBar();
                    
                // wait for it to hide
                setTimeout(function(){
                    setDelayedHeight(key, data.callback);
                },2000); // minimum time it takes the browser to move the address bar up and get innerHeight right
            }
        } else {
            //set height
            setContainerHeight(storedHeight[key], key, _this.STORAGE, data.callback);
        }
    };
    
    this.getHeight = function(){
        return {
            "value": $container.height(),
            "source": currentSource
        }
    };
    
    this.hideAddressBar = function(){
        window.scrollTo(0, SCROLL_TOP+1);
        window.setTimeout(function(){
            window.scrollTo(0, SCROLL_TOP);
        }, 0);
    };
    
    this.shouldRecalculate = function(val){
        val && (shouldRecalculate = val);
        
        return shouldRecalculate;
    };
    
    this.getTestHeight = function(key){
        return testHeight[key];
    };
    
    function getOrientationKey(){
        return Utils.getOrientation().name;
    }
    
    function setDelayedHeight(key, cb){
        // make sure it's not under minimum height (happens if keyboard is up)
        if (window.innerHeight >= minHeight[key]){
            //set height and store
            setContainerHeight(window.innerHeight, key, _this.DETECTED, cb);
            setStoredHeight(key, window.innerHeight);
        }
        else{
            setTimeout(function(){
                setDelayedHeight(key, cb);
            }, 1000);
            
            EventHandler.trigger(_name, "heightNotSet", {
                "text": 'height not set because too shorter than '+minHeight[key]
            });
        }
    }
    
    function setStoredHeight(key, value){
        storedHeight[key] = value;
        Storage.add(STORAGE_HEIGHT_KEY, JSON.stringify(storedHeight), storedHeightTTL);
    }
    
    function getStoredHeight(){
        var val = Storage.get(STORAGE_HEIGHT_KEY);
        if (val){
            val = JSON.parse(val);
        }
        
        return val;
    }
    
    function setContainerHeight(height, key, source, cb){
        var style = document.createElement("style");
        style.id = "viewport-"+key;
        var html = "";
        html += " #doat-container.orientation-"+key+" {height:"+height+"px; position: relative; top: auto; left:auto; bottom: auto; right: auto}";
        style.innerHTML = html;
        document.getElementsByTagName("head")[0].appendChild(style);
        
        styleEl[key] = true;
        currentSource = source;
        
        var data = {};
        data[key] = { "height": height };
        Utils.setScreen(data);
        
        EventHandler.trigger(_name, "heightSet", {
            "source": source,
            "height": height,
            "orientation": key
        });
        
        cb && cb(source);
    }
};
