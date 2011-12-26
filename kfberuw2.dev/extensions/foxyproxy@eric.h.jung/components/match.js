/**
  FoxyProxy
  Copyright (C) 2006-2011 Eric H. Jung and FoxyProxy, Inc.
  http://getfoxyproxy.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
**/

/* A better name for this class would have been Pattern */

//dump("match.js\n");
if (!CI) {
  var CI = Components.interfaces, CC = Components.classes, CR = Components.results;

  // Get attribute from node if it exists, otherwise return |def|.
  // No exceptions, no errors, no null returns.
  var gGetSafeAttr = function(n, name, def) {
    n.QueryInterface(CI.nsIDOMElement);
    return n ? (n.hasAttribute(name) ? n.getAttribute(name) : def) : def;
  };
  // Boolean version of GetSafe
  var gGetSafeAttrB = function(n, name, def) {
    n.QueryInterface(CI.nsIDOMElement);
    return n ? (n.hasAttribute(name) ? n.getAttribute(name)=="true" : def) : def;
  };
}
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

///////////////////////////// Match class///////////////////////
function Match(enabled, name, pattern, temp, isRegEx, caseSensitive, isBlackList, isMultiLine, fromSubscription) {
  this.wrappedJSObject = this;
  this.init.apply(this, arguments);
  Components.utils.import("resource://foxyproxy/patternSubscriptions.jsm", 
    this); 
}

Match.prototype = {
  enabled : true,
  name : "",
  _pattern : "",
  temp : false,
  _isRegEx : false,
  _caseSensitive : false,
  isBlackList : false,
  _isMultiLine : false,
  _fromSubscription : false,

  clone : function() {
    return new Match(this.enabled, this.name, this._pattern, this.temp, this.isRegEx, this.caseSensitive,
      this.isBlackList, this._isMultiLine, this._fromSubscription);
  },

  init : function(enabled, name, pattern, temp, isRegEx, caseSensitive, isBlackList, isMultiLine) {
    this.enabled = arguments.length > 0 ? arguments[0] : true;
    this.name = name || "";
    this._pattern = pattern || "";
    this.temp = arguments.length > 3 ? arguments[3] : false; // doesn't calculate the regex
    this._isRegEx = arguments.length > 4 ? arguments[4] : false;
    this._caseSensitive = arguments.length > 5 ? arguments[5] : false;
    this.isBlackList = arguments.length > 6 ? arguments[6] : false;
    this._isMultiLine = arguments.length > 7 ? arguments[7] : false;
    this._fromSubscription = arguments.length > 8 ? arguments[8] : false;
    this.buildRegEx();
  },

  set pattern(p) {
    if (!p) p = ""; // prevent null patterns
    this._pattern = p.replace(/^\s*|\s*$/g,""); // trim
    this.buildRegEx();
  },

  get pattern() {
    return this._pattern;
  },

  set isRegEx(r) {
    this._isRegEx = r;
    this.buildRegEx();
  },

  get isRegEx() {
    return this._isRegEx;
  },

  set isMultiLine(m) {
    this._isMultiLine = m;
    this.buildRegEx();
  },

  get isMultiLine() {
    return this._isMultiLine;
  },

  set caseSensitive(m) {
    this._caseSensitive = m;
    this.buildRegEx();
  },

  get caseSensitive() {
    return this._caseSensitive;
  },

  set fromSubscription(m) {
    this._fromSubscription = m;
  },

  get fromSubscription() {
    return this._fromSubscription;
  },

  buildRegEx : function() {
    var pat = this._pattern;
    if (!this._isRegEx) {
      // Wildcards
      // $& replaces with the string found, but with that string escaped (like
      // the .lastMatch property)
      pat = pat.replace(/[$.+()^]/g, "\\$&"); 
      pat = pat.replace(/\*/g, ".*");
      pat = pat.replace(/\?/g, ".");
    }
    try {
      this.regex = this._caseSensitive ? new RegExp(pat) : new RegExp(pat, "i");
    }
    catch(e) {
      // ignore--we might be in a state where the regexp is invalid because
      // _isRegEx hasn't been changed to false yet, so we executed the wildcard
      // replace() calls. however, this code is about to re-run because we'll be
      // changed to a wildcard and re-calculate the regex correctly.
    }
  },

  fromDOM : function(n, includeTempPatterns) {
    var notes = gGetSafeAttr(n, "notes", "");  // name was called notes in v1.0
	  this.name = gGetSafeAttr(n, "name", notes);
	  this._isRegEx = gGetSafeAttrB(n, "isRegEx", false);
	  this._pattern = gGetSafeAttr(n, "pattern", "");
	  this.isBlackList = gGetSafeAttrB(n, "isBlackList", false);
	  this.enabled = gGetSafeAttrB(n, "enabled", true);
	  this._isMultiLine = gGetSafeAttrB(n, "isMultiLine", false);
    // Set this.caseSensitive instead of this._caseSensitive because the latter creates the regexp.
    this.caseSensitive = gGetSafeAttrB(n, "caseSensitive", false);
    this._fromSubscription = gGetSafeAttrB(n, "fromSubscription", false);
    // We don't deserialize this.temp because it's not serialized
    // exception: use is copying these patterns (including temporary ones)
    // to a new proxy
    if (includeTempPatterns)
      this.temp = gGetSafeAttrB(n, "temp", false);
  },

  toDOM : function(doc, includeTempPatterns) {
    if (!includeTempPatterns && this.temp) return;
    var matchElem = doc.createElement("match");
    matchElem.setAttribute("enabled", this.enabled);
    matchElem.setAttribute("name", this.name);
    matchElem.setAttribute("pattern", this._pattern);
    matchElem.setAttribute("isRegEx", this.isRegEx);
    matchElem.setAttribute("isBlackList", this.isBlackList);
    matchElem.setAttribute("isMultiLine", this._isMultiLine);
    matchElem.setAttribute("caseSensitive", this._caseSensitive);
    matchElem.setAttribute("fromSubscription", this._fromSubscription);
    if (includeTempPatterns)
      matchElem.setAttribute("temp", this.temp);
    return matchElem;
  },

  toJSON : function() {
    let pattern = {};
    pattern.enabled = this.enabled;
    pattern.name = this.name;
    pattern.pattern = this._pattern;
    pattern.isRegEx = this.isRegEx;
    pattern.caseSensitive = this._caseSensitive;
    pattern.blackList = this.isBlackList;
    pattern.multiLine = this._isMultiLine;
    return this.patternSubscriptions.getJSONFromObject(pattern);
  },
  
  QueryInterface: XPCOMUtils.generateQI([CI.nsISupports]),
  classDescription: "FoxyProxy Match Component",
  classID: Components.ID("{2b49ed90-f194-11da-8ad9-0800200c9a66}"),
  contractID: "@leahscape.org/foxyproxy/match;1",  
};

/**
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4)
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 and earlier (Firefox 3.6)
 */
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([Match]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([Match]);
