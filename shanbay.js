// functions of cookies,from web, not tested
// it is of no use now.
//
// function getCookie(name){
//     var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
//     if(arr != null) return unescape(arr[2]); return null;
// };

String.prototype.trim= function(){
    // 用正则表达式将前后空格
    // 用空字符串替代
    return this.replace(/(^\s*)|(\s*$)/g, "");
};

function add_popup(){
    var $box = $('<div id="shanbay-popup" ></div>');
    var $input = $('<form id="shanbay-form" action="" >word:<input size="10" id="shanbay-search-box" type="text" name="word" /><input type="submit" value="search" /></form>');
    var $req = $('<div id="shanbay-req" ><div id="shanbay-content">Please Login First</div><div id="shanbay-definition"></div><div id="shanbay-en-definitions">something</div></div>');
    var $root = $('<p id="shanbay-support">Shanbay Supported</p>');
    $box.appendTo("body");
    $input.appendTo("#shanbay-popup");
    $req.appendTo("#shanbay-popup");
    $root.appendTo("#shanbay-popup");
    $("#shanbay-popup").css({
        "background": "rgb(240,240,240)",
        "border": "1px solid rgb(0,0,0)",
        "position": "absolute",
        "top": "0px",
        "left": "0px",
        "width": "250px",
        "display": "none",
        "text-align": "left",
        "font-family": "sans-serif",
        "z-index": "1000",
        "border": "2px solid #CCC"
    });
    $("#shanbay-form").css({
        "font-size": "14px",
        "margin": "0px",
        "padding": "2px"
    });
    $("#shanbay-content").css({
        "color": "#CC0099",
        "font-size": "14px",
        "margin": "0px",
        "padding": "2px"
    });
    $("#shanbay-definition").css({
        "font-size": "14px",
        "margin": "0px",
        "padding": "2px",
        "text-align": "left"
    });
    $("#shanbay-en-definitions").css({
        "font-size": "14px",
        "margin": "0px",
        "padding": "2px",
        "text-align": "left"
    });
    $("#shanbay-support").css({
        "font-size": "10px",
        "text-align": "right",
        "margin": "0px",
        "color": "gray"
    });
};

// change content and definitions
function change(data){
    var en_def = data.voc.en_definitions;
    var $new_speech;
    var $new_en_def;
    $("#shanbay-content").html(data.voc.content);
    $("#shanbay-definition").html(data.voc.definition);
    $("#shanbay-en-definitions").html("");// clear <div id="shanbay-en-definitions"> before append
    $.each(en_def, function(speech, definitions){
        var speech_id = "shanbay-speech-" + speech;
        $new_speech = $('<div id="' + speech_id + '">' + speech + ":</div>");
        $new_speech.appendTo("#shanbay-en-definitions");
        $.each(definitions, function(i, def){
            $new_en_def = $('<div style="padding-left:10px">' + (i+1) + '. ' + def + '</div>');
            $new_en_def.appendTo($("#"+speech_id));
        });
    });
}

function not_found(){
    $("#shanbay-content").html("word not found!");
    $("#shanbay-definition").html("");
    $("#shanbay-en-definitions").html("");
}

function jsonp_get(text){
    $.ajax({
        url:"http://www.shanbay.com/api/word/" + text,
        dataType:"jsonp",
        success:function(data){
            //console.log(data);
            if(data.voc != false){
                change(data);
            }
            else{
                not_found();
            }
        },
        //TODO
        //error:function 
    })
}

// this function only works on firefox
// TODO: implement this function by jQuery
function get_text(){
    var text = new String("");
    if(window.getSelection()){
        var selection = window.getSelection();
        text = selection.toString().trim().toLowerCase();
    }
    return text;
}

$(document).ready(function(){
    var old_text = new String(""); //record last selected text

    $(document).mouseup(function(event){
        event.stopPropagation();
        // if it's the first select, add popup HTML
        if(document.getElementById("shanbay-popup") == null){ 
            add_popup();
        }
        // TODO: change this to jQuery inplementation
        var popup = document.getElementById("shanbay-popup");
        var new_text = get_text();
        // condition: 1.select a word.
        //            2.select something different from the formmer time.
        if(popup.style.display == "none" || (new_text != old_text && new_text != "")){
            old_text = new_text;
            // change popup's position
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
        // condition: click on the popup window
        else if ($(event.target).parents("#shanbay-popup").attr("id")){
            old_text = new_text;
            $("#shanbay-form").unbind("submit").submit(function(){
                var str = $("#shanbay-form").serialize().slice(5); // maybe can use better way
                //console.log(str);
                jsonp_get(str);
                return false;
            });
        }
        // condition: click outside the popup window
        else{
            old_text = new_text;
            $("#shanbay-popup").fadeOut("fast");
        }
    })
});
