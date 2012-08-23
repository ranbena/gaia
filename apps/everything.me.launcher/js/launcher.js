
'use strict';

var Launcher = (function() {

  var loading = document.getElementById('loading');

  var iframe = document.getElementById('app');
  iframe.setVisible(false);

  var back = document.getElementById('back-button');

  var advertisement = document.getElementById('advertisement');

  function removeAdvertisement() {
    advertisement.parentNode.removeChild(advertisement);
  }

  var advTimeout = setTimeout(removeAdvertisement, 5000);

  var toolbar = document.getElementById('toolbar');
  toolbar.addEventListener('click', function toggle() {
    toolbar.classList.toggle('hidden');
  });

  var locationchange = 0, url;

  function locChange(evt) {
    locationchange++;

    if (locationchange === 0 || evt.detail === url ||
        evt.detail === url + '/') {
      locationchange = 0;
      back.dataset.disabled = true;
      back.removeEventListener('click', goBack);
      return;
    }

    iframe.getCanGoBack().onsuccess = function(e) {
      if (e.target.result === true) {
        delete back.dataset.disabled;
        back.addEventListener('click', goBack);
      } else {
        back.dataset.disabled = true;
        back.removeEventListener('click', goBack);
      }
    }
  }

  function goBack(evt) {
    evt.stopPropagation();
    iframe.getCanGoBack().onsuccess = function(e) {
      if (e.target.result === true) {
        locationchange -= 2;
        iframe.goBack();
      }
    }
  }

  function clearHistory(callback) {
    var req = iframe.getCanGoBack();
    req.onsuccess = function(e) {
      if (e.target.result === true) {
        iframe.goBack();
        clearHistory(callback);
      } else {
        callback();
      }
    }
    req.onerror = callback;
  }

  function mozbrowserloadstart() {
    loading.hidden = false;
  }

  function mozbrowserloadend() {
    loading.hidden = true;
  }

  return {
    init: function l_init() {
      this.hasLoaded = true;
      iframe.addEventListener('mozbrowserloadstart', mozbrowserloadstart);
      iframe.addEventListener('mozbrowserloadend', mozbrowserloadend);
      this.waitingActivities.forEach(this.handleActivity, this);
    },

    waitingActivities: [],

    hasLoaded: false,

    handleActivity: function(activity) {
      if (activity.source.data.type !== 'url' ||
          activity.source.data.url === url) {
        iframe.setVisible(true);
        return;
      }

      iframe.stop();
      iframe.removeEventListener('mozbrowserlocationchange', locChange);
      clearHistory(function callback() {
        iframe.setVisible(true);
        loading.hidden = false;
        locationchange = 0;
        back.dataset.disabled = true;
        back.removeEventListener('click', goBack);
        iframe.src = url = activity.source.data.url;
        iframe.addEventListener('load', function end() {
          iframe.removeEventListener('load', end);
          iframe.addEventListener('mozbrowserlocationchange', locChange);
        });
      });
    }
  };
}());

window.addEventListener('load', function launcherOnLoad(evt) {
  window.removeEventListener('load', launcherOnLoad);
  Launcher.init();
});

function handleActivity(activity) {
  if (Launcher.hasLoaded) {
    Launcher.handleActivity(activity);
  } else {
    Launcher.waitingActivities.push(activity);
  }
  activity.postResult({ status: 'accepted' });
}

if (window.navigator.mozSetMessageHandler) {
  window.navigator.mozSetMessageHandler('activity', handleActivity);
}
