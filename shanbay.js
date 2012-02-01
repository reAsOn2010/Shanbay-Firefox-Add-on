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
	var $box = $('<div id="shanbay-popup" ><p style="margin: 0px">Shanbay Extention</p></div>')
	$box.appendTo("body")				
	$("#shanbay-popup").css({
						"background": "rgb(240,240,240)",
						"border": "1px solid rgb(0,0,0)",
						"position": "absolute",
						"top": "0px",
						"left": "0px",
						"width": "400px",
						"display": "none",
						"text-align": "center"
					});
	var $input = $('<form name="input" action="" method="get">word:<input id="shanbay-search-box" type="text" name="word" /><input type="submit" value="search" /></form>');
	var $req = $('<div id="shanbay-req" ><h1 id="shanbay-content" style="margin : 0px">content</h1><p id="shanbay-definition" style="margin : 0px">definition</p></div>');
	$input.appendTo("#shanbay-popup");
	$req.appendTo("#shanbay-popup");
};

function change(data){
	var content = document.getElementById("shanbay-content");
	var definition = document.getElementById("shanbay-definition");
	var en_definition = document.getElementById("shanbay-en_definition");
	content.innerHTML = data.voc.content;
	definition.innerHTML = data.voc.definition;
	//en_definition.innerHTML = data.voc.en_definition; 
}


$(document).ready(function ()
	{
			$(document).mouseup(function(event){
				event.stopPropagation();
				if(document.getElementById("shanbay-popup") == null){
					addPopup();
				}
				var popup = document.getElementById("shanbay-popup");
				if(popup.style.display == "none" || window.getSelection() != ""){
					var text = new String("");
					if(window.getSelection){
						var selection = window.getSelection();
						text = selection.toString();
						text = text.trim();
					}
					if(text != ""){
						$("#shanbay-popup").css({
							top: event.pageY + 15,
							left: event.pageX
						});
						$("#shanbay-search-box").val(text);
						$("#shanbay-popup").fadeTo("fast",0.8);
						$.ajax({
							url:"http://www.shanbay.com/api/word/" + text,
							dataType:"jsonp", 
							success:function(data){console.log(data);
								if(data.learning_id != 0){
									change(data);
									/*TODO*/
								}	
							}
						})
					}
				}
				else if ($(event.target).parents("#shanbay-popup").attr("id")){
					/*TODO*/
				}
				else{
					$("#shanbay-popup").fadeOut("fast")
				}
			})
		});
