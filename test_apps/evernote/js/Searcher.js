var Searcher = new function() {
    var _this = this,
        elInput = null,
        searchNotes = null, searchFields = [], lastValueSearched = "",
        onSearch = null;
        
    this.init = function(options) {
        elInput = options.input;
        onSearch = options.onSearch;
        
        elInput.addEventListener("keyup", onKeyUp);
    };
    
    this.setData = function(_notes, _fields) {
        searchNotes = _notes;
        searchFields = _fields;
    };
    
    this.search = function(keyword) {
        var results = [],
            regexMatch = new RegExp("(" + keyword + ")", "i");
        
        for (var i=0,il=searchNotes.length; i<il; i++) {
            var item = searchNotes[i],
                match = false;
            
            for (var j=0,jl=searchFields.length; j<jl; j++) {
                var val = item.getProperty(searchFields[j]);
                if (val.match(regexMatch)) {
                    match = true;
                }
            }
            
            if (match) {
                results.push(item);
            }
        }
        
        return results;
    };
    
    function onKeyUp(e) {
        if (lastValueSearched == this.value) {
            return;
        }
        
        lastValueSearched = this.value;
        
        var items = _this.search(lastValueSearched);
        onSearch && onSearch(items);
        
    }
};