// http://HOST/#!/(homepage|search)/{query}/(type|all)/all
var Url = new function() {
    var _name = "Url", _this = this, prefix = "#!";
    
    var URL_ENABLED = false;

    this.activate = true;
    this.PREFIX = prefix;
    this.PAGES = {
        "Search": "search",
        "Homepage": "homepage",
        "Info": "info"
    };

    this.goTo = function(page, query, type, paging) {
        if (!URL_ENABLED) return;
        
        var currentUrl = _this.get(), urlChanged = false;
        
        var url = "/" + page;
        
        if (query !== undefined && query !== "") {
            url += "/" + encodeURIComponent(query.toLowerCase());
            
            if (type !== undefined && type !== "") {
                url += "/" + encodeURIComponent(type.toLowerCase());
            }
            
            if (paging) {
                url += "/" + paging;
            }
        }
        
        if (window.location.hash !== decodeURIComponent(prefix + url)) {
            _this.activate = false;
            urlChanged = true;
            
            window.location.href = prefix + url;
        }
        
        EventHandler.trigger(_name, "goTo", {
            "page": page,
            "paging": paging,
            "urlChanged": urlChanged
        });

        return true;
    };

    this.get = function() {
        if (!URL_ENABLED) return;
        
        var obj = {
            "page": "",
            "query": "",
            "type": "",
            "paging": 0
        };
        var url = window.location.hash || "";

        url = url.split("/");

        if (url.length > 1) {
            obj.page = url[1];
        }
        if (url.length > 2) {
            obj.query = (decodeURIComponent(url[2]) || "").toLowerCase();
        }
        if (url.length > 3) {
            var type = (decodeURIComponent(url[3]) || "").toLowerCase();
            
            if (type*1 != type) {
                obj.type = type;
            } else {
                obj.paging = type;
            }
        }
        if (url.length > 4) {
            obj.paging = decodeURIComponent(url[4]) || 0;
        }

        return obj;
    };
};