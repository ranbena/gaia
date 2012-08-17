
'use strict';

var ConnectionManager = (function() {

  var dataConnected = false, wifiConnected = false;
  var observer = function() {};

  var wifiManager = window.navigator.mozWifiManager;

  if (wifiManager) {
    wifiManager.onstatuschange =
    wifiManager.connectionInfoUpdate = function updateWifi() {
      wifiConnected = (wifiManager.connection &&
          wifiManager.connection.status === 'connected') ? true : false;
      observer(dataConnected || wifiConnected);
    }
  }

  var conn = window.navigator.mozMobileConnection;

  if (conn) {
    conn.addEventListener('datachange', function updateSignal() {
      dataConnected = (conn.data && conn.data.connected) ? true : false;
      observer(dataConnected || wifiConnected);
    });
  }

  return {
    onConnection: function(callback) {
      observer = callback;
    }
  };

}());
