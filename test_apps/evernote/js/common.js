var App = new function() {
    var _this = this,
        cards = null, notebooks = [],
        $notebooksList = null,
        createNoteOnTap = false;

    var TIME_FOR_NEW_NOTE_DOUBLECLICK = 200,
        NUMBER_OF_SCROLL_RETRIES = 10,
        EMPTY_CONTENT_CLASS = "show-empty",
        CLASS_EDIT_TITLE = "edit-title",
        TEXTS = {
            "NEW_NOTEBOOK": "Create Notebook",
            "NEW_NOTE": "New Note",
            "FIRST_NOTEBOOK_NAME": "My Notebook",
            "EMPTY_NOTEBOOK_NAME": "Notes",
            "NOTE_CANCEL_CHANGES": "You have made changes to the note, do you wish to save it?",
            "CONFIRM_DELETE_NOTE": "Are you sure you want to delete this note?",
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
        ];
    
    this.init = function() {
        cards = new Cards();
        
        NotebookView.init({
            "container": document.getElementById("main"),
            "onClickNote": _this.showNote,
            "onChange": _this.refreshNotebooks
        });
        NoteView.init({
            "container": document.getElementById("note"),
            "elCancel": document.getElementById("button-note-cancel"),
            "elSave": document.getElementById("button-note-save"),
            "onSave": onNoteSave,
            "onCancel": onNoteCancel
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
        
        document.getElementById("button-notebook-add").addEventListener("click", function() {
            _this.newNote(null, true);
        });
        
        initUserNotes();
    };
    
    function initUserNotes() {
        var _notebooks = getUserNotes();
        
        if (!_notebooks || _notebooks.length == 0) {
            var notebook = _this.newNotebook(TEXTS.FIRST_NOTEBOOK_NAME);
            _this.newNote(notebook, true);
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
        _this.showNote(null, notebook || NotebookView.getCurrent());
        if (bFocus) {
            NoteView.focus();
        }
    };
    
    this.sortNotes = function(sort, isDesc) {
        NotebookView.showNotes(sort, isDesc);
    };
    
    function onNoteSave(noteSaved) {
        _this.refreshNotebooks();
        _this.showNotes();
    }
    
    function onNoteCancel(isChanged) {
        if (isChanged) {
            if (confirm(TEXTS.NOTE_CANCEL_CHANGES)) {
                NoteView.save();
            } else {
                cards.goTo(cards.CARDS.MAIN);
            }
        } else {
            cards.goTo(cards.CARDS.MAIN);
        }
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
        
        /* these don't work on B2G, since they create a new element of their own
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
            noteContentBeforeEdit = "",
            el = null, elContent = null, elTitle = null, elActions = null,
            onSave = null, onCancel = null;
            
        this.init = function(options) {
            el = options.container;
            elSave = options.elSave;
            elCancel = options.elCancel;
            
            onSave = options.onSave;
            onCancel = options.onCancel;
            
            elContent = el.querySelector("textarea");
            elTitle = el.querySelector("h1");
            elActions = el.querySelector("#note-edit-actions");
            
            elContent.addEventListener("focus", onContentFocus);
            elContent.addEventListener("blur", onContentBlur);
            
            elSave.addEventListener("click", _this.save);
            elCancel.addEventListener("click", _this.cancel);
            
            NoteActions.init({
                "el": elActions,
                "onBeforeAction": onBeforeAction,
                "onAfterAction": onAfterAction
            });
        };

        this.show = function(note, notebook) {
            if (note) {
                _this.setTitle(note.getName());

                var content = note.getContent() || "";
                
                noteContentBeforeEdit = content;

                elContent.value = content;

                onContentBlur();
            } else {
                _this.setTitle();
                elContent.value = "";
                onContentBlur();
            }
            
            currentNote = note;
            currentNotebook = notebook || currentNote.getNotebook();
        };
        
        this.getCurrent = function() {
            return {
                "notebook": currentNotebook,
                "note": currentNote
            };
        };
        
        this.setTitle = function(title) {
            elTitle.innerHTML = title || TEXTS.NEW_NOTE;
        };
        
        this.save = function() {
            var content = elContent.value;
            
            if (currentNote) {
                currentNote.setContent(content);
            } else {
                currentNote = new Note({
                    "content": content
                });
                currentNotebook.addNote(currentNote);
            }
            
            onSave && onSave(currentNote);
        };
        
        this.cancel = function() {
            onCancel && onCancel(_this.changed());
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
            return noteContentBeforeEdit !== elContent.value;
        };

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
        
        function onBeforeAction(action) {
            switch(action) {
                case "type":
                    elContent.focus();
                    break;
                case "photo":
                    break;
                case "info":
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
                    break;
                case "info":
                    break;
                case "share":
                    break;
                case "delete":
                    if (output) {
                        App.showNotes();
                        App.refreshNotebooks
                    }
                    break;
            }
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
            elEditTitle.addEventListener("keyup", onEditTitleKeyUp);
            
            $notesList = el.getElementsByClassName("notebook-notes")[0];
            
            $notesList.addEventListener("click", clickNote);
            
            notebookScrollOffset = document.getElementById("search").offsetHeight;
        };
        
        this.show = function(notebook) {
            !notebook && (notebook = currentNotebook);
            
            _this.setTitle(notebook.getName());
            
            if (!currentNotebook || currentNotebook.getId() != notebook.getId()) {
                currentSort = "";
                currentIsDesc = false;
            }
            
            currentNotebook = notebook;
            
            this.showNotes(currentSort, currentIsDesc);
            
            this.scrollTop();
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
        
        this.showNotes = function(sortby, isDesc) {
            if (!currentNotebook) return;
            
            $notesList.innerHTML = '';
            
            window.setTimeout(function(){
                var notes = sortNotes(currentNotebook.getNotes(), sortby, isDesc);
                if (notes.length > 0) {
                    for (var i=0; i<notes.length; i++) {
                        $notesList.appendChild(getNoteElement(notes[i]));
                    }
                    el.classList.remove(EMPTY_CONTENT_CLASS);
                } else {
                    el.classList.add(EMPTY_CONTENT_CLASS);
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
            el.innerHTML = '<div class="name">' + (note.getName() || TEXTS.NEW_NOTE) + ' <span class="time">' + prettyDate(note.getDateUpdated()) + '</span></div>' +
                            '<div class="content">' + note.getContent() + '</div>' +
                            (note.getImage()? '<div class="image" style="background-image: url(' + note.getImage() + ')"></div>' : '');
                            
            return el;
        }
        
        function onEditTitleKeyUp(e) {
            if (e.keyCode == 13) {
                _this.saveEditTitle();
            }
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
                if (createNoteOnTap || el.classList.contains(EMPTY_CONTENT_CLASS)) {
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
            
            DeviceImagesGallery.show({
                "title": TEXTS.ADD_IMAGE_TITLE,
                "onSelect": onImageAdded
            });
            
            onAfterAction && onAfterAction("photo");
        }
        
        function onImageAdded(image) {
            var el = document.createElement("img");
            el.style.cssText = "width: 50px; height: 50px; position: absolute; top: " + (Math.round(Math.random()*70)+20) + "%; right: 0; z-index: 600;";
            el.src = image.src;
            document.body.appendChild(el);
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
                
                document.getElementById("note-content").value = "Activity Error!\n" + e.message + "\n" + s;
            };
            
            onAfterAction && onAfterAction("share");
        }
        
        function actionDelete() {
            onBeforeAction && onBeforeAction("delete");
            
            var deleted = false;
            
            if (confirm(TEXTS.CONFIRM_DELETE_NOTE)) {
                var current = NoteView.getCurrent();
                current.note.remove();
                deleted = true;
            }
            
            onAfterAction && onAfterAction("delete", deleted);
        }
    };
};

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