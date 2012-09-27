var User = function(_options) {
    var _this = this;
    
    this.data_id = "";
    this.data_username = "";
    this.data_name = "";
    this.data_date_created = "";
    this.data_metadata = {};
    
    function init(options) {
        updateObject(_this, options);
        validate();
    };
    
    this.set = function(options, cbSuccess, cbError) {
        updateObject(_this, options);
        validate();
        
        DB.updateUser(_this, cbSuccess, cbError);
        
        return _this;
    };
    
    this.newNotebook = function(options, cbSuccess, cbError) {
        options.user_id = _this.getId();
        
        var notebook = new Notebook(options);
        DB.addNotebook(notebook, function(){
            cbSuccess && cbSuccess(notebook);
        });
    };
    
    this.getNotebooks = function(cbSuccess, cbError) {
        DB.getNotebooks({"user_id": _this.data_id}, cbSuccess, cbError);
    };
    
    this.getTrashedNotes = function(cbSuccess, cbError) {
        DB.getNotes({"trashed": true}, cbSuccess, cbError);
    };
    
    this.getNotes = function(filters, cbSuccess, cbError) {
        DB.getNotes(filters, cbSuccess, cbError);
    };
    
    this.getId = function() { return _this.data_id; };
    this.getDateCreated = function() { return _this.data_date_created; };
    
    function validate() {
        if (!_this.data_id) {
            _this.data_id = "user_" + Math.round(Math.random()*100000);
        }
        
        if (!_this.data_date_created) {
            _this.data_date_created = new Date().getTime();
        }
    }
    
    init(_options);
};

