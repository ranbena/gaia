var App = new function() {
    var _this = this,
        cards = null, notebooks = [],
        $notebooksList = null, elButtonNewNote = null,
        createNoteOnTap = false;

    var TIME_FOR_NEW_NOTE_DOUBLECLICK = 200,
        NUMBER_OF_SCROLL_RETRIES = 10,
        EMPTY_CONTENT_CLASS = "show-empty",
        CLASS_EDIT_TITLE = "edit-title",
        TEXTS = {
            "NEW_NOTEBOOK": "Create Notebook",
            "NOTEBOOK_ALL": "All Notes",
            "NOTEBOOK_TRASH": "Trash",
            "NOTE_RESTORED": "Restored to {{notebook}}",
            "NEW_NOTE": "New Note",
            "FIRST_NOTEBOOK_NAME": "My Notebook",
            "EMPTY_NOTEBOOK_NAME": "Notes",
            "NOTE_CANCEL_CHANGES": "You have made changes to the note, do you wish to save it?",
            "CONFIRM_TRASH_NOTE": "Tap OK to move this note to the Trash",
            "CONFIRM_DELETE_NOTE": "Are you sure you want to permanently delete this note?",
            "ADD_IMAGE_TITLE": "Attach a photo to your note:"
        },
        ORDERS = [
            {
                "property": "dateUpdated",
                "label": "Date updated",
                "descending": true
            },
            {
                "property": "dateCreated",
                "label": "Date created",
                "descending": true
            },
            {
                "property": "title",
                "label": "Title",
                "descending": false
            },
            {
                "property": "notebookId",
                "label": "Notebook",
                "descending": false
            },
            {
                "property": "city",
                "label": "City",
                "descending": false
            },
            {
                "property": "country",
                "label": "Country",
                "descending": false
            }
        ],
        INFO_FIELDS = [
            {
                "key": "notebookId",
                "label": "Notebook",
                "type": "options"
            },
            {
                "key": "dateCreated",
                "label": "Created on",
                "type": "date"
            },
            {
                "key": "dateUpdated",
                "label": "Modified on",
                "type": "date"
            }
        ];
    
    this.init = function() {
        cards = new Cards();
        
        // handler of the notebook card (list of notes)
        NotebookView.init({
            "container": $("main"),
            "onClickNote": _this.showNote,
            "onChange": _this.refreshNotebooks
        });
        // handler of the note card (view and edit actual note)
        NoteView.init({
            "container": $("note"),
            "elCancel": $("button-note-cancel"),
            "elSave": $("button-note-save"),
            "onSave": onNoteSave,
            "onCancel": onNoteCancel,
            "onRestore": onNoteRestore,
            "onDelete": onNoteDelete,
        });
        // handler of the note-info card
        NoteInfoView.init({
            "container": $("note-info"),
            "fields": INFO_FIELDS
        });
        // handles the sorting of notebooks
        Sorter.init({
            "orders": ORDERS,
            "container": $("notebook-footer"),
            "onChange": function(order, desc) {
                NotebookView.showNotes(order, desc);
            }
        });
        // general object to show notifications on screen
        Notification.init({
            "container": $("container")
        });
        
        $notebooksList = $("notebooks-list");
        elButtonNewNote = $("button-notebook-add");
        
        $("button-new-notebook").addEventListener("click", _this.promptNewNotebook);
        
        elButtonNewNote.addEventListener("click", function() {
            _this.newNote(null, true);
        });
        
        initUserNotes();
    };
    
    function initUserNotes() {
        var _notebooks = getUserData();
        
        if (!_notebooks || _notebooks.length == 0) {
            var notebook = _this.newNotebook(TEXTS.FIRST_NOTEBOOK_NAME);
            _this.newNote(notebook, true);
        } else {
            _notebooks = notebook;
        }
        
        _this.refreshNotebooks();
    }

    function getUserData() {
        return [];
    }
    
    this.getNotes = function() {
        return notes;
    };
    
    this.showNote = function(note, notebook) {
        NoteView.show(note, notebook);
        cards.goTo(cards.CARDS.NOTE);
    };
    this.showNotes = function(notebook) {
        NotebookView.show(notebook);
        cards.goTo(cards.CARDS.MAIN);
        
        if (NotebookView.getCurrent()) {
            elButtonNewNote.style.display = "";
        }
    };

    this.refreshNotebooks = function() {
        $notebooksList.innerHTML = "";
        
        $notebooksList.appendChild(createNotebookEntry_All());
        for (var i=0; i<notebooks.length; i++) {
            $notebooksList.appendChild(createNotebookEntry(notebooks[i]));
        }
        $notebooksList.appendChild(createNotebookEntry_Trash());
        
        NoteInfoView.refreshNotebooks(notebooks);
    };
    
    function createNotebookEntry_All() {
        var el = document.createElement("li");
        el.innerHTML = TEXTS.NOTEBOOK_ALL;
        el.className = "all";
        el.addEventListener("click", _this.showAllNotes);
        
        return el;
    }
    
    function createNotebookEntry_Trash() {
        var el = document.createElement("li"),
            numberOfApps = getNumberOfTrashedApps();
            
        el.innerHTML = TEXTS.NOTEBOOK_TRASH + (numberOfApps? " (" + numberOfApps + ")" : "");
        el.className = "trash";
        el.addEventListener("click", _this.showTrashedNotes);
        
        return el;
    }
    
    function getNumberOfTrashedApps() {
        var numberOfApps = 0;
        for (var i=0; i<notebooks.length; i++) {
            numberOfApps += notebooks[i].getTrashedNotes().length;
        }
        return numberOfApps;
    }
    
    function createNotebookEntry(notebook) {
        var el = document.createElement("li"),
            numberOfApps = notebook.getNumberOfNotes();
            
        el.innerHTML = notebook.getName() + (numberOfApps? " (" + numberOfApps + ")" : "");
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
            _this.newNotebook(notebookName, true);
        }
    };

    this.newNotebook = function(name, isSartEditing) {
        var notebook = new Notebook({
            "name": name
        });
        notebooks.push(notebook);
        
        createNotebookEntry(notebook);
        
        if (isSartEditing) {
            NotebookView.show(notebook);
            _this.newNote(notebook);
        } else {
            _this.showNotes(notebook);
        }
        
        return notebook;
    };

    this.newNote = function(notebook, bFocus) {
        !notebook & (notebook = NotebookView.getCurrent());
        
        if (notebook) {
            var note = new Note({
                "notebook": notebook
            });
            
            _this.showNote(note, notebook);
            
            if (bFocus) {
                NoteView.focus();
            }
        }
    };
    
    this.sortNotes = function(sort, isDesc) {
        NotebookView.showNotes(sort, isDesc);
    };
    
    this.showAllNotes = function() {
        alert("Need to Implement:\nShow all notes");
    };
    
    this.showTrashedNotes = function() {
        var notes = [];
        for (var i=0; i<notebooks.length; i++) {
            notes = notes.concat(notebooks[i].getTrashedNotes());
        }
        
        elButtonNewNote.style.display = "none";
        NotebookView.show(null, notes);
        NotebookView.setTitle(TEXTS.NOTEBOOK_TRASH);
        cards.goTo(cards.CARDS.MAIN);
    };
    
    function onNoteSave(noteAffected) {
        _this.showNotes();
        _this.refreshNotebooks();
    }
    
    function onNoteCancel(noteAffected, isChanged) {
        if (isChanged && confirm(TEXTS.NOTE_CANCEL_CHANGES)) {
            NoteView.save();
            return;
        }
        
        if (noteAffected.getName() == "" && noteAffected.getContent() == "") {
            noteAffected.remove();
            _this.showNotes();
            _this.refreshNotebooks();
        } else {
            cards.goTo(cards.CARDS.MAIN);
        }
    }
    
    function onNoteRestore(noteAffected) {
        _this.showNotes();
        _this.refreshNotebooks();
        
        var txt = TEXTS.NOTE_RESTORED.replace("{{notebook}}", noteAffected.getNotebook().getName());
        Notification.show(txt);
    }
    
    function onNoteDelete(noteAffected) {
        _this.showNotes();
        _this.refreshNotebooks();
    }
    
    function getNoteNameFromContent(content) {
        return (content || "").split("\n")[0];
    }
    
    var Sorter = new function() {
        var _this = this,
            el = null, elOptionNotebook = null,
            currentOrder = "", currentDesc = false, onChange = null;
            
        this.ORDER = {};
        
        this.init = function(options) {
            this.ORDER = options.orders;
            onChange = options.onChange;
            createElement(options.container);
        };
        
        this.show = function() {
            el.focus();
        };
        
        /* these don't work on B2G, since they create a new element of their own.
         * the created element should take the visibility from the actual options
         */
        this.showSortByNotebook = function() {
            elOptionNotebook.style.display = "block";
        };
        this.hideSortByNotebook = function() {
            elOptionNotebook.style.display = "none";
        };
        
        function createElement(parent) {
            if (el) return;
            
            el = document.createElement("select");
            
            el.addEventListener("change", el.blur);
            el.addEventListener("blur", select);
            
            var html = '';
            for (var i=0; i<_this.ORDER.length; i++) {
                var order = _this.ORDER[i],
                    option = document.createElement("option");
                    
                option.value = order.property;
                option.innerHTML = order.label;
                option.setAttribute("data-descending", order.descending);
                
                if (option.value == "notebookId") {
                    elOptionNotebook = option;
                }
                
                el.appendChild(option);
            }
            
            _this.hideSortByNotebook();
            
            parent.appendChild(el);
        }
        
        function select() {
            var options = el.childNodes,
                sortby = "",
                isDescending = false;
                
            for (var i=0,l=options.length; i<l; i++) {
                if (options[i].selected) {
                    sortby = options[i].value;
                    isDescending = options[i].getAttribute("data-descending") == "true";
                    break;
                }
            }
            
            if (currentOrder != sortby) {
                currentOrder = sortby;
                currentDesc = isDescending;
                onChange && onChange(currentOrder, currentDesc);
            }
        }
    };
    
    var NoteView = new function() {
        var _this = this,
            currentNote = null, currentNotebook = null,
            noteContentBeforeEdit = "", noteNameBeforeEdit = "",
            el = null, elContent = null, elImages = null, elTitle = null, elEditTitle = null, elActions = null,
            elRestore = null, elDelete = null,
            onSave = null, onCancel = null, onRestore = null, onDelete = null, onTitleChange = null;
            
        var CLASS_EDIT_TITLE = "edit-title",
            CLASS_WHEN_VISIBLE = "visible",
            CLASS_WHEN_TRASHED = "readonly";
            
        this.init = function(options) {
            el = options.container;
            elSave = options.elSave;
            elCancel = options.elCancel;
            
            onSave = options.onSave;
            onCancel = options.onCancel;
            onRestore = options.onRestore;
            onDelete = options.onDelete;
            onTitleChange = options.onTitleChange;
            
            elContent = el.querySelector("textarea");
            elImages = el.querySelector("#note-images");
            elTitle = el.querySelector("h1");
            elEditTitle = el.querySelector("input");
            elActions = el.querySelector("#note-edit-actions");
            elRestore = el.querySelector("#button-note-restore");
            elDelete = el.querySelector("#button-note-delete");
            
            elTitle.addEventListener("click", _this.editTitle);
            elEditTitle.addEventListener("blur", _this.saveEditTitle);
            elEditTitle.addEventListener("keyup", function(e){
                (e.keyCode == 13) && _this.saveEditTitle();
            });
            
            elContent.addEventListener("focus", onContentFocus);
            elContent.addEventListener("blur", onContentBlur);
            elContent.addEventListener("keyup", onContentKeyUp);
            
            elSave.addEventListener("click", _this.save);
            elCancel.addEventListener("click", _this.cancel);
            
            elRestore.addEventListener("click", _this.restore);
            elDelete.addEventListener("click", _this.del);
            
            NoteActions.init({
                "el": elActions,
                "onBeforeAction": onBeforeAction,
                "onAfterAction": onAfterAction
            });
        };

        this.show = function(note, notebook) {
            var noteContent = note.getContent(),
                noteName = note.getName();

            noteContentBeforeEdit = noteContent;
            noteNameBeforeEdit = noteName;
            
            elContent.value = noteContent;
            _this.setTitle(noteName);
            _this.loadImages(note.getImages());
            
            if (note.isTrashed()) {
                el.classList.add(CLASS_WHEN_TRASHED);
            } else {
                el.classList.remove(CLASS_WHEN_TRASHED);
            }
            
            onContentKeyUp();
            
            onContentBlur();
            
            currentNote = note;
            currentNotebook = notebook || currentNote.getNotebook();
        };
        
        
        this.loadImages = function(images) {
            elImages.innerHTML = '';
            for (var i=0; i<images.length; i++) {
                elImages.appendChild(getImageElement(images[i]));
            }
        };
        this.addImage = function(image) {
            elImages.appendChild(getImageElement(image));
        };
        
        this.getCurrent = function() {
            return {
                "notebook": currentNotebook,
                "note": currentNote
            };
        };
        
        this.setTitle = function(title) {
            elTitle.innerHTML = title || getNoteNameFromContent(elContent.value) || TEXTS.NEW_NOTE;
            elEditTitle.value = title || "";
        };
        
        this.editTitle = function() {
            el.classList.add(CLASS_EDIT_TITLE);
            elEditTitle.focus();
        };
        
        this.saveEditTitle = function() {
            el.classList.remove(CLASS_EDIT_TITLE);
            elEditTitle.blur();
            
            _this.setTitle(elEditTitle.value);
            
            onTitleChange && onTitleChange();
        };
        
        this.save = function() {
            var content = elContent.value,
                name = elEditTitle.value;
            
            currentNote.setContent(content);
            currentNote.setName(name);
            
            onSave && onSave(currentNote);
        };
        
        this.cancel = function() {
            onCancel && onCancel(currentNote, _this.changed());
        };
        
        this.restore = function() {
            if (currentNote) {
                currentNote.setTrashed(false);
                onRestore && onRestore(currentNote);
            }
        };
        
        this.del = function() {
            if (currentNote) {
                if (confirm(TEXTS.CONFIRM_DELETE_NOTE)) {
                    currentNote.remove();
                    onDelete && onDelete(currentNote);
                }
            }
        };
        
        this.focus = function() {
            elContent.focus();
            _this.scrollToElement(NUMBER_OF_SCROLL_RETRIES);
        };
        
        this.scrollToElement = function(numberOfTries) {
            var top = elContent.getBoundingClientRect().top;
            
            window.scrollTo(0, top);
            if (numberOfTries > 0 && document.body.scrollTop < top) {
                window.setTimeout(function(){
                    _this.scrollToElement(numberOfTries-1);
                }, 80);
            }
        };
        
        this.changed = function() {
            return noteContentBeforeEdit !== elContent.value || noteNameBeforeEdit !== elEditTitle.value;
        };
        
        function onContentKeyUp(e) {
            if (elContent.value) {
                elSave.classList.add(CLASS_WHEN_VISIBLE);
                !elEditTitle.value && (elTitle.innerHTML = getNoteNameFromContent(elContent.value));
            } else {
                elSave.classList.remove(CLASS_WHEN_VISIBLE);
            }
        }

        function onContentFocus(e) {
            el.classList.remove(EMPTY_CONTENT_CLASS);
            
            window.scrollTo(0, 1);
            
            setHeightAccordingToScreen();
        }
        
        function onContentBlur(e) {
            if (elContent.value) {
                el.classList.remove(EMPTY_CONTENT_CLASS);
            } else {
                el.classList.add(EMPTY_CONTENT_CLASS);
            }
            
            resetHeight();
        }
        
        function setHeightAccordingToScreen() {
            var tries = 20,
                initialHeight = window.innerHeight,
                intervalHeight = window.setInterval(function(){
                
                if (window.innerHeight < initialHeight) {
                    elContent.style.height = elContent.style.minHeight = (window.innerHeight-elTitle.offsetHeight-elActions.offsetHeight) + "px";
                    window.scrollTo(0, 1);
                }
                
                if (tries == 0 || window.innerHeight < initialHeight) {
                    window.clearInterval(intervalHeight);
                }
                tries--;
            }, 100);
        }
        
        function resetHeight() {
            elContent.style.height = elContent.style.minHeight = "";
        }
        
        function getImageElement(image) {
            var el = document.createElement("li");
            el.innerHTML = '<span style="background-image: url(' + image.src + ')"></span> ' +
                            image.name + ' (' + readableFilesize(image.size) + ')';
            return el;
        }
        
        function onBeforeAction(action) {
            switch(action) {
                case "type":
                    elContent.focus();
                    break;
                case "info":
                    NoteInfoView.load(currentNote);
                    cards.goTo(cards.CARDS.NOTE_INFO);
                    break;
                case "share":
                    break;
            }
        }
        
        function onAfterAction(action, output) {
            switch(action) {
                case "type":
                    break;
                case "photo":
                    var image = new NoteImage(output.name, output.src, output.size, output.type);
                    currentNote.addImage(image);
                    _this.addImage(image);
                    break;
                case "info":
                    break;
                case "share":
                    break;
                case "delete":
                    if (output) {
                        App.showNotes();
                        App.refreshNotebooks();
                    }
                    break;
            }
        }
    };
    
    var NoteInfoView = new function() {
        var _this = this,
            el = null, fields = [], currentNote = null;
            
        this.init = function(options) {
            el = options.container;
            fields = options.fields;
            
            elFields = el.querySelector(".fields");
            
            initView();
        };
        
        this.load = function(note) {
            if (currentNote && note.getId() == currentNote.getId()) {
                return;
            }
            
            for (var i=0; i<fields.length; i++) {
                var f = fields[i],
                    value = note.getProperty(f.key),
                    elValue = elFields.querySelector("." + f.key);
                    
                switch(f.type) {
                    case "date":
                        value = printDate(value);
                        elValue.innerHTML = value;
                        break;
                    case "options":
                        elValue.value = value;
                        break;
                }
            }
            
            currentNote = note;
        };
        
        this.refreshNotebooks = function(notebooks) {
            var html = '';
            for (var i=0; i<notebooks.length; i++) {
                html += '<option value="' + notebooks[i].getId() + '">' + notebooks[i].getName() + '</option>';
            }
            elFields.querySelector(".notebookId").innerHTML = html;
        };
        
        function initView() {
            var html = '';
            
            for (var i=0; i<fields.length; i++) {
                var f = fields[i],
                    type = f.type;
                
                if (type == "options") {
                    html += '<li>' + getNotebookSelect(f) + '</li>';
                } else {
                    html += '<li>' +
                                '<label>' + f.label + '</label>' +
                                '<b class="value ' + f.key + '"></b>' +
                            '</li>';
                }
            }
            
            elFields.innerHTML += html;
        }
        
        function getNotebookSelect(field) {
            var html = '' +
                        '<label>' + field.label + '</label>' +
                        '<select name="" class="' + field.key + '">' +
                        '</select>';
            
            return html;
        }
        
        function printDate(date) {
            var s = "";
            
            s += date.getHours() + ":" + date.getMinutes();
            s += " ";
            s += date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear();
            
            return s;
        }
    };

    var NotebookView = new function() {
        var _this = this,
            el = null, elTitle = null, elEditTitle = null, $notesList = null,
            currentNotebook = null, currentSort = "", currentIsDesc = false,
            onClickNote = null, notebookScrollOffset = 0,
            onChange = null;

        this.init = function(options) {
            el = options.container;
            onClickNote = options.onClickNote;
            onChange = options.onChange;
            
            elTitle = el.querySelector("h1");
            elEditTitle = el.querySelector("input");
            
            elTitle.addEventListener("click", _this.editTitle);
            elEditTitle.addEventListener("blur", _this.saveEditTitle);
            elEditTitle.addEventListener("keyup", function(e){
                (e.keyCode == 13) && _this.saveEditTitle();
            });
            
            $notesList = el.getElementsByClassName("notebook-notes")[0];
            
            $notesList.addEventListener("click", clickNote);
            
            notebookScrollOffset = $("search").offsetHeight;
        };
        
        this.show = function(notebook, notes) {
            if (notes) {
                notebook = null;
                currentNotebook = null;
            } else {
                !notebook && (notebook = currentNotebook);
            }
            
            
            notebook && _this.setTitle(notebook.getName());
            
            if (!currentNotebook || currentNotebook.getId() != notebook.getId()) {
                currentSort = "";
                currentIsDesc = false;
            }
            
            currentNotebook = notebook;
            
            _this.showNotes(currentSort, currentIsDesc, notes);
            
            _this.scrollTop();
        };
        
        this.setTitle = function(title) {
            elTitle.innerHTML = title || TEXTS.EMPTY_NOTEBOOK_NAME;
            elEditTitle.value = title || "";
        };
        
        this.editTitle = function() {
            if (!currentNotebook) return;
            
            el.classList.add(CLASS_EDIT_TITLE);
            elEditTitle.focus();
        };
        
        this.saveEditTitle = function() {
            if (!currentNotebook) return;
            
            el.classList.remove(CLASS_EDIT_TITLE);
            elEditTitle.blur();
            
            var newName = elEditTitle.value;
            if (newName != currentNotebook.getName()) {
                currentNotebook.setName(newName);
                _this.setTitle(newName);
                
                onChange && onChange();
            }
        };
        
        this.showNotes = function(sortby, isDesc, _notes) {
            $notesList.innerHTML = '';
            
            window.setTimeout(function(){
                var notes = sortNotes(_notes || currentNotebook && currentNotebook.getNotes(), sortby, isDesc);
                if (notes) {
                    if (notes.length > 0 || _notes) {
                        for (var i=0; i<notes.length; i++) {
                            $notesList.appendChild(getNoteElement(notes[i]));
                        }
                        el.classList.remove(EMPTY_CONTENT_CLASS);
                    } else {
                        el.classList.add(EMPTY_CONTENT_CLASS);
                    }
                }
            }, 0);
            
            currentSort = sortby;
            currentIsDesc = isDesc;
        };

        this.getCurrent = function() {
            return currentNotebook;
        };
        
        this.scrollTop = function() {
            $notesList.parentNode.scrollTop = notebookScrollOffset;
        };
        
        function getNoteElement(note) {
            var el = document.createElement("li");
            el.className = "note";
            el.objNote = note;
            el.innerHTML = '<div class="name">' + (note.getName() || getNoteNameFromContent(note.getContent())) + ' <span class="time">' + prettyDate(note.getDateUpdated()) + '</span></div>' +
                            '<div class="content">' + note.getContent() + '</div>' +
                            (note.getImages().length > 0? '<div class="image" style="background-image: url(' + note.getImages()[0].src + ')"></div>' : '');
            
            return el;
        }
        
        function sortNotes(notes, sortby, isDesc) {
            if (!sortby) return notes;
            
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
            
            if (elNote) {
                onClickNote && onClickNote(elNote.objNote);
            } else if (TIME_FOR_NEW_NOTE_DOUBLECLICK) {
                if (currentNotebook && (createNoteOnTap || el.classList.contains(EMPTY_CONTENT_CLASS))) {
                    App.newNote(null, true);
                } else {
                    createNoteOnTap = true;
                    window.setTimeout(function(){
                        createNoteOnTap = false;
                    }, TIME_FOR_NEW_NOTE_DOUBLECLICK);
                }
            }
        }
    };

    var NoteActions = new function() {
        var _this = this,
            el = null,
            onBeforeAction = null, onAfterAction = null;
            
        this.init = function(options) {
            el = options.el;
            onBeforeAction = options.onBeforeAction;
            onAfterAction = options.onAfterAction;
            
            elType = el.querySelector(".type");
            elPhoto = el.querySelector(".photo");
            elInfo = el.querySelector(".info");
            elShare = el.querySelector(".share");
            elDelete = el.querySelector(".delete");
            
            elType.addEventListener("click", actionType);
            elPhoto.addEventListener("click", actionPhoto);
            elInfo.addEventListener("click", actionInfo);
            elShare.addEventListener("click", actionShare);
            elDelete.addEventListener("click", actionDelete);
        };
        
        function actionType() {
            onBeforeAction && onBeforeAction("type");
            
            onAfterAction && onAfterAction("type");
        }
        
        function actionPhoto() {
            onBeforeAction && onBeforeAction("photo");
            
            /*
            onAfterAction && onAfterAction("photo", {
                "name": "Photo",
                "src": "http://www.cbc.ca/sevenwonders/images/pic_wonder_prairie_sky_lg.jpg",
                "size": 82364,
                "type": "image/jpeg"
            });
            
            return;
            */
            
            DeviceImagesGallery.show({
                "title": TEXTS.ADD_IMAGE_TITLE,
                "onSelect": function(image) {
                    onAfterAction && onAfterAction("photo", image);
                }
            });
        }
        
        function actionInfo() {
            onBeforeAction && onBeforeAction("info");
            
            onAfterAction && onAfterAction("info");
        }
        
        function actionShare() {
            onBeforeAction && onBeforeAction("share");
            
            var act = new MozActivity({
                "name": "email",
                "data": {
                    "URI": "mailto:evyatron@gmail.com?subject=hi!"
                }
            });
            
            act.onerror = function(e){
                var s = "";
                for (var k in e) {
                    s += k + ": " + e[k] + "\n";
                }
                
                $("note-content").value = "Activity Error!\n" + e.message + "\n" + s;
            };
            
            onAfterAction && onAfterAction("share");
        }
        
        function actionDelete() {
            onBeforeAction && onBeforeAction("delete");
            
            var deleted = false;
            if (confirm(TEXTS.CONFIRM_TRASH_NOTE)) {
                var current = NoteView.getCurrent();
                current.note.setTrashed(true);
                deleted = true;
            }
            
            onAfterAction && onAfterAction("delete", deleted);
        }
    };
    
    var Notification = new function() {
        var _this = this,
            el = null, timeoutHide = null;
            
        var CLASS_WHEN_VISIBLE = "visible",
            TIME_TO_SHOW = 4000;
            
        this.init = function(options) {
            el = document.createElement("div");
            el.className = "notifier";
            
            options.container.appendChild(el);
        };
        
        this.show = function(message) {
            window.clearTimeout(timeoutHide);
            
            el.innerHTML = message;
            el.classList.add(CLASS_WHEN_VISIBLE);
            
            timeoutHide = window.setTimeout(_this.hide, TIME_TO_SHOW);
        };
        
        this.hide = function() {
            window.clearTimeout(timeoutHide);
            el.classList.remove(CLASS_WHEN_VISIBLE);
        };
    }
};

