var Utils = new function() {
    var _this = this, userAgent = "", platform = "", browser = "", os = "", screen= {}, connection, cssPrefix = "", iconsFormat = null,
        isKeyboardVisible = false, _title = "Everything", isNewUser, isFFOS = false,
        _parseQuery = parseQuery();
        
    var env = new Doat_Env();
    this.Env = env;
    var envInfo = env.getInfo();
    
    this.ICONS_FORMATS = {
        "Small": 10,
        "Large": 20
    };
    var COOKIE_NAME_CREDENTIALS = "credentials",
        DYNAMIC_TITLE = false;
    
    this.FFOSMessages = {
        "APP_CLICK": "open-in-app",
        "APP_INSTALL": "add-bookmark",
        "SWIPE_LEFT_TO_RIGHT": false,
        "SWIPE_RIGHT_TO_LEFT": "home"
    };
    this.isLauncher = function() {
        return (window.location.href.indexOf("mode=launcher") !== -1);
    };
    this.isB2G = function() {
        return navigator.mozApps && ("getSelf" in navigator.mozApps);
    };
    this.getB2GHeight = function() {
        return Math.max(400, _this.B2GCalc(window.innerHeight));
    };
    this.getB2GWidth = function() {
        return _this.B2GCalc(window.innerWidth);
    };
    this.B2GCalc = function(x) {
        return window.innerWidth > 320 ?  x*2/3 : x;
    };
    this.isFFOS = function() {
        return isFFOS
    };
    this.setIsFFOS = function(val) {
        isFFOS = val;
    };
    this.sendToFFOS = function(type, data) {
        if (!type) return;
        
        try {
            if (Utils.isLauncher()) {
                navigator.everything.client.launcher.message(type, data);
            } else {
                var obj = {
                    "type": type,
                    "data": data || {}
                };
                var sMessage = JSON.stringify(obj);
                window.parent.postMessage(sMessage, "*");
            }
        } catch(ex) {
            
        }
    };
    
    
    this.init = function() {
        userAgent = navigator.userAgent;
        cssPrefix = _getCSSPrefix();
        platform = _this.getPlatform();
        browser = _this.getBrowser();
        os = _this.getOS();
        screen = _this.getScreen();
        connection = _this.getConnection();
        isTouch = "ontouchstart" in window;
    };
    
    this.setTitle = function(title) {
        if (!DYNAMIC_TITLE) return;
        
        var sTitle = _title;
        if (title) {
            sTitle += " " + title;
        }
        window.setTimeout(function(){
            document.title = sTitle;
        }, 50);
    };
    
    this.isNewUser = function() {
        if (isNewUser === undefined) {
            isNewUser = !Storage.get("counter-ALLTIME");
        }
        return isNewUser;
    };
    
    this.hasFacebookParam = function() {
        return Utils.getUrlParam("fb") == "mp";
    };
    this.setAuthUser = function() {
        Storage.set("isUser", true);
        $(document.body).removeClass("not-auth-user").addClass("auth-user");
    };
    this.isAuthUser = function() {
        return Storage.get("isUser");
    };
    
    
    this.updateObject = function(configData, groupConfig) {
        if (!groupConfig) return;
        
        for (var key in groupConfig) {
            eval('configData["' + key.replace(/=>/g, '"]["') + '"] = groupConfig[key]');
        }
        
        return configData;
    };
    
    this.formatImageData = function(image) {
        if (!image || typeof image !== "object") {
            return image;
        } 
        if (!image.MIMEType || image.data.length < 10) {
            return null;
        }
        
        return "data:" + image.MIMEType + ";base64," + image.data;
    };
    
    this.getRoundIcon = function(imageSrc, size, shadowOffset, callback) {
        // canvas
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            radius = size/2;
        
        canvas.setAttribute("width", size);
        canvas.setAttribute("height", size);
        
        !shadowOffset && (shadowOffset = 0); 
        
        // create clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, 2 * Math.PI, false);
        ctx.clip();
        
        // generate image
        var img = new Image()
        img.onload = function() {
            ctx.drawImage(img,0,0, size, size);
            
            // send to get shadow
            var data = canvas.toDataURL();
            getShadow(data, size, shadowOffset, callback)
        };
        img.src = imageSrc;
    };
    
    var getShadow = function(imageSrc, size, shadowOffset, callback) {
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");
        
        canvas.setAttribute("width", size+shadowOffset);
        canvas.setAttribute("height", size+shadowOffset);    
    
        ctx.shadowColor="rgba(0,0,0,0.3)";
        ctx.shadowOffsetY = shadowOffset;
        
        // generate image
        var img = new Image()
        img.onload = function() {
            ctx.drawImage(img,0,0, size, size);
            var data = canvas.toDataURL();
            callback(data);
        };
        img.src = imageSrc;
    }
    
    this.getIconGroup = function() {
        return JSON.parse(JSON.stringify(__config.iconsGroupSettings));
    }
    
    this.getIconsFormat = function() {
        return iconsFormat || _getIconsFormat();
    };
    
    this.isKeyboardVisible = function(){
        return isKeyboardVisible;
    };
    
    this.setKeyboardVisibility = function(value){
        isKeyboardVisible = value;
        if (isKeyboardVisible) {
            $(document.body).addClass("keyboard-visible");
        } else {
            $(document.body).removeClass("keyboard-visible");
        }
    };
    
    this.needsInputPolling = function() {
        return (Utils.platform() == "android" && Utils.browser() == "mozilla");
    };

    this.platform = function() {
        return envInfo.platform.name;
    };

    this.browser = function() {
        return envInfo.browser.name;
    };

    this.os = function() {
        return os.name;
    };
    
    this.connection = function(){
        return connection;
    };

    this.getUrlParam = function(key) {
        return _parseQuery[key]
    };
    
    this.cssPrefix = function() {
        return cssPrefix;
    };
    
    this.convertIconsToAPIFormat = function(icons) {
        var aIcons = [];
        if (icons instanceof Array) {
            for (var i=0; i<icons.length; i++) {
                aIcons.push(f(icons[i]));
            }
        } else {
            for (var i in icons) {
                aIcons.push(f(icons[i]));
            }
        }
        aIcons = aIcons.join(",");
        return aIcons;
        
        function f(icon) {
            return (icon && icon.id && icon.revision && icon.format)? icon.id + ":" + icon.revision + ":" + icon.format : "";
        }
    }
    
    this.hasFixedPositioning = function(){
        /*var p = _this.getPlatform().name;
        var v = _this.getOS().version;
        
        // desktop
        if (p === "desktop"){
            return true;
        }
        // iOS 5+ 
        else if (p === 'iphone' || p === 'ipad'){
            return isVersionOrHigher(v, '5');
        }
        // android 2.2+ implementation is a joke*/
        
        return false;
    };
    
    this.isVersionOrHigher = function(v1, v2) {
        if (!v2){ v2 = v1; v1 = Utils.getOS().version; };
        if (!v1){ return undefined; }
        
        var v1parts = v1.split('.');
        var v2parts = v2.split('.');
        
        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length == i) {
                return true;
            }
            
            if (v1parts[i] == v2parts[i]) {
                continue;
            } else if (parseInt(v1parts[i], 10) > parseInt(v2parts[i], 10)) {
                return true;
            } else {
                return false;
            }
        }
        
        if (v1parts.length != v2parts.length) {
            return false;
        }
        
        return true;
    };
    
    this.User = new function() {
        this.creds = function() {
            var credsFromCookie = Utils.Cookies.get(COOKIE_NAME_CREDENTIALS);
            return credsFromCookie;
        };
    };
    
    this.Cookies = new function() {
        this.set = function(name, value, expMinutes, _domain) {
            var expiration = "",
                path = norm("path","/"),
                domain = norm("domain", _domain);
            
            if (expMinutes) {
                expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + expMinutes);
                expiration = expiration.toGMTString();
            }
            expiration = norm("expires", expiration);
            
            var s = name + "=" + escape(value) + expiration + path + domain;
            
            try {
                document.cookie = s;
            } catch(ex) {}
            
            return s;
        };
        
        this.get = function(name) {
            var results = null;
            
            try {
                results = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');   
            } catch(ex) {}
            
            return (results)? unescape(results[2]) : null;
        };
        
        this.remove = function(name) {
            Utils.Cookies.set(name, "", "Thu, 24-Jun-1999 12:34:56 GMT");
        };
        
        function norm(k, v) {
            return k && v ? "; "+k+"="+v : "";
        }
    };
    
    // check that cookies are enabled by setting and getting a temp cookie
    this.bCookiesEnabled = function(){
        var key = "cookiesEnabled",
            value = "true";
            
        // set 
        _this.Cookies.set(key, value, 10);
        
        // get and check
        if (_this.Cookies.get(key) === value){
            _this.Cookies.remove(key);
            return true;
        }
    };
    
    // check that localStorage is enabled by setting and getting a temp value
    this.bLocalStorageEnabled = function(){
        return Storage.enabled();
    };
    
    function _getIconsFormat() {
        iconsFormat = _this.ICONS_FORMATS.Small;
        var connection = _this.getConnection();
        
        if (
                (window.devicePixelRatio && window.devicePixelRatio >= 2) || // retina display on iPhone
                os.name == "android" || // all android phones
                os.name == "windowsphoneos" || // all windows phones
                os.name == "firefoxos" || // all windows phones
                platform.name == "desktop" // desktop
            ) {
                
            if (connection.speed >= connection.SPEED_HIGH) {
                iconsFormat = _this.ICONS_FORMATS.Large;
            }
        }
        
        return iconsFormat;
    }
    
    function _getCSSPrefix() {
        var browser = _this.getBrowser().name;
        var prefix = (browser === 'webkit' ? '-webkit-' : browser === 'mozilla' ? '-moz-' : browser === 'msie' ? '-ms-' : '');
        return prefix;
    }

    this.getPlatform = function(uaStr){
        return env.getInfo(uaStr).platform;
    };
    
    this.getBrowser = function(uaStr) {
        return env.getInfo(uaStr).browser;
    };
    
    this.getOS = function(uaStr){        
        return env.getInfo(uaStr).os;
    };
    
    this.getScreen = function(uaStr){
        return env.getScreen(uaStr);
    };
    
    this.getScreenWidth = function(){
        return env.getScreen().width;
    };
    
    this.setScreen = function(data){
        env.setScreen(data);
    };
    
    this.clearScreen = function(){
        env.clearScreen(_this.getOrientation().name);
    };
    
    this.getOrientation = function(uaStr){
        return env.getInfo(uaStr).orientation;
    };    
    
    this.getConnection = function(){
        return env.getInfo().connection;
    };
    
    this.getIsTouch = function(){
        return env.isTouch();
    };
    
    this.setOrientation = function(_orientation){
        env.setOrientation(_orientation);
    };
    
    this.updateOrientation = function(){
        env.setOrientation();
    };
    
    this.getCurrentSearchQuery = function(){
        return Brain.Searcher.getDisplayedQuery();
    };
    
    this.Campaign = new function(){
        this.current = {
            "network": _parseQuery["n"],
            "creative": _parseQuery["c"]
        };
        
        this.NETWORK = {
            "STARTAPP": "StartApp",
            "DOAT": "doat" 
        };
    };

    this.init();
};

