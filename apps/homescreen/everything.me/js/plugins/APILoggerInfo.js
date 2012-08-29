/*
 * APILoggerInfo class
 */
function APILoggerInfo(Sandbox){
    var _this = this, config, logger, processedItems, report = Sandbox.Logger.info, tempEventArr = [], enabled = true, item_count = 0,
        templates = {
            "Core_requestInvite": {
                "userEvent": "requestInvite",
                "email": "{email}"
            },
            
            "Survey_open": {
                "userEvent": "surveyOpen",
                "survey": "{survey}",
                "question": "{question}",
                "prompt": "{prompt}"
            },
            "Survey_close": {
                "userEvent": "surveyClose",
                "survey": "{survey}",
                "question": "{question}",
                "reason": "{reason}"
            },
            "Survey_promptShow": {
                "userEvent": "surveyPromptShow",
                "survey": "{survey}",
                "question": "{question}",
                "prompt": "{prompt}"
            },
            "Survey_promptDismiss": {
                "userEvent": "surveyPromptDismiss",
                "survey": "{survey}",
                "question": "{question}",
                "prompt": "{prompt}"
            },
            "Survey_vote": {
                "userEvent": "surveyVote",
                "survey": "{survey}",
                "question": "{question}",
                "answer": "{answer}"
            }
        };
        
    this.name = "APILoggerInfo";
    
    this.init = function(_config, _logger){
        // set config
        config = _config;
        logger = _logger;
        
        // add common params
        for (var k in templates){
            templates[k]["elapsed"] = "{elapsed}";
        }
        
        // stringify templates
        templatesStr = stringify(templates);

        // log 
        logger.debug(_this.name+".init(",config,")");
    };
    
    function stringify(old){
        var temp = {};
        
        for (key in old){
            var value = old[key];
                value = JSON.stringify(value);
            temp[key] = value;
        }
        
        return temp;
    }
    
    // actual report
    this.dispatch = function(items){
        // leave if disabled or is no items provided
        if (!enabled || !items.length) { return false;}
        
        // process
        items = process(items);
        
        if (items.length){
            // increment item_count
            item_count += items.length;
            
            // report
            report({
                "params": "["+ items.toString()+"]"
            });
        
            // log
            logger.debug(this.name+".dispatch(", items,")");
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
                var template = templatesStr[item["class"]+"_"+item["event"]]
                    data = renderTemplate(template, item["data"]);

                data && processedItems.push( data );
            }
        });
        
        return processedItems;
    }
    
    function authenticate(item){
        var method = item["class"]+"_"+item["event"];
        return method in templates;
    }
    
    // template rendering
    function renderTemplate(str, attrArr) {
        if (str && attrArr) {
            for ( var key in attrArr ) {
                str = str.replace("{" + key + "}", attrArr[key]);
            }
        }
        return str;
    };
}

