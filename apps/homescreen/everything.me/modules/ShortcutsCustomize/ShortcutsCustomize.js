Evme.ShortcutsCustomize = new function() {
    var _name = 'ShortcutsCustomize', _this = this,
        $el = null, $title = null, $subTitle = null, $list = null, $buttonDone = null,
        scroll = null, numSelectedStartedWith = 0, numSuggestedStartedWith = 0, clicked = null, moved = null,
        
        title = 'FROM CONFIG',
        titleCustomize = 'FROM CONFIG',
        subTitle = 'FROM CONFIG',
        buttonDone = 'FROM CONFIG',
        buttonDoneSaving = 'FROM CONFIG';
        
    this.init = function(options) {
        $parent = options.$parent;
        
        $list = $('<select multiple="multiple" id="shortcuts-select"></select>');
        $list.bind('change', done);
        
        $el = $('<div></div>');
        
        $parent.append($list);
        $parent.append($el);
        
        Evme.EventHandler.trigger(_name, 'init');
    };
    
    this.show = function() {
        $el.addClass('visible');
        $list.focus();
        
        Evme.EventHandler.trigger(_name, 'show', {
            'numSelected': numSelectedStartedWith,
            'numSuggested': numSuggestedStartedWith
        });
    };
    
    this.hide = function() {
        $el.removeClass('visible');
        
        Evme.EventHandler.trigger(_name, 'hide');
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
            ID = 'shortcuts-customize-loading';
        
        this.show = function() {
            _this.hide();
            
            var $el = $('<div id="' + ID + '"></div>');
            $('#' + Evme.Utils.getID()).append($el);
        };
        
        this.hide = function() {
            $('#' + ID).remove();
        };
    };
    
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
