String.prototype.trim= function(){
    return this.replace(/(^\s*)|(\s*$)/g, "");
};

loadingPicturePath = "http://cloud.github.com/downloads/reAsOn2010/Shanbay-Firefox-Add-on/loading.gif";
//--------------------------------------------
// static string values
//--------------------------------------------

var ShanbayStatics = {
    "notLoggedIn": "\u8BF7\u5148\u767B\u9646\u6247\u8D1D\u7F51",
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
    "noExample": "\u8BE5\u8BCD\u5C1A\u672A\u6709\u4F8B\u53E5",
    "blank": "\u4F8B\u53E5\u548C\u8BD1\u6587\u4E0D\u80FD\u4E3A\u7A7A",
    "tooLong": "\u4F8B\u53E5\u53CA\u5176\u8BD1\u6587\u603B\u957F\u4E0D\u5F97\u8D85\u8FC7300\u4E2A\u5B57\u7B26",
    "success": "\u6DFB\u52A0\u6210\u529F",
    "cancel": "\u53D6\u6D88",
    "foot": "\u6247\u8d1d\u7f51\u652f\u6301",
};
//--------------------------------------------
// add elements
//--------------------------------------------
var addPopupWindow = function() {
    //main popup window
    $('<div/>')
        .attr("id", "shanbay-popup")
        .appendTo("body");

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

    //loading picture
    $('<div/>')
        .attr("id", "shanbay-loading-wrapper")
        .appendTo($("#shanbay-popup"));
    $('<img/>',{
        src: loadingPicturePath
    }).appendTo($("#shanbay-loading-wrapper"));

    //search result display
    $('<div/>')
        .attr("id", "shanbay-req")
        .appendTo($("#shanbay-popup"));
    $('<div/>')
        .addClass("shanbay-menu-wrapper")
        .appendTo($("#shanbay-req"));
    $('<ul/>')
        .addClass("shanbay-menu")
        .appendTo($("#shanbay-req .shanbay-menu-wrapper"));
    $('<div/>')
        .attr("id", "shanbay-meaning")
        .appendTo($("#shanbay-req"));
    $('<div/>')
        .attr("id", "shanbay-en-meaning")
        .appendTo($("#shanbay-req"));
    $('<div/>')
        .addClass("shanbay-content")
        .html(ShanbayStatics["notLoggedIn"])
        .appendTo($("#shanbay-req .shanbay-menu"))
        .wrap('<li/>');
    $('<button/>')
        .addClass("shanbay-button")
        .html(ShanbayStatics["add"])
        .attr("id", "shanbay-add-word")
        .appendTo($("#shanbay-req .shanbay-menu"))
        .wrap('<li/>');
    $('<button/>')
        .addClass("shanbay-button")
        .html(ShanbayStatics["showEn"])
        .attr("id", "shanbay-show-en")
        .appendTo($("#shanbay-req .shanbay-menu"))
        .wrap('<li/>');
    $('<button/>')
        .addClass("shanbay-button")
        .html(ShanbayStatics["showExample"])
        .attr("id", "shanbay-show-example")
        .appendTo($("#shanbay-req .shanbay-menu"))
        .wrap('<li/>');

    //example sentences display
    $('<div/>')
        .attr("id", "shanbay-example")
        .appendTo($("#shanbay-popup"));
    $('<div/>')
        .addClass("shanbay-menu-wrapper")
        .appendTo($("#shanbay-example"));
    $('<ul/>')
        .addClass("shanbay-menu")
        .appendTo($("#shanbay-example .shanbay-menu-wrapper"));
    $('<div/>')
        .attr("id", "shanbay-example-area")
        .appendTo($("#shanbay-example"));
    $('<div/>')
        .addClass("shanbay-content")
        .appendTo($("#shanbay-example .shanbay-menu"))
        .wrap('<li/>');
    $('<button/>')
        .addClass("shanbay-button")
        .html(ShanbayStatics["goBack"])
        .attr("id", "shanbay-go-back")
        .appendTo($("#shanbay-example .shanbay-menu"))
        .wrap('<li/>');
    $('<button/>')
        .addClass("shanbay-button")
        .html(ShanbayStatics["addExample"])
        .attr("id", "shanbay-add-example")
        .appendTo($("#shanbay-example .shanbay-menu"))
        .wrap('<li/>');

    $('<form/>',{
        id: "shanbay-new-example",
        action: ""
    }).appendTo($("#shanbay-example"));
    $('<textarea/>',{
        name: "sentence",
        value: "English sentence"
    }).focus(function(){
        if($(this).val() === "English sentence")
            $(this).val("");
    }).blur(function(){
        if($(this).val() === "")
            $(this).val("English sentence")
    }).appendTo($("#shanbay-new-example"));
    $('<textarea/>',{
        name: "translation",
        value: "Translation"
    }).focus(function(){
        if($(this).val() === "Translation")
            $(this).val("");
    }).blur(function(){
        if($(this).val() === "")
            $(this).val("Translation")
    }).appendTo($("#shanbay-new-example"));
    $('<div/>')
        .addClass("shanbay-submenu")
        .appendTo($("#shanbay-new-example"));

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
    $('<div>')
        .attr("id", "shanbay-error-log")
        .html("error log")
        .appendTo($("#shanbay-popup"));

    //foot div
    $('<p/>')
        .attr("id", "shanbay-support")
        .html(ShanbayStatics["foot"])
        .appendTo($("#shanbay-popup"));

};

