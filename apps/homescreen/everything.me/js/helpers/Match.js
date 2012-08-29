var Match = new function() {
    var _this = this;
    
    this.EXCEPTIONS = {
        "NOT_ENOUGH_ARGUMENTS": new Error("Not enough arguments")
    };
    
    var fn = {
        
        /*
         * check if v1 equals to v2, or if regex passes
         */
        "is": function(v1, v2) {
            return v1 === v2 ||
                v1.charAt(0) === "/" && new RegExp(v1.substring(1, v1.length-1), "i").test(v2) ||
                v2.charAt(0) === "/" && new RegExp(v2.substring(1, v2.length-1), "i").test(v1)
        },
        
        /*
         * check if doesn't pass "is()"
         */
        "not": function(v1, v2) {
            return !fn.is(v1, v2);
        },
        
        /*
         * check if v1 is above v2
         */
        "above": function(v1, v2) {
            
            if (!v1 || !v2) { return true; } // if no argument to check - return true
            
            var v1Arr = v1.split('.');
            var v2Arr = v2.split('.');

            for (var i = 0; i < v1Arr.length; ++i) {
                if (v2Arr.length <= i){
                    if (parseInt(v1Arr[i], 10) !== 0){
                        return true;    
                    }
                    else{
                        continue;
                    }
                }
                
                if (v1Arr[i] == v2Arr[i]) {
                    continue;
                } else if (parseInt(v1Arr[i], 10) > parseInt(v2Arr[i], 10)) {
                    return true;
                } else {
                    return false;
                }
            }
            
            return false;
        },
        
        /*
         * check if v1 is under v2
         */
        "below": function(v1, v2) {
            return !fn.above(v1, v2);
        },
        
        /*
         * check if "v2" validates condition in "info"
         */
        "exec": function(info, v2) {
            var allPassed = true;

            // if no operator is provided - set "is"
            !(info instanceof Object && !(info instanceof Array)) && (info = { "is": info });
    
            // loop through operators and _compare
            for (var k in info){
                // normalize to array
                !(info[k] instanceof Array) && (info[k] = [info[k]]);
                
                var passed = false;
                
                // _compare
                for (var i=0,len=info[k].length;i<len;i++){
                    var v1 = info[k][i];
                    passed = fn[k](v2, v1);
                    if (passed){
                        break;
                    }
                }
                
                if (!passed){
                    allPassed = false;
                    return;
                }
            }
            
            return allPassed;
        }
    };
    
    // make them public with data validation (at least 2 args)
    for (var k in fn) {
        _this[k] = (function(k) {
            return function() {
                return validate.apply(_this, arguments) && fn[k].apply(_this, arguments);    
            };
        })(k);
    };
    
    function validate() {
        if (arguments.length < 2) {
            throw _this.EXCEPTIONS.NOT_ENOUGH_ARGUMENTS;
            return false;
        }
        return true;
    }
};