/* page visibility api polyfill */
(function(global, d){
    var DEFAULT_SPEC_EVENT = "visibilitychange",
        DEFAULT_SPEC_PROP = "hidden",
        prefixes = ["o", "ms", "moz", "webkit"],
        vendorProp, vendorEvent;
        
    if (typeof d[DEFAULT_SPEC_PROP] !== "undefined") {
        return;
    } else {
        var i = prefixes.length;
        while(i--) {
            var prefix = prefixes[i],
                propName = prefix + "Hidden";
            
            if (d[propName] !== "undefined") {
                vendorProp = propName;
                vendorEvent = prefix + "visibilitychange";
                break;
            }
        }
    }
    
    if (vendorEvent) {
        d.addEventListener(vendorEvent, function(){
            setHidden(d[vendorProp]);
        }, false);
    } else {
        var evShow = ("onpageshow" in global)? "pageshow" : "focus",
            evHide = ("onpagehide" in global)? "pagehide" : "blur";
        
        global.addEventListener(evShow, function(){
            setHidden(false);
        }, false);
        global.addEventListener(evHide, function(){
            setHidden(true);
        }, false);
    }
    
    function setHidden(hidden) {
        d[DEFAULT_SPEC_PROP] = hidden;
        fireVisibilityEvent();
    }
    function fireVisibilityEvent() {
        var e = d.createEvent("Events");
        e.initEvent(DEFAULT_SPEC_EVENT, true, false);
        d.dispatchEvent(e);
    }
})(this, document);
