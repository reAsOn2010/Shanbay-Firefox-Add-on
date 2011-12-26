/**
 * FoxyProxy Copyright (C) 2006-2011 Eric H. Jung and FoxyProxy, Inc.
 * http://getfoxyproxy.org/ eric.jung@yahoo.com
 * 
 * This source code is released under the GPL license, available in the LICENSE
 * file at the root of this installation and also online at
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 */

"use strict";

var Ci = Components.interfaces, Cu = Components.utils, Cc = Components.classes;

var EXPORTED_SYMBOLS = ["patternSubscriptions"];

var patternSubscriptions = {
 
  fp: null,

  // See: http://stackoverflow.com/questions/475074/regex-to-parse-or-validate-base64-data
  base64RegExp: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/,

  subscriptionsList : [],

  // TODO: Where do we need the specific values? Wouldn't it not be enough to
  // have just the properties in an array?
  defaultMetaValues :  {
    formatVersion : 1,
    checksum : "",
    algorithm : "",
    url : "",
    format : "FoxyProxy",
    obfuscation : "none",
    name : "",
    notes : "",
    enabled : true,
    refresh : 60,
    nextUpdate : 0,
    timer : null
  },

  subscriptionsTree : null,

  // We count here the amount of load failures during startup in order to
  // show a dialog with the proper amount in overlay.js
  failureOnStartup : 0,

  // We save pattern subscriptions in this array which could only be loaded
  // partially after startup (or refresh) due to errors in the JSON. The idea
  // is to show the user a respective dialog (see: showPatternLoadFailures() in
  // options.js) asking here to refresh the corrupted subscription immediately.
  partialLoadFailure : [],

  init: function() {
    Cu.import("resource://foxyproxy/autoproxy.jsm", this);
    this.autoproxy.init();
    this.fp = Cc["@leahscape.org/foxyproxy/service;1"].getService().
      wrappedJSObject;
    this.fpc = Cc["@leahscape.org/foxyproxy/common;1"].getService().
      wrappedJSObject; 
  },

  // TODO: Find a way to load the file efficiently using our XmlHTTPRequest
  // method below...
  loadSavedSubscriptions: function(savedPatternsFile) {
    try {
      var line = {};
      var i;
      var errorMessages;
      var hasmore;
      var loadedSubscription;
      var metaIdx;
      var parseString;
      if (!savedPatternsFile) {
        // We do not have saved Patterns yet, thus returning...
	return;
      }
      var istream = Cc["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Ci.nsIFileInputStream);
      // -1 has the same effect as 0444.
      istream.init(savedPatternsFile, 0x01, -1, 0);
      var conStream = Cc["@mozilla.org/intl/converter-input-stream;1"].
                createInstance(Ci.nsIConverterInputStream);
      conStream.init(istream, "UTF-8", 0, 0);
      conStream.QueryInterface(Ci.nsIUnicharLineInputStream);
      do {
        // Every subscription should just get its related error messages,
        // therefore resetting errorMessages here.
	errorMessages = [];
        hasmore = conStream.readLine(line);
        loadedSubscription = this.getObjectFromJSON(line.value, errorMessages); 
	if (loadedSubscription && loadedSubscription.length === undefined) {
	  this.subscriptionsList.push(loadedSubscription); 
	} else {
          // Parsing the whole subscription failed but maybe we can parse at
          // least the metadata to show the user the problematic subscription
          // in the subscriptionsTree. Thus, looking for "metadata" first.
          // If we do not find it (because the problem occurred there) then
	  // obviously we are not able to display anything in the tree.
          metaIdx = line.value.indexOf('"metadata"');
          if (metaIdx > -1) {
            // As we cannot be sure that the JSON starts with "{"metadata""
            // (e.g. if the pattern subscription had not had one) we prepend one
            // "{" to our string to parse. We append one as well in order to be
            // sure that our metadata string is valid JSON regardless where
            // its position in the saved subscription is.
	    parseString = "{" + line.value.slice(metaIdx, line.value.
              indexOf("}", metaIdx) + 1) + "}";
            loadedSubscription = this.getObjectFromJSON(parseString, 
              errorMessages);
	    if (loadedSubscription && loadedSubscription.length === undefined) {
              // At least we could parse the metadata. Now, we can show the
              // subscription in the tree after setting the last status
              // properly. Afterwards we ask the user if she wants to refresh
              // her subscription immediately in order to solve the issue
	      // with the corrupt pattern part.
	      errorMessages.push(this.fp.
                getMessage("patternsubscription.error.patterns", 
                [loadedSubscription.metadata.name])); 
	      loadedSubscription.metadata.lastStatus = this.fp.
                getMessage("error"); 
	      loadedSubscription.metadata.errorMessages = errorMessages;
	      this.subscriptionsList.push(loadedSubscription); 
	      this.partialLoadFailure.push(loadedSubscription);
            } else {
	      this.failureOnStartup++;
            }
	  } else {
	    this.failureOnStartup++;
	  } 
	}
      } while(hasmore);
      try {
        // We could not do this in the while loop above as every time the timer
        // needs to be refreshed the subscriptions are written to disk. Thus, if
        // that happens to the first loaded subscription there may occur a loss
        // of the other subscriptions as the subscriptions list would not be
        // populated with them yet.
        for (i = 0; i < this.subscriptionsList.length; i++) {
          if (this.subscriptionsList[i].metadata && 
              this.subscriptionsList[i].metadata.refresh != 0) {
            delete this.subscriptionsList[i].metadata.timer;
            this.setSubscriptionTimer(this.subscriptionsList[i], false, true);
	  } 
        } 
      } catch (ex) {
        dump("Error while resetting the subscription timer: " + ex + "\n");
      }
      conStream.close(); 
    } catch (e) {
      dump("Error while loading the saved subscriptions: " + e + "\n");
    }
  },

  loadSubscription: function(aURLString, bBase64) {
    try {
      var errorMessages = [];
      var subscriptionText;
      var parsedSubscription;
      var subscriptionJSON = null;
      var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].
        createInstance(Ci.nsIXMLHttpRequest);
      req.open("GET", aURLString, false);
      // We do need the following line of code. Otherwise we would get an error
      // that our JSON is not well formed if we load it from a local drive. See:
      // http://stackoverflow.com/questions/677902/not-well-formed-error-in-
      // firefox-when-loading-json-file-with-xmlhttprequest
      req.overrideMimeType("application/json");
      req.send(null);
      subscriptionText = req.responseText;
      // Stripping of all unnecessary whitespaces and newlines etc. before
      // testing.
      let base64TestString = subscriptionText.replace(/\s*/g, '');
      let isBase64 = this.base64RegExp.test(base64TestString);
      if (isBase64) {
        // Decoding the Base64.
        subscriptionText = atob(base64TestString);
      } 
      // No Base64 (anymore), thus we guess we have a plain FoxyProxy
      // subscription first. If that is not true we check the AutoProxy format.
      // And if that fails as well we give up.
      subscriptionJSON = this.getObjectFromJSON(subscriptionText,
        errorMessages);
      if (subscriptionJSON && subscriptionJSON.length !== undefined) {
        let lines = this.autoproxy.isAutoProxySubscription(subscriptionText);
        if (lines) {
          parsedSubscription = this.autoproxy.
            processAutoProxySubscription(lines, errorMessages);
        } else {
          // No AutoProxy either.
          return errorMessages;
        } 
      } else {
        parsedSubscription = this.
          parseSubscription(subscriptionJSON, aURLString, errorMessages);
        // Did we get the errorMessages back? If so return them immediately.
        if (parsedSubscription.length !== undefined) {
          return parsedSubscription;
        }
        if (!parsedSubscription.metadata) {
	  parsedSubscription.metadata = {};
        } 
        // We've got a FoxyProxy subscription...
        parsedSubscription.metadata.format = "FoxyProxy";
        // Setting the name of the patterns if there is none set yet.
        let pats = parsedSubscription.patterns;
        for (let i = 0, length = pats.length; i < length; i++) {
          let pat = pats[i];
          if (!pat.name) {
            pat.name = pat.pattern;
          }
        }
      }
      if (bBase64 && !isBase64 && !this.fp.warnings.showWarningIfDesired(null,
        ["patternsubscription.warning.not.base64"], "noneEncodingWarning")) {
        errorMessages.push(this.fp.
          getMessage("patternsubscription.error.cancel64"));
        return errorMessages;
      } else if (!bBase64 && isBase64 &&
          !this.fp.warnings.showWarningIfDesired(null,
          ["patternsubscription.warning.base64"], "noneEncodingWarning")) {
          errorMessages.push(this.fp.
            getMessage("patternsubscription.error.cancel64"));
          return errorMessages; 
      } else {
        if (isBase64) {
          parsedSubscription.metadata.obfuscation = "Base64";
	} else {
          parsedSubscription.metadata.obfuscation = this.fp.getMessage("none");
        }
        return parsedSubscription;
      }
    } catch (e) {
      if (e.name === "NS_ERROR_FILE_NOT_FOUND") {
        errorMessages.push(this.fp.
          getMessage("patternsubscription.error.network")); 
      } else {
        errorMessages.push(this.fp.
          getMessage("patternsubscription.error.network.unspecified")); 
      }
      return errorMessages;
    }
  },

  getObjectFromJSON: function(aString, errorMessages) {
    var json;
    try {
      // Should never happen...
      if (!aString) {
	errorMessages.push(this.fp.
          getMessage("patternsubscription.error.JSONString"));
	return errorMessages;
      }
      // As FoxyProxy shall be usable with FF < 3.5 we use nsIJSON. But
      // Thunderbird does not support nsIJSON. Thus, we check for the proper
      // method to use here. Checking for nsIJSON is not enough here due to bug
      // 645922.
      if (typeof Ci.nsIJSON !== "undefined" && typeof Ci.nsIJSON.decode ===
          "function") {
        json = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
        return json.decode(aString); 
      } else {
        return JSON.parse(aString);    
      }
    } catch (e) {
      errorMessages.push(this.fp.
            getMessage("patternsubscription.error.JSON"));
      return errorMessages; 
    }
  },

   getJSONFromObject: function(aObject) {
    var json;
    try {
      // As FoxyProxy shall be usable with FF < 3.5 we use nsIJSON. But
      // Thunderbird does not support nsIJSON. Thus, we check for the proper
      // method to use here. Checking for nsIJSON is not enough here due to bug
      // 645922. 
      if (typeof Ci.nsIJSON !== "undefined" && typeof Ci.nsIJSON.encode ===
          "function") {
        json = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
        return json.encode(aObject); 
      } else {
        return JSON.stringify(aObject);    
      }
    } catch (e) {
      dump("Error while parsing the JSON: " + e + "\n");
    }
  },
 
  parseSubscription: function(aSubscription, aURLString, errorMessages) {
    try {
      var subProperty, ok;
      // Maybe someone cluttered the subscription in other ways...
      for (subProperty in aSubscription) {
        if (subProperty !== "metadata" && subProperty !== "patterns") {
          delete aSubscription[subProperty];
        }	  
      }
      // And maybe someone cluttered the metadata or mistyped a property...
      for (subProperty in aSubscription.metadata) {
        if (!this.defaultMetaValues.hasOwnProperty(subProperty)) {
	  delete aSubscription.metadata[subProperty];
        }
      }
      // We are quite permissive here. All we need is a checksum. If somebody
      // forgot to add that the subscription is MD5 encoded (using the
      // algorithm property of the metadata object) we try that though. But we
      // only check the subscription object for several reasons: 1) It is this
      // object that contains data that we want to have error free. The
      // metadata is not so important as the user can overwrite a lot of its
      // properties and it contains only additional information 2) We cannot
      // hash the whole a whole subscription as this would include hashing the
      // hash itself, a thing that would not lead to the desired result
      // without introducing other means of transporting this hash (e.g. using
      // a special HTTP header). But the latter would have drawbacks we want to
      // avoid 3) To cope with 2) we could exclude the checksum property from
      // getting hashed and hash just all the other parts of the subscription.
      // However, that would require a more sophisticated implementation which
      // currently seems not worth the effort. Thus, sticking to a hashed
      // subscription object.
      if (aSubscription.metadata && aSubscription.metadata.checksum) {
        ok = this.checksumVerification(aSubscription.metadata.checksum, 
          aSubscription);
        if (!ok) {
          if (!this.fp.warnings.showWarningIfDesired(null, 
            ["patternsubscription.warning.md5"], "md5Warning")) {
	    errorMessages.push(this.fp.
            getMessage("patternsubscription.error.cancel5")); 
            return errorMessages;
          }
        } else {
          // Getting the metadata right...
          if (!aSubscription.metadata.algorithm.toLowerCase() !== "md5") {
            aSubscription.metadata.algorithm = "md5";
          }
        }
      }
      return aSubscription; 
    } catch(e) {
      this.fp.alert(null, this.fp.
        getMessage("patternsubscription.error.parse"));        
        errorMessages.push(this.fp.
          getMessage("patternsubscription.error.parse")); 
      return errorMessages;
    }
  },

  addSubscription: function(aSubscription, userValues) {
    var userValue, d, subLength;
    // We need this to respect the user's wishes concerning the name and other
    // metadata properties. If we would not do this the default values that
    // may be delivered with the subscription itself (i.e. its metadate) would
    // overwrite the users' choices.
    // We exlucde obfuscation and format as these are already detected while
    // loading the subscription. The user may nevertheless change them later on
    // if she wants that but at least after the initial import these values are
    // correct.
    for (userValue in userValues) {
      if (userValue !== "obfuscation" && userValue !== "format") {
        aSubscription.metadata[userValue] = userValues[userValue];
      }
    } 
    // If the name is empty take the URL.
    if (aSubscription.metadata.name === "") {
      aSubscription.metadata.name = aSubscription.metadata.url;
    }
    aSubscription.metadata.lastUpdate = this.fp.logg.format(Date.now()); 
    aSubscription.metadata.lastStatus = this.fp.getMessage("okay");
    aSubscription.metadata.errorMessages = null;
    if (aSubscription.metadata.refresh > 0) { 
      this.setSubscriptionTimer(aSubscription, false, false);
    }
    this.subscriptionsList.push(aSubscription);
    this.fp.alert(null, this.fp.
      getMessage("patternsubscription.initial.import.success"));
    this.writeSubscriptions();
  }, 

  editSubscription: function(aSubscription, userValues, index) {
    // TODO: What shall we do if the user changed the URL?
    var userValue;
    var oldRefresh = aSubscription.metadata.refresh;
    for (userValue in userValues) {
      aSubscription.metadata[userValue] = userValues[userValue];
    } 
    // If the name is empty take the URL.
    if (aSubscription.metadata.name === "") {
      aSubscription.metadata.name = aSubscription.metadata.url;
    } 
    if (oldRefresh !== aSubscription.metadata.refresh) {
      // We need type coercion here, hence "==" instead of "===".
      if (aSubscription.metadata.refresh == 0) {
        aSubscription.metadata.timer.cancel();
        delete aSubscription.metadata.timer;
        // There is no next update as refresh got set to zero. Therefore,
        // deleting this property as well.
        delete aSubscription.metadata.nextUpdate;
        // Again, we need type coercion...
      } else if (oldRefresh == 0) {
        this.setSubscriptionTimer(aSubscription, false, false);
      } else {
	// We already had a timer just resetting it to the new refresh value.
        this.setSubscriptionTimer(aSubscription, true, false);
      }
    } 
    this.subscriptionsList[index] = aSubscription;
    this.writeSubscriptions();
  },

  setSubscriptionTimer: function(aSubscription, bRefresh, bStartup) {
    var timer, d, that, event;
    // Now calculating the next time to refresh the subscription and setting
    // a respective timer just in case the user wants to have an automatic
    // update of her subscription.
    if (!aSubscription.metadata.timer) {
      timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      aSubscription.metadata.timer = timer; 
    } else {
      timer = aSubscription.metadata.timer;
    }
    d = new Date().getTime();
    if (bStartup) {
      if (aSubscription.metadata.nextUpdate <= d) {
        this.refreshSubscription(aSubscription, false);
        return;
      }
    } else {
      // TODO: Investigate whether there is an easy way to use
      // metadata.lastUpdate here in order to calculate the next update time in
      // ms since 1969/01/01. By this we would not need metadata.nextUpdate.
      aSubscription.metadata.nextUpdate = d + aSubscription.metadata.
        refresh * 60 * 1000; 
    }
    that = this;
    var event = {
      notify : function(timer) {
        that.refreshSubscription(aSubscription, false);
	// We just need the notification to redraw the tree...
	that.fp.broadcast(null, "foxyproxy-tree-update", null); 
      }
    };
    if (bRefresh) {
      timer.cancel();
      aSubscription.metadata.timer.cancel();
    }
    if (bStartup) {
      // Just a TYPE_ONE_SHOT on startup to come into the regular update cycle.
      timer.initWithCallback(event, aSubscription.metadata.nextUpdate - d, Ci.
        nsITimer.TYPE_ONE_SHOT);
    } else { 
      timer.initWithCallback(event, aSubscription.metadata.refresh * 60 * 1000,
        Ci.nsITimer.TYPE_REPEATING_SLACK);
    }
  },

  getSubscriptionsFile: function() {
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    var subDir = this.fp.getSettingsURI(Ci.nsIFile).parent;
    file.initWithPath(subDir.path);
    file.appendRelativePath("patternSubscriptions.json");
    if ((!file.exists() || !file.isFile())) {
      // Owners may do everthing with the file, the group and others are
      // only allowed to read it. 0x1E4 is the same as 0744 but we use it here
      // as octal literals and escape sequences are deprecated and the
      // respective constants are not available yet, see: bug 433295.
      file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0x1E4); 
    }
    return file;
  }, 

  writeSubscriptions: function() {
    try {
      var subscriptionsData = "";
      var foStream;
      var converter;
      var subFile = this.getSubscriptionsFile();	
      for (var i = 0; i < this.subscriptionsList.length; i++) {
        subscriptionsData = subscriptionsData + this.getJSONFromObject(this.
	  subscriptionsList[i]) + "\n";
      }
      foStream = Cc["@mozilla.org/network/file-output-stream;1"].
                   createInstance(Ci.nsIFileOutputStream);
      // We should set it to the hex equivalent of 0644
      foStream.init(subFile, 0x02 | 0x08 | 0x20, -1, 0);
      converter = Cc["@mozilla.org/intl/converter-output-stream;1"].
                   createInstance(Ci.nsIConverterOutputStream);
      converter.init(foStream, "UTF-8", 0, 0);
      converter.writeString(subscriptionsData);
      converter.close(); 
    } catch (e) {
      dump("Error while writing the subscriptions to disc: " + e + "\n");
    }
  },

  handleImportExport: function(bImport, bPreparation) {
    var patternElement;
    var f = this.fp.getSettingsURI(Ci.nsIFile);
    var s = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.
      nsIFileInputStream);
    s.init(f, -1, -1, Ci.nsIFileInputStream.CLOSE_ON_EOF);
    var p = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.
      nsIDOMParser);
    var doc = p.parseFromStream(s, null, f.fileSize, "text/xml"); 
    if (bPreparation) {
      // Now we are adding the pattern subscriptions.
      doc.documentElement.appendChild(this.toDOM(doc));
    } 
    if (bImport) {
      // Importing old settings means removing the current ones first including
      // pattern subscriptions. Therefore...
      this.subscriptionsList = [];
      // Convert the subscriptions (if there are any) to objects and put them
      // (back) to the susbcriptionsList.
      patternElement = doc.getElementsByTagName("patternSubscriptions").item(0);
      if (patternElement) {
        this.fromDOM(patternElement);
      } else {
	// Although it is not a preparation we set the flag to "true" as we
	// not not need to execute the respective if-path as there are no
	// pattern susbcriptions to erase.
        bPreparation = true;
      }
    } 
    if (!bPreparation) {
      // As we only want to export these subscriptions and have a separate file
      // to store them locally, we remove them after the file was exported in
      // order to avoid messing unnecessarily with the settings file.
      // The same holds for the import case.
      patternElement = doc.getElementsByTagName("patternSubscriptions").
        item(0);
      doc.documentElement.removeChild(patternElement);
    }
    var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
        createInstance(Ci.nsIFileOutputStream);
    foStream.init(f, 0x02 | 0x08 | 0x20, -1, 0); // write, create, truncate
    // In foxyproxy.js is a call to gFP.toDOM() used instead of doc but that is
    // not available here as the patternSubscriptions are not written there.
    // The result is two missing newlines, one before and one after the DOCTYPE
    // declaration. But that does not matter for parsing the settings.
    Cc["@mozilla.org/xmlextras/xmlserializer;1"].
      createInstance(Ci.nsIDOMSerializer).serializeToStream(doc, foStream, "UTF-8");
      // foStream.write(str, str.length);
      foStream.close() 
  },

  fromDOM: function(patElem) {
    var subscription, metaNode, subNode, attrib, patterns,
      name, value;
    var subs = patElem.getElementsByTagName("subscription");
    for (var i = 0; i < subs.length; i++) {
      subscription = {};
      metaNode = subs[i].getElementsByTagName("metadata").item(0);
      if (metaNode) {
        subscription.metadata = {};
        attrib = metaNode.attributes;
        for (var j = 0; j < attrib.length; j++) {
          name = attrib.item(j).nodeName; 
	  value = attrib.item(j).nodeValue; 
          subscription.metadata[name] = value; 
        }	  
      }	
      // The proxy id's are saved as a string but we need them as an array.
      if (subscription.metadata.proxies) {
        subscription.metadata.proxies = subscription.metadata.proxies.
          split(",");
      }
      subNode = subs[i].getElementsByTagName("patterns").item(0);
      if (subNode) {
        subscription.patterns = [];
	patterns = subNode.getElementsByTagName("pattern");
	for (var k = 0; k < patterns.length; k++) {
          subscription.patterns[k] = {};
	  attrib = patterns[k].attributes;
	  for (var l = 0; l < attrib.length; l++) {
	    name = attrib.item(l).nodeName; 
	    value = attrib.item(l).nodeValue; 
            subscription.patterns[k][name] = value; 
          }
        }
      }
      this.subscriptionsList.push(subscription);
    }
    // Add now save the pattern subscriptions to disk...
    this.writeSubscriptions();
  },

  toDOM: function(doc) {
    var sub, meta, sub2, pat, pat2, patterns;
    var e = doc.createElement("patternSubscriptions");
    for (var i = 0; i < this.subscriptionsList.length; i++) {
      patterns = this.subscriptionsList[i].patterns;
      sub = doc.createElement("subscription");
      meta = doc.createElement("metadata");
      pat = doc.createElement("patterns");
      for (var a in this.subscriptionsList[i].metadata) {
        meta.setAttribute(a, this.subscriptionsList[i].metadata[a])
      }
      sub.appendChild(meta);
      for (var j = 0; j < patterns.length; j++) {
        pat2 = doc.createElement("pattern");
        for (var a in patterns[j]) {
          pat2.setAttribute(a, patterns[j][a]);  
        }
        pat.appendChild(pat2);
      }
      sub.appendChild(pat);
      e.appendChild(sub);
    }
    return e;
  },

  refreshSubscription: function(aSubscription, showResponse) {
    var errorText = "";
    // We are calculating the index in this method in order to be able to
    // use it with the nsITimer instances as well. If we would get the
    // index from our caller it could happen that the index is wrong due
    // to changes in the subscription list while the timer was "sleeping".
    var aIndex = null, proxyList = [];
    for (var i = 0; i < this.subscriptionsList.length; i++) {
      if (this.subscriptionsList[i] === aSubscription) {
	aIndex = i;
      }
    }
    if (aIndex === null) return;
    // Estimating whether the user wants to have the subscription base64
    // encoded. We use this as a parameter to show the proper dialog if there
    // is a mismatch between the users choice and the subscription's
    // encoding.
    var base64Encoded = aSubscription.metadata.obfuscation === "base64";
    var refreshedSubscription = this.loadSubscription(aSubscription.
      metadata.url, base64Encoded); 
    // Our "array test" we deployed in addeditsubscription.js as well.
    if (refreshedSubscription && !(refreshedSubscription.length === 
          undefined)) {
      for (var i = 0; i < refreshedSubscription.length; i++) {
        errorText = errorText + "\n" + refreshedSubscription[i];
      }
      this.fp.alert(null, this.fp.
        getMessage("patternsubscription.update.failure") + "\n" + errorText); 
      aSubscription.metadata.lastStatus = this.fp.getMessage("error"); 
      // So, we really did not get a proper subscription but error messages.
      // Making sure that they are shown in the lastStatus dialog.
      aSubscription.metadata.errorMessages = refreshedSubscription;
    } else {
      // We do not want to lose our metadata here as the user just
      // refreshed the subscription to get up-to-date patterns.
      aSubscription.patterns = refreshedSubscription.
        patterns;
      // Maybe the obfuscation changed. We should update this...
      aSubscription.metadata.obfuscation = refreshedSubscription.
        metadata.obfuscation;	
      aSubscription.metadata.lastStatus = this.fp.getMessage("okay");
      // We did not get any errors. Therefore, resetting the errorMessages
      // array to null.
      aSubscription.metadata.errorMessages = null;
      // If we have a timer-based update of subscriptions we deactive the
      // success popup as it can be quite annoying to get such kinds of popups
      // while surfing. TODO: Think about doing the same for failed updates.
      if (showResponse) {
        this.fp.alert(null, this.fp.
          getMessage("patternsubscription.update.success")); 
      }
    }
    aSubscription.metadata.lastUpdate = this.fp.logg.format(Date.now()); 
    // Refreshing a subscription means refreshing the timer as well if there
    // is any...
    if (aSubscription.metadata.refresh > 0) {
      this.setSubscriptionTimer(aSubscription, true, false);
    }
    // And it means above all refreshing the patterns... But first we generate
    // the proxy list.
    if (aSubscription.metadata.proxies.length > 0) {
      proxyList = this.fp.proxies.getProxiesFromId(aSubscription.metadata.
        proxies);
      // First, deleting the old subscription patterns.
      this.deletePatterns(proxyList, aSubscription.metadata.enabled);
      // Now, we add the refreshed ones...
      this.addPatterns(aIndex, proxyList); 
    } 
    this.subscriptionsList[aIndex] = aSubscription;	
    this.writeSubscriptions(); 
  },

  removeDeletedProxies: function(aProxyId) {
    for (let i = 0, sz = this.subscriptionsList.length; i < sz; i++) {
      let proxyList = this.subscriptionsList[i].metadata.proxies;
      for (let j = 0, psz = proxyList.length; j < psz; j++) {
        if (proxyList[j] === aProxyId) {
          proxyList.splice(j, 1);
          // As we know there is just one instance of a proxy tied to the
          // subscription we can leave the innermost for loop now.
          break;
        }
      } 
    }
  },

  addPatterns: function(currentSubIndex, proxyList) {
    // Now are we going to implement the crucial part of the pattern
    // subscription feature: Adding the patterns to the proxies.
    // We probably need no valiatePattern()-call as in pattern.js as the user
    // is not entering a custom pattern itself but imports a list assuming
    // the latter is less error prone.
    var currentSub;
    var currentMet;
    var currentPat;
    var pattern;
    var i,j; 
    if (currentSubIndex) {
      currentSub = this.subscriptionsList[currentSubIndex];
    } else {
      // Adding patterns to a subscription just added to the subscripions list.
      currentSub = this.subscriptionsList[this.subscriptionsList.length - 1];
    }
    currentMet = currentSub.metadata;
    currentPat = currentSub.patterns;
    for (i = 0; i < proxyList.length; i++) {
      // TODO: Maybe we could find a way to blend an old subscription or
      // old patterns with a new one!?
      if (currentPat) {
        for (j = 0; j < currentPat.length; j++) {
          pattern = Cc["@leahscape.org/foxyproxy/match;1"].createInstance().
                    wrappedJSObject; 
          pattern.init(currentSub.metadata.enabled, currentPat[j].name, 
                      currentPat[j].pattern, false, currentPat[j].isRegEx, 
                      currentPat[j].caseSensitive, currentPat[j].blackList, 
                      currentPat[j].multiLine, true);
          proxyList[i].matches.push(pattern);
        }
      }
    } 
  },

  deletePatterns: function(aProxyList) {
    // This method deletes all the patterns belonging to a subscription.
    // That holds for all proxies that were tied to it and are contained in
    // the aProxyList argument.
    var i,j,k,matchesLength; 
    for (i = 0; i < aProxyList.length; i++) {
      matchesLength = aProxyList[i].matches.length; 
      j = k = 0;
      do {
        // That loop does the following: Check the pattern j of the proxy i
        // whether it is from a subscription. If so, delete it (splice()-call)
        // raise k and start at the same position again (now being the next)
        // pattern. If not, raise j (i.e. check the pattern at the next
        // position in the array at the next time running the loop) and k.
        // That goes until all the patterns are checked, i.e. until k equals
        // the patterns length.
        let currentMatch = aProxyList[i].matches[j];
        if (currentMatch && currentMatch.fromSubscription) {
            aProxyList[i].matches.splice(j, 1);
        } else {
          j++;	
        }
        k++;
      } while (k < matchesLength);  
    } 
    this.fp.writeSettingsAsync(); 
  },

  changeSubStatus: function(aProxyList, bNewStatus) {
    for (var i = 0; i < aProxyList.length; i++) {
      for (var j = 0; j < aProxyList[i].matches.length; j++) {
        // We know already that the status has changed. Thus, we only need to
        // apply the new one to the subscription patterns.
        if (aProxyList[i].matches[j].fromSubscription) {
	  aProxyList[i].matches[j].enabled = bNewStatus;
        }
      }
    }
  },

  checksumVerification: function(aChecksum, aSubscription) {
    var result, data, ch, hash, finalHash, i;
    // First getting the subscription object in a proper stringified form.
    // That means just to stringify the Object. JSON allows (additional)
    // whitespace (see: http://www.ietf.org/rfc/rfc4627.txt section 2)
    // but we got rid of it while creating the JSON object the first time.
    var subscriptionJSON = this.getJSONFromObject(aSubscription.patterns);
    
    // Following https://developer.mozilla.org/En/NsICryptoHash
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                    createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    var result = {};
    data  = converter.convertToByteArray(subscriptionJSON, result);
    ch = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
    // We just have the checksum here (maybe the user forgot to specify MD5) in
    // the metadata. But we can safely assume MD5 as we are currently
    // supporting just this hash algorithm.
    ch.init(ch.MD5);
    ch.update(data, data.length); 
    hash = ch.finish(false);
    finalHash = [this.toHexString(hash.charCodeAt(i)) for (i in hash)].
      join("");
    if (finalHash === aChecksum) {
      return true;
    }
    return false;
  },

  toHexString: function(charCode) {
    return ("0" + charCode.toString(16)).slice(-2);
  },

  makeSubscriptionsTreeView: function() {
    var that = this;
    var ret = {
      rowCount : that.subscriptionsList.length,
      getCellText : function(row, column) {
        var i = that.subscriptionsList[row];
        switch(column.id) {
          case "subscriptionsEnabled" : return i.metadata.enabled;
	  case "subscriptionsName" : return i.metadata.name;
          case "subscriptionsNotes" : return i.metadata.notes;
          case "subscriptionsUri" : return i.metadata.url;           
	  // We are doing here a similar thing as in addeditsubscription.js
	  // in the onLoad() function described: As we only saved the id's
	  // and the id's are not really helpful for users, we just use them to
	  // get the respective name of a proxy out of the proxies object
	  // belonging to the foxyproxy service. These names are then displayed
	  // in the subscriptions tree comma separated in the proxy column.
          case "subscriptionsProxy":
	    let proxyString = "";
            let proxies = that.fp.proxies.getProxiesFromId(i.metadata.proxies);
	    for (let j = 0; j < proxies.length; j++) {
              proxyString = proxyString + proxies[j].name;
	      if (j < proxies.length - 1) {
		proxyString = proxyString + ", ";
              }
            }
	    return proxyString; 
          case "subscriptionsRefresh" : return i.metadata.refresh;
          case "subscriptionsStatus" : return i.metadata.lastStatus;
          case "subscriptionsLastUpdate" : return i.metadata.lastUpdate;   
          case "subscriptionsFormat" : return i.metadata.format;
          case "subscriptionsObfuscation" : return i.metadata.obfuscation;
        }
      },
      setCellValue: function(row, col, val) {
		      that.subscriptionsList[row].metadata.enabled = val;
		    },
      getCellValue: function(row, col) {
		      return that.subscriptionsList[row].metadata.enabled;
		    },    
      isSeparator: function(aIndex) { return false; },
      isSorted: function() { return false; },
      isEditable: function(row, col) { return false; },
      isContainer: function(aIndex) { return false; },
      setTree: function(aTree){},
      getImageSrc: function(aRow, aColumn) {return null;},
      getProgressMode: function(aRow, aColumn) {},
      cycleHeader: function(aColId, aElt) {},
      getRowProperties: function(aRow, aColumn, aProperty) {},
      getColumnProperties: function(aColumn, aColumnElement, aProperty) {},
      getCellProperties: function(row, col, props) {},
      getLevel: function(row){ return 0; } 
    };
    return ret;
  }

}
