
'use strict';

var EvmeManager = (function() {

  var footerStyle = document.querySelector('#footer').style;
  var previousPage = GridManager.landingPageIndex;
  var everythingMeIndex = 0;
  var evmePage = document.querySelector('#etmPage');
  
  evmePage.addEventListener('transitionstart', function transitionEnd(e) {
    this.style.visibility = "visible";
  });
  
  evmePage.addEventListener('transitionend', function transitionEnd(e) {
    var currentPage = GridManager.pageHelper.getCurrentPageNumber();

    if (previousPage !== currentPage) {
      if (currentPage === everythingMeIndex) {
        showEvme();
        footerStyle.MozTransform = 'translateY(7.5rem)';
        setVisibilityChange(true);
        this.style.visibility = "visible";
      } else {
        footerStyle.MozTransform = 'translateY(0)';
        setVisibilityChange(false);
        this.style.visibility = "hidden";
      }
      footerStyle.MozTransition = '-moz-transform .2s ease';
    }

    previousPage = currentPage;
  });

  function hideEvme(callback, param) {
    callback(param);
  }

  function showEvme() {
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
    hide: hideEvme,

    openApp: openApp,

    addBookmark: function ev_addBookmark(data) {
      hideEvme(addBookmark, data);
    },

    goHome: function ev_goHome() {
      hideEvme(GridManager.goToPage, GridManager.landingPageIndex);
    }
  };

}());

var EvmeApp = function createEvmeApp(params) {
  Bookmark.call(this, params);
  this.manifest.launchedFrom = 'everything.me';
};

extend(EvmeApp, Bookmark);
