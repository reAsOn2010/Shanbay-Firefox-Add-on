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
	var $box = $('<div id="shanbay-popup" ><img src="http://www.shanbay.com/img/logo.gif"/></div>')
	
	var $input = $('<form id="shanbay-form" action="" >word:<input size="10" id="shanbay-search-box" type="text" name="word" /><input type="submit" value="search" /></form>');
	var $req = $('<div id="shanbay-req" ><div id="shanbay-content">Please Login First</div><div id="shanbay-definition"></div><div id="shanbay-en-definitions">something</div></div>');
	$box.appendTo("body");
	$input.appendTo("#shanbay-popup");
	$req.appendTo("#shanbay-popup");
	$("#shanbay-popup").css({
						"background": "rgb(240,240,240)",
						"border": "1px solid rgb(0,0,0)",
						"position": "absolute",
						"top": "0px",
						"left": "0px",
						"width": "300px",
						"display": "none",
						"text-align": "center",
						"font-family": "sans-serif"
	});
	//$("#popup-title").css({
	//					"color": "#CC0099",
	//					"font-size": "200%",
	//					"margin": "0px",
	//					"padding": "10px"
	//});
	$("#shanbay-form").css({
						"font-size": "100%",
						"margin": "0px"
	});				
	$("#shanbay-content").css({
						"color": "#CC0099",
						"font-size": "100%",
						"margin": "0px",
						"padding": "5px"
	});
	$("#shanbay-definition").css({
						"font-size": "80%",
						"margin": "0px",
						"padding": "5px",
						"text-align": "left"
	});
	$("#shanbay-en-definitions").css({
						"font-size": "80%",
						"margin": "0px",
						"padding": "5px",
						"text-align": "left"
	});
};

function change(data){
	var en_def = data.voc.en_definitions;
	var $new_speech;
	var $new_en_def;
	$("#shanbay-content").html(data.voc.content);
	$("#shanbay-definition").html(data.voc.definition);
	$("#shanbay-en-definitions").html("");
	$.each(en_def, function(speech, definitions){
		var speech_id = "shanbay-speech-" + speech;
		$new_speech = $('<div id="' + speech_id + '">' + speech + ":</div>");
		$new_speech.appendTo("#shanbay-en-definitions");
		$.each(definitions, function(i, def){
			$new_en_def = $('<div>' + (i+1) + '. ' + def + '</div>');
			$new_en_def.appendTo($("#"+speech_id));
		});
	});
	//	console.log(speech + ' ' + definitions);
}

function notfound(){
	$("#shanbay-content").html("word not found!");
	$("#shanbay-definition").html("");
	$("#shanbay-en-definitions").html("");
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
		},
		//error:function
	})
}

function get_text(){
	var text = new String("");
	if(window.getSelection()){
		var selection = window.getSelection();
		text = selection.toString().trim().toLowerCase();
	}
	return text;
}

$(document).ready(function ()
	{
			var old_text = new String("");

			$(document).mouseup(function(event){
				event.stopPropagation();
				if(document.getElementById("shanbay-popup") == null){
					addPopup();
				}
				var popup = document.getElementById("shanbay-popup");
				var new_text = get_text();
				if(popup.style.display == "none" || (new_text != old_text && new_text != "")){
					old_text = new_text;
					if(new_text != ""){
						$("#shanbay-popup").css({
							top: event.pageY + 15,
							left: event.pageX
						});
						$("#shanbay-search-box").val(new_text);
						$("#shanbay-popup").fadeTo("fast",1);
						jsonp_get(new_text);
					}
				}
				else if ($(event.target).parents("#shanbay-popup").attr("id")){
					old_text = new_text;
					$("#shanbay-form").unbind("submit").submit(function(){
						var str = $("#shanbay-form").serialize().slice(5);
						//console.log(str);
						jsonp_get(str);
						return false;
					});
				}
				else{
					old_text = new_text;
					$("#shanbay-popup").fadeOut("fast");
				}
			})
		});
