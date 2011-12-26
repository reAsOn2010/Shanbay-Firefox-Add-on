/**
  FoxyProxy
  Copyright (C) 2006-2011 Eric H. Jung and FoxyProxy, Inc.
  http://getfoxyproxy.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
**/
//dump("proxy.js\n");
if (!CI) {
  // XPCOM module initialization
  var NSGetModule = function() { return ProxyModule; }

  var CI = Components.interfaces, CC = Components.classes, CR = Components.results, self,
    fileProtocolHandler = CC["@mozilla.org/network/protocol;1?name=file"].getService(CI["nsIFileProtocolHandler"]);
  if ("undefined" != typeof(__LOCATION__)) {
    // preferred way
    self = __LOCATION__;
  }
  else {
    self = fileProtocolHandler.getFileFromURLSpec(Components.Exception().filename);
  }
  var componentDir = self.parent; // the directory this file is in

  // Get attribute from node if it exists, otherwise return |def|.
  // No exceptions, no errors, no null returns.
  var gGetSafeAttr = function(n, name, def) {
    n.QueryInterface(CI.nsIDOMElement);
    return n ? (n.hasAttribute(name) ? n.getAttribute(name) : def) : def;
  }
  // Boolean version of GetSafe
  var gGetSafeAttrB = function(n, name, def) {
    n.QueryInterface(CI.nsIDOMElement);
    return n ? (n.hasAttribute(name) ? n.getAttribute(name)=="true" : def) : def;
  }

  var loadComponentScript = function(filename) {
    try {
      var filePath = componentDir.clone();
      filePath.append(filename);
      loader.loadSubScript(fileProtocolHandler.getURLSpecFromFile(filePath));
    }
    catch (e) {
      dump("Error loading component " + filename + ": " + e + "\n" + e.stack + "\n");
      throw(e);
    }
  }
  var self,
    fileProtocolHandler = CC["@mozilla.org/network/protocol;1?name=file"].getService(CI["nsIFileProtocolHandler"]);
  if ("undefined" != typeof(__LOCATION__)) {
    // preferred way
    self = __LOCATION__;
  }
  else {
    self = fileProtocolHandler.getFileFromURLSpec(Components.Exception().filename);
  }
  var dir = self.parent, // the directory this file is in
    loader = CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI["mozIJSSubScriptLoader"]);
}

loadComponentScript("autoconf.js");
loadComponentScript("match.js");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

var proxyService = CC["@mozilla.org/network/protocol-proxy-service;1"].getService(CI.nsIProtocolProxyService),
  DEFAULT_COLOR = "#0055E5"; /* blue */
///////////////////////////// Proxy class ///////////////////////
function Proxy(fp) {
  this.wrappedJSObject = this;
  this.fp = fp || CC["@leahscape.org/foxyproxy/service;1"].getService().wrappedJSObject;
  this.matches = [];
  this.name = this.notes = "";
  this.manualconf = new ManualConf(this, this.fp);
  this.autoconf = new AutoConf(this, this.fp);
  // An own object for the WPAD feature...
  this.wpad = new AutoConf(this, this.fp);
  // We set a URL to the proxy file which cannot changed. The rationale for
  // this is:
  // "We diverge from the WPAD spec here in that we don't walk the
  // hosts's FQDN, stripping components until we hit a TLD.  Doing so
  // is dangerous in the face of an incomplete list of TLDs, and TLDs
  // get added over time.  We could consider doing only a single
  // substitution of the first component, if that proves to help
  // compatibility." 
  // See: http://mxr.mozilla.org/mozilla2.0/source/netwerk/base/src/
  // nsProtocolProxyService.cpp#488 
  this.wpad.url = "http://wpad/wpad.dat";
  this._mode = "manual"; // manual, auto, direct, random
  this._autoconfMode = "pac";
  this._enabled = true;
  this.selectedTabIndex = 1; /* default tab is the proxy details tab */
  this.lastresort = false;
  this.id = this.fp.proxies.uniqueRandom();
}

