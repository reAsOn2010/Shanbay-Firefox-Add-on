function getCookie(name){
	var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
	if(arr != null) return unescape(arr[2]); return null;
};

String.prototype.trim= function(){  
    // 用正则表达式将前后空格  
    // 用空字符串替代。  
    return this.replace(/(^\s*)|(\s*$)/g, "");  
};

function addPopup(){
	var $box = $('<div id="shanbay-popup" ><h2 class="popup-title">Shanbay Extention</p></div>')
	$box.appendTo("body")				
	$("#shanbay-popup").css({
						"background": "rgb(240,240,240)",
						"border": "1px solid rgb(0,0,0)",
						"position": "absolute",
						"top": "0px",
						"left": "0px",
						"width": "300px",
						"display": "none",
						"text-align": "center",
						"font-family": "Monospace"
					});
	$("h2.popup-title").css({
						"color": "#CC0099",
						"font-size": "200%",
						"margin": "0px"
	});
	var $input = $('<form id="shanbay-form" action="" >word:<input size="10" id="shanbay-search-box" type="text" name="word" /><input type="submit" value="submit" /></form>');
	var $req = $('<div id="shanbay-req" ><h3 id="shanbay-content">content</h1><p id="shanbay-definition" id="shanbay-definition">definition</p></div>');
	$input.appendTo("#shanbay-popup");
	$req.appendTo("#shanbay-popup");
	$("#shanbay-content").css({
						"color": "#CC0099",
						"font-size": "150%",
						"margin": "0px"
	});
	$("#shanbay-definition").css({
						"font-size": "100%",
						"margin": "0px"
	});
};

function change(data){
	var content = document.getElementById("shanbay-content");
	var definition = document.getElementById("shanbay-definition");
	var en_definition = document.getElementById("shanbay-en_definition");
	//TODO
	content.innerHTML = data.voc.content;
	definition.innerHTML = data.voc.definition;
	//en_definition.innerHTML = data.voc.en_definition; 
}

function notfound(){
	var content = document.getElementById("shanbay-content");
	var definition = document.getElementById("shanbay-definition");
	var en_definition = document.getElementById("shanbay-en_definition");
	content.innerHTML = "Word not found!"
	definition.innerHTML = "No definition."
}

function jsonp_get(text){
	$.ajax({
		url:"http://www.shanbay.com/api/word/" + text,
		dataType:"jsonp", 
		success:function(data){console.log(data);
			if(data.voc != false){
				change(data);
			}
			else{
				notfound();
			}
		}
	})
}

$(document).ready(function ()
	{
			$(document).mouseup(function(event){
				event.stopPropagation();
				if(document.getElementById("shanbay-popup") == null){
					addPopup();
				}
				var popup = document.getElementById("shanbay-popup");
				if(popup.style.display == "none" && window.getSelection() != ""){
					//alert(popup.style.display);
					//alert(window.getSelection());
					var text = new String("");
					if(window.getSelection){
						var selection = window.getSelection();
						text = selection.toString();
						text = text.trim().toLowerCase();
					}
					if(text != ""){
						$("#shanbay-popup").css({
							top: event.pageY + 15,
							left: event.pageX
						});
						$("#shanbay-search-box").val(text);
						$("#shanbay-popup").fadeTo("fast",1);
						//$("#shanbay-popup").show();
						jsonp_get(text);
					}
				}
				else if ($(event.target).parents("#shanbay-popup").attr("id")){
					//alert($(event.target).parents("#shanbay-popup").attr("id"));
					//alert($(event.target));
					$("#shanbay-form").submit(function(){
						//console.log($("#shanbay-form").serialize());
						var str = $("#shanbay-form").serialize().slice(5);
						console.log(str);
						jsonp_get(str);
						return false;
					});
				}
				else{
					$("#shanbay-popup").fadeOut("fast");
				}
			//$("#shanbay-form").unbind("submit");//TODO
			})
		});
