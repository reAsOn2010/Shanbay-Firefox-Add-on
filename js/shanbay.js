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
// static string values
//--------------------------------------------

var ShanbayStatics = {
    "notLogin": "\u8BF7\u5148\u767B\u9646\u6247\u8D1D\u7F51",
    "search": "\u67E5\u8BE2",
    "added": "\u5df2\u6dfb\u52a0",
    "addFail": "\u6DFB\u52A0\u5931\u8d25",
    "add": "\u6DFB\u52A0",
    "showEn": "\u82f1\u6587\u91ca\u4e49",
    "showExample": "\u4f8b\u53e5",
    "goBack": "\u8fd4\u56de",
    "addExample": "\u6DFB\u52A0\u4F8B\u53E5",
    "wordNotFound": "\u62B1\u6B49\uFF0C\u6CA1\u6709\u627E\u5230\u60A8\u6240\u67E5\u8BE2\u7684\u5355\u8BCD",
    "wordNotContained": "\u4F8B\u53E5\u4E2D\u6CA1\u6709\u5305\u542B\u8BE5\u5355\u8BCD\u6216\u5176\u53D8\u4F53",
    "wordNotAdded": "\u60A8\u5C1A\u672A\u6DFB\u52A0\u8BE5\u5355\u8BCD",
    "blank": "\u4F8B\u53E5\u548C\u8BD1\u6587\u4E0D\u80FD\u4E3A\u7A7A",
    "tooLong": "\u4F8B\u53E5\u53CA\u5176\u8BD1\u6587\u603B\u957F\u4E0D\u5F97\u8D85\u8FC7300\u4E2A\u5B57\u7B26",
    "success": "\u6DFB\u52A0\u6210\u529F",
    "cancel": "\u53D6\u6D88",
    "foot": "\u6247\u8d1d\u7f51\u652f\u6301",
};
//--------------------------------------------
// add elements
//--------------------------------------------
function add_popup(){
    //main popup window
    $('<div/>').attr("id", "shanbay-popup").appendTo("body");

    //search form
    $('<form/>',{
        id:"shanbay-form",
        action:""
    }).appendTo($("#shanbay-popup"));
    $('<input/>',{
        id:"shanbay-search-box",
        type:"text",
        name:"word"
    }).appendTo($("#shanbay-form"));
    $('<input/>',{
        class:"shanbay-input",
        type:"submit",
        value:ShanbayStatics["search"]
    }).appendTo($("#shanbay-form"));

    //search result display
    $('<div/>').attr("id", "shanbay-req")
        .appendTo($("#shanbay-popup"));
    $('<div/>').addClass("shanbay-menu-wrapper")
        .appendTo($("#shanbay-req"));
    $('<ul/>').addClass("shanbay-menu")
        .appendTo($("#shanbay-req .shanbay-menu-wrapper"));
    $('<div/>').attr("id", "shanbay-meaning")
        .appendTo($("#shanbay-req"));
    $('<div/>').attr("id", "shanbay-en-meaning")
        .appendTo($("#shanbay-req"));
    $('<div/>').addClass("shanbay-content")
        .html(ShanbayStatics["notLogin"])
        .appendTo($("#shanbay-req .shanbay-menu")).wrap('<li/>');
    $('<button/>').addClass("shanbay-button")
        .attr("id", "shanbay-add-word")
        .appendTo($("#shanbay-req .shanbay-menu")).wrap('<li/>');
    $('<button/>').addClass("shanbay-button")
        .html(ShanbayStatics["showEn"])
        .attr("id", "shanbay-show-en")
        .appendTo($("#shanbay-req .shanbay-menu")).wrap('<li/>');
    $('<button/>').addClass("shanbay-button")
        .html(ShanbayStatics["showExample"])
        .attr("id", "shanbay-show-example")
        .appendTo($("#shanbay-req .shanbay-menu")).wrap('<li/>');

    //example sentences display
    $('<div/>').attr("id", "shanbay-example").appendTo($("#shanbay-popup"));
    $('<div/>').addClass("shanbay-menu-wrapper").appendTo($("#shanbay-example"));
    $('<ul/>').addClass("shanbay-menu").appendTo($("#shanbay-example .shanbay-menu-wrapper"));
    $('<div/>').attr("id", "shanbay-example-area").appendTo($("#shanbay-example"));
    $('<div/>').addClass("shanbay-content")
        .html(ShanbayStatics["notLogin"]).appendTo($("#shanbay-example .shanbay-menu")).wrap('<li/>');
    $('<button/>').addClass("shanbay-button").html(ShanbayStatics["goBack"])
        .attr("id", "shanbay-go-back").appendTo($("#shanbay-example .shanbay-menu")).wrap('<li/>');
    $('<button/>').addClass("shanbay-button").html(ShanbayStatics["addExample"])
        .attr("id", "shanbay-add-example").appendTo($("#shanbay-example .shanbay-menu")).wrap('<li/>');

    $('<form/>',{
        id: "shanbay-new-example",
        action: ""
    }).appendTo($("#shanbay-example"));
    $('<textarea/>',{
        name: "sentence",
        value: "English sentence"
    })
        .focus(function(){
            if($(this).val() === "English sentence")
                $(this).val("");
        })
        .blur(function(){
            if($(this).val() === "")
                $(this).val("English sentence")
        })
        .appendTo($("#shanbay-new-example"));
    $('<textarea/>',{
        name: "translation",
        value: "Translation"
    })
        .focus(function(){
            if($(this).val() === "Translation")
                $(this).val("");
        })
        .blur(function(){
            if($(this).val() === "")
                $(this).val("Translation")
        })
        .appendTo($("#shanbay-new-example"));
    $('<div/>').addClass("shanbay-submenu").appendTo($("#shanbay-new-example"));

    $('<button/>',{
        id: "shanbay-new-example-submit",
        class:"shanbay-input",
    }).html(ShanbayStatics["add"])
    .appendTo($("#shanbay-new-example .shanbay-submenu"));
    $('<button/>',{
        id: "shanbay-new-example-cancel",
        class: "shanbay-input",
    }).html(ShanbayStatics["cancel"])
    .appendTo($("#shanbay-new-example .shanbay-submenu"));

    //error log
    $('<div>').attr("id", "shanbay-error-log")
        .html("error log")
        .appendTo($("#shanbay-popup"));

    //foot div
    $('<p/>').attr("id", "shanbay-support").html(ShanbayStatics["foot"]).appendTo($("#shanbay-popup"));

};