var Notebook = function(_options) {
    var _this = this;
    
    this.data_id = "";
    this.data_name = "";
    this.data_user_id = "";
    this.data_date_created = "";
    this.data_date_updated = "";
    this.data_metadata = {};
    
    this.data_trashed = false;
    this.data_numberOfNotes = 0;
    this.data_numberOfTrashedNotes = 0;
    
    function init(options) {
        updateObject(_this, options);
        validate();
    }
    
    this.set = function(options, cbSuccess, cbError) {
        updateObject(_this, options);
        validate();
        
        DB.updateNotebook(_this, cbSuccess, cbError);
        
        return _this;
    };
    
    this.newNote = function(options, cbSuccess, cbError) {
        !options && (options = {});
        
        options.notebook_id = _this.getId();
        
        var note = new Note(options);
        
        DB.addNote(note, function(){
            _this.set({
                "numberOfNotes": _this.data_numberOfNotes+1
            });
            cbSuccess && cbSuccess(note);
        }, cbError);
    };
    
    this.getNotes = function(bIncludeTrashed, cbSuccess, cbError) {
        var filters = {
            "notebook_id": _this.getId()
        };
        if (!bIncludeTrashed) {
            filters.trashed = false;
        }
        
        DB.getNotes(filters, cbSuccess, cbError);
        
        return _this;
    };
    this.getTrashedNotes = function(cbSuccess, cbError) {
        var filters = {
            "notebook_id": _this.getId(),
            "trashed": true
        };
        
        DB.getNotes(filters, cbSuccess, cbError);
        
        return _this;
    };
    
    this.trash = function(cbSuccess, cbError) {
        if (_this.data_trashed) return;
        
        _this.set({
            "trashed": true,
            "numberOfTrashedNotes": _this.getNumberOfTrashedNotes() + _this.getNumberOfNotes(),
            "numberOfNotes": 0
        }, function onSuccess() {
            DB.update("notes", {"notebook_id": _this.getId()}, {"trashed": true}, cbSuccess, cbError);
        }, cbError);
    };
    
    this.restore = function(cbSuccess, cbError) {
        if (!_this.data_trashed) return;
        
        _this.set({
            "trashed": false
        }, cbSuccess, cbError);
    };
    
    this.getId = function() { return _this.data_id; };
    this.getName = function() { return _this.data_name; };
    this.getUserId = function() { return _this.data_user_id; };
    this.getTrashed = function() { return _this.data_trashed; };
    this.getNumberOfNotes = function() { return _this.data_numberOfNotes; };
    this.getNumberOfTrashedNotes = function() { return _this.data_numberOfTrashedNotes; };

    init(_options);
    
    function validate() {
        if (!_this.data_id){
            _this.data_id = "nb_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        }
        if (!_this.data_date_created) {
            _this.data_date_created = new Date().getTime();
        }
        if (!_this.data_date_modified) {
            _this.data_date_updated = new Date().getTime();
        }
        
        (_this.data_numberOfNotes < 0) && (_this.data_numberOfNotes = 0);
        (_this.data_numberOfTrashedNotes < 0) && (_this.data_numberOfTrashedNotes = 0);
    }
};

var Note = function(_options) {
    var _this = this;
    
    this.data_id = "";
    this.data_title = "";
    this.data_text = "";
    this.data_country = "";
    this.data_city = "";
    this.data_date_created = null;
    this.data_date_updated = null;
    this.data_trashed = false;
    this.data_notebook_id = null;
    this.data_metadata = {};
    
    function init(options) {
        updateObject(_this, options);
        validate();
    }
    
    this.set = function(options, cbSuccess, cbError) {
        updateObject(_this, options);
        validate();
        
        _this.data_date_updated = new Date().getTime();
        
        DB.updateNote(_this, cbSuccess, cbError);
        
        return _this;
    };
    
    this.trash = function(cbSuccess, cbError) {
        if (_this.data_trashed) return;
        
        _this.set({"trashed": true}, function onSuccess() {
            _this.getNotebook(function(notebook){
                notebook.set({
                    "numberOfNotes": notebook.getNumberOfNotes()-1,
                    "numberOfTrashedNotes": notebook.getNumberOfTrashedNotes()+1
                }, cbSuccess, cbError);
            }, cbError);
        }, cbError);
    };
    
    this.restore = function(cbSuccess, cbError) {
        if (!_this.data_trashed) return;
        
        _this.set({"trashed": false}, function onSuccess() {
            _this.getNotebook(function(notebook){
                notebook.set({
                    "trashed": false,
                    "numberOfNotes": notebook.getNumberOfNotes()+1,
                    "numberOfTrashedNotes": notebook.getNumberOfTrashedNotes()-1
                }, cbSuccess, cbError);
            }, cbError);
        }, cbError);
    };
    
    this.remove = function(cbSuccess, cbError) {
        DB.removeNote(_this, function() {
            _this.getNotebook(function(notebook){
                notebook.set({
                    "numberOfNotes": notebook.getNumberOfNotes() - (_this.data_trashed? 0 : 1),
                    "numberOfTrashedNotes": notebook.getNumberOfTrashedNotes() - (_this.data_trashed? 1 : 0)
                }, cbSuccess, cbError);
            }, cbError);
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
        
        var noteResource = new NoteResource(options);
        DB.addNoteResource(noteResource, function() {
            cbSuccess && cbSuccess(noteResource);
        });
    };
    
    this.getId = function() { return _this.data_id; };
    this.getName = function() { return _this.data_title; };
    this.getContent = function() { return _this.data_text; };
    this.getDateCreated = function() { return _this.data_date_created; };
    this.getDateUpdated = function() { return _this.data_date_updated; };
    this.getNotebookId = function() { return _this.data_notebook_id; };
    this.isTrashed = function() { return _this.data_trashed; };
    
    init(_options);
    
    function validate() {
        if (!_this.data_id) {
            _this.data_id = "note_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        }
        
        if (!_this.data_date_created) {
            _this.data_date_created = new Date().getTime();
        }
        
        if (!_this.data_date_updated) {
            _this.data_date_updated = new Date().getTime();
        }
    }
};

function NoteResource(_options) {
    var _this = this;
    
    this.data_id = '';
    this.data_name = '';
    this.data_src = '';
    this.data_size = -1;
    this.data_type = '';
    this.data_noteId = '';
    this.data_metadata = {};
        
    function init(options) {
        updateObject(_this, options);
        validate();
    }
    
    function validate() {
        if (!_this.data_id) {
            _this.date_id = "nr_" + new Date().getTime() + "_" + Math.round(Math.random()*100000);
        }
    }
    
    this.set = function(options, cbSuccess, cbError) {
        updateObject(_this, options);
        validate();
        
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

function updateObject(obj, options) {
    if (!options) return;
    for (var k in options) {
        obj['data_' + k] = options[k];
    }
}