/*
 * GAPageViews class
 * An extension to Analytics.js
 */
function GAPageViews(Sandbox){
    var _this = this, config, logger, processedItems, tracker, tempEventArr = [], resultsPageName = "searchResults",
        constants = {
            "Results_search": resultsPageName+"?query={query}&feature={feature}&type={type}&source={source}",
            
            /* THESE WERE ALL UNIFIED UNDER Results_search */
            //"Searchbar_returnPressed": resultsPageName+"?query={query}&feature=rtrn",
            //"suggestions_click": resultsPageName+"?query={query}&feature=sugg",
            //"history_click": resultsPageName+"?query={query}&feature=hist",
            //"didyoumean_click": resultsPageName+"?query={query}&feature=spel",
            //"Shortcut_click": resultsPageName+"Shortcut?query={query}&feature=shrt",
            //"Helper_searchFromFirstSuggestion": resultsPageName+"FirstHelper?query={query}&feature=appClick",
            //"HomepageTrending_click": resultsPageName+"Trending?query={query}&feature=trnd",
            //"Core_redirectedToAppForSearch": resultsPageName+"?query={query}&feature=appClick",
            //"AppsMore_showWhileKeyboardOpen": resultsPageName+"?query={query}&feature=more",
            //"Searchbar_idle": resultsPageName+"?query={query}&feature=idle",
            //"Core_searchOnPageLoad": resultsPageName+"?query={query}&feature=pageLoad",
            //"HomepageTip_searchFromClick": resultsPageName+"?query={query}&feature=homeTip",
            
            "Core_redirectedToApp": "appClick",
            
            "Info_home": "info",
            "Info_page": "infoPage_{id}",
            
            "Welcome_show": "welcome",
            "Welcome_getTheApp": "welcomeGetTheApp",
            "Welcome_dismiss": "welcomeDismiss?from={page}",
            "Welcome_signup": "welcomeSignup",
            
            "Url_goTo": "{page}?source={source}",
            
            "HomepageTrending_fullCycle": "homeFullTrendingCycle"
        };
        
    this.immediateDispatch = true;
    
    this.init = function(_config, _logger){
        // set config
        config = _config;
        logger = _logger;
        
        // set tracker ready callback
        Sandbox.onGAScriptLoad(onTrackerLoad);

        // log 
        logger.debug("GAPageViews.init(",config,")");
    };
    
    // actual report
    this.dispatch = function(items){
        // leave if no items
        if (!items.length) { return false;}
        
        // report
        if (tracker){

            // process
            items = process(items);
            
            items.forEach(function(item){
                tracker[item[0]](item[1]);    
            });
        
            // log
            logger.debug("GAPageViews.dispatch(", items,")");
        } else {
            tempEventArr = tempEventArr.concat(items);
        
            // log
            logger.debug("GAPageViews stored items in tempEventArr", items);
        }
    };
    
    function process(items){
        processedItems = [];
        
        // make into an array if not
        if (!(items instanceof Array)){
            items = [items];
        }
        
        // process
        items.forEach(function(item){
            var key = item["class"]+"_"+item["event"];
            
            // if the constant exists
            if (!(key in constants)) {return false; }
            
            // if it's a search report
            if (constants[key].indexOf(resultsPageName) === 0){
                // if the query is different from the last
                if (!Sandbox.isNewSearchQuery(item["data"]["query"])){
                    return false;
                } 
            }
            
            // render template
            var url = renderTemplate(constants[key], item["data"]);
                url = config.pageViewPrefix+url;
            
            // push to queue
            processedItems.push(["_trackPageview", url]);
        });
        
        return processedItems;
    }
    
    function onTrackerLoad(_tracker){
        // log
        logger.debug("GAEvents onTrackerLoad");
        
        tracker = _tracker;
        
        if (tempEventArr.length) {
            _this.dispatch(tempEventArr);
        }
    }
    
    // template rendering
    function renderTemplate(str, attrArr) {
        if ( !attrArr ) return str;
        for ( var key in attrArr ) {
            str = str.replace("{" + key + "}", attrArr[key]);
        }
        str = str.replace(/{.*}/, "");
        return str;
    };
}