//--------------------------------------------
// change content and definitions
//--------------------------------------------
function change(data){
    var en_def = data.voc.en_definitions;
    var $new_speech;
    var $new_en_def;
    $("#shanbay-req").show();
    $("#shanbay-req").children().show();
    $("#shanbay-error-log").hide();
    $(".shanbay-content").html(data.voc.content);
    $("#shanbay-meaning").html(data.voc.definition);
    $("#shanbay-en-meaning").html("");// clear <div id="shanbay-en-meaning"> before append
    $("#shanbay-example").hide();
    if(data.learning_id !== 0){
        $("#shanbay-add-word").html(ShanbayStatics["added"]);
    }else{
        $("#shanbay-add-word").html(ShanbayStatics["add"]);
    }
    $("#shanbay-en-meaning").css("display","none");
    //console.log($add_word_button);
    $.each(en_def, function(speech, definitions){
        var speech_id = "shanbay-speech-" + speech;
        $new_speech = $('<div id="' + speech_id + '">' + speech + ":</div>");
        $new_speech.appendTo("#shanbay-en-meaning");
        $.each(definitions, function(i, def){
            $new_en_def = $('<div style="padding-left:10px">' + (i+1) + '. ' + def + '</div>');
            $new_en_def.appendTo($("#"+speech_id));
        });
    });
}

function not_found(){
    $("#shanbay-req").show();
    $("#shanbay-example").hide();
    $("#shanbay-req .shanbay-menu-wrapper").hide();
    $("#shanbay-error-log").html(ShanbayStatics["wordNotFound"]).show();
    $("#shanbay-meaning").html("");
    $("#shanbay-en-meaning").html("");
}


