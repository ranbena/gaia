
'use strict';

var Launcher = (function() {

	var loading = document.getElementById('loading');
	var app = document.getElementById('app');

	var iframe = undefined;

	var back = document.getElementById('back-button');
	var forward = document.getElementById('forward-button');

	function mozbrowserlocationchange() {
		iframe.getCanGoBack().onsuccess = function(e) {
			if (e.target.result === true) {
				back.removeAttribute('disabled');
			} else {
				back.setAttribute('disabled', 'disabled');
			}
		}

		iframe.getCanGoForward().onsuccess = function(e) {
			if (e.target.result === true) {
				forward.removeAttribute('disabled');
			} else {
				forward.setAttribute('disabled', 'disabled');
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

	function goForward() {
		iframe.getCanGoForward().onsuccess = function(e) {
			if (e.target.result === true) {
				iframe.goForward();
			}
		}
	}

	function mozbrowserloadstart() {
		loading.hidden = false;
	}

	function mozbrowserloadend() {
		loading.hidden = true;
	}

	function addFrame(url) {
		loading.hidden = false;

		if (iframe) {
			iframe.removeEventListener('mozbrowserloadstart',
																					mozbrowserloadstart);
			iframe.removeEventListener('mozbrowserloadend',
																					mozbrowserloadend);
			iframe.removeEventListener('mozbrowserlocationchange',
														mozbrowserlocationchange);
			app.removeChild(iframe);
			iframe = undefined;
			back.setAttribute('disabled', 'disabled');
			forward.setAttribute('disabled', 'disabled');
		} else {
			back.addEventListener('click', goBack);
			forward.addEventListener('click', goForward);
		}

		iframe = document.createElement('iframe');
		iframe.id = 'app';
		iframe.setAttribute('remote', 'true');
		iframe.setAttribute('mozbrowser', 'true');
		iframe.src = url;

		// Events
		iframe.addEventListener('mozbrowserloadstart',
																			mozbrowserloadstart);
		iframe.addEventListener('mozbrowserloadend',
																			mozbrowserloadend);
		iframe.addEventListener('mozbrowserlocationchange',
														mozbrowserlocationchange);

		app.appendChild(iframe);
	}

	return {
		init: function l_init() {
			this.hasLoaded = true;
      this.waitingActivities.forEach(this.handleActivity, this);
		},

		waitingActivities: [],

		hasLoaded: false,

		handleActivity: function(activity) {
			switch (activity.source.data.type) {
				case 'url':
					addFrame(activity.source.data.url);
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
