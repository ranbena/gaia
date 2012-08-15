
'use strict';

const EverythingMeManager = (function() {

  var footerStyle = document.querySelector('#footer').style;
  var widget = document.querySelector('#etmWidget');

  var previousPage = GridManager.landingPageIndex;
  var everythingMeIndex = 0;

  document.querySelector('#etmPage').addEventListener('transitionend',
                                                    function transitionEnd(e) {
    var currentPage = GridManager.pageHelper.getCurrentPageNumber();

    if (previousPage !== currentPage) {
      if (currentPage === everythingMeIndex) {
        footerStyle.MozTransform = 'translateY(7.5rem)';
        setVisibilityChange(true);
      } else {
        footerStyle.MozTransform = 'translateY(0)';
        setVisibilityChange(false);
      }
      footerStyle.MozTransition = '-moz-transform .3s ease';
    }

    previousPage = currentPage;
  });

  var connection = document.querySelector('#etmConnection');

  ConnectionManager.onConnection(function(connected) {
    if (connected && !loadedWidget) {
      widget.src = widget.src;
    }

    connection.style.display = connected ? 'none' : 'block';
  });

  var loadedWidget = false;

  widget.addEventListener('load', function loaded() {
    loadedWidget = true;
  });

  window.addEventListener('message', function onMessage(e) {
    if (!e || !e.data) {
      return;
    }

    if (typeof e.data === 'string' && e.data.indexOf('type') !== -1) {
      var json = JSON.parse(e.data);
      switch (json.type) {
        case 'open-in-app':
          openApp(json.data.url);
          break;
        case 'add-bookmark':
          addBookmark(json.data);
          break;
      }
    }
  });

  function openApp(url) {
    new MozActivity({
      name: 'view',
      data: {
        type: 'url',
        url: url
      }
    });
  }

  function addBookmark(params) {
    new MozActivity({
      name: 'save-bookmark',
      data: {
        type: 'url',
        url: params.url,
        name: params.title,
        icon: params.icon
      }
    });
  }

  function setVisibilityChange(visible) {
    if (widget.contentWindow) {
      widget.contentWindow.postMessage(JSON.stringify({
        type: 'visibilitychange',
        data: { hidden: !visible }
      }), '*');
    }
  }

}());
