/**
  FoxyProxy
  Copyright (C) 2006-2011 FoxyProxy, Inc.
  http://getfoxyproxy.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
**/

// Thanks for the template, doron (http://www.nexgenmedia.net/docs/protocol/)
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const kSCHEME = "proxy";
const CI = Components.interfaces
const CC = Components.classes
const CR = Components.results;
const IOS = CC["@mozilla.org/network/io-service;1"].
  getService(CI.nsIIOService).getProtocolHandler("file").
        QueryInterface(CI.nsIFileProtocolHandler);

function Protocol() {}

Protocol.prototype = {
  scheme: kSCHEME,
  defaultPort: -1,
  protocolFlags: CI.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

  allowPort: function(port, scheme) {
    return false;
  },

  newURI: function(spec, charset, baseURI) {
    var uri = CC["@mozilla.org/network/simple-uri;1"].createInstance(CI.nsIURI);
    uri.spec = spec;
    return uri;
  },

  processURI : function(aURI) {
    // aURI is a nsIUri, so get a string from it using .spec
    var uri = aURI.spec;
    // strip away the proxy: part
    uri = uri.substring(uri.indexOf(":") + 1, uri.length);
    // and, optionally, leading // as in proxy://
    if (uri.indexOf("//") == 0)
      uri = uri.substring(2);    
    uri = decodeURI(uri);
    // e.g. proxy:ip=xx.xx.xx.xx&port=yyyyy
    // Parse query params into nameValuePairs array
    var count = 0, nameValuePairs = [], queryParams = uri.split('&'), foundSomeInput;
    for (var i in queryParams) {
      var pair = queryParams[i].split('=');
      if (pair.length == 2) {
        nameValuePairs[pair[0]] = pair[1];
        foundSomeInput = true;
      }
    }
    if (!foundSomeInput) return;
    var proxy = CC["@leahscape.org/foxyproxy/proxy;1"].createInstance().wrappedJSObject;
    proxy.fromAssociateArray(nameValuePairs);
    // We accept URIs like this:
    //   proxy:foxyProxyMode=disabled
    // with no other parameters. In cases like that, we must skip the
    // create/update/delete proxy code otherwise we'll create an empty/useless proxy
    // Note: |uri| has been stripped of its scheme at this point.
    var fp = CC["@leahscape.org/foxyproxy/service;1"].getService().wrappedJSObject;
    if (!(/^foxyProxyMode=[^&]*$/.test(uri))) {
      // Are we adding a new proxy, or deleting or updating an existing one? Default is to updateOrAdd.
      if (!nameValuePairs["action"]) { /* no action was specified */
          nameValuePairs["action"] = "updateOrAdd";
      }
      switch (nameValuePairs["action"]) {
        case "update":
          var p = fp.proxies.mergeByName(proxy, nameValuePairs);
          if (p) {
            proxy = p;
            fp.broadcast(null, "foxyproxy-proxy-change");
          }
          break;
        case "add":
          fp.proxies.insertAt(nameValuePairs["position"], proxy);
          fp.broadcast(null, "foxyproxy-proxy-change");
          break;
        case "delete": /* deliberate fall-through */
        case "deleteOne":
          fp.proxies.deleteByName(proxy.name, false);
          fp.broadcast(null, "foxyproxy-proxy-change");
          break;
        case "deleteMultiple":
          fp.proxies.deleteByName(proxy.name, true);
          fp.broadcast(null, "foxyproxy-proxy-change");
          break;
        case "updateOrAdd":
          var p = fp.proxies.mergeByName(proxy, nameValuePairs);
          if (p)
            proxy = p;
          else
            fp.proxies.insertAt(nameValuePairs["position"], proxy);
          fp.broadcast(null, "foxyproxy-proxy-change");
          break;
      }
      fp.writeSettingsAsync(); // Save to disk
    }
    
    // If foxyProxyMode was specified as "this", translate that to something that fp.setMode() understands.
    // Can't set mode to "this" if you're deleting.
    if (nameValuePairs["foxyProxyMode"] == "this") {
      nameValuePairs["foxyProxyMode"] = 
        nameValuePairs["action"] == "delete" || nameValuePairs["action"] == "deleteOne" || nameValuePairs["action"] == "deleteMultiple" ?
        null :
        proxy.id;
    }
    // If a proxy name was specifed, get its ID and use that for new foxyproxy mode.
    else if (nameValuePairs["foxyProxyMode"] != "patterns" && nameValuePairs["foxyProxyMode"] != "disabled" &&
        nameValuePairs["foxyProxyMode"] != "random" && nameValuePairs["foxyProxyMode"] != "previous" && 
        nameValuePairs["foxyProxyMode"] != "roundrobin" && !fp.proxies.getProxyById(nameValuePairs["foxyProxyMode"])) {
      var proxy = fp.proxies.getProxyByName(nameValuePairs["foxyProxyMode"]);
      if (proxy)
        nameValuePairs["foxyProxyMode"] = proxy.id;
    }     
    
    // Set mode last in case user is setting mode to the proxy we just configured.
    // (In that case, setting mode earlier will result in the proxy not being found)
    if (nameValuePairs["foxyProxyMode"])
      fp.setMode(nameValuePairs["foxyProxyMode"], true);
    
    // User-feedback?
    if (nameValuePairs["confirmation"] == "popup") {
      fp.notifier.alert(fp.getMessage("foxyproxy"), fp.getMessage("proxy.configured", [nameValuePairs["name"]]));
      return;
    }
    else if (nameValuePairs["confirmation"]) {
      // Is it a valid URL?
      try {
        CC["@mozilla.org/network/io-service;1"]
           .getService(CI.nsIIOService).newURI(nameValuePairs["confirmation"], "UTF-8", null);
      }
      catch(e) {/* not a valid URL */ return; }
      CC["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject
        .openTab(nameValuePairs["confirmation"]);
    }   
  },
  
  newChannel: function(aURI) {
    var fp = CC["@leahscape.org/foxyproxy/service;1"].getService().wrappedJSObject;
    if (fp.ignoreProxyScheme) return new nsDummyChannel();
    
    // user notification first
    var fpc = CC["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject,
      self = this;
    fpc.notify("proxy.scheme.warning.2", null, null, null, 
      function() {self.processURI(aURI)}, true);
    return new nsDummyChannel();
  },

  classID: Components.ID("{d1362868-da85-4faa-b1bf-24bfd936b0a6}"),
  contractID: "@mozilla.org/network/protocol;1?name=" + kSCHEME,
  classDescription: "FoxyProxy Protocol",
  QueryInterface: XPCOMUtils.generateQI([CI.nsISupports, CI.nsIProtocolHandler])
};

// Dummy channel implementation - thanks mark finkle and http://mxr.mozilla.org/mobile-browser/source/components/protocols/nsTelProtocolHandler.js#49
function nsDummyChannel() {}
nsDummyChannel.prototype = {
  QueryInterface: XPCOMUtils.generateQI([CI.nsISupports, CI.nsIChannel, CI.nsIRequest]),
  /* nsIChannel */
  loadAttributes: null,
  contentLength: 0,
  owner: null,
  loadGroup: null,
  notificationCallbacks: null,
  securityInfo: null,
  asyncOpen: function() {},
  asyncRead: function() {throw CR.NS_ERROR_NOT_IMPLEMENTED;},
  /* nsIRequest */
  isPending: function() {return true;},
  status: CR.NS_OK,
  cancel: function(status) {this.status = status;},
  suspend: this._suspres,
  resume: this._suspres,

  _suspres: function() {throw CR.NS_ERROR_NOT_IMPLEMENTED;}
};

/**
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4)
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 and earlier (Firefox 3.6)
 */
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([Protocol]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([Protocol]);
