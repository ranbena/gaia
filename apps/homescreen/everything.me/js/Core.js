var Core = new function() {
    var _name = "Core", _this = this, logger,
        recalculateHeightRetries = 1,
        VIEWPORT_NOT_VERIFIED_CLASSNAME = "viewport-not-verified",
        TIMEOUT_BEFORE_INIT_SESSION = "FROM CONFIG";
        
    this.shouldSearchOnInputBlur = true;
   
    this.init = function() {
        Utils.setIsFFOS(true);
        
        Viewport.init({
            "$container": $("#doat-container"),
            "fullscreen": Utils.isB2G() ? false : true
        });
        
        document.getElementById("doat-container").addEventListener("mousemove", function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, true);
        
        Viewport.setHeight();
        
        // Add classes according to platform
        addPlatformClasses($("#doat-container"));
        
        if (false) {
            var $refresh = $('<div id="btgrefresh" style="position: absolute; text-align: center; top: 5px; right: 55px; z-index: 1000; width: 80px; padding: 12px 3px; background: rgba(255, 255, 255, 1); border-radius: 5px; border: 1px solid #000; color: #000; font-size: 16px;">Refresh</div>');
            $refresh.bind("touchstart", function() {
                window.location.reload();
            });
            $("#doat-container").append($refresh);
        }
        
        window.setTimeout(function(){
            _this.initWithConfig(__config);
        }, 50);
        
        window.addEventListener("message", function(e) {
            // if event has no message - return
            if (!e || !e.data) { return }
            
            var msg = e.data;
            
            // if mg is string - parse it
            if (msg instanceof String) {
                try {
                    msg = JSON.parse(msg);
                } catch (ex) { return }    
            }
            
            switch (msg.type) {
                case "visibilitychange":
                
                    // change window.hidden value
                    window.hidden = msg.data.hidden;
                    
                    // fire visibilitychange event
                    var e = document.createEvent("Events");
                    e.initEvent("visibilitychange", true, false);
                    document.dispatchEvent(e);
                    break;
            }
        }, false);
    };

    this.initWithConfig = function(data) {
        logger = (typeof Logger !== "undefined") ? new Logger() : console;
        
        var apiHost = Utils.getUrlParam("apiHost") || data.apiHost;
        apiHost && api.setHost(apiHost);
        
        TIMEOUT_BEFORE_INIT_SESSION = data.timeoutBeforeSessionInit;
        
        ObjectManager.init({
            "featureCfg": data.featureCfg,
            "success": function(){
                EventHandler.trigger(_name, "init", {"deviceId": DoATAPI.getDeviceId()});
            },
            "fileLoad": function(failObject){
                EventHandler.trigger(_name, "initLoadFile", {"text": "Object file loaded individually", "objectName": failObject.name});
            },
            "error": function(failObject){
                EventHandler.trigger(_name, "initError", { "text": "Object init failed", "objectName": failObject.name});
            }
        });
        
        Brain.init({
            "numberOfAppsToLoad": data.numberOfAppsToLoad,
            "logger": logger,
            "minimumLettersForSearch": data.minimumLettersForSearch,
            "helper": data.texts.helper,
            "promptInstallAppText": data.texts.installAppPrompt,
            "trending": {
                "itemsPerPage": data.trending.itemsPerPage,
                "itemsOnFirstPage": data.trending.itemsOnFirstPage,
                "timeBeforeError": data.trending.timeBeforeError,
                "timeBeforeCache": data.trending.timeBeforeCache
            },
            "timeBeforeAllowingDialogsRemoval": data.timeBeforeAllowingDialogsRemoval,
            "tips": data.tips,
            "searchSources": data.searchSources,
            "pageViewSources": data.pageViewSources
        });
        
        DoATAPI.init({
            "env": data.env.server,
            "apiKey": data.apiKey,
            "appVersion": data.appVersion,
            "authCookieName": data.authCookieName
        });
        
        initSession(function() {
            initObjects(data);
        }, true);        
        
        ErrorHandler && ErrorHandler.setLoggerReady();
    };

    function initSession(callback, activated) {
        var shouldInit = DoATAPI.Session.shouldInit()
        if (shouldInit.should) {
            DoATAPI.initSession({
                "cachedIcons": Utils.convertIconsToAPIFormat(IconManager.get()),
                "cause": shouldInit.cause,
                "source": "Core.initSession"
            }, function(){
                callback();
                EventHandler.trigger("DoATAPI", "sessionInitOnPageLoad");
            });
        } else {
            callback();
        }
    }
    
    function initObjects(data) {
        ObjectManager.initObjects([
            {
                "name": "Connection",
                "type": "module",
                "config": {
                    "texts": data.texts.connection
                }
            },{
                "name": "Location",
                "type": "module",
                "config": {
                    "$elName": $(".user-location"),
                    "$elButton": $("#button-location"),
                    "$elSelectorDialog": $("#location-selector"),
                    "$elLocateMe": $("#locate-me"),
                    "$elEnterLocation": $("#enter-location"),
                    "$elDoItLater": $("#later"),
                    "texts": data.texts.location
                }
            },{
                "name": "Screens",
                "type": "helper",
                "config": {
                    "$screens": $(".content_page"),
                    "tabs": data.texts.tabs
                }
            },{
                "name": "Shortcuts",
                "type": "module",
                "config": {
                    "$el": $("#shortcuts"),
                    "$loading": $("#shortcuts-loading"),
                    "design": data.design.shortcuts,
                    "shortcutsFavorites": data.texts.shortcutsFavorites
                }
            },{
                "name": "ShortcutsCustomize",
                "type": "module",
                "config": {
                    "$parent": $("#doat-container"),
                    "texts": data.texts.shortcutsFavorites
                }
            },{
                "name": "Searchbar",
                "type": "module",
                "config": {
                    "$el": $("#search-q"),
                    "$form": $("#search-rapper"),
                    "$defaultText": $("#default-text"),
                    "texts": data.texts.searchbar,
                    "timeBeforeEventPause": data.searchbar.timeBeforeEventPause,
                    "timeBeforeEventIdle": data.searchbar.timeBeforeEventIdle,
                    "setFocusOnClear": false
                }
            },{
                "name": "Helper",
                "type": "module",
                "config": {
                    "$el": $("#helper"),
                    "$elTitle": $("#search-title"),
                    "$tip": $("#helper-tip"),
                    "defaultSuggestions": data.defaultSuggestions,
                    "texts": data.texts.helper
                }
            },{
                "name": "Apps",
                "type": "module",
                "config": {
                    "$el": $("#doat-apps"),
                    "$buttonMore": $("#button-more"),
                    "$header": $("#search #header"),
                    "texts": data.texts.apps,
                    "appHeight": data.apps.appHeight,
                    "scrollThresholdTop": data.apps.scrollThresholdTop,
                    "scrollThresholdBottom": data.apps.scrollThresholdBottom,
                    "widthForFiveApps": data.apps.widthForFiveApps,
                    "minHeightForMoreButton": data.minHeightForMoreButton,
                    "defaultScreenWidth": {
                        "portrait": 320,
                        "landscape": 480
                    }
                }
            },{
                "name": "BackgroundImage",
                "type": "module",
                "config": {
                    "$el": $("#background-image"),
                    "$elementsToFade": $("#doat-apps, #header, #search-header"),
                    "defaultImage": data.defaultBGImage,
                    "texts": data.texts.backgroundImage
                }
            },{
                "name": "SearchHistory",
                "type": "module",
                "config": {
                    "maxEntries": data.maxHistoryEntries
                }
            }
        ]);
    }
    
    function addPlatformClasses($container) {
        var os = Utils.os(),
            platform = Utils.platform(),
            osVersion = Utils.Env.getInfo().os.version;

        var classToAdd = "env-" + os;
            classToAdd += osVersion ? " env-os-version-"+Math.floor(parseInt(osVersion, 10)) : "";
            classToAdd += Utils.getIsTouch() ? " istouch" : "";
            classToAdd += Utils.platform() ? " env-platform-"+Utils.platform() : "";
        
        if (platform == "iphone") {
            classToAdd += " iphone-browser";
        }
        
        if (window.devicePixelRatio) {
            classToAdd += " pixel-ratio-" + window.devicePixelRatio;
        }
        
        // TEMP FOR FIREFOX - REMOVE
        if (navigator.userAgent.match(/Firefox/gi)) {
            classToAdd += " browser-firefox";
        }
        
        if (Utils.isB2G() && Utils.isFFOS()) {
            classToAdd += " b2g";
        }
        
        if (Utils.isLauncher()) {
            classToAdd += " no_bg";
        }
        
        if (Utils.isAuthUser()) {
            classToAdd += " auth-user";
        } else {
            classToAdd += " not-auth-user";
        }
        
        $container.addClass(classToAdd);
        
        Utils.updateOrientation();
    }
};

Core.init();