var Brain = new function() {
    var _this = this,
        _config = {},
        logger = null,
        QUERIES_TO_NOT_CACHE = "",
        DEFAULT_NUMBER_OF_APPS_TO_LOAD = 16,
        NUMBER_OF_APPS_TO_LOAD = DEFAULT_NUMBER_OF_APPS_TO_LOAD,
        TIME_BEFORE_INVOKING_HASH_CHANGE = 200,
        TIMEOUT_BEFORE_ALLOWING_DIALOG_REMOVE = "FROM CONFIG",
        MINIMUM_LETTERS_TO_SEARCH = 1,
        SEARCH_SOURCES = {},
        PAGEVIEW_SOURCES = {},
        TIPS = {},
        
        // whether to show shortcuts customize on startup or not
        ENABLE_FAVORITES_SHORTCUTS_SCREEN = false,
        
        HISTORY_CLEAR_TEXT = "FROM CONFIG",
        REFINE_DISMISS_TEXT = "FROM CONFIG",
        NO_REFINE_TEXT = "FROM CONFIG",
        SHOW_HISTORY_TEXT = "FROM CONFIG",
        
        QUERY_TYPES = {
            "EXPERIENCE": "experience",
            "APP": "app",
            "QUERY": "query"
        },
        
        timeoutSetUrlAsActive = null,
        timeoutHashChange = null;
    
    this.init = function(options) {
        EventHandler && EventHandler.bind(catchCallback);
        $body = $("#" + Utils.getID());
        $container = $("#" + Utils.getID());
        
        _config = options;
        
        // Helper
        HISTORY_CLEAR_TEXT = _config.helper.clearHistory;
        REFINE_DISMISS_TEXT = _config.helper.dismiss;
        NO_REFINE_TEXT = _config.helper.noRefine;
        SHOW_HISTORY_TEXT = _config.helper.linkHistory;
        
        // Tips
        TIPS = _config.tips;
        TIMEOUT_BEFORE_ALLOWING_DIALOG_REMOVE = _config.timeBeforeAllowingDialogsRemoval;
        
        SEARCH_SOURCES = _config.searchSources;
        PAGEVIEW_SOURCES = _config.pageViewSources;
        
        logger = _config && _config.logger || console;
    };
    
    function catchCallback(_class, _event, _data) {
        logger.debug(_class + "." + _event + "(", (_data || ""), ")");
        
        try {
            _this[_class] && _this[_class][_event] && _this[_class][_event](_data || {});
        } catch(ex){
            logger.error(ex);
        }
    }
    
    this.Core = new function() {
        var _this = this;
        
        this.init = function() {
            Searcher.empty();
            Searchbar.clear();
            Brain.Searchbar.setEmptyClass();
            
            Swiper.init();
            
            Shortcuts.loadDefault();
            Shortcuts.show();
        };
        
        var Swiper = new function() {
            var $els = $("#doat-apps, #shortcuts"),
                startPoint = null, movePoint = null;
            
            var DISTANCE_TO_COUNT_AS_SWIPE = window.innerWidth/2;
            
            this.init = function() {
                DISTANCE_TO_COUNT_AS_SWIPE = $els.width()/2;
                
                $els.bind("touchstart", start);
            };
            
            function start(e) {
                startPoint = getEventPoint(e);
                movePoint = startPoint;
                
                if (startPoint) {
                    $els.bind("touchmove", move); // b2g hack due to https://bugzilla.mozilla.org/show_bug.cgi?id=783276
                    $els.bind("touchend", end);
                }
            }
            
            function move(e) {
                movePoint = getEventPoint(e); // b2g hack due to https://bugzilla.mozilla.org/show_bug.cgi?id=783276
            }
            
            function end(e) {
                if (!startPoint) return;
                
                //var point = getEventPoint(e),
                var point = movePoint, // b2g hack due to https://bugzilla.mozilla.org/show_bug.cgi?id=783276
                    distance = [point[0] - startPoint[0], point[1] - startPoint[1]];

                if (distance[0] > DISTANCE_TO_COUNT_AS_SWIPE) {
                    Utils.sendToFFOS(Utils.FFOSMessages.SWIPE_LEFT_TO_RIGHT);
                } else if (distance[0] < -DISTANCE_TO_COUNT_AS_SWIPE) {
                    Utils.sendToFFOS(Utils.FFOSMessages.SWIPE_RIGHT_TO_LEFT);
                }
                
                $els.unbind("touchend", end);
                $els.unbind("touchmove", move); // b2g hack due to https://bugzilla.mozilla.org/show_bug.cgi?id=783276
                
                startPoint = null;
            }
            
            function getEventPoint(e) {
                var touch = e.touches && e.touches[0] ? e.touches[0] : e,
                    point = touch && [touch.pageX || touch.clientX, touch.pageY || touch.clientY];
                
                return point;
            }
        }
    };
    
    
    this.Searchbar = new function() {
        var _this = this,
            timeoutBlur = null,
            tipKeyboard = null,
            TIMEOUT_BEFORE_RUNNING_BLUR = 50;
        
        this.focus = function(data) {
            Utils.setKeyboardVisibility(true);
            
            if (!Screens.Search.active()) {
                if (data && data.e && data.e.type === "touchstart"){
                    data.e.preventDefault();
                }
                window.setTimeout(function() {
                    Screens.Search.show({"pageviewSource": PAGEVIEW_SOURCES.TAB});
                }, 0);
                window.setTimeout(Helper.showTip, 320);
            } else {
                Helper.showTip();
            }
            
            Location.hideButton();
            
            Helper.disableCloseAnimation();
            Helper.hideTitle();
            if (Searchbar.getValue() !== "") {
                Helper.showSuggestions();
            } else {
                Brain.Helper.showDefault();
            }
            
            if (!tipKeyboard) {
                tipKeyboard = new Tip(TIPS.SEARCHBAR_FOCUS).show();
            }
        };

        this.blur = function(data) {
            // Gaia bug workaround because of this http://b2g.everything.me/tests/input-blur.html
            data && data.stopPropagation && data.stopPropagation();
            
            if (Brain.Dialog.isActive()) {
                return;
            }
            
            window.setTimeout(_this.hideKeyboardTip, 500);
            
            Utils.setKeyboardVisibility(false);
            Location.showButton();
            Apps.refreshScroll();
            
            if (Searchbar.getValue() == "") {
                Helper.setTitle();
                Helper.showTitle();
            }
            
            if (Core.shouldSearchOnInputBlur){
                window.clearTimeout(timeoutBlur);
                timeoutBlur = window.setTimeout(_this.returnPressed, TIMEOUT_BEFORE_RUNNING_BLUR);
            }
        };
        
        this.onfocus = this.focus;
        this.onblur = this.blur;

        this.empty = function(data) {
            Searcher.cancelRequests();
            _this.emptySource = (data && data.pageviewSource) || (data.sourceObjectName === "Searchbar" && PAGEVIEW_SOURCES.CLEAR);
            Searcher.empty();
            _this.setEmptyClass();
            
            Shortcuts.show();
        };

        this.clear = function(e) {
            Searcher.cancelRequests();
            Apps.clear();
            Helper.setTitle();
            Brain.Helper.showDefault();
        };
        
        this.returnPressed = function(data) {
            if (Brain.Dialog.isActive()) {
                data && data.e && data.e.preventDefault();
                return;
            }
            
            var query = Searchbar.getValue();
            Searcher.searchExactFromOutside(query, SEARCH_SOURCES.RETURN_KEY);
            Searchbar.blur();
        };
        
        this.setEmptyClass = function() {
            var query = Searchbar.getValue();
            
            if (!query) {
                $body.addClass("empty-query");
            } else {
                $body.removeClass("empty-query");
            }
        };
        
        this.cancelBlur = function() {
            window.clearTimeout(timeoutBlur);
        };
        
        this.backButtonClick = function(data) {
            _this.cancelBlur();
            Screens.Search.hide();
            
            if (!Screens.active()) {
                Screens.goTo(DEFAULT_PAGE);
            }
        };

        this.valueChanged = function(data) {
            _this.hideKeyboardTip();
            
            var lastQuery = Searcher.getDisplayedQuery();
            
            if (data.value && (data.value.length > MINIMUM_LETTERS_TO_SEARCH || lastQuery != "")) {
                Searcher.searchAsYouType(data.value, SEARCH_SOURCES.TYPING);
            }
            
            _this.setEmptyClass();
            Helper.hideTitle();
        };
        
        this.idle = function(data) {
            
        };
        
        this.pause = function(data) {
            var suggestions = Helper.getData().suggestions || [];
            if (!suggestions || suggestions.length == 0) {
                return;
            }
            
            var typedQuery = Searchbar.getValue(),
                suggestionsQuery = Helper.getSuggestionsQuery(),
                firstSuggestion = suggestions[0].replace(/[\[\]]/g, "");
            
            if (typedQuery == suggestionsQuery) {
                Searcher.searchExactAsYouType(firstSuggestion, typedQuery);
            }
        };
        
        this.hideKeyboardTip = function() {
            if (tipKeyboard) {
                tipKeyboard.hide();
                tipKeyboard = null;
            }
        };
    };

    this.Helper = new function() {
        var _this = this,
            cleared = false,
            refineQueryShown = "",
            flashCounter = 0,
            previousFirstSuggestion = "",
            SEARCHES_BEFORE_FLASHING_HELPER = 4,
            TIMEOUT_ANDROID_BEFORE_HELPER_CLICK = 500;
            
        var sourcesMap = {
            "suggestions": SEARCH_SOURCES.SUGGESTION,
            "didyoumean": SEARCH_SOURCES.SPELLING,
            "refine": SEARCH_SOURCES.REFINE,
            "history": SEARCH_SOURCES.HISTORY
        };
        
        this.load = function(data) {
            refineQueryShown = "";
        };
        
        this.click = function(data) {
            var query = data.value,
                index = data.index,
                source = data.source || "suggestions",
                type = data.type;
            
            if (query == ".") {
                query = Searchbar.getValue();
            }
            
            Helper.enableCloseAnimation();
            Helper.setTitle(query);
            window.setTimeout(Helper.showTitle, 0);
            
            Searcher.searchExactFromOutside(query, sourcesMap[source], index, type);
        };
        
        this.clear = function() {
            if (!cleared) {
                cleared = true;
                _this.showDefault();
            }
        };
        
        this.animateDefault = function() {
            Helper.animateLeft(function(){
                _this.showDefault();
                Helper.animateFromRight();
            });
        };
        
        this.showDefault = function() {
            Searcher.cancelRequests();
            BackgroundImage.loadDefault();
            
            if (Searchbar.getValue() == "" && !Utils.isKeyboardVisible()) {
                Helper.setTitle();
                Helper.showTitle();
            } else {
                _this.loadHistory();
            }
        };
        
        this.animateIntoHistory = function(history) {
            if (!history || history.length > 0) {
                Helper.animateLeft(function(){
                    _this.loadHistory(history);
                    Helper.animateFromRight();
                });
            }
        };
        
        this.loadHistory = function(history) {
            history = history || SearchHistory.get();
            
            if (history && history.length > 0) {
                var items = [];
                for (var i=0,l=history.length; i<l; i++) {
                    items.push({
                        "id": history[i].type,
                        "type": history[i].type,
                        "name": history[i].query
                    });
                }
                
                Helper.loadHistory(items);
                Helper.showHistory();
            }
        };
        
        this.showRefinement = function(data) {
            var types = data.data;
            var query = Searcher.getDisplayedQuery();
            
            if (refineQueryShown != query) {
                
                window.setTimeout(function(){
                    Helper.Loading.show();
                }, 20);
                
                DoATAPI.getDisambiguations({
                    "query": query
                }, function(data) {
                    if (data.errorCode != DoATAPI.ERROR_CODES.SUCCESS) {
                        Helper.Loading.hide();
                        return;
                    }
                    
                    var types = data.response;
                    if (types) {
                        Helper.loadRefinement(types);
                        Helper.showRefinement();
                        refineQueryShown = query;
                    }
                });
            }
        };
        
        this.show = function(data) {
            var items = data.data;
            var type = data.type;
            
            cleared = false;
            
            Helper.getList().removeClass("default");
            
            switch (type) {
                case "":
                    var history = SearchHistory.get() || [];
                    if (history && history.length > 0) {
                        Helper.addLink(SHOW_HISTORY_TEXT, function(){
                            _this.animateIntoHistory(history);
                        });
                    }
                    break;
                case "refine":
                    if (refineQueryShown == Searcher.getDisplayedQuery()) {
                        if (items.length == 1) {
                            Helper.addText(NO_REFINE_TEXT);
                        }
                        
                        Helper.addLink(REFINE_DISMISS_TEXT, didyoumeanClick);
                    }
                    break;
                    
                case "didyoumean":
                    Helper.addLink(REFINE_DISMISS_TEXT, didyoumeanClick);
                    break;
                
                case "history":
                    Helper.addLink(HISTORY_CLEAR_TEXT, function(e){
                        SearchHistory.clear();
                        helperClick(Helper.clear, e);
                    });
                    
                    break;
            }
        };
        
        function showApps(query, source) {
            if (!Screens.Search.active()) {
                return;
            }
            
            if (typeof query == "string") {
                query = {
                    "query": query,
                    "type": ""
                };
            }
            
            Searcher.searchExact(query.query, source, 1, query.type, false, true);
        }
        
        function didyoumeanClick(e) {
            var callback = Helper.showTitle;
            if (Utils.isKeyboardVisible()) {
                callback = Helper.showSuggestions;
            }
            
            helperClick(callback, e);
        }
        
        function helperClick(callback, e) {
            e && e.stopPropagation();
            e && e.preventDefault();
            
            setTimeout(callback, TIMEOUT_ANDROID_BEFORE_HELPER_CLICK);
        }
    };
    
    
    this.Location = new function() {
        var lastLat = "", lastLon = "";
        
        this.requesting = function() {
            $body.addClass("requesting-location");
        };
        
        this.got = function() {
            $body.removeClass("requesting-location");
        };
        
        this.set = function(data) {
            Location.hideDialog();
            DoATAPI.setLocation(data.lat, data.lon);
            
            if (data.lat !== lastLat || data.lon !== lastLon) {
                lastLat = data.lat;
                lastLon = data.lon;
                Searcher.searchAgain(SEARCH_SOURCES.LOCATION_REFRESH);
            }
        };
        
        this.error = function() {
            $body.removeClass("requesting-location");
        };
        
        this.zipValueChanged = function(data) {
            Brain.LocationSelector.searchLocation(data.value, data.callback);
        };
        
        this.zipSearch = function(data) {
            Brain.LocationSelector.searchLocation(data.value, function(location) {
                if (location && location.length > 0) {
                    location = location[0];
                    data.callback(location.lat, location.lon, location.name, data.dialog);
                }
            });
        };
        
        this.setCallbacks = function(options) {
            callbackSet = options.success;
            callbackError = options.error;
        };
    };
    
    this.LocationSelector = new function() {
        var requestSearch = null, _this = this;
        
        this.show = function() {
            $body.addClass("location-input-visible");
        };
       
        this.valueChanged = function(data) {
            var value = data.value;
            var e = data.e;
            var callback = data.callback || function(){};
            
            requestSearch && requestSearch.abort();
            
            // If the query contains digits- don't autocomplete
            if (value.match(/[\d*]/g)) {
                Location.LocationSelector.clear();
                
                // If the user presses "return"- resolve it
                if (e.keyCode == 13) {
                    Location.LocationSelector.blur();
                }
                
                return;
            }
            
            if (value) {
                _this.searchLocation(value, callback);
            }
        };
        
        this.blur = function(data) {
            var query = data.value;
            
            if (query.match(/\d\d\d\d\d/g)) {
                requestSearch = DoATAPI.searchLocations({
                    "query": query
                }, function(data) {
                    var location = data.response;
                    if (location && location.length > 0) {
                        location = location[0];
                        
                        Location.setLocation(location.lat, location.lon, location.name);
                        _this.close();
                    }
                });
            }
        };
        
        this.searchLocation = function(query, callback) {
            requestSearch = DoATAPI.searchLocations({
                "query": query
            }, function(data) {
                callback(data.response);
            });
        }
        
        this.click = function(data) {
            Location.setLocation(data.lat, data.lon, data.city);
        };
        
        this.close = function() {
            $body.removeClass("location-input-visible");
            Location.hideDialog();
        };
    };
    
    this.Apps = new function() {
        var bShouldGetHighResIcons = false;
        
        this.init = function() {
            bShouldGetHighResIcons = Utils.getIconsFormat() == Utils.ICONS_FORMATS.Large;
            EventHandler && EventHandler.bind(Brain.App.handleEvents);
        };
        
        this.loadComplete = function(data) {
            var icons = data.icons,
                iconsToGet = icons.missing;
                
            if (bShouldGetHighResIcons && !Utils.isKeyboardVisible() && icons && icons.cached) {
                for (var i=0; i<icons.cached.length; i++) {
                    var icon = icons.cached[i];
                    if (icon && icon.id && icon.format < Utils.ICONS_FORMATS.Large) {
                        iconsToGet.push(icon.id);
                    }
                }
            }
            
            if (iconsToGet && iconsToGet.length > 0) {
                Searcher.getIcons(iconsToGet, Utils.ICONS_FORMATS.Large);
            }
        };

        this.scrollTop = function() {
            BackgroundImage.showFullScreen();
        };

        this.scrollBottom = function() {
            Searcher.loadMoreApps();
        };
        
        this.errorRetryClick = function() {
            
        };
    };

    this.AppsMore = new function() {
        this.show = function() {
        };

        this.hide = function() {
        };
        
        this.buttonClick = function() {
            Searcher.loadMoreApps();
        };
    };
    
    this.App = new function() {
        var _this = this,
            bNeedsLocation = false,
            isKeyboardOpenWhenClicking = false,
            loadingApp = null,
            loadingAppAnalyticsData,
            loadingAppId = false;
            
        var STORAGE_KEY_CLOSE_WHEN_RETURNIG = "needsToCloseKeyboard";
        
        this.close = function(data) {
            Apps.removeApp(data.data.id);
        };
        
        this.hold = function(data) {
            Apps.disableScroll();
            
            var tip = new Tip({
                "id": "install-app",
                "text": "Bookmark " + data.data.name + "?",
                "blockScreen": true,
                "buttons": [
                    {
                        "text": "Yes",
                        "onclick": function() {
                            // get icon data
                            var appIcon = Utils.formatImageData(data.data.icon);
                            // make it round
                            Utils.getRoundIcon(appIcon, 58, 2, function(appIcon) {
                                // bookmark in ffos
                                Utils.sendToFFOS(Utils.FFOSMessages.APP_INSTALL, {
                                    "url": data.data.appUrl,
                                    "title": data.data.name,
                                    "icon": appIcon
                                });    
                            });
                            
                            tip.hide();
                            
                            new Tip({
                                "id": "install-app-success",
                                "text": "Thank you for bookmarking " + data.data.name + "!",
                                "closeAfter": 2000
                            }).show();
                        }
                    },
                    {
                        "text": "Cancel",
                        "onclick": function() {
                            tip.hide();
                        }
                    }
                ]
            }).show();
            
            Apps.enableScroll();
        };
        
        this.click = function(data) {
            if (Screens.active() == "user" && !Screens.Search.active()) {
                Brain.UserPage.clickApp(data);
                return;
            }
            
            if (!Apps.isSwiping() && !Searcher.isLoadingApps()) {
                data.keyboardVisible = Utils.isKeyboardVisible() ? 1 : 0;
                
                if (!Searcher.searchedExact()) {
                    Storage.set(STORAGE_KEY_CLOSE_WHEN_RETURNIG, true);
                    
                    Searchbar.setValue(Searcher.getDisplayedQuery(), false, true);
                    
                    Searchbar.blur();
                    Brain.Searchbar.cancelBlur();
                    
                    window.setTimeout(function(){
                        _this.animateAppLoading(data);
                    }, 50);
                } else {
                    Storage.set(STORAGE_KEY_CLOSE_WHEN_RETURNIG, false);
                    _this.animateAppLoading(data);
                }
            }
        };
        
        this.isLoadingApp = function() {
            return loadingApp;
        };

        this.animateAppLoading = function(data) {
            Searcher.cancelRequests();
            
            loadingApp = true;
            var $app = data.$el;
            loadingAppAnalyticsData = {
                "index": data.index,
                "keyboardVisible": data.keyboardVisible,
                "isMore": data.isMore,
                "appUrl": data.app.getLink(),
                "name": data.data.name,
                "id": data.appId,
                "query": Searcher.getDisplayedQuery(),
                "source": Searcher.getDisplayedSource(),
                "icon": data.data.icon
            };
            
            loadingApp = data.app;
            loadingAppId = data.data.id;
            bNeedsLocation = data.data.requiresLocation && !DoATAPI.hasLocation() && !Location.userClickedDoItLater();
            
            var $apps = $("#doat-apps");
            var oldPos = {
                "top": $app[0].offsetTop,
                "left": $app[0].offsetLeft
            };
            var appListHeight = $apps.height(),
                appListWidth = $apps.width(),
                appHeight = $app.height(),
                appWidth = $app.width();
                
           if (Utils.isB2G()) {
                appListHeight = Utils.B2GCalc(appListHeight),
                appListWidth = Utils.B2GCalc(appListWidth),
                appHeight = Utils.B2GCalc(appHeight),
                appWidth = Utils.B2GCalc(appWidth);
           }
                
            var newPos = {
                "top": (appListHeight-appHeight)/2 - Apps.getScrollPosition(),
                "left": (appListWidth-appWidth)/2
            };
            
            $("#loading-app").remove();
            var $pseudo = $('<li class="inplace ' + $app.attr("class") + '" id="loading-app">' + loadingApp.getHtml() + '</li>');
            var appName = "Loading...";
            if (bNeedsLocation) {
                appName = "";
            }
            $pseudo.find("b").text(appName);
            
            $app.parent().append($pseudo);
            $body.addClass("loading-app");
            $container.css("background-image", 'url(' + BackgroundImage.get().image + ')');

            window.setTimeout(function(){
                var translate = "translate(" + -(oldPos.left-newPos.left) + "px, " + -(oldPos.top-newPos.top) + "px)";
                $pseudo[0].setAttribute("style", Utils.cssPrefix() + "transform: " + translate);
            }, 0);
            
            if (bNeedsLocation) {
                Location.requestUserLocation(Location.showErrorDialog);
            } else {
                goToApp(loadingAppAnalyticsData, 500);
            }
        };
        
        this.handleEvents = function(_class, _event, _data){
            if (!bNeedsLocation) {
                return;
            }
            
            if (_class == "Apps" && _event == "loadComplete") {
                bNeedsLocation = false;
                
                var apps = _data.data;
                for (var i=0; i<apps.length; i++) {
                    if (apps[i].id == loadingAppId) {
                        loadingApp.update(apps[i]);
                    }
                }
                goToApp(loadingAppAnalyticsData);
            } else if (_class == "Dialog" && _event == "buttonClick") {
                // User clicked on "Do it later"
                if (_data.id == "location_error" && _data.button == "ok") {
                    goToApp(loadingAppAnalyticsData);
                }
            } else if (_class == "Location" && _event == "error") {
                if ($(".dialog").length == 0) {
                    goToApp(loadingAppAnalyticsData);
                }
            }
        };
        
        function goToApp(data, delay) {
            !delay && (delay = 0);
            data["appUrl"] = loadingApp.getLink();
            
            EventHandler.trigger("Core", "redirectedToApp", data);
            
            if (Utils.isB2G()) {
                /*$(window)
                    .unbind("visibilitychange", returnFromOutside)
                    .bind("visibilitychange", returnFromOutside);
                    */
                // for now this hack is in place because Cristian can't fire visibilitychange when returning from an app     
                setTimeout(returnFromOutside, 2000);
            } else {
                $(window)
                    .unbind("pageshow", returnFromOutside).bind("pageshow", returnFromOutside)
                    .unbind("focus", returnFromOutside).bind("focus", returnFromOutside);            
            }
            
            window.setTimeout(function(){
                if (Utils.isB2G()) {
                    _this.appRedirectExecute(data["appUrl"], data);    
                } else {
                    _this.appRedirectBridge(data["appUrl"], data);    
                }
            }, delay);
        }
        
        // overriden in Analytics.init()
        this.appRedirectBridge = function(appUrl, data){
            _this.appRedirectExecute(appUrl, data);
        };
        
        this.appRedirectExecute = function(appUrl, data){
           var appIcon = Utils.formatImageData(data.icon);
           
           Utils.getRoundIcon(appIcon, 58, 2, function(appIcon) {
                // bookmark in ffos
                Utils.sendToFFOS(Utils.FFOSMessages.APP_CLICK, {
                    "url": appUrl,
                    "title": data.name,
                    "icon": appIcon
                });    
            });
        };
        
        function returnFromOutside() {
            if (window.hidden) { return; }
            
            if (loadingApp) {
                loadingApp = null;
                
                $(window).unbind("visibilitychange", returnFromOutside);
                
                bNeedsLocation = false;
                loadingAppAnalyticsData = null;
                loadingAppId = false;
                
                Searcher.clearTimeoutForShowingDefaultImage();
                $("#loading-app").remove();
                BackgroundImage.cancelFullScreenFade();
                $container.css("background", "#000");
                $body.removeClass("loading-app");
                
                Brain.Core.onresize();
                
                if (Storage.get(STORAGE_KEY_CLOSE_WHEN_RETURNIG)) {
                    Searcher.searchAgain();
                }
                Storage.remove(STORAGE_KEY_CLOSE_WHEN_RETURNIG);
                
                EventHandler.trigger("Core", "returnedFromApp");
            }
        }
    };
    
    this.BackgroundImage = new function() {
        this.CLASS_FULLSCREEN = "fullscreen-bgimage";
        
        this.updated = function() {

        };
        
        this.load = function() {
          
        };
        
        //overriden in Brain.android.js
        this.showFullScreen = function() {
            $body.addClass(Brain.BackgroundImage.CLASS_FULLSCREEN);
        };
        
        this.hideFullScreen = function() {
            $body.removeClass(Brain.BackgroundImage.CLASS_FULLSCREEN);
        };
    };
    
    
    this.Shortcuts = new function() {
        var _this = this,
            customizeInited = false,
            timeoutShowLoading = null,
            $screen = null,
            clickedCustomizeHandle = false,
            loadingCustomization = false;
            
        this.loaded = false;
        
        var SHOW_FAVORITES_SHORTCUTS_SELECTION_SCREEN_STORAGE_KEY = "shrtFav";
            
        this.init = function() {
            $screen = $('<div id="category-page-screen"></div>');
            $("#shortcuts-page .pages").append($screen);
            
            var $buttonClose = $('<b id="close-category"></b>');
            $buttonClose.bind("touchstart", function(e){
                e.preventDefault();
                e.stopPropagation();
                _this.closeCategoryPage();
            });
            $("#shortcuts-page .pages").append($buttonClose);
        };
        
        this.show = function() {
            new Tip(TIPS.APP_EXPLAIN, function(tip) {
                $(document.body).bind("touchstart", tip.hide);
            }).show();
            
            Brain.Searchbar.hideKeyboardTip();
            
            _this.loadFromAPI(function(){
                Brain.ShortcutsCustomize.addCustomizeButton();
            });
        };
        
        this.closeCategoryPage = function() {
            Shortcuts.showCategories();
        };
        
        this.loadFromAPI = function(callback, bForce) {
            if (!_this.loaded || bForce) {
                DoATAPI.Shortcuts.get({
                    "iconFormat": Utils.getIconsFormat(),
                }, function(data, methodNamespace, methodName, url) {
                    Shortcuts.load(data.response, callback);
                });
            } else {
                callback && callback(Shortcuts.get());
            }
        };
        
        this.load = function() {
            checkForMissingShortcutIcons();
        };
        
        function checkForMissingShortcutIcons() {
            var $elsWithMissingIcons = Shortcuts.getElement().find("*[iconToGet]"),
                appIds = [];
                
            if ($elsWithMissingIcons.length == 0) {
                return false;
            }
                
            for (var i=0,l=$elsWithMissingIcons.length; i<l; i++) {
                var $el = $elsWithMissingIcons[i],
                    appId = $el.getAttribute("iconToGet");
                    
                appIds.push(appId);
            }
            
            DoATAPI.icons({
                "ids": appIds.join(","),
                "iconFormat": Utils.getIconsFormat()
            }, function(data) {
                if (!data || !data.response) {
                    return;
                }
                
                var icons = data.response;
                for (var i in icons) {
                    var icon = icons[i],
                        objIcon = IconManager.add(icon.id, icon.icon, Utils.getIconsFormat()),
                        iconImage = Utils.formatImageData(objIcon);
                    
                    $elsWithMissingIcons.filter("[iconToGet='" + icon.id + "']").css("background-image", "url(" + iconImage + ")");
                }
            });
            
            return true;
        }
        
        this.hide = function() {
            
        };
        
        this.handleCustomizeClick = function() {
            ShortcutsCustomize.show(false);
        };
        
        this.click = function(data) {
            if (!data || !data.data || !data.data.query) {
                return;
            }
            
            if (Utils.isLauncher()) {
                data.force = true;
            }
            
            if (!Shortcuts.customizing() && !Shortcuts.isSwiping()) {
                var query = data.data.query,
                    tips = __config.categoriesDialogs;
                
                data.query = query;
                
                EventHandler.trigger("Shortcut", "click", data);
                
                if (tips[query] && !data.force) {
                    tips[query].query = query;
                    Shortcuts.showPage(tips[query]);
                    
                    if ($("#category-options li").length == 1) {
                        $("#page-category").addClass("one-option");
                    } else {
                        $("#page-category").removeClass("one-option");
                    }
                } else {
                    searchShortcut(data);
                }
            }
        };
        
        function searchShortcut(data) {
            !data.source && (data.source = SEARCH_SOURCES.SHORTCUT);
            
            EventHandler.trigger("Shortcut", "search", data);
            
            Searcher.searchExactFromOutside(data.query, data["source"], data.index, data.type);
        }
        
        this.clickContinue = function(data) {
            data.source = SEARCH_SOURCES.SHORTCUT_CONTINUE_BUTTON;
            searchShortcut(data);
            
            // after we search, hide the category middle page
            // so when users return they see the main categories
            window.setTimeout(function(){
                Shortcuts.showCategories();
            }, 1000);
        };
        
        this.searchCategoryPage = function(data) {
            data.source = SEARCH_SOURCES.SHORTCUT_ENTITY;
            searchShortcut(data);
            
            window.setTimeout(function(){
                Shortcuts.showCategories();
            }, 1000);
        };
        
        this.remove = function(data) {
            data.shortcut.remove();
            Shortcuts.remove(data.shortcut);
            
            if (!data.shortcut.isCustom()) {
                ShortcutsCustomize.add(data.data);
            }
        };
        
        this.load = function(data) {
            _this.loaded = true;
        };
        
        this.dragStart = function(data) {
            if (Shortcuts.customizing()) {
                ShortcutsCustomize.Dragger.start(data.e, data.shortcut);
            }
        };
    };
    
    this.ShortcutsCustomize = new function() {
        var _this = this,
            isFirstShow = true;
        
        this.init = function() {
            
        };
        
        this.show = function() {
            if (isFirstShow) {
                isFirstShow = false;
                
                // load user/default shortcuts from API
                Brain.Shortcuts.loadFromAPI(function(userShortcuts) {
                    var shortcutsToFavorite = {};
                    
                    for (var i=0; i<userShortcuts.length; i++) {
                        shortcutsToFavorite[userShortcuts[i].getQuery()] = true;
                    }
                    
                    ShortcutsCustomize.load(shortcutsToFavorite);
                    
                    // load suggested shortcuts from API
                    DoATAPI.Shortcuts.suggest({}, function(data) {
                        var suggestedShortcuts = data.response.shortcuts;
                        
                        shortcutsToFavorite = {};
                        
                        for (var i=0; i<suggestedShortcuts.length; i++) {
                            if (!shortcutsToFavorite[suggestedShortcuts[i].query]) {
                                shortcutsToFavorite[suggestedShortcuts[i].query] = false;
                            }
                        }
                        
                        ShortcutsCustomize.add(shortcutsToFavorite);
                    });
                });
            }
        };
        
        this.hide = function() {
        };
        
        this.done = function(data) {
            DoATAPI.Shortcuts.set({
                "shortcuts": JSON.stringify(data.shortcuts)
            }, function(data){
                Brain.Shortcuts.loadFromAPI(function(){
                    Shortcuts.show();
                    _this.addCustomizeButton();
                    ShortcutsCustomize.hide();
                }, true);
                
                //new Tip(TIPS.SHORTCUTS_FAVORITES_DONE, function(tip) {
                //    $("#" + Utils.getID()).bind("touchstart", tip.hide);
                //}).show();
            });
        };
        
        
        this.addCustomizeButton = function() {
            var $el = Shortcuts.getElement(),
                $elCustomize = $('<li class="shortcut add"><div class="c"><span class="thumb"></span><b>More</b></div></li>');
            
            $el.find(".shortcut.add").remove();
            
            $elCustomize.bind("touchstart", function(){
                ShortcutsCustomize.show(false);
            });
            
            $el.append($elCustomize);
        };
    };
    
    this.Dialog = new function() {
        var active = null;
        
        this.show = function(data) {
            active = data.obj;
            if (data.id == "location_error") {
                $body.addClass("location-input-visible");
            }
        };
        
        this.remove = function(data) {
            active = null;
            $body.removeClass("location-input-visible");
        };
        
        this.blackoutClick = function() {
            if (Utils.isKeyboardVisible()) {
                Searchbar.focus();
                _this.Searchbar.cancelBlur();
            }
        };
        
        this.getActive = function() {
            return active;
        };
        
        this.isActive = function() {
            return (active !== null && !Brain.Tips.isVisible());
        };
    };

    
    
    this.Tips = new function() {
        var _this = this,
            activeTip = null,
            timeoutShowTip = null;
        
        this.show = function(tip, options) {
            !options && (options = {});
            
            if (activeTip) {
                return;
            }
            
            var onHelper = false;
            
            if (options.query) {
                for (var tipId in TIPS.HELPER) {
                    if (tipId == options.query.toUpperCase()) {
                        var helperTip = TIPS.HELPER[tipId];
                        
                        helperTip.timesShown = _this.timesShown(helperTip);
                        
                        if (_this.timesShown(helperTip) < helperTip.timesToShow) {
                            showHelperTip(helperTip, options);
                            onHelper = true;
                        }
                        
                        break;
                    }
                }
            }
            
            return onHelper;
        };
        
        function showHelperTip(tip, options) {
            Helper.showText(tip.text);
            Helper.hideTitle();
            Helper.flash();
            _this.markAsShown(tip);
        }
        
        this.markAsShown = function(tip) {
            tip.timesShown++;
            Storage.set(tip.id, tip.timesShown);
        };
        
        this.timesShown = function(tip) {
            return Storage.get(tip.id) || 0;
        };
        
        this.isVisible = function() {
            return activeTip;
        };
    };
    
    
    this.Searcher = new function() {
        var appsCurrentOffset = 0,
            lastSearch = {},
            lastQueryForImage = "",
            hasMoreApps = false,
            iconsCachedFromLastRequest = [],
            autocompleteCache = {},
            timeoutShowExactTip = null;
            
        var requestSearch = null,
            requestImage = null,
            requestIcons = null,
            requestAutocomplete = null,
            
            timeoutShowDefaultImage = null
            timeoutHideHelper = null,
            timeoutSearchImageWhileTyping = null,
            timeoutSearch = null,
            timeoutSearchWhileTyping = null,
            timeoutAutocomplete = null,
            timeoutAppsLoading = null;
            
        var TIMEOUT_BEFORE_REQUESTING_APPS_AGAIN = 500,
            TIMEOUT_BEFORE_SHOWING_DEFAULT_IMAGE = 3000,
            TIMEOUT_BEFORE_SHOWING_HELPER = 3000,
            TIMEOUT_BEFORE_RENDERING_AC = 200,
            TIMEOUT_BEFORE_RUNNING_APPS_SEARCH = 200,
            TIMEOUT_BEFORE_RUNNING_IMAGE_SEARCH = 500,
            TIMEOUT_BEFORE_AUTO_RENDERING_MORE_APPS = 200,
            TIMEOUT_BEFORE_SHOWING_APPS_LOADING = 4000,
            TIMEOUT_BEFORE_SHOWING_APPS_RETRY = 4000;
        
        function resetLastSearch(bKeepImageQuery) {
            lastSearch = {
                "query": "",
                "exact": false,
                "type": "",
                "offset": false,
                "source": ""
            };
            
            if (!bKeepImageQuery) {
                lastQueryForImage = "";
            }
        }
        resetLastSearch();
        
        this.isLoadingApps = function() {
            return requestSearch;
        };
        
        this.getApps = function(options) {
            var query = options.query,
                type = options.type,
                source = options.source,
                index = options.index,
                reloadingIcons = options.reloadingIcons,
                exact = options.exact || false,
                iconsFormat = options.iconsFormat,
                offset = options.offset,
                onlyDidYouMean = options.onlyDidYouMean;
            
            Searchbar.startRequest();
            removeAppsIndicators();
            
            var removeSession = reloadingIcons;
            var prevQuery = removeSession? "" : lastSearch.query;
            var getSpelling = (source !== SEARCH_SOURCES.SUGGESTION && source !== SEARCH_SOURCES.REFINE && source !== SEARCH_SOURCES.SPELLING);
            
            if (exact && appsCurrentOffset === 0) {
                window.clearTimeout(timeoutHideHelper);
                
                if (!onlyDidYouMean) {
                    if (!options.automaticSearch) {
                        var urlOffset = appsCurrentOffset+NUMBER_OF_APPS_TO_LOAD;
                        if (urlOffset == NUMBER_OF_APPS_TO_LOAD && NUMBER_OF_APPS_TO_LOAD == DEFAULT_NUMBER_OF_APPS_TO_LOAD) {
                            urlOffset = 0;
                        }
                        
                        SearchHistory.save(query, type);
                    }
                    
                    timeoutHideHelper = window.setTimeout(Helper.showTitle, TIMEOUT_BEFORE_SHOWING_HELPER);
                }
                
                timeoutAppsLoading = window.setTimeout(showAppsLoading, TIMEOUT_BEFORE_SHOWING_APPS_LOADING);
            }
            
            iconsFormat = (appsCurrentOffset == 0)? Utils.ICONS_FORMATS.Small : Utils.getIconsFormat();
            options.iconsFormat = iconsFormat;
            
            var _NOCACHE = false;
            if (QUERIES_TO_NOT_CACHE.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                _NOCACHE = true;
            }
            
            cancelSearch();
            
            requestSearch = DoATAPI.search({
                "query": query,
                "typeHint": type,
                "index": index,
                "feature": source,
                "exact": exact,
                "spellcheck": getSpelling,
                "suggest": !onlyDidYouMean,
                "limit": NUMBER_OF_APPS_TO_LOAD,
                "first": appsCurrentOffset,
                "cachedIcons": Utils.convertIconsToAPIFormat(iconsCachedFromLastRequest),
                "iconFormat": iconsFormat,
                "prevQuery": prevQuery,
                "_NOCACHE": _NOCACHE
            }, function(data) {
                getAppsComplete(data, options);   
                
                requestSearch = null;
                NUMBER_OF_APPS_TO_LOAD = DEFAULT_NUMBER_OF_APPS_TO_LOAD;
            }, removeSession);
        };

        function getAppsComplete(data, options) {
            var _query = options.query,
                _type = options.type,
                _source = options.source,
                _index = options.index,
                reloadingIcons = options.reloadingIcons,
                isExactMatch = options.exact, 
                iconsFormat = options.iconsFormat,
                queryTyped = options.queryTyped, // used for searching for exact results if user stopped typing for X seconds
                onlyDidYouMean = options.onlyDidYouMean;
                
            if (data.errorCode !== DoATAPI.ERROR_CODES.SUCCESS) {
                return false;
            }
            
            removeAppsIndicators();
            
            window.clearTimeout(timeoutHideHelper);
            
            Apps.More.hideButton();
            
            var searchResults = data.response;
            var query = searchResults.query || _query;
            var disambig = searchResults.disambiguation || [];
            var suggestions = searchResults.suggestions || [];
            var apps = searchResults.apps || [];
            var spelling = searchResults.spellingCorrection || [];
            var isMore = (appsCurrentOffset > 0);
            var bSameQuery = (lastSearch.query === query);
            var tipShownOnHelper = false;
            
            // searching after a timeout while user it typing
            if (onlyDidYouMean || options.automaticSearch) {
                // show only spelling or disambiguation, and only if the query is the same as what the user typed
                if (query == queryTyped && (spelling.length > 0 || disambig.length > 1)) {
                    Helper.load(queryTyped, query, undefined, spelling, disambig);
                    Helper.hideTitle();
                    Helper.showSpelling();
                }
            } else {
                if (!isMore && !reloadingIcons) {
                    Helper.load(_query, query, suggestions, spelling, disambig);
                    
                    if (isExactMatch && !onlyDidYouMean && !Brain.App.isLoadingApp()) {
                        tipShownOnHelper = Brain.Tips.show(TIPS.FIRST_EXACT, {
                            "query": query
                        });
                    }
                    
                    if (isExactMatch) {
                        if (spelling.length > 0 || disambig.length > 1) {
                            Helper.hideTitle();
                            Helper.showSpelling();
                        } else {
                            if (!tipShownOnHelper) {
                                Helper.showTitle();
                            }
                        }
                    } else {
                        Helper.showSuggestions(_query);
                    }
                }
            }
            
            lastSearch.exact = isExactMatch && !onlyDidYouMean;
            
            if (isMore || !bSameQuery) {
                if (apps) {
                    lastSearch.query = query;
                    lastSearch.source = _source;
                    lastSearch.type = _type;
                    
                    Apps.More.hide();
                    
                    var method = _source == SEARCH_SOURCES.PAUSE? "updateApps" : "load";
                    
                    // if just updating apps (user paused while typing) but we get different apps back from API- replace them instead of updating
                    if (method == "updateApps" && Apps.getAppsSignature() != Apps.getAppsSignature(apps)) {
                        method = "load";
                    }
                    
                    var iconsResponse = Apps[method](apps, appsCurrentOffset, iconsFormat);
                    
                    if (iconsResponse) {
                        iconsCachedFromLastRequest = iconsResponse.cached;
                    }
                    
                    var maxApps = (searchResults.paging)? searchResults.paging.max || NUMBER_OF_APPS_TO_LOAD*2 : NUMBER_OF_APPS_TO_LOAD*2;
                    
                    hasMoreApps = appsCurrentOffset+NUMBER_OF_APPS_TO_LOAD < maxApps;
                    if (hasMoreApps) {
                        hasMoreApps = {
                            "query": _query,
                            "type": _type,
                            "isExact": isExactMatch
                        };
                        
                        Apps.More.showButton();
                    }
                }
            }
            
            if (isExactMatch) {
                var originalTip = TIPS.EXACT_RESULTS;
                if (data.response.queryType == QUERY_TYPES.EXPERIENCE && TIPS.EXACT_RESULTS_SHORTCUT) {
                    originalTIp = TIPS.EXACT_RESULTS_SHORTCUT;
                }
                
                var tip = JSON.parse(JSON.stringify(originalTip)),
                    query = Searchbar.getValue();
                    
                tip.text = tip.text.replace(/{QUERY}/gi, query);
                if (query.match(/apps/i)) {
                    tip.text = tip.text.replace("apps for ", "");
                }
                new Tip(tip).show();
            }
            
            Searchbar.endRequest();

            return true;
        }
        
        function showAppsLoading() {
            window.clearTimeout(timeoutAppsLoading);
            Apps.clear();
            Apps.Indicators.loading.show();
            
            timeoutAppsLoading = window.setTimeout(showAppsError, TIMEOUT_BEFORE_SHOWING_APPS_RETRY);
        }
        
        function showAppsError() {
            window.clearTimeout(timeoutAppsLoading);
            Apps.Indicators.loading.hide();
            Apps.Indicators.error.show();
        }
        
        function removeAppsIndicators() {
            window.clearTimeout(timeoutAppsLoading);
            Apps.Indicators.loading.hide();
            Apps.Indicators.error.hide();
        }
        
        this.getBackgroundImage = function(options) {
            var query = options.query,
                type = options.type,
                source = options.source,
                index = options.index,
                exact = options.exact;
                
            if (query == lastQueryForImage) {
                return;
            }
            
            setTimeoutForShowingDefaultImage();
            
            requestImage && requestImage.abort();
            requestImage = DoATAPI.bgimage({
                "query": query,
                "typeHint": type,
                "index": index,
                "feature": source,
                "exact": exact,
                "prevQuery": lastQueryForImage,
                "width": screen.width,
                "height": screen.height
            }, getBackgroundImageComplete);
        };
        
        function getBackgroundImageComplete(data) {
            if (data.errorCode !== DoATAPI.ERROR_CODES.SUCCESS) {
                return;
            }
            
            Searcher.clearTimeoutForShowingDefaultImage();
            
            var query = data.response.completion;
            var image = Utils.formatImageData(data.response.image);
            
            if (image) {
                lastQueryForImage = query;
                
                image = {
                    "image": image,
                    "query": query,
                    "source": data.response.source
                };
                
                BackgroundImage.update(image);
            }
        }
        
        this.getIcons = function(ids, format) {
            format = format || Utils.getIconsFormat();
            if (format !== Utils.ICONS_FORMATS.Large) {
                return;
            }
            
            requestIcons = DoATAPI.icons({
                "ids": ids.join(","),
                "iconFormat": format
            }, function(data) {
                getIconsComplete(ids, data, format);
            });
        };
        
        function getIconsComplete(ids, data, format) {
            var icons = data.response || [];
            
            for (var i=0, l=icons.length; i<l; i++) {
                var icon = icons[i];
                
                if (icon) {
                    var app = Apps.getApp(icon.id);
                    IconManager.add(icon.id, icon.icon, format);
                    
                    if (app) {
                        app.setIcon(icon.icon, true);
                    }
                }
            }
            
            for (var i=0, l=ids.length; i<l; i++) {
                var app = Apps.getApp(ids[i]);
                if (app && app.missingIcon()) {
                    app.setIcon(Apps.getDefaultIcon(), true);
                }
            }
        }
        
        this.getAutocomplete = function(query) {
            if (autocompleteCache[query]) {
                getAutocompleteComplete(autocompleteCache[query]);
                return;
            }
            
            requestAutocomplete = DoATAPI.suggestions({
                    "query": query
                }, function(data) {
                    if (!data) {
                        return;
                    }
                                        
                    var items = data.response || [];
                    autocompleteCache[query] = items;
                    getAutocompleteComplete(items, query);
                }
            );
        };
        
        function getAutocompleteComplete(items, querySentWith) {
            window.clearTimeout(timeoutAutocomplete);
            timeoutAutocomplete = window.setTimeout(function(){
                if (Utils.isKeyboardVisible() && !requestSearch) {
                    Helper.loadSuggestions(items);
                    Helper.showSuggestions(querySentWith);
                }
            }, TIMEOUT_BEFORE_RENDERING_AC);
        };
        
        
        function setTimeoutForShowingDefaultImage() {
            Searcher.clearTimeoutForShowingDefaultImage();
            timeoutShowDefaultImage = window.setTimeout(BackgroundImage.loadDefault, TIMEOUT_BEFORE_SHOWING_DEFAULT_IMAGE);
        }
        
        this.clearTimeoutForShowingDefaultImage = function() {
            window.clearTimeout(timeoutShowDefaultImage);
        };
        
        this.loadMoreApps = function() {
            if (hasMoreApps) {
                Apps.More.show();
                Searcher.nextAppsPage(hasMoreApps.query, hasMoreApps.type, hasMoreApps.isExact);
            }
        };
        
        this.empty = function(){
            Searcher.cancelRequests();
            Apps.clear();
            resetLastSearch();
            lastQueryForImage = "";
            
            if (!Searchbar.getValue()) {
                Helper.clear();
            }
        };

        this.nextAppsPage = function(query, type, exact) {
            appsCurrentOffset += NUMBER_OF_APPS_TO_LOAD;
            lastSearch.offset = appsCurrentOffset;
            
            Searcher.getApps({
                "query": query,
                "type": type,
                "source": SEARCH_SOURCES.MORE,
                "exact": exact,
                "offset": appsCurrentOffset
            });
        };
        
        this.searchAgain = function(source) {
            Searcher.cancelRequests();
            
            var query = Searchbar.getValue();
            var _query = lastSearch.query || query;
            var _source = source || lastSearch.source;
            var _type = lastSearch.type;
            var _offset = lastSearch.offset;
            
            if (_query) {
                resetLastSearch();
                Searcher.searchExact(_query, _source, null, _type, _offset);
            }
        };
        
        this.searchExactFromOutside = function(query, source, index, type, offset, isGetAllAppsForPage) {
            !type && (type = "");
            !offset && (offset = 0);
            
            if (query) {
                Helper.reset();
                Searchbar.setValue(query, false);
                
                Screens.Search.show();
                
                if (lastSearch.query != query || lastSearch.type != type || !lastSearch.exact) {
                    resetLastSearch();
                    
                    if (isGetAllAppsForPage && offset) {
                        NUMBER_OF_APPS_TO_LOAD = offset*1;
                        offset = 0;
                    }
                    
                    Searcher.searchExact(query, source, index, type, offset);
                } else {
                    Helper.enableCloseAnimation();
                    
                    Helper.setTitle(query);
                    window.setTimeout(Helper.showTitle, 50);
                }
                
                Searchbar.blur();
                window.setTimeout(function(){
                    Brain.Searchbar.cancelBlur();
                }, 0);
            }
            
            Brain.Searchbar.setEmptyClass();
        };

        this.searchExact = function(query, source, index, type, offset, automaticSearch) {
            Searcher.cancelRequests();
            appsCurrentOffset = 0;
            
            if (!automaticSearch) {
                Searchbar.setValue(query, false, true);
                Helper.setTitle(query);
            }
            
            var options = {
                "query": query,
                "type": type,
                "source": source,
                "index": index,
                "exact": true,
                "offset": offset,
                "automaticSearch": automaticSearch
            };
            
            Searcher.getApps(options);
            Searcher.getBackgroundImage(options);
        };
        
        this.searchExactAsYouType = function(query, queryTyped) {
            resetLastSearch(true);
            cancelSearch();
            appsCurrentOffset = 0;
            
            var options = {
                "query": query,
                "queryTyped": queryTyped,
                "source": SEARCH_SOURCES.PAUSE,
                "exact": true,
                "offset": 0,
                "onlyDidYouMean": true
            };
            
            Searcher.getApps(options);
            Searcher.getBackgroundImage(options);
        };
        
        this.searchAsYouType = function(query, source){
            appsCurrentOffset = 0;
            
            var searchOptions = {
                "query": query,
                "source": source
            };
            
            requestSearch && requestSearch.abort();
            window.clearTimeout(timeoutSearchWhileTyping);
            timeoutSearchWhileTyping = window.setTimeout(function(){
                Searcher.getApps(searchOptions);
            }, TIMEOUT_BEFORE_RUNNING_APPS_SEARCH);
            
            requestImage && requestImage.abort();
            window.clearTimeout(timeoutSearchImageWhileTyping);
            timeoutSearchImageWhileTyping = window.setTimeout(function(){
                Searcher.getBackgroundImage(searchOptions);
            }, TIMEOUT_BEFORE_RUNNING_IMAGE_SEARCH);
        };
        
        this.cancelRequests = function() {
            cancelSearch();
            
            Searcher.clearTimeoutForShowingDefaultImage();
            window.clearTimeout(timeoutSearchImageWhileTyping);
            requestImage && requestImage.abort();
            
            requestIcons && requestIcons.abort();
        };
        
        function cancelSearch() {
            window.clearTimeout(timeoutSearchWhileTyping);
            window.clearTimeout(timeoutSearch);
            requestSearch && requestSearch.abort();
        };
        
        function cancelAutocomplete() {
            requestAutocomplete && requestAutocomplete.abort();
            window.clearTimeout(timeoutAutocomplete);
        };
        
        this.setLastQuery = function() {
            Searchbar.setValue(lastSearch.query, false, true);
            Helper.setTitle(lastSearch.query, lastSearch.type);
        };
        
        this.getDisplayedQuery = function() {
            return lastSearch.query;
        };
        
        this.getDisplayedSource = function() {
            return lastSearch.source;
        };
        
        this.searchedExact = function() {
            return lastSearch.exact;
        };
    }
    var Searcher = this.Searcher;
};