/*
 * GAFunnel class
 * An extension to Analytics.js
 */
function GAFunnel(Sandbox){
    var _this = this, processedItems, url, idle, tracker, previouslyStoredUrl,
    
        // url settings
        URL_END = "end",
        URL_DELIMITER = "/",
        
        // local storage keys
        URL = "analytics_gafunnel_url",
        TIME = "analytics_gafunnel_time",
        
        constants = {
            "Searchbar_returnPressed": "sretcl",
            "Suggestions_click": "sgcl,{index},{visible}",
            "App_click": "apcl,{rowIndex}-{totalRows},{colIndex}-{totalCols},{visible},{keyboardVisible}",
            "Search_typing": "srty",
            "Shortcut_click": "shcl,{index}",
            "Spelling_click": "splcl",
            "HonmepageTrending_click": "trcl,{index}",
            "BackgroundImage_showFullScreen": "bgimcl",
            "AppsMore_show": "lm",
            "Core_returnedFromApp": "rdfap,{elapsedTime}"
        };
    
    this.init = function(_config){
        // set tracker ready callback
        Sandbox.onGAScriptLoad(function(){
            onTrackerLoad(_config.account);
        });
        
        // Idle
        idle = new Idle();
        idle.init({
            "callback": dispatch,
            "delay": _config.idleDelay || 4000
        });        
        
        // dispatch url in local storage
        if (localStorage[URL] && localStorage[TIME]){
            console.log("*********** localStorage found");
            
            // calculate elapsed
            var elapsed = new Date().getTime() - localStorage[TIME];
            
            // if its been enough time
            if (elapsed > _config.idleDelay){
                console.log("*********** elapsed is greater than delay", elapsed);
                // dispatch url
                dispatch();
            }
            else{                
                console.log("*********** elapsed not greater than delay", elapsed);
                idle.advanceBy(elapsed);                
                console.log("*********** advancing idle", elapsed);
            }
        }
        // start a new analytics session
        else{            
            console.log("*********** localStorage NOT found");
            add(Sandbox.getSessionId());
        }

        // log 
        logger.debug("GAFunnel.init(",_config,")");
    };
    
    // public dispatch
    this.dispatch = function(items){
        // leave if no items
        if (!items.length) { return false;}
        
        // reset idle timer
        idle.reset();       
        
        // update url and timestamp
        for (i in items){
            add(process(items[i]));
        }
        
        // log
        logger.debug("GAFunnel.dispatch(", items,")");
        logger.debug("GAFunnel url=\'", localStorage[URL]+"\"");
    };
    
    // dispatch
    function dispatch(){
        var url = localStorage[URL]+URL_END;
                
        // if tracker exists
        if (tracker){
            // report
            tracker._trackPageview(url);
            // log
            logger.debug("GAFunnel.dispatch(", url,")");
        }
        // if not
        else{
            // store it for later reporting
            previouslyStoredUrl = url;
            
            // log
            logger.debug("GAFunnel previouslyStoredUrl = "+url);
        }
        
        // start a new analytics session
        localStorage[URL] = "";
        add(Sandbox.getSessionId());
    };
    
    // process
    function process(item){
        // render template
        var template = constants[item["class"]+"_"+item["event"]];
        var itemStr = renderTemplate(template, item["data"]);        
        
        // replace true/false with 1/0
        itemStr = itemStr.replace(/false/g, "0").replace(/true/g, "1");
        
        return itemStr;
    }
    
    // add to url
    function add(str){
        // create if needed
        !localStorage[URL] && (localStorage[URL] = "");
        
        // concat string
        localStorage[URL] += str + URL_DELIMITER;
        
        // set new timestamp
        localStorage[TIME] = new Date().getTime();
    }
    
    function onTrackerLoad(account){
        // create tracker
        tracker = window._gat._createTracker(account);
        
        // log
        logger.debug("GAFunnel onTrackerLoad");
        
        // report previously stored url
        if (previouslyStoredUrl){
            // report
            tracker._trackPageview(previouslyStoredUrl);
            
            // log
            logger.debug("GAFunnel dispatchung previouslyStoredUrl", url);
            
            // empty
            previouslyStoredUrl = null;
        }
    }
    
    // template rendering
    function renderTemplate(str, attrArr) {
        if ( !attrArr ) return str;
        for ( var key in attrArr ) {
            str = str.replace("{" + key + "}", attrArr[key]);
        }
        return str;
    };
}