function readableFilesize(size) {
    var sizes = ["kb", "mb", "gb", "tb"];
    
    for (var i=0; i<sizes.length; i++) {
        size = Math.round(size/1000);
        if (size < 1000) {
            return size + sizes[i];
        }
    }
}

/* taken from the email app */
function prettyDate(time) {
  switch (time.constructor) {
    case String:
      time = parseInt(time);
      break;
    case Date:
      time = time.getTime();
      break;
  }
  
  var f = navigator.mozL10n? new navigator.mozL10n.DateTimeFormat() : null;
  var diff = Date.now() - time;
  var day_diff = Math.floor(diff / 86400);
  var actualDate = new Date();
  actualDate.setTime(time);
  
  if (isNaN(day_diff))
    return '(incorrect date)';

  if (day_diff < 0 || diff < 0) {
    // future time
    return f.localeFormat(new Date(time), _('shortDateTimeFormat'));
  }
  
  return day_diff == 0 && (
    diff < 60 && 'Just now' ||
    diff < 86400 && (actualDate.getHours() + ":" + actualDate.getMinutes()) ||
    day_diff == 1 && 'yesterday' ||
    day_diff < 7 && f.localeFormat(new Date(time), '%A') ||
    (f? f.localeFormat(new Date(time), '%x') : new Date(time)));
}

function $(s) { return document.getElementById(s); }