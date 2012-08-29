/*
 * GoogleAnalytics class
 * An extension to Analytics.js
 */
function GAEvents(Sandbox){
    var _this = this, config, logger, processedItems, tracker, tempEventArr = [], templatesStr = "",
        templates = {
            "Core_redirectedToApp": {
                "category": "appClick",
                "action": "{query}",
                "label": "{appIdName}"
            },
            
            "event_override": {
                "category": "{category}",
                "action": "{action}",
                "label": "{label}",
                "value": "{value}"
            }
        };
        
    this.name = "GAEvents";
        
    this.immediateDispatch = true;
    
    this.init = function(_config, _logger){
        // set config
        config = _config;
        logger = _logger;
        
        // set tracker ready callback
        Sandbox.onGAScriptLoad(onTrackerLoad);

        // log 
        logger.debug("GAEvents.init(",config,")");
    };
    
    // actual report
    this.dispatch = function(items){
        // leave if no items
        if (!items.length) { return false;}
        
        // report
        if (tracker){
            // process
            items = process(items);
            
            // report
            items.forEach(function(d){
                tracker["_trackEvent"].apply(tracker, d);
            });
            
            // log
            logger.debug("GAEvents.dispatch(", items,")");
        } else {
            tempEventArr = tempEventArr.concat(items);
        
            // log
            logger.debug("GAEvents stored items in tempEventArr", items);
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
            // authenticate
            if (authenticate(item)) {
                // render template
                var template = templates[item["class"]+"_"+item["event"]],
                    d = renderTemplate(template, item["data"]);
                
                if (d){
                    var args = [d.category, d.action];
                    d.label && (args.push(d.label));
                    d.value && (args.push(d.value));
                    
                    processedItems.push( args )
                }
            }
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
    
    function authenticate(item){
        var method = item["class"]+"_"+item["event"];
        return method in templates;
    }
    
    // template rendering
    function renderTemplate(template, data) {
        if (template && data) {
            
            var retObj = {};
            
            for ( var tKey in template ) {
                if (typeof template[tKey] === "string" && template[tKey].indexOf("{") === 0){
                    for (var dKey in data){
                        if ("{" + dKey + "}" === template[tKey]){
                            retObj[tKey] = data[dKey];
                            break;
                        }
                    }
                }
                !retObj[tKey] && (retObj[tKey] = template[tKey]);
            }
            return retObj;
        }
        else{
            return template;
        }
    }
}
