
'use strict';

var EverythingMeManager = (function() {

  var footerStyle = document.querySelector('#footer').style;
  var evmeStyle = document.querySelector('#evme').style;

  var previousPage = GridManager.landingPageIndex;
  var everythingMeIndex = 0;

  document.querySelector('#etmPage').addEventListener('transitionend',
                                                    function transitionEnd(e) {
    var currentPage = GridManager.pageHelper.getCurrentPageNumber();

    if (previousPage !== currentPage) {
      if (currentPage === everythingMeIndex) {
        evmeStyle.left = '0';
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

  function dispatchEvent(e) {
    if (typeof e.data === 'string' && e.data.indexOf('type') !== -1) {
      var json = JSON.parse(e.data);
      switch (json.type) {
        case 'open-in-app':
          openApp(json.data);
          break;
        case 'add-bookmark':
          addBookmark(json.data);
          break;
        case 'home':
          evmeStyle.left = '-100%';
          GridManager.goToPage(GridManager.landingPageIndex);
          break;
      }
    }
  }

  function openApp(params) {
    (new EvmeApp({
      url: params.url,
      name: params.title,
      icon: params.icon
    })).launch();

    setVisibilityChange(false);
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
      window.postMessage(JSON.stringify({
        type: 'visibilitychange',
        data: { hidden: !visible }
      }), '*');
  }

  return {
    dispatchEvent: dispatchEvent
  };

}());

var EvmeApp = function createEvmeApp(params) {
  Bookmark.call(this, params);
  this.manifest.launchedFrom = 'everything.me';
};

extend(EvmeApp, Bookmark);
