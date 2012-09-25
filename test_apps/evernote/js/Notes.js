var DB = new function() {
    var tables = {
        "notes": {},
        "notebooks": {},
        "noteResources": {}
    };
    
    this.get = function() { return tables; };
    
    this.getNotebooks = function(filters, c, e) { get("notebooks", filters, c, e); };
    this.getNotes = function(filters, c, e) { get("notes", filters, c, e); };
    this.getNoteResources = function(filters, c, e) { get("noteResources", filters, c, e); };
    
    this.addNotebook = function(obj, c, e) { add("notebooks", obj, c, e); };
    this.addNote = function(obj, c, e) { add("notes", obj, c, e); };
    this.addNoteResource = function(obj, c, e) { add("noteResources", obj, c, e); };
    
    this.updateNotebook = function(obj, c, e) { update("notebooks", obj, c, e); };
    this.updateNote = function(obj, c, e) { update("notes", obj, c, e); };
    this.updateNoteResource = function(obj, c, e) { update("noteResources", obj, c, e); };
    
    this.removeNotebook = function(obj, c, e) { remove("notebooks", obj, c, e); };
    this.removeNote = function(obj, c, e) { remove("notes", obj, c, e); };
    this.removeNoteResource = function(obj, c, e) { remove("noteResources", obj, c, e); };
    
    
    function get(table, filters, c, e) {
        var ret = [];
        
        for (var id in tables[table]) {
            var obj = tables[table][id],
                ok = true;
                
            for (var k in filters) {
                if (obj['data_' + k] !== filters[k])  {
                    ok = false;
                    break;
                }
            }
            
            ok && ret.push(obj);
        }
        
        Console.log("DB: get from -" + table + "-: ", filters, ret);
        
        c(ret);
    }
    
    function add(table, obj, c, e) {
        tables[table][obj.getId()] = obj;
        Console.log("DB: add to -" + table + "-: ", obj);
        c && c(obj);
    }
    
    function remove(table, obj, c, e) {
        delete tables[table][obj.getId()];
        Console.log("DB remove from -" + table + "-: ", obj);
        c && c(obj);
    }
    
    function update(table, obj, c, e) {
        tables[table][obj.getId()] && (tables[table][obj.getId()] = obj);
        Console.log("DB update -" + table + "-: ", obj);
        c && c(obj);
    }
};

var User = new function() {
    var _this = this;
    
    this.data_id = "user_" + Math.round(Math.random()*100000);
    
    this.newNotebook = function(options, cbSuccess, cbError) {
        options.userId = _this.getId();
        
        new Notebook(options, function(obj){
            DB.addNotebook(obj, function(){
                cbSuccess && cbSuccess(obj);
            });
        }, cbError);
    };
    
    this.getNotebooks = function(cbSuccess, cbError) {
        DB.getNotebooks({"userId": _this.data_id}, cbSuccess, cbError);
    };
    
    this.getTrashedNotes = function(cbSuccess, cbError) {
        DB.getNotes({"trashed": true}, cbSuccess, cbError);
    };
    
    this.getNotes = function(filters, cbSuccess, cbError) {
        DB.getNotes(filters, cbSuccess, cbError);
    };
    
    this.getId = function() { return _this.data_id; };
};

var Notebook = function(_options, _cbSuccess, _cbError) {
    var _this = this;
    
    this._numberOfNotes = 0;
    this._numberOfTrashedNotes = 0;
    
    this.data_id = "";
    this.data_name = "";
    this.data_userId = "";
    
    function init(options) {
        !options && (options = {});
        
        _this.data_id = options.id || "nb_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        _this.data_name = options.name || "";
        _this.data_userId = options.userId || "";
        
        _cbSuccess && _cbSuccess(_this);
    }
    
    this.set = function(options, cbSuccess, cbError) {
        !options && (options = {});
        
        options.name && (_this.data_name = options.name);
        options.userId && (_this.data_userId = options.userId);
        (typeof options.numberOfNotes == "number") && (_this._numberOfNotes = options.numberOfNotes);
        (typeof options.numberOfTrashedNotes == "number") && (_this._numberOfTrashedNotes = options.numberOfTrashedNotes);
        
        (_this._numberOfNotes < 0) && (_this._numberOfNotes = 0);
        (_this._numberOfTrashedNotes < 0) && (_this._numberOfTrashedNotes = 0);
        
        DB.updateNotebook(_this, cbSuccess, cbError);
        
        return _this;
    };
    
    this.newNote = function(options, cbSuccess, cbError) {
        !options && (options = {});
        
        options.notebookId = _this.getId();
        
        new Note(options, function(obj) {
            DB.addNote(obj, function(){
                _this._numberOfNotes++;
                cbSuccess && cbSuccess(obj);
            });
        }, cbError);
    };
    
    this.getNotes = function(bIncludeTrashed, cbSuccess, cbError) {
        var filters = {
            "notebookId": _this.getId()
        };
        if (!bIncludeTrashed) {
            filters.trashed = false;
        }
        
        DB.getNotes(filters, cbSuccess, cbError);
        
        return _this;
    };
    this.getTrashedNotes = function(cbSuccess, cbError) {
        var filters = {
            "notebookId": _this.getId(),
            "trashed": true
        };
        
        DB.getNotes(filters, cbSuccess, cbError);
        
        return _this;
    };
    
    this.getId = function() { return _this.data_id; };
    this.getName = function() { return _this.data_name; };
    this.getUserId = function() { return _this.data_userId; };
    this.getNumberOfNotes = function() { return _this._numberOfNotes; };
    this.getNumberOfTrashedNotes = function() { return _this._numberOfTrashedNotes; };

    init(_options);
};

