var Searchbar = new function() {
    var _name = "Searchbar", _this = this,
        $el = null, $form = null, $clear = null, $defaultText = null,
        value = "", $elAutocomplete = null, Selection = null,
        timeoutSearchOnBackspace = null, timeoutPause = null, timeoutIdle = null,
        intervalPolling = null;
        
    var DEFAULT_TEXT = "FROM CONFIG",
        SEARCHBAR_POLLING_INTERVAL = 300,
        TIMEOUT_BEFORE_SEARCHING_ON_BACKSPACE = 500,
        TIMEOUT_BEFORE_SENDING_PAUSE_EVENT = "FROM CONFIG",
        TIMEOUT_BEFORE_SENDING_IDLE_EVENT = "FROM CONFIG",
        RETURN_KEY_CODE = 13,
        SET_FOCUS_ON_CLEAR = true,
        BACKSPACE_KEY_CODE = 8,
        DELETE_KEY_CODE = 46,
        ftr = {
            "KeyboardEvents": true, // bind to keyup and keydown (false: use interval)
            "ClearButton": true,    // show clear button inside the searchbox
            "AutoComplete": true,   // show gray autocomplete over the searchbox (NOT WORKING)
            "Selection": true,      // show selection around value when focusing on searchbox
            "Blur": true,           // search on blur
            "Paste": true           // bind to paste event
        };

    this.init = function(options) {
        !options && (options = {});
        
        $el = options.$el;
        $defaultText = options.$defaultText;
        $form = options.$form;
        if (options.features){
            for (var i in options.features) {
                ftr[i] = options.features[i];
            }
        }
        
        if (typeof options.setFocusOnClear == "boolean") {
            SET_FOCUS_ON_CLEAR = options.setFocusOnClear;
        }
        
        if (Utils.needsInputPolling()) {
            ftr.KeyboardEvents = false;
        }
        
        $form.bind("submit", function(e){
            e.preventDefault();
            e.stopPropagation();
            cbReturnPressed(e, $el.val());
        });
        
        $("#button-back").bind("touchstart", function(){
            $(this).addClass("down");
        }).bind("click", function(e){
            $(this).removeClass("down");
            backButtonClick(e);
        });
        
        DEFAULT_TEXT = options.texts.defaultText;
        if (DEFAULT_TEXT) {
            $defaultText.html(DEFAULT_TEXT);
        }
        BUTTON_CLEAR = options.texts.clear;
        
        TIMEOUT_BEFORE_SENDING_PAUSE_EVENT = options.timeBeforeEventPause;
        TIMEOUT_BEFORE_SENDING_IDLE_EVENT = options.timeBeforeEventIdle;
        
        ftr.AutoComplete && ($elAutocomplete = options.$elAutocomplete);
        
        if (ftr.Selection) {
            Selection = options.useNativeSelection ? new nativeSelection() : new pseudoSelection();
        }
        
        $("#button-clear").html(BUTTON_CLEAR).bind("touchstart", function(e){
            e.preventDefault();
            e.stopPropagation();
            clearButtonClick();
        });
        
        _this.bindEvents($el, cbFocus, inputKeyDown, inputKeyUp);
            
        ftr.Paste && $el.bind("paste", pasted);
        
        ftr.Blur && $el.bind("blur", cbBlur);
            
        ftr.Selection && $el.bind("click", Selection.create);

        ftr.AutoComplete && $elAutocomplete && $elAutocomplete.click(function(){
            $el.focus();
            ftr.Selection && Selection.create();
        });

        EventHandler.trigger(_name, "init");
    };
    
    this.bindEvents = function($el, cbFocus, inputKeyDown, inputKeyUp){
        $el.bind("mousedown", cbFocus);
        
        $el.bind("keydown", inputKeyDown)
           .bind("keyup", inputKeyUp);
    };

    this.getValue = function() {
        return value;
    };
    
    this.setValue = function(_value, bPerformSearch, bDontBlur) {
        if (_value != "") {
            ftr.ClearButton && _this.showClearButton();
        }
        
        if (value !== _value) {
            value = _value;
            $el.val(value);

            if (bPerformSearch) {
                if (value == "") {
                    cbEmpty();
                } else {
                    cbValueChanged(value);
                }
            }

            if (!bDontBlur) {
                ftr.Blur && _this.blur();
            }
        }
    };

    this.clear = function() {
        _this.hideClearButton();
        value = "";
        $el[0].value = "";
    };

    this.focus = function() {
        $el[0].focus();
        cbFocus();
    };

    this.blur = function(e) {
        $el[0].blur();
        
        !ftr.Blur && cbBlur(e);
            
        // For windows phone- not enough to blur the keyboard, need to move focus
        if (Utils.os() === "windowsphoneos") {
            window.focus();
            window.setTimeout(function() {
                window.focus();
            }, 50);
        }
    };
    
    this.getElement = function() {
        return $el;
    };

    this.startRequest = function() {
        pending = true;
    };

    this.endRequest = function() {
        pending = false;
    };

    this.isWaiting = function() {
        return pending;
    };
    
    this.updateAutocomplete = function(input) {
        if (ftr.AutoComplete){
            var currentCompletion = $elAutocomplete.data("completion");
            if (currentCompletion) {
                _this.setAutocomplete(currentCompletion, input);
            }    
        }
    };

    this.setAutocomplete = function(completion, input) {
        if (ftr.AutoComplete){
            completion = completion.toLowerCase();
            input = input.toLowerCase();
            
            completion = completion.replace(/[\[\]]/g, "");
            
            var html = "";
            if (input && completion.replace(/ /g, "").indexOf(input.replace(/ /g, "")) == 0) {
                var suffix = completion.replace($.trim(input), "");
                suffix = suffix.replace(/</g, "&lt;");
                html = '<b>' + input + '</b>' + suffix;
            }
            $elAutocomplete[0].innerHTML = html;
            
            $elAutocomplete.data("completion", completion)
                           .data("input", input);    
        }
    };

    this.clearAutocomplete = function() {
        ftr.AutoComplete && ($elAutocomplete[0].innerHTML = "");
    };
    
    this.hideClearButton = function() {
        if (ftr.ClearButton) {
            $("#search-header").removeClass("clear-visible");
        }
    };
    
    this.showClearButton = function() {
        if (ftr.ClearButton) {
            $("#search-header").addClass("clear-visible");
        }
    };
    
    this.pollValue = function() {
        _this.stopPollingValue();
        intervalPolling = window.setInterval(function(){
            var _value = $el.val();
            _this.setValue(_value, true, true);
        }, SEARCHBAR_POLLING_INTERVAL);
    };
    
    this.stopPollingValue = function() {
        window.clearInterval(intervalPolling);
    };
    
    function backButtonClick(e) {
        e.stopPropagation();
        EventHandler.trigger(_name, "backButtonClick");
    }
    
    function pseudoSelection(){
        var self = this,
            $elSelection = null;
                
        function onClick(e){
            e.stopPropagation();
            e.preventDefault();
            _this.focus();
            self.cancel();
        }
        
        this.create = function(){
            if ($elSelection) {
                self.cancel();
            } else {
                var val = $el.val().replace(/</g, "&lt;");
                if (val == "") {
                    return;
                }
                
                $elSelection = $('<span id="search-selection"><span>' + val + '</span></span>');
                $elSelection.bind("touchstart", onClick)
                            .bind("mousedown", onClick);
                            
                $el.parent().append($elSelection);
                $el[0].setSelectionRange(0, 0);
            }
        };
        
        this.cancel = function(){
            if ($elSelection) {
                $elSelection.remove();
                $elSelection = null;
                $el[0].setSelectionRange(100000, 100000);
            }
        };
        
        this.isSelected = function(){
            return ($elSelection !== null);
        };
    }
    
    function nativeSelection(){
        var self = this,
            isSelected = false;
        
        this.create = function(){
            var end = $el.val().length;
        
            if (isSelected){
                //logger.debug('nativeSelection deselected');
                // deselect and move anchor to end
                isSelected = false;
            }
            else{
                // select
                //logger.debug('nativeSelection selected');
                $el[0].setSelectionRange(0, end);
                isSelected = true;    
            }
        };
        
        this.cancel = function(){
            //window.getSelection().getRangeAt(0).removeRange();
            //$el[0].setSelectionRange(end, end);
            isSelected = false;
        };
        
        this.isSelected = function(){
            return isSelected;
        };
    }

    function clearButtonClick() {
        ftr.Selection && Selection.cancel();
        _this.setValue("", false, true);
        
        if (SET_FOCUS_ON_CLEAR) {
            $el.focus();
        }
        
        window.setTimeout(function(){
            cbClear();
            cbEmpty();
        }, 0);
    }
    
    function inputKeyDown(e) {
        // Hack to disable keyboard- must be here to cancel the event
        if (Brain.Dialog.isActive()) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        if (e.keyCode !== RETURN_KEY_CODE && ftr.Selection && Selection.isSelected()) {
            $el.val("");
            Selection.cancel();
        }
        
        window.clearTimeout(timeoutPause);
        window.clearTimeout(timeoutIdle);
    }
    
    function inputKeyUp(e) {
        var _value = $el.val();
        
        if (_value !== value) {
            ftr.AutoComplete && _this.updateAutocomplete(_value);
            
            value = _value;

            if (value == "") {
                timeoutSearchOnBackspace && window.clearTimeout(timeoutSearchOnBackspace);
                cbEmpty();
            } else {
                ftr.ClearButton && _this.showClearButton();
                if (e.keyCode == BACKSPACE_KEY_CODE) {
                    timeoutSearchOnBackspace && window.clearTimeout(timeoutSearchOnBackspace);
                    timeoutSearchOnBackspace = window.setTimeout(function(){
                        cbValueChanged(value);
                    }, TIMEOUT_BEFORE_SEARCHING_ON_BACKSPACE);
                } else {
                    cbValueChanged(value);
                }
            }
        } else {
            if (e.keyCode == RETURN_KEY_CODE) {
                cbReturnPressed(e, value);
            }
        }
        
        _this.pollValue();
    }

    function pasted(e) {
        //
         // Setting timeout because otherwise the value of the input is the one
         // before the paste.
         //
        window.setTimeout(function(){
            inputKeyUp({
                "keyCode": ""
            });
        }, 0);
    }

    function cbValueChanged(val) {
        timeoutPause = window.setTimeout(cbPause, TIMEOUT_BEFORE_SENDING_PAUSE_EVENT);
        timeoutIdle = window.setTimeout(cbIdle, TIMEOUT_BEFORE_SENDING_IDLE_EVENT);
        
        EventHandler.trigger(_name, "valueChanged", {
            "value": val
        });
    }
    
    function cbEmpty() {
        ftr.ClearButton && _this.hideClearButton();
        EventHandler.trigger(_name, "empty", {
            "sourceObjectName": _name
        });
    }
    
    function cbReturnPressed(e, val) {
        !ftr.Blur && cbBlur(e);
        EventHandler.trigger(_name, "returnPressed", {
            "e": e,
            "value": val
        });
    }
    
    function cbClear() {
        EventHandler.trigger(_name, "clear");
    }
    
    function cbFocus(e) {
        //Do not use Utils.hideAddressBar() caus it has a delay that makes the address bar pop in a nasty way
        window.scrollTo(0,1);
        
        Brain && Brain[_name].onfocus({
            "e": e
        });
    }
    
    function cbBlur(e) {
        ftr.Selection && Selection.cancel();
        
        Brain && Brain[_name].onblur({
            "e": e
        });
    }
    
    function cbPause(e) {
        EventHandler.trigger(_name, "pause", {
            "query": value
        });
    }
    
    function cbIdle(e) {
        EventHandler.trigger(_name, "idle", {
            "query": value
        });
    }
}