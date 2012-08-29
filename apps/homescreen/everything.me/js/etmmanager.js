
'use strict';

var EverythingMeManager = (function() {

  var URI = 'http://b2g.everything.me';

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

  var etmSplash = document.querySelector('#etmSplash');

  var etmLoading = document.querySelector('#etmLoading');
  var goToEverything = document.querySelector('#goToEverything');

  goToEverything.addEventListener('click', function click() {
    goToEverything.disabled = true;
    goToEverything.textContent = 'Loading...';
    etmLoading.style.visibility = 'visible';
    etmSplash.children[0].textContent = 'Find the things you love';
    widget.src = URI;
  });

  widget.addEventListener('load', function loaded() {
    if (widget.src === 'about:blank') {
      return;
    }

    goToEverything.textContent = '';
    etmLoading.style.visibility = 'hidden';
    var style = etmSplash.style;
    style.MozTransform = 'rotateY(180deg)';
    style.opacity = 0;
    etmSplash.addEventListener('transitionend', function transitionend() {
      etmSplash.removeEventListener('transitionend', transitionend);
      etmSplash.style.display = 'none';
    });
  });

  widget.addEventListener('error', function error() {
    goToEverything.disabled = false;
    goToEverything.textContent = 'Try again';
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
          GridManager.goToPage(GridManager.landingPageIndex);
          break;
      }
    }
  }

  function openApp(params) {
    (new Bookmark({
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
    if (widget.contentWindow) {
      widget.contentWindow.postMessage(JSON.stringify({
        type: 'visibilitychange',
        data: { hidden: !visible }
      }), '*');
    }
  }

  return {
    dispatchEvent: dispatchEvent
  };

}());
