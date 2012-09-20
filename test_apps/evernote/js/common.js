var App = new function() {
    var _this = this,
        cards = null, notebooks = [],
        $notebooksList = null;

    var TEXTS = {
        "NEW_NOTEBOOK": "Create Notebook",
        "NEW_NOTE": "New Note",
        "FIRST_NOTEBOOK_NAME": "My Notebook",
        "EMPTY_NOTEBOOK_NAME": "Notes"
    },
    ORDERS = {
        "dateUpdated": "Date updated",
        "dateCreated": "Date created",
        "title": "Title",
        "notebookId": "Notebook",
        "city": "City",
        "country": "Country"
    };
    
    this.init = function() {
        cards = new Cards();
        
        NotebookView.init({
            "container": document.getElementById("main"),
            "onClickNote": _this.showNote
        });
        NoteView.init({
            "container": document.getElementById("note")
        });
        Sorter.init({
            "orders": ORDERS,
            "container": document.getElementById("notebook-footer"),
            "onChange": function(order, desc) {
                NotebookView.showNotes(order, desc);
            }
        })
        
        $notebooksList = document.getElementById("notebooks-list");
        
        document.getElementById("button-new-notebook").addEventListener("click", _this.promptNewNotebook);
        
        document.getElementById("button-note-save").addEventListener("click", _this.saveNote);
        
        document.getElementById("button-notebook-add").addEventListener("click", function() {
            _this.newNote();
        });
        
        initUserNotes();
    };

    function initUserNotes() {
        var _notebooks = getUserNotes();
        
        if (!_notebooks || _notebooks.length == 0) {
            var notebook = _this.newNotebook(TEXTS.FIRST_NOTEBOOK_NAME);
            _this.newNote(notebook);
        } else {
            _this.refreshNotebooks();
        }
    }

    function getUserNotes() {
        return [];
    }
    
    this.showNote = function(note, notebook) {
        NoteView.show(note, notebook);
        cards.goTo(cards.CARDS.NOTE);
    };
    this.showNotes = function(notebook) {
        NotebookView.show(notebook);
        cards.goTo(cards.CARDS.MAIN);
    };

    this.refreshNotebooks = function() {
        $notebooksList.innerHTML = "";
        for (var i=0; i<notebooks.length; i++) {
            createNotebookEntry(notebooks[i]);
        }
    };
    function createNotebookEntry(notebook) {
        var el = getNotebookEntryElement(notebook);
        $notebooksList.appendChild(el);
    }
    function getNotebookEntryElement(notebook) {
        var el = document.createElement("li");
        el.innerHTML = notebook.getName() + " (" + notebook.getNumberOfNotes() + ")";
        el.objNotebook = notebook;
        el.addEventListener("click", clickNotebook);
        return el;
    }

    function clickNotebook(e) {
        _this.showNotes(this.objNotebook);
    }

    this.promptNewNotebook = function() {
        var notebookName = prompt(TEXTS.NEW_NOTEBOOK, "");
        if (notebookName) {
            _this.newNotebook(notebookName);
        }
    };

    this.newNotebook = function(name) {
        var notebook = new Notebook({
            "name": name
        });
        notebooks.push(notebook);
        
        createNotebookEntry(notebook);
        
        _this.showNotes(notebook);

        return notebook;
    };

    this.newNote = function(notebook) {
        _this.showNote(null, notebook || NotebookView.getCurrent());
    };

    this.saveNote = function() {
        NoteView.save(function(noteSaved){
            if (noteSaved) {
                _this.refreshNotebooks();
            }
            _this.showNotes();
        })
    };
    
    var Sorter = new function() {
        var _this = this,
            el = null,
            currentOrder = "", currentDesc = false, onChange = null;
            
        this.ORDER = {};
        
        this.init = function(options) {
            this.ORDER = options.orders;
            onChange = options.onChange;
            createElement(options.container);
        };
        
        this.show = function() {
            
        };
        
        function createElement(parent) {
            if (el) return;
            
            el = document.createElement("select");
            
            el.addEventListener("blur", select);
            
            var html = '';
            for (var key in _this.ORDER) {
                html += '<option value="' + key + '">' + _this.ORDER[key] + '</option>';
            }
            el.innerHTML = html;
            
            parent.appendChild(el);
        }
        
        function select() {
            if (el.value == currentOrder) {
                currentDesc = !currentDesc;
            } else {
                currentDesc = false;
            }
            
            currentOrder = el.value;
            
            onChange && onChange(currentOrder, currentDesc)
        }
    };
    
    this.sortNotes = function(sort, isDesc) {
        NotebookView.showNotes(sort, isDesc);
    };

    var NoteView = new function() {
        var currentNote = null, currentNotebook = null,
            el = null, elContent = null;
            
        this.init = function(options) {
            el = options.container;

            elContent = el.querySelector("textarea");

            elContent.addEventListener("focus", onContentFocus);
            elContent.addEventListener("blur", onContentBlur);
        };

        this.show = function(note, notebook) {
            if (note) {
                el.querySelector("h1").innerHTML = note.getName() || TEXTS.NEW_NOTE;

                var content = note.getContent() || "";

                elContent.value = content;

                onContentBlur();
            } else {
                el.querySelector("h1").innerHTML = TEXTS.NEW_NOTE;
                elContent.value = "";
                onContentBlur();
            }
            
            currentNote = note;
            currentNotebook = notebook;
        };

        this.save = function(callback) {
            var content = elContent.value;

            if (content) {
                if (currentNote) {
                    currentNote.setContent(content);
                } else {
                    currentNote = new Note({
                        "content": content
                    });
                    currentNotebook.addNote(currentNote);
                }
                
                callback(currentNote);
            } else {
                callback();
            }
        };

        function onContentFocus(e) {
            el.classList.remove("empty-note");
        }
        function onContentBlur(e) {
            if (elContent.value) {
                el.classList.remove("empty-note");
            } else {
                el.classList.add("empty-note");
            }
        }
    };

    var NotebookView = new function() {
        var el = null, $notesList = null,
            currentNotebook = null, currentSort = "", currentIsDesc = false,
            onClickNote = null, notebookScrollOffset = 0;

        this.init = function(options) {
            el = options.container;
            onClickNote = options.onClickNote;
            
            $notesList = el.getElementsByClassName("notebook-notes")[0];
            
            $notesList.addEventListener("click", clickNote);
            
            notebookScrollOffset = document.getElementById("search").offsetHeight;
        };
        
        this.show = function(notebook) {
            !notebook && (notebook = currentNotebook);
            
            el.querySelector("h1").innerHTML = notebook.getName() || TEXTS.EMPTY_NOTEBOOK_NAME;
            
            
            if (!currentNotebook || currentNotebook.getId() != notebook.getId()) {
                currentSort = "";
                currentIsDesc = false;
            }
            
            currentNotebook = notebook;
            
            this.showNotes(currentSort, currentIsDesc);
            
            this.scrollTop();
        };
        
        this.showNotes = function(sortby, isDesc) {
            if (!currentNotebook) return;
            
            $notesList.innerHTML = '';
            
            var notes = sortNotes(currentNotebook.getNotes(), sortby, isDesc);
            for (var i=0; i<notes.length; i++) {
                $notesList.appendChild(notes[i].getElement());
            }
            
            currentSort = sortby;
            currentIsDesc = isDesc;
        };

        this.getCurrent = function() {
            return currentNotebook;
        };
        
        this.scrollTop = function() {
            $notesList.parentNode.scrollTop = notebookScrollOffset;
        };
        
        function sortNotes(notes, sortby, isDesc) {
            if (!sortby) return notes;
            
            var valMethod = "get" + sortby;
            notes.sort(function(a, b){
                var valA = a.getProperty(sortby),
                    valB = b.getProperty(sortby);
                
                return valA > valB? (isDesc?-1:1)*1 : valA < valB? (isDesc?1:-1)*1 : 0;
            });
            
            return notes;
        }
        
        // the click is captured on the entire list,
        // and we extract the specific note from the event target
        function clickNote(e) {
            var elNote = e.target;
            while (elNote && elNote.tagName != "LI") {
                elNote = elNote.parentNode;
            }
            
            elNote && onClickNote && onClickNote(elNote.objNote);
        }
    };
};