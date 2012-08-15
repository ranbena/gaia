
'use strict';

const ConnectionManager = (function() {

  var dataConnected = false, wifiConnected = false;
  var observer = function() {};

  var wifiManager = window.navigator.mozWifiManager;

  if (wifiManager) {
    wifiManager.onstatuschange =
    wifiManager.connectionInfoUpdate = function updateWifi() {
      if (wifiManager.connection  &&
          wifiManager.connection.status === 'connected') {
        wifiConnected = true;
      } else {
        wifiConnected = false;
      }

      observer(dataConnected || wifiConnected);
    }
  }

  var conn = window.navigator.mozMobileConnection;

  if (conn) {
    conn.addEventListener('datachange', function updateSignal() {
      if (conn.data && conn.data.connected) {
        dataConnected = true;
      } else {
        dataConnected = false;
      }

      observer(dataConnected || wifiConnected);
    });
  }

  return {
    onConnection: function(callback) {
      observer = callback;
    }
  }

}());
