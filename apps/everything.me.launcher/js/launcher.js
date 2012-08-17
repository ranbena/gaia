
'use strict';

const Launcher = (function() {

	var iframe = document.getElementById('app');
	var loading = document.getElementById('loading');

	var appLoaded = true;

	var backShowed = false;
	var forwardShowed = false;

	var back = document.getElementById('back');
	var forward = document.getElementById('forward');

	iframe.addEventListener('mozbrowserlocationchange',
													function mozbrowserlocationchange() {
		iframe.getCanGoBack().onsuccess = function(e) {
			if (e.target.result === true) {
				if (!backShowed) {
					back.style.MozTransform = 'translateX(0)';
					backShowed = true;
				}
			} else {
				back.style.MozTransform = 'translateX(-4.5rem)';
				backShowed = false;
			}
		}

		iframe.getCanGoForward().onsuccess = function(e) {
			if (e.target.result === true) {
				if (!forwardShowed) {
					forward.style.MozTransform = 'translateX(0)';
					forwardShowed = true;
				}
			} else {
				if (forwardShowed) {
					forward.style.MozTransform = 'translateX(4.5rem)';
					forwardShowed = false;
				}
			}
		}
	});

	iframe.addEventListener('mozbrowserloadstart',
													function mozbrowserloadstart() {
		loading.hidden = false;
	});

	iframe.addEventListener('mozbrowserloadend',
													function mozbrowserloadend() {
		if (appLoaded)
			loading.hidden = true;
	});


	back.addEventListener('click', function(event) {
		iframe.getCanGoBack().onsuccess = function(e) {
			if (e.target.result === true) {
				iframe.goBack();
			}
		}
	});

	forward.addEventListener('click', function(event) {
		iframe.getCanGoForward().onsuccess = function(e) {
			if (e.target.result === true) {
				iframe.goForward();
			}
		}
	});

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
					loading.hidden = false;
					appLoaded = false;
					iframe.src = activity.source.data.url;
					iframe.addEventListener('load', function end() {
						iframe.removeEventListener('load', end);
						loading.hidden = true;
						appLoaded = true;
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
