/*
 * APIStatsFunnel class
 * An extension to Analytics.js
 */
function APIStatsFunnel(Sandbox){
    var _this = this, processedItems, url, idle, tracker = Sandbox.DoATAPI,
    
        // url settings
        URL_END = "end",
        URL_DELIMITER = "/",
        
        // local storage keys
        URL = "analytics_apistatsfunnel_url",
        TIME = "analytics_apistatsfunnel_time",
        
        constants = {
            "Searchbar_returnPressed": "sretcl",
            "Suggestions_click": "Suggestions_click,index={index},visible={visible}",
            "App_click": "apcl,{rowIndex}-{totalRows},{colIndex}-{totalCols},{visible},{keyboardVisible}",
            "Search_typing": "srty",
            "Shortcut_click": "shcl,{index}",
            "Spelling_click": "splcl",
            "HomepageTrending_click": "trcl,{index}",
            "BackgroundImage_showFullScreen": "bgimcl",
            "AppsMore_show": "lm",
            "Core_returnedFromApp": "rdfap,{elapsedTime}",
            "TRACKER_EVENT_NAME_KEY": "event",
            "TRACKER_EVENT_NAME": "sessionfunnel",
            "TRACKER_PARAM_KEY": "funnel"
        };
    
    this.init = function(_config){
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
        logger.debug("APIStatsFunnel.dispatch(", items,")");
        logger.debug("APIStatsFunnel url=\'", localStorage[URL]+"\"");
    };
    
    // dispatch
    function dispatch(){
        // add ending
        var url = localStorage[URL]+URL_END;
                
        // construct params
        var params = {};
        params["data"] = "[{"+
                "\""+constants.TRACKER_EVENT_NAME_KEY+"\":\""+constants.TRACKER_EVENT_NAME+"\","+
                "\""+constants.TRACKER_PARAM_KEY+"\":\""+url+"\""+
                "}]";
        
        // report
        tracker.report(params);
        
        // log
        logger.debug("APIStatsFunnel.dispatch(", url,")");
        
        // start a new analytics session
        localStorage[URL] = "";
        add();
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
        str && (localStorage[URL] += str + URL_DELIMITER);
        
        // set new timestamp
        localStorage[TIME] = new Date().getTime();
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