var Note = function(_options, _cbSuccess, _cbError) {
    var _this = this;
    
    this.data_id = "";
    this.data_name = "";
    this.data_content = "";
    this.data_dateCreated = null;
    this.data_dateUpdated = null;
    this.data_trashed = false;
    this.data_notebookId = null;
        
    function init(options) {
        !options && (options = {});
        
        _this.data_id = options.id || "note_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        _this.data_name = options.name || "";
        _this.data_content = options.content || "";
        _this.data_trashed = options.trashed || false;
        _this.data_dateCreated = options.dateCreated || new Date();
        _this.data_dateUpdated = options.dateUpdated || new Date();
        _this.data_notebookId = options.notebookId || "";
        
        if (typeof _this.data_dateCreated == "number") {
            _this.data_dateCreated = new Date(dateCreated);
        }
        if (typeof _this.data_dateUpdated == "number") {
            _this.data_dateUpdated = new Date(dateUpdated);
        }
        
        _cbSuccess && _cbSuccess(_this);
    }
    
    this.set = function(options, cbSuccess, cbError) {
        !options && (options = {});
        
        (typeof options.id !== "undefined") && (_this.data_id = options.id);
        (typeof options.name !== "undefined") && (_this.data_name = options.name);
        (typeof options.content !== "undefined") && (_this.data_content = options.content);
        (typeof options.notebookId !== "undefined") && (_this.data_notebookId = options.notebookId);
        
        _this.data_dateUpdated = new Date();
        
        DB.updateNote(_this, cbSuccess, cbError);
        
        return _this;
    };
    
    this.trash = function(cbSuccess, cbError) {
        if (_this.data_trashed) return;
        
        _this.data_trashed = true;
        
        _this.getNotebook(function(notebook){
            notebook.set({
                "numberOfNotes": notebook.getNumberOfNotes()-1,
                "numberOfTrashedNotes": notebook.getNumberOfTrashedNotes()+1
            }, cbSuccess, cbError);
        }, cbError);
    };
    
    this.restore = function(cbSuccess, cbError) {
        if (!_this.data_trashed) return;
        
        _this.data_trashed = false;
        
        _this.getNotebook(function(notebook){
            notebook.set({
                "numberOfNotes": notebook.getNumberOfNotes()+1,
                "numberOfTrashedNotes": notebook.getNumberOfTrashedNotes()-1
            }, cbSuccess, cbError);
        }, cbError);
    };
    
    this.remove = function(cbSuccess, cbError) {
        DB.removeNote(_this, function() {
            if (_this.data_trashed) {
                cbSuccess && cbSuccess();
            } else {
                _this.getNotebook(function(notebook){
                    notebook.set({
                        "numberOfNotes": notebook.getNumberOfNotes()-1
                    }, cbSuccess, cbError);
                }, cbError);
            }
        }, cbError);
    };
    
    this.getNotebook = function(cbSuccess, cbError) {
        DB.getNotebooks({"id": _this.getNotebookId()}, function(notebooks){
            cbSuccess && cbSuccess(notebooks[0]);
        }, cbError);
    };
    
    
    this.getResources = function(cbSuccess, cbError) {
        DB.getNoteResources({"noteId": _this.getId()}, cbSuccess, cbError);
    };
    
    this.newResource = function(options, cbSuccess, cbError) {
        options.noteId = _this.getId();
        
        new NoteResource(options, function(obj) {
            DB.addNoteResource(obj);
            
            cbSuccess && cbSuccess(obj);
        }, cbError);
    };
    
    this.getId = function() { return _this.data_id; };
    this.getName = function() { return _this.data_name; };
    this.getContent = function() { return _this.data_content; };
    this.getDateCreated = function() { return _this.data_dateCreated; };
    this.getDateUpdated = function() { return _this.data_dateUpdated; };
    this.getNotebookId = function() { return _this.data_notebookId; };
    this.isTrashed = function() { return _this.data_trashed; };
    
    init(_options);
};

function NoteResource(_options, _cbSuccess, cbError) {
    var _this = this;
    
    this.data_id = '';
    this.data_name = '';
    this.data_src = '';
    this.data_size = -1;
    this.data_type = '';
    this.data_noteId = '';
        
    function init(options) {
        !options && (options = {});
        
        _this.data_id = options.id || "nr_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        _this.data_name = options.name || "";
        _this.data_src = options.src || "";
        _this.data_size = options.size || -1;
        _this.data_type = options.type || "";
        _this.data_noteId = options.noteId || "";
        
        _cbSuccess && _cbSuccess(_this);
    }
    
    this.set = function(options, cbSuccess, cbError) {
        !options && (options = {});
        
        options.name && (_this.data_name = options.name);
        options.src && (_this.data_src = options.src);
        options.size && (_this.data_size = options.size);
        options.type && (_this.data_type = options.type);
        options.noteId && (_this.data_noteId = options.noteId);
        
        DB.updateNoteResource(_this, cbSuccess, cbError);
        
        return _this;        
    };
    
    this.getId = function() { return _this.data_id; };
    this.getName = function() { return _this.data_name; };
    this.getSrc = function() { return _this.data_src; };
    this.getSize = function() { return _this.data_size; };
    this.getType = function() { return _this.data_type; };
    this.getNoteId = function() { return _this.data_noteId; };
    
    init(_options);
}

var ResourceTypes = {
    "IMAGE": "image"
};