Proxy.prototype = {
  direct: proxyService.newProxyInfo("direct", "", -1, 0, 0, null),
  animatedIcons: true,
  includeInCycle: true,
  noInternalIPs: false,
  _color: DEFAULT_COLOR,
  colorString: "nmbado",
  _proxyDNS: true,
  fp: null,
  readOnlyProperties : ["lastresort", "fp", "wrappedJSObject", "matches", /* from ManualConf */ "owner",
                        /* from AutoConf */ "timer", /* from AutoConf */  "_resolver"],

  fromDOM : function(node, includeTempPatterns) {
    this.name = node.getAttribute("name");
    this.id = node.getAttribute("id") || this.fp.proxies.uniqueRandom();
    this.notes = node.getAttribute("notes");
    this._enabled = node.getAttribute("enabled") == "true";
    this.autoconf.fromDOM(node.getElementsByTagName("autoconf").item(0));
    let wpadNode = node.getElementsByTagName("autoconf").item(1);
    if (wpadNode) { 
      this.wpad.fromDOM(wpadNode); 
    } else {
      this.wpad = new AutoConf(this, this.fp);
      this.wpad.url = "http://wpad/wpad.dat";
    }
    this._proxyDNS = gGetSafeAttrB(node, "proxyDNS", true);
    this.manualconf.fromDOM(node.getElementsByTagName("manualconf").item(0));
    // 1.1 used "manual" instead of "mode" and was true/false only (for manual or auto)
    this._mode = node.hasAttribute("manual") ?
      (node.getAttribute("manual") == "true" ? "manual" : "auto") :
      node.getAttribute("mode");
    this._mode = this._mode || "manual";
    // New for 3.3. If the proxy had "wpad" as its mode select "wpad" as
    // autoconfMode otherwise the default, "pac", is used.
    if (this._mode !== "wpad") {
      this._autoconfMode = gGetSafeAttr(node, "autoconfMode", "pac");
    } else {
      // The mode was WPAD but that is not available anymore starting with 3.3.
      // There is only "auto" as proxy mode (we choose it) and two autoconf
      // modes, "wpad" and "pac", now (we choose former). 
      this._mode = "auto";
      this._autoconfMode = gGetSafeAttr(node, "autoconfMode", "wpad"); 
    }
    this.selectedTabIndex = node.getAttribute("selectedTabIndex") || "0";
    if (this.fp.isFoxyProxySimple() && this.selectedTabIndex > 1)
      this.selectedTabIndex = 1; /* FoxyProxy Simple only has 2 tabs */
	  this.lastresort = node.hasAttribute("lastresort") ? node.getAttribute("lastresort") == "true" : false; // new for 2.0
    this.animatedIcons = node.hasAttribute("animatedIcons") ? node.getAttribute("animatedIcons") == "true" : !this.lastresort; // new for 2.4
    this.includeInCycle = node.hasAttribute("includeInCycle") ? node.getAttribute("includeInCycle") == "true" : !this.lastresort; // new for 2.5
    this.color = gGetSafeAttr(node, "color", DEFAULT_COLOR);    
    
    this.noInternalIPs = node.hasAttribute("noInternalIPs") ?
      node.getAttribute("noInternalIPs") == "true" : false;
    for (var i=0,temp=node.getElementsByTagName("match"); i<temp.length; i++) {
      var j = this.matches.length;
      this.matches[j] = new Match();
      this.matches[j].fromDOM(temp.item(i), includeTempPatterns);
    }
    // Were we disabled due to a bad/missing PAC file? If so, try enabling ourselves again.
    //if (this.autoconf.disabledDueToBadPAC) {
      //this._enabled = true;
    //}
    this.afterPropertiesSet();
  },
  
  /**
   * |includeTempPatterns| is only true when the user is copying a proxy and all its data
   */
  toDOM : function(doc, includeTempPatterns) {
    var e = doc.createElement("proxy");
    e.setAttribute("name", this.name);
    e.setAttribute("id", this.id);
    e.setAttribute("notes", this.notes);
    e.setAttribute("enabled", this.enabled);
    e.setAttribute("mode", this.mode);
    e.setAttribute("selectedTabIndex", this.selectedTabIndex);
    e.setAttribute("lastresort", this.lastresort);
    e.setAttribute("animatedIcons", this.animatedIcons);
    e.setAttribute("includeInCycle", this.includeInCycle);
    e.setAttribute("color", this._color);
    e.setAttribute("proxyDNS", this._proxyDNS);
    e.setAttribute("noInternalIPs", this.noInternalIPs);
    e.setAttribute("autoconfMode", this._autoconfMode);

    var matchesElem = doc.createElement("matches");
    e.appendChild(matchesElem);
    for (var j=0, m; j<this.matches.length && (m=this.matches[j]); j++)
      if (!m.temp || (includeTempPatterns && m.temp)) matchesElem.appendChild(m.toDOM(doc, includeTempPatterns));

    e.appendChild(this.autoconf.toDOM(doc));
    e.appendChild(this.wpad.toDOM(doc)); 
    e.appendChild(this.manualconf.toDOM(doc));
    return e;
  },
  
  /**
   * If this proxy requires network.dns.disablePrefetch to be false,
   * return true. network.dns.disablePrefetch must be false when the
   * user wants to proxy DNS requests through this proxy. Otherwise,
   * Firefox won't always use this proxy for DNS lookups.
   */
  shouldDisableDNSPrefetch : function() {
    return this._mode != "direct" && this._enabled && this._proxyDNS;
  },
  
  /**
   * Merge |src| into this, using the keys of the |nameValuePairs|
   * associative array as the properties to overwrite in |this|.
   */
  merge : function(src, nameValuePairs) {
    for (var propertyName in nameValuePairs) {
      // Simple sanity check on our input
      var obj = this.propertyBelongsTo(propertyName, this, this.manualconf, this.autoconf);
      // If obj == null then we don't understand this property, so ignore it.
      if (obj)
        obj[propertyName] = nameValuePairs[propertyName];
    }
  },
  
  getPropertyValue : function(propertyName) {
    var obj = this.propertyBelongsTo(propertyName, this, this.manualconf, this.autoconf);
    return obj ? obj[propertyName] : "";
  },
  
  /**
   * Checks if |propertyName| is a known writable property of the classes Proxy,
   * ManualConf, or AutoConf (excepting readOnly properties). |x|, |y|, or |z|
   * is returned, respectively, based on |propertyName's| membership in one of those
   * classes, If the property is unknown or read-only, null is returned.
   */
  propertyBelongsTo : function(propertyName, x, y, z) {
    function validType(str) {
      return str == "string" || str == "boolean" || str == "number";
    }    
    if (this.readOnlyProperties.indexOf(propertyName) > -1) return null;
    
    if (validType(typeof(this[propertyName])))
      return x;
    else if (validType(typeof(this.manualconf[propertyName])))
      return y;
    else if (validType(typeof(this.autoconf[propertyName])))
      return z;
    return null;    
  },
  
  /**
   * Use as a static-style method on this class.
   * Returns a |Proxy| instance based on the |nameValuePairs|
   * associative array. Each key in the array is expected to be
   * a property of either Proxy, ManualConf, or AutoConf, otherwise
   * it is ignored.
   */
  fromAssociateArray : function(nameValuePairs) {
    var doc = CC["@mozilla.org/xml/xml-document;1"].createInstance(CI.nsIDOMDocument),
      proxyElem = doc.createElement("proxy"),
      manualConfElem = doc.createElement("manualconf"),
      autoConfElem = doc.createElement("autoconf");
    
    proxyElem.appendChild(manualConfElem);
    proxyElem.appendChild(autoConfElem);
    for (var i in nameValuePairs) {
      // Simple sanity check on our input
      var elem = this.propertyBelongsTo(i, proxyElem, manualConfElem, autoConfElem);
      /* If elem == null then we don't understand this property, so ignore it.
         However, even if an unrecognized property were to slip by us here,
         the |Proxy.fromDOM()| code would ignore it anyway. This check just prevents us from
         building an arbitrarily large DOM element.
      */
      if (elem)
        elem.setAttribute(i, nameValuePairs[i] == null ? "" : nameValuePairs[i]);         
    }
    // Turn it on by default
    if (!nameValuePairs["enabled"])
      proxyElem.setAttribute("enabled", "true");
    
    // If a socks version was specified and either isSocks is true or no isSocks parameter was specified,
    // then enable socks
    if (nameValuePairs["socksversion"] && (nameValuePairs["isSocks"] == "true" || !nameValuePairs["isSocks"])) {
      nameValuePairs["isSocks"] = true;
      manualConfElem.setAttribute("isSocks", "true");
      manualConfElem.setAttribute("socksversion", parseInt(nameValuePairs["socksversion"]));
    }    
    // If a URL was specified and either mode was specified as auto or no mode was specified,
    // then set mode to auto
    if (nameValuePairs["url"] && (nameValuePairs["mode"] == "auto" || !nameValuePairs["mode"])) {
      nameValuePairs["mode"] = "auto";
      proxyElem.setAttribute("mode", "auto");
    }
    // Change the mode to "direct" if we don't have enough info for "manual" and "auto"
    var noManual = (nameValuePairs["host"] && !nameValuePairs["port"]) ||
      (!nameValuePairs["host"] && nameValuePairs["port"]);
    if (!nameValuePairs["url"] && noManual) {
      nameValuePairs["mode"] = "direct";      
      proxyElem.setAttribute("mode", "direct");
      dump("No host and port specified, and no PAC URL specified; setting proxy mode to direct.\n");
    }

    // Set a default name if one wasn't specified. Don't set the default name based
    // on the mode because proxies like these will end up with different names:
    // proxy:host=my.proxy.server.com&port=999
    // proxy:host=my.proxy.server.com&port=999&mode=direct
    if (!nameValuePairs["name"]) {
      if (noManual)
        nameValuePairs["name"] = nameValuePairs["url"] ? nameValuePairs["url"] : this.fp.getMessage("new.proxy");
      else
        nameValuePairs["name"] = nameValuePairs["host"] + ":" + nameValuePairs["port"];
      proxyElem.setAttribute("name", nameValuePairs["name"]);
    }
    this.fromDOM(proxyElem, true);
  },  

  set autoconfMode(e) {
    this._autoconfMode = e;
  },

  get autoconfMode() {
    return this._autoconfMode;
  },
  
  set proxyDNS(e) {
    this._proxyDNS = e;
    this.manualconf._makeProxy();
  },

  get proxyDNS() {return this._proxyDNS;},  
  
  /**
   * Create a variable that represents the color but as all letters.
   * This is because the CSS style treechildren::-moz-tree-cell(x) requires
   * x to be all letters (no numbers or symbols)
   */
  set color(n) {
    this._color = n;
    var str = new String(n); /* ensure it's a String type, not a Number type */
    str = str.toLowerCase();
    var temp = ["g", "h", "i", "j", "k", "m", "n", "o", "p", "q"];
    temp["a"] = "a";
    temp["b"] = "b";
    temp["c"] = "c";
    temp["d"] = "d";
    temp["e"] = "e";
    temp["f"] = "f";
    temp["#"] = ""; 
    this.colorString = "";
    for (var i=0, len = str.length; i<len; i++)
      this.colorString += temp[str[i]];
  },
  
  get color() {
    return this._color;
  },

  set enabled(e) {
    if (this.lastresort && !e) return; // can't ever disable this guy
    this._enabled = e;
    if (this.shouldLoadPAC()) {
      if (this._mode === "auto") {
        if (this._autoconfMode === "pac") {
          this.autoconf.loadPAC();
        } else if (this._autoconfMode === "wpad") {
          this.wpad.loadPAC();
        }
      }
    } 
    this.handleTimer();
  },

  get enabled() {return this._enabled;},

  shouldLoadPAC : function() {
    if (this._mode == "auto" && this._enabled) {
      var m = this.fp.mode;
      return m == this.id || m == "patterns" || m == "random" ||
        m == "roundrobin";
    }
  },

  set mode(m) {
    this._mode = m;
    if (this.shouldLoadPAC()) {
      if (this._mode === "auto") {
        if (this._autoconfMode === "pac") {
          this.autoconf.loadPAC();
        } else if (this._autoconfMode === "wpad") {
          this.wpad.loadPAC();
        }
      }
    } 
    this.handleTimer();
  },

  afterPropertiesSet : function() {
    // Load PAC if required. Note that loadPAC() is synchronous and if it fails,
    // it changes our mode to "direct" or disables us.
    if (this.shouldLoadPAC()) {
      if (this._mode === "auto") {
        if (this._autoconfMode === "pac") {
          this.autoconf.loadPAC();
        } else if (this._autoconfMode === "wpad") {
          this.wpad.loadPAC();
        }
      }
    } 
    // Some integrity maintenance: if this is a manual proxy and
    // this.manualconf.proxy wasn't created during deserialization, disable us.
    if (this._enabled && this._mode == "manual" && !this.manualconf.proxy) {
      if (this.lastresort) {
        // Switch lastresort to DIRECT since manualconf is corrupt--someone
        // changed foxyproxy.xml manually, outside our GUI
        this._mode = "direct";
      } else {
        this._enabled = false;
      }
      !this._enabled &&
        // (proxy, isBeingDeleted, isBeingDisabled, isBecomingDIRECT)  
        this.fp.proxies.maintainIntegrity(this, false, true, false); 
    }
  },

  handleTimer : function() {
    let ac;
    if (this._autoconfMode === "pac") {
      ac = this.autoconf; 
    } else if (this._autoconfMode === "wpad") {
      ac = this.wpad;
    } 
    // always always always cancel first before doing anything 
    if (ac) {
      ac.timer.cancel();
    }
    if (this.shouldLoadPAC() && ac._autoReload) {
      ac.timer.initWithCallback(ac, ac._reloadFreqMins*60000,
        CI.nsITimer.TYPE_REPEATING_SLACK);
    }
  },

  get mode() {return this._mode;},

  /**
   * Check if any white patterns already match uriStr. As a shortcut,
   * we first check if the existing white patterns (as strings) equal |patStr|
   * before performing regular expression matches.
   *
   * Black pattern matches take precendence over white pattern matches.
   * 
   * Note patStr is sometimes null when this method is called.
   */
  isWhiteMatch : function(patStr, uriStr) {
    var white = -1;
    for (var i=0,sz=this.matches.length; i<sz; i++) {
      var m = this.matches[i];
      if (m.enabled) {
        if ((patStr && m.pattern == patStr) || m.regex.test(uriStr)) {
          if (m.isBlackList) {
            // Black takes priority over white
            return false;
          }
          else if (white == -1) {
            white = i; // continue checking for blacklist matches!
          }
        }
      }
    }
    return white == -1 ? false : this.matches[white];
  },

  isBlackMatch : function(patStr, uriStr) {
    for (var i=0,sz=this.matches.length; i<sz; i++) {
      var m = this.matches[i];
      if (m.enabled && m.isBlackList && (m.pattern == patStr || m.regex.test(uriStr)))
        return m;
    }
  },
  
  removeURLPattern : function(removeMe) {
    this.matches = this.matches.filter(function(e) {return e != removeMe;});
  },
  
  resolve : function(spec, host, mp, isWPAD) {
    function _notifyUserOfError(spec) {
      /*this.autoconf.errorNotification &&*/
      this.fp.notifier.alert(this.fp.getMessage("foxyproxy"),
        this.fp.getMessage("proxy.error.for.url", [spec]));
      return null;
    }
    // See http://wp.netscape.com/eng/mozilla/2.0/relnotes/demo/proxy-live.html
    if (isWPAD) {
      var str = mp.pacResult = this.wpad._resolver.getProxyForURI(spec, host);
    } else {
      var str = mp.pacResult = this.autoconf._resolver.getProxyForURI(spec,
        host);
    }
    if (str && str != "") {
      str = str.toLowerCase();
      var tokens = str.split(/\s*;\s*/), // Trim and split
      proxies = [];
      // In case final token ends with semi-colon 
      if (tokens[tokens.length-1] == "")
        tokens.length--;
      for (var i=0; i<tokens.length; i++) {
        if (isWPAD) {
          var components = this.wpad.parser.exec(tokens[i]);
        } else {
          var components = this.autoconf.parser.exec(tokens[i]); 
        }
        if (!components) continue;
        var tmp = this._proxyDNS && components[1].indexOf("socks") === 0 ?
          CI.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST : 0;
        switch (components[1]) {
          case "proxy":
            proxies.push(proxyService.newProxyInfo("http", components[2],
              components[3], tmp, 0, null));
            break;
          case "socks":
          case "socks5":
            proxies.push(proxyService.newProxyInfo("socks", components[2],
              components[3], tmp, 0, null));
            break;
          case "socks4":
            proxies.push(proxyService.newProxyInfo("socks4", components[2],
              components[3], tmp, 0, null));
            break;
          case "direct":
            proxies.push(this.direct);
           break;
          default:
            return _notifyUserOfError(spec);
        }
      }
      // Build a proxy list for proxy for failover support
      for (var i=1; i<=proxies.length-1; i++) {
        proxies[i-1].failoverTimeout = 1800;
        proxies[i-1].failoverProxy = proxies[i];
      }
      if (proxies[0] == null) {
        return _notifyUserOfError(spec);
      }
      else if (proxies[1]) {
        proxies[0].failoverTimeout = 1800;
        proxies[0].failoverProxy = proxies[1];
      }
      return proxies[0];
    } else {
      // Resolver did not find a proxy, but this isn't an error condition
      return null;
    }
  },

  getProxy : function(spec, host, mp) {
    switch (this._mode) {
      case "manual":return this.manualconf.proxy;
      case "auto":
        if (this._autoconfMode === "pac") {
          return this.resolve(spec, host, mp, false);
        } else {
          // WPAD
          return this.resolve(spec, host, mp, true);
        }
      case "direct":return this.direct;
    }
  },
  
  QueryInterface: XPCOMUtils.generateQI([CI.nsISupports]),
  classDescription: "FoxyProxy Proxy Component",
  classID: Components.ID("{51b469a0-edc1-11da-8ad9-0800200c9a66}"),
  contractID: "@leahscape.org/foxyproxy/proxy;1"    
};

