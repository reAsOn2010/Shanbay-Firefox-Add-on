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

//--------------------------------------------
// add elements
//--------------------------------------------
function add_popup(){
    var $box = $('<div id="shanbay-popup" ></div>');
    var $input = $('<form id="shanbay-form" action="" >word:<input size="10" id="shanbay-search-box" type="text" name="word" /><input class="shanbay-input" type="submit" value="\u67e5\u8bcd" /></form>');
    var $req = $('<div id="shanbay-req" ><div id="shanbay-menu"><div id="shanbay-content">Please Login First</div></div><div id="shanbay-definition"></div><div id="shanbay-en-definitions">something</div></div>');
    var $foot = $('<p id="shanbay-support">\u6247\u8d1d\u7f51\u652f\u6301</p>');
    var $add_word_button = $('<button class="shanbay-button" id="shanbay-add-word" type="button">\u6dfb\u52a0</button>');
    var $show_en_def = $('<button class="shanbay-button" id="shanbay-show-en" type="button">\u82f1\u6587\u91ca\u4e49</button>');
    var $show_example = $('<button class="shanbay-button" id="shanbay-show-example" type="button">\u4f8b\u53e5</button>');
    var $examples = $('<div id="shanbay-example"></div>');
    var $examples_area = $('<div id="examples-area"></div>');
    var $go_back = $('<button class="shanbay-button" id="shanbay-go-back" type="button">\u8fd4\u56de</button>');
    $box.appendTo("body");
    $input.appendTo("#shanbay-popup");
    $req.appendTo("#shanbay-popup");
    $examples.appendTo("#shanbay-popup");
    $foot.appendTo("#shanbay-popup");
    $add_word_button.appendTo("#shanbay-menu");
    $show_en_def.appendTo("#shanbay-menu");
    $show_example.appendTo("#shanbay-menu");
    $examples_area.appendTo("#shanbay-example");
    $go_back.appendTo("#shanbay-example");
    $("#shanbay-popup").css({
        "background": "rgb(240,240,240)",
        "border": "1px solid rgb(0,0,0)",
        "position": "absolute",
        "top": "0px",
        "left": "0px",
        "width": "300px",
        "display": "none",
        "text-align": "left",
        "font-family": "sans-serif",
        "z-index": "1000",
        "border": "2px solid #CCC"
    });
    $("#shanbay-form").css({
        "width":"300px",
        "font-size": "14px",
        "margin": "0px",
        "padding": "2px"
    });
    $("#shanbay-menu").css({
        "float":"left",
        "width":"300px"
    });
    $("#shanbay-content").css({
        "float": "left",
        "color": "#CC0099",
        "font-size": "18px",
        "margin": "0px",
        "padding": "2px"
    });
    $("#shanbay-definition").css({
        "width":"300px",
        "float": "left",
        "font-size": "14px",
        "margin": "0px",
        "padding": "2px",
        "text-align": "left"
    });
    $("#shanbay-en-definitions").css({
        "display":"none",
        "width":"300px",
        "float": "left",
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
    $(".shanbay-input").css({
        "background-color": "#209E85",
        "color": "white"
    });
    $(".shanbay-button").css({
        "background-color": "#209E85",
        "color": "white",
        "float": "right",
        "margin-left" : "5px"
    });
    $("#shanbay-example").css({
        "width":"300px",
        "min-height":"25px"
    });
};

//--------------------------------------------
// change content and definitions
//--------------------------------------------
function change(data){
    var en_def = data.voc.en_definitions;
    var $new_speech;
    var $new_en_def;
    $("#shanbay-req").css("display","block");
    $("#shanbay-content").html(data.voc.content);
    $("#shanbay-definition").html(data.voc.definition);
    $("#shanbay-en-definitions").html("");// clear <div id="shanbay-en-definitions"> before append
    $("#shanbay-example").css("display","none");
    if(data.learning_id != 0){
        $("#shanbay-add-word").html("\u5df2\u6dfb\u52a0");
    }else{
        $("#shanbay-add-word").html("\u6dfb\u52a0");
    }
    $("#shanbay-en-definitions").css("display","none");
    //console.log($add_word_button);
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
    $("#shanbay-req").css("display","block");
    $("#shanbay-example").css("display","none");
    $("#shanbay-content").html("not found!");
    $("#shanbay-definition").html("");
    $("#shanbay-en-definitions").html("");
}


//--------------------------------------------
// all jsonp functions
//--------------------------------------------
function get_word(text){
    var learning_id;
    $.ajax({
        url:"http://www.shanbay.com/api/word/" + text,
        dataType:"jsonp",
        success:function(data){
            if(data.voc != false){
                change(data);
                learning_id = data.learning_id;
                //console.log(data);
            }
            else{
                not_found();
            }
        },
        //TODO
        //error:function 
    });
    return learning_id;
}

function save_word(text){
    $.ajax({
        url:"http://www.shanbay.com/api/learning/add/" + text,
        dataType:"jsonp",
        success:function(data){
            //console.log(data);
            //console.log(data.id);
            if(data.id != 0){
                $("#shanbay-add-word").html("\u5df2\u6dfb\u52a0");
                learning_id = data.id;
            }
            else{
                $("#shanbay-add-word").html("\u5931\u8d25");
            }
        }
    });
}

function get_example(text){
    var learning_id;
    $("#shanbay-req").css("display","none");
    $("#shanbay-example").css("display","block");
    $.ajax({
        url:"http://www.shanbay.com/api/word/" + text,
        dataType:"jsonp",
        success:function(data){
            //console.log(data);
            learning_id = data.learning_id;
            $.ajax({
                url:"http://www.shanbay.com/api/learning/examples/" + learning_id,
                dataType:"jsonp",
                success:function(data){
                    //console.log(data);
                    var example_instance = data.examples;
                    if(data.examples_status == 1){
                        //console.log("in");
                        $.each(example_instance, function(id, sentence){
                            var example_id = "shanbay-example-" + id;
                            $new_example = $('<div id="' + example_id + '">' + (id+1) + ":</div>");
                            $new_example.appendTo("#examples-area");
                            var full_sentence = sentence.first + sentence.mid + sentence.last;
                            //console.log(full_sentence);
                            $new_en_sentence = $('<div style="padding-left:10px">' + full_sentence + '</div>');
                            $new_en_sentence.appendTo($("#"+example_id));
                        });
                    }else if(data.examples_status == -1){
                        $("#shanbay-example").html("You haven't add this word");
                    }else if(data.examples_status == 0){
                        $("#shanbay-example").html("No example sentence");
                    }
                }
            });
        }
    });
}



//--------------------------------------------
// this function only works on firefox
// TODO: implement this function by jQuery
//--------------------------------------------
function get_text(){
    var text = new String("");
    if(window.getSelection()){
        var selection = window.getSelection();
        text = selection.toString().trim().toLowerCase();
    }
    return text;
}

//--------------------------------------------
// main function
//--------------------------------------------
$(document).ready(function(){
    var old_text = new String(""); //record last selected text
    var now_text = new String(""); //record text now
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
            now_text = new_text;
            // change popup's position
            if(new_text != ""){
                $("#shanbay-popup").css({
                    top: event.pageY + 15,
                    left: event.pageX
                });
            $("#shanbay-search-box").val(new_text);
            $("#shanbay-popup").fadeTo("fast",1);
            get_word(new_text);
            }
        }
        // condition: click on the popup window
        else if ($(event.target).parents("#shanbay-popup").attr("id")){
            old_text = new_text;
            $("#shanbay-form").unbind("submit").submit(function(){
                var str = $("#shanbay-form").serialize().slice(5); // maybe can use better way
                now_text = str;
                //console.log(str);
                get_word(now_text);
                return false;
            });
            $("#shanbay-add-word").unbind("click").click(function(){
                //console.log("clicked");
                save_word(now_text);
            });
            $("#shanbay-show-en").unbind("click").click(function(){
                $("#shanbay-en-definitions").css("display","block");
            });
            $("#shanbay-show-example").unbind("click").click(function(){
                get_example(now_text);
            })
            $("#shanbay-go-back").unbind("click").click(function(){
                $("#shanbay-req").css("display","block");
                $("#shanbay-example").css("display","none");
                $("#examples-area").html("");
            })
        }
        // condition: click outside the popup window
        else{
            old_text = new_text;
            $("#shanbay-popup").fadeOut("fast");
        }
    })
});
