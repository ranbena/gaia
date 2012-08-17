
'use strict';

var Launcher = (function() {

	var loading = document.getElementById('loading');

	var iframe = document.getElementById('app');

	var back = document.getElementById('back-button');

	function mozbrowserlocationchange(evt) {
		if (evt.detail === 'about:blank') {
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

	function goBack() {
		iframe.getCanGoBack().onsuccess = function(e) {
			if (e.target.result === true) {
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
			switch (activity.source.data.type) {
				case 'url':
					loading.hidden = false;
					iframe.removeEventListener('mozbrowserlocationchange',
															       mozbrowserlocationchange);
					clearHistory(function callback() {
						iframe.src = activity.source.data.url;
						iframe.addEventListener('load', function end() {
							iframe.removeEventListener('load', end);
							iframe.addEventListener('mozbrowserlocationchange',
															        mozbrowserlocationchange);
						});
					});
					break;
			}
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