//
// Event handler
//
var showOneDivAndHideOthers = function(div) {
    div.siblings("div").slideUp();
    div.slideDown();
}

var wordData = {
    query: "",
    learningId: 0,
    voc: {},
    example: {},
};

var ShanbayEventHandler = function(queryWord){

    wordData.query = queryWord;

    var changeReqDiv = function() {
        if(wordData.learningId === 0){
            $("#shanbay-add-word").html(ShanbayStatics["add"]);
        }else{
            $("#shanbay-add-word").html(ShanbayStatics["added"]);
        }
        $(".shanbay-content").html(wordData.voc.content);
        $("#shanbay-meaning").html(wordData.voc.definition);
        $("#shanbay-en-meaning").html("");
        $.each(wordData.voc.en_definitions, function(speech, definitions){
            $('<div/>')
            .html(speech)
            .attr("id", "shanbay-speech-"+speech)
            .addClass("shanbay-en-speech")
            .appendTo("#shanbay-en-meaning");
            $.each(definitions, function(i, def){
                $('<div/>')
                .addClass("shanbay-en-entry")
                .html((i+1)+". " + def)
                .appendTo($("#shanbay-speech-"+speech));
            });
        });
    }

    var changeExampleDiv = function() {
        $("#shanbay-example-area").html("");
        if(wordData.example.examples_status === 1){
            $.each(wordData.example.examples, function(id, sentence){
                var example_id = "shanbay-example-" + id;
                $new_example = $('<div id="' + example_id + '">' + (id+1) + ":</div>");
                $new_example.appendTo("#shanbay-example-area");
                var full_sentence = sentence.first + sentence.mid + sentence.last;
                $new_en_sentence = $('<div style="padding-left:10px">' + full_sentence + '</div>');
                $new_en_sentence.appendTo($("#"+example_id));
            });
        }
    }

    var showLogMessage = function(text) {
        $("#shanbay-error-log").html(text).slideDown();
    }

    this.showPopupWindow = function() {
        $("#shanbay-popup").show();
    }

    this.setQuery = function(newQuery) {
        if(newQuery !== "")
            wordData.query = newQuery;
        else
            showLogMessage("no empty query");
    }

    this.changeWindowPosition = function(newTop, newLeft) {
        $("#shanbay-popup").css({
            top: newTop,
            left: newLeft,
        })
    }

    this.getData = function() {
        $.ajax({
            url:"http://www.shanbay.com/api/word/" + wordData.query,
            dataType:"jsonp",
            success:function(data){
                if(data === "notLoggedIn"){
                    wordData.learningId = 0;
                    showLogMessage(ShanbayStatics["notLoggedIn"]);
                }
                else if(data.voc === ""){
                    wordData.learningId = 0;
                    showLogMessage(ShanbayStatics["wordNotFound"]);
                }
                else{
                    wordData.learningId = data.learning_id;
                    wordData.voc = data.voc;
                    changeReqDiv();
                    showOneDivAndHideOthers($("#shanbay-req"));
                }
            },
        });
    }

    this.getExample = function() {
        console.log(wordData.learningId);
        $.ajax({
            url:"http://www.shanbay.com/api/learning/examples/" + wordData.learningId,
            dataType:"jsonp",
            success:function(data){
                wordData.example = data;
                console.log(data);
                changeExampleDiv();
                showOneDivAndHideOthers($("#shanbay-example"));
                if(data.examples_status === -1){
                    showLogMessage(ShanbayStatics["wordNotAdded"]);
                }
                else if(data.examples_status === 0){
                    showLogMessage(ShanbayStatics["noExample"]);
                }
            }
        });
    };

    this.submitNewExample = function() {
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
            url:"http://www.shanbay.com/api/example/add/" + wordData.learningId + "?" + query,
            dataType:"jsonp",
            success:function(data){
                console.log(data.example_status);
                if(data.example_status === 100){
                    showLogMessage(ShanbayStatics["wordNotContained"]);
                }
                else if(data.example_status === -1){
                    showLogMessage(ShanbayStatics["wordNotAdded"]);
                }
                else if(data.example_status === 0){
                    showLogMessage(ShanbayStatics["blank"]);
                }
                else if(data.example_status === 300){
                    showLogMessage(ShanbayStatics["tooLong"]);
                }
                else if(data.example_status === 1) {
                    showLogMessage(ShanbayStatics["success"]);
                }
            }
        });
    }


    this.saveWord = function() {
        $.ajax({
            url:"http://www.shanbay.com/api/learning/add/" + wordData.query,
            dataType:"jsonp",
            success:function(data){
                if(data.id !== 0){
                    $("#shanbay-add-word").html(ShanbayStatics["added"]);
                    wordData.learningId = data.id;
                }
            },
        });
    };

    this.toggleEnMeaning = function() {
        $("#shanbay-en-meaning").slideToggle();
    }

    this.hidePopupWindow = function() {
        $("#shanbay-popup").hide();
    }
}