/**
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4)
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 and earlier (Firefox 3.6)
 */
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([Proxy]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([Proxy]);

///////////////////////////// ManualConf class ///////////////////////
function ManualConf(owner, fp) {
  this.owner = owner;
  this.fp = fp;
}

ManualConf.prototype = {
  _host: "",
  _port: "",
  _socksversion: "5",
  _isSocks: false,
  fp : null,
  owner: null,

  fromDOM : function(n) {
    this._host = gGetSafeAttr(n, "host", null) || gGetSafeAttr(n, "http", null) ||
      gGetSafeAttr(n, "socks", null) || gGetSafeAttr(n, "ssl", null) ||
      gGetSafeAttr(n, "ftp", null) || gGetSafeAttr(n, "gopher", ""); //"host" is new for 2.5

    this._port = gGetSafeAttr(n, "port", null) || gGetSafeAttr(n, "httpport", null) ||
      gGetSafeAttr(n, "socksport", null) || gGetSafeAttr(n, "sslport", null) ||
      gGetSafeAttr(n, "ftpport", null) || gGetSafeAttr(n, "gopherport", ""); // "port" is new for 2.5

    this._socksversion = gGetSafeAttr(n, "socksversion", "5");

    this._isSocks = n.hasAttribute("isSocks") ? n.getAttribute("isSocks") == "true" :
      n.getAttribute("http") ? false:
      n.getAttribute("ssl") ? false:
      n.getAttribute("ftp") ? false:
      n.getAttribute("gopher") ? false:
      n.getAttribute("socks") ? true : false; // new for 2.5

    this._makeProxy();
  },

  toDOM : function(doc)  {
    var e = doc.createElement("manualconf");
    e.setAttribute("host", this._host);
    e.setAttribute("port", this._port);
    e.setAttribute("socksversion", this._socksversion);
    e.setAttribute("isSocks", this._isSocks); 
    return e;
  },

  _makeProxy : function() {
    if (!this._host || !this._port)
      return;
    this.proxy = this._isSocks ? proxyService.newProxyInfo(this._socksversion == "5"?"socks":"socks4", this._host, this._port,
          this.owner._proxyDNS ? CI.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST : 0, 0, null): // never ignore, never failover
          proxyService.newProxyInfo("http", this._host, this._port, 0, 0, null);
  },

  get host() {return this._host;},
  set host(e) {
    this._host = e;
    this._makeProxy();
  },

  get port() {return this._port;},
  set port(e) {
    this._port = e;
    this._makeProxy();
  },

  get isSocks() {return this._isSocks;},
  set isSocks(e) {
    this._isSocks = e;
    this._makeProxy();
  },

  get socksversion() {return this._socksversion;},
  set socksversion(e) {
    this._socksversion = e;
    this._makeProxy();
  }
};