//--------------------------------------------
// all json functions
//--------------------------------------------
function get_word(text){
    var learning_id;
    $.ajax({
        url:"http://www.shanbay.com/api/word/" + text,
        dataType:"jsonp",
        success:function(data){
            if(data.voc !== ""){
                change(data);
                learning_id = data.learning_id;
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
            if(data.id !== 0){
                $("#shanbay-add-word").html(ShanbayStatics["added"]);
                learning_id = data.id;
            }
            else{
                $("#shanbay-add-word").html(ShanbayStatics["add"]);
            }
        }
    });
}

function get_example(text){
    var learning_id;
    $("#shanbay-req").hide();
    $("#shanbay-example").show();
    $("#shanbay-new-example").hide();
    $("#shanbay-example-area").html("").show();
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
                    if(data.examples_status === 1){
                        //console.log("in");
                        $.each(example_instance, function(id, sentence){
                            var example_id = "shanbay-example-" + id;
                            $new_example = $('<div id="' + example_id + '">' + (id+1) + ":</div>");
                            $new_example.appendTo("#shanbay-example-area");
                            var full_sentence = sentence.first + sentence.mid + sentence.last;
                            //console.log(full_sentence);
                            $new_en_sentence = $('<div style="padding-left:10px">' + full_sentence + '</div>');
                            $new_en_sentence.appendTo($("#"+example_id));
                        });
                    }else if(data.examples_status === -1){
                        $("#shanbay-example-area").html("You haven't add this word");
                    }else if(data.examples_status === 0){
                        $("#shanbay-example-area").html("No example sentence");
                    }
                }
            });
        }
    });
}

function add_example(text) {
    var learning_id;
    var query = "";
    //console.log("in add example");
    $.ajax({
        url:"http://www.shanbay.com/api/word/" + text,
        dataType:"jsonp",
        success:function(data){
            //console.log(data);
            learning_id = data.learning_id;
            var array = $("#shanbay-new-example").serializeArray();
            if(array[0].value === "English sentence"){
                array[0].value = "";
            }
            if(array[1].value === "Translation"){
                array[1].value = ""
            }
            var query= $.param(array);
            console.log(query)
            $.ajax({
                url:"http://www.shanbay.com/api/example/add/" + learning_id + "?" + query,
                dataType:"jsonp",
                success:function(data){
                    console.log(data.example_status);
                    if(data.example_status === 100){
                        $("#shanbay-error-log").html(ShanbayStatics["wordNotContained"]).show("fast").delay(1000).hide("slow");
                    }
                    else if(data.example_status === -1){
                        $("#shanbay-error-log").html(ShanbayStatics["wordNotAdded"]).show("fast").delay(1000).hide("slow");
                    }
                    else if(data.example_status === 0){
                        $("#shanbay-error-log").html(ShanbayStatics["blank"]).show("fast").delay(1000).hide("slow");
                    }
                    else if(data.example_status === 300){
                        $("#shanbay-error-log").html(ShanbayStatics["tooLong"]).show("fast").delay(1000).hide("slow");
                    }
                    else if(data.example_status === 1) {
                        $("#shanbay-error-log").html(ShanbayStatics["success"]).show("fast").delay(1000).hide("slow");
                        get_example(text);
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
        if(document.getElementById("shanbay-popup") === null){ 
            add_popup();
        }
        var popup = $("#shanbay-popup");
        var new_text = get_text();
        // condition: 1.select a word.
        //            2.select something different from the formmer time.
        if(popup.css("display") === "none" || (new_text !== old_text && new_text !== "")){
            old_text = new_text;
            now_text = new_text;
            // change popup's position
            if(new_text !== ""){
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
                $("#shanbay-en-meaning").css("display","block");
            });
            $("#shanbay-show-example").unbind("click").click(function(){
                get_example(now_text);
            });
            $("#shanbay-add-example").unbind("click").click(function(){
                $("#shanbay-example-area").fadeOut("fast");
                $("#shanbay-new-example").show();
                $("#shanbay-new-example").children().show();
            });
            $("#shanbay-new-example-submit").unbind("click").click(function(){
                //alert("clicked");
                add_example(now_text);
                return false;
            });
            $("#shanbay-new-example-cancel").unbind("click").click(function(){
                $("#shanbay-new-example").fadeOut("fast");
                $("#shanbay-example-area").show();
                return false;
            });
            $("#shanbay-go-back").unbind("click").click(function(){
                $("#shanbay-req").css("display","block");
                $("#shanbay-example").css("display","none");
                $("#shanbay-example-area").html("");
            });
        }
        // condition: click outside the popup window
        else{
            old_text = new_text;
            $("#shanbay-popup").fadeOut("fast");
        }
    })
});
