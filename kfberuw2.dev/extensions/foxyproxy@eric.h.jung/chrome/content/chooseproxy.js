/**
  FoxyProxy
  Copyright (C) 2006-2011 Eric H. Jung and FoxyProxy, Inc.
  http://getfoxyproxy.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
**/
var proxyTree, fp, fpc, inn;
const CC = Components.classes, CI = Components.interfaces;

function onLoad() {
  proxyTree = document.getElementById("proxyTree");
  fp = CC["@leahscape.org/foxyproxy/service;1"].getService().wrappedJSObject;  
  fpc = CC["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject;
  inn = window.arguments[0].inn;

  // Using the chooseproxy.xul for pattern subscription purposes we do
  // neither need the extra2 button nor the reloadcurtab-checkbox. Thus,
  // collapsing them.
  if (inn.pattern) {
    document.documentElement.getButton("extra2").collapsed = true;
    document.getElementById("reloadcurtab").collapsed = true;
  }

  // Append title as a textnode to the description so text wrapping works
  var title = document.getElementById("title");
  title.appendChild(document.createTextNode(inn.title));
  
  proxyTree.view = fpc.makeProxyTreeView(fp.proxies, document);
  proxyTree.view.selection.select(0); /* select the first entry */
  if (!inn.pattern) {
    document.getElementById("reloadcurtab").checked = inn.reloadcurtab;
  }
  sizeToContent();
}

function onOK() {
  if (proxyTree.currentIndex !== -1) {
    if (inn.pattern && fp.proxies.item(proxyTree.currentIndex).lastresort) { 
      fp.alert(window, fp.getMessage("patternsubscription.pattern.default")); 
      return false;
    }
    window.arguments[0].out = {proxy:fp.proxies.item(proxyTree.currentIndex), 
      reloadcurtab:
      document.getElementById("reloadcurtab").checked};
    return true;
  }
  return false;
}

function onSettings() {
  var p = CC["@leahscape.org/foxyproxy/proxy;1"].createInstance().wrappedJSObject;
  p.name = inn.host;
  p.manualconf.host = inn.host;
  p.manualconf.port = inn.port;
  var params = {inn:{proxy: p}, out:null};
        
  window.openDialog("chrome://foxyproxy/content/addeditproxy.xul", "",
    "chrome, dialog, modal, resizable=yes", params).focus();
  if (params.out) {
    fp.proxies.push(params.out.proxy);
    proxyTree.view = fpc.makeProxyTreeView(fp.proxies, document); /* reset the view to show the new entry */
    fp.writeSettingsAsync();
  }

  // Reselect what was previously selected or the new item
  proxyTree.view.selection.select(proxyTree.view.rowCount-2);
  //document.documentElement.acceptDialog();
}