//--------------------------------------------
// this function only works on firefox
// TODO: implement this function by jQuery
//--------------------------------------------
function getSelectedText(){
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
$(document).ready(function() {
    addPopupWindow();
    $(document).mouseup(function(event) {
        event.stopPropagation();
        var query = getSelectedText();
        var handler = new ShanbayEventHandler(query);
        // condition: 1.select a word.
        //            2.select something different from the formmer time.
        if($("#shanbay-popup").css("display") === "none" && query !== ""){
            handler.changeWindowPosition(event.pageY + 15, event.pageX);
            handler.showPopupWindow();
            handler.getData();
        }
        else if ($(event.target).parents("#shanbay-popup").attr("id")){
            $("#shanbay-form").unbind("submit").submit(function() {
                handler.setQuery($("#shanbay-form").serialize().slice(5));
                handler.getData();
                return false;
            });
            $("#shanbay-add-word").unbind("click").click(function(){
                handler.saveWord();
            });
            $("#shanbay-show-en").unbind("click").click(function(){
                handler.toggleEnMeaning();
            });
            $("#shanbay-show-example").unbind("click").click(function(){
                showOneDivAndHideOthers($("#shanbay-loading-wrapper"));
                handler.getExample();
            });
            $("#shanbay-go-back").unbind("click").click(function() {
                showOneDivAndHideOthers($("#shanbay-req"));
            });
            $("#shanbay-add-example").unbind("click").click(function(){
                $("#shanbay-example-area").slideUp();
                $("#shanbay-new-example").slideDown();
            });
            $("#shanbay-new-example-submit").unbind("click").click(function(){
                handler.submitNewExample();
                return false;
            });
            $("#shanbay-new-example-cancel").unbind("click").click(function(){
                showOneDivAndHideOthers($("#shanbay-example"));
                $("#shanbay-example-area").slideDown();
                $("#shanbay-new-example").slideUp();
                return false;
            });

        }
        else{
            showOneDivAndHideOthers($("#shanbay-loading-wrapper"));
            handler.hidePopupWindow();
        }
    });

});
