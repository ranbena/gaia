Evme.ShortcutsCustomize = new function() {
    var _name = 'ShortcutsCustomize', _this = this,
        $list = null,
        numSelectedStartedWith = 0, numSuggestedStartedWith = 0;
        
    this.init = function(options) {
        $parent = options.$parent;
        
        $list = $('<select multiple="multiple" id="shortcuts-select"></select>');
        $list.bind('change', done);
        $list.bind('blur', onHide);
        
        $parent.append($list);
        
        Evme.EventHandler.trigger(_name, 'init');
    };
    
    this.show = function() {
        $list.focus();
        
        Evme.EventHandler.trigger(_name, 'show', {
            'numSelected': numSelectedStartedWith,
            'numSuggested': numSuggestedStartedWith
        });
    };
    
    this.hide = function() {
        $list.blur();
    };
    
    this.get = function() {
        var $items = $list.find('option'),
            shortcuts = [];
        
        for (var i=0; i<$items.length; i++) {
            if ($items[i].selected) {
                shortcuts.push($items[i].value);
            }
        }
        
        return shortcuts;
    };
    
    this.load = function(shortcuts) {
        numSelectedStartedWith = 0;
        numSuggestedStartedWith = 0;
        
        $list.empty();
        _this.add(shortcuts);
        
        Evme.EventHandler.trigger(_name, 'load');
    };
    
    this.add = function(shortcuts) {
        var html = '';
        
        for (var query in shortcuts) {
            html += '<option value="' + query.replace(/"/g, '&quot;') + '"';
            
            if (shortcuts[query]) {
                html += ' selected="selected"';
                numSelectedStartedWith++;
            } else {
                numSuggestedStartedWith++;
            }
            
            html += '>' + query.replace(/</g, '&lt;') + '</option>';
        }
        
        $list.append(html);
    };
    
    this.Loading = new function() {
        var _this = this,
            active = false,
            ID = 'shortcuts-customize-loading';
        
        this.show = function() {
            if (active) return;
            
            var $el = $('<div id="' + ID + '"></div>');
            $('#' + Evme.Utils.getID()).append($el);
            active = true;
        };
        
        this.hide = function() {
            if (!active) return;
            
            $('#' + ID).remove();
            active = false;
        };
    };
    
    function onHide() {
        Evme.EventHandler.trigger(_name, 'hide');
    }
    
    function done() {
        var shortcuts = _this.get();
        
        Evme.EventHandler.trigger(_name, 'done', {
            'shortcuts': shortcuts,
            'numSelectedStartedWith': numSelectedStartedWith,
            'numSuggestedStartedWith': numSuggestedStartedWith,
            'numSelected': shortcuts.length,
            'numSuggested': $list.find('option').length - shortcuts.length
        });
    }
};
