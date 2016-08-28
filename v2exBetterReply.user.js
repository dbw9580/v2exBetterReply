// ==UserScript==
// @name        v2exBetterReply
// @author      dbw9580
// @namespace   v2ex.com
// @description better reply experience for v2ex
// @include     /^https?:\/\/(\w+\.)?v2ex\.com\/t\//
// @version     2016-08-27
// @grant       GM_log
// @grant       GM_addStyle
// @run-at      document-end
// @require     https://code.jquery.com/jquery-2.2.4.min.js
// ==/UserScript==

GM_addStyle(".v2exBR-reply-no-target{background-color: #AAAAAA; color: black !important; cursor: pointer; font-weight:bold;}");
GM_addStyle(".v2exBR-cited-comment-view{background-color: white; position: absolute; display: none; max-width: 500px;}");
GM_addStyle(".v2exBR-reply-citation{color: #778087; cursor: pointer;} .v2exBR-reply-citation:hover{color: #4d5256; text-decoration: underline;}");
GM_addStyle(".v2exBR-cited-comment-view .fr{display: none;}");

$(document.body).append($("<div class=\"v2exBR-cited-comment-view cell\" id=\"v2exBR_citation_div\"></div>"));

$(".no").hover(function(){
    $(this).addClass("v2exBR-reply-no-target");
}, function(){
    $(this).removeClass("v2exBR-reply-no-target");
}).click(function(){
    var username = $(this).parent().next().next().children("a").text();
    var commentNo = $(this).text();
    makeCitedReply(username, commentNo);
});



var numCurrentPage = Math.ceil(parseInt($(".no").eq(0).text()) / 100);
var citedPages = {};
var commentCells = $("div.cell").filter(function(){
    return this.id.startsWith("r");
});
var citedPagesNos = [];
var threadUrl = window.location.href.match(/^.+\/t\/\d+/)[0];

commentCells.find("div.reply_content")
    .each(function(index){
        var content = $(this).html();
        var replacementSpan = "<span class=\"v2exBR-reply-citation\" v2exBR-commentCellId=\"null\" v2exBR-citedPage=\"0\">";
        content = content.replace(/&gt;&gt;\d+(?=\s|<br)/g, replacementSpan + "$&" + "</span>");
        $(this).html(content);
        
        $("span.v2exBR-reply-citation", this).each(function(){
            var replyNo = parseInt($(this).text().match(/>>(\d+)/)[1]);
            var numCitedPage = Math.ceil(replyNo / 100);
            if(citedPagesNos.indexOf(numCitedPage) < 0){
                citedPagesNos.push(numCitedPage);
            }
        });
    });

for(var i = 0; i < citedPagesNos.length; i++){
    var thisPageNo = citedPagesNos[i];
    if(thisPageNo == numCurrentPage) continue;
    (function(thisPageNo){
        $.get(threadUrl + "?p=" + thisPageNo, function(data, status){
            var resultPageRoot = $(data);

            if(resultPageRoot.find("a.page_current").attr("href").match("\\?p=" + thisPageNo) === null){
                return;
            }
            citedPages[thisPageNo] = resultPageRoot;
            bindCitationElements(thisPageNo);
        });
    })(thisPageNo);

}

bindCitationElements(numCurrentPage);

$(".v2exBR-reply-citation").hover(function(){
    var self = this;
    var commentCellId = $(self).attr("v2exBR-commentCellId");
    var numCitedPage = parseInt($(self).attr("v2exBR-citedPage"));

    
    if(commentCellId === "null") return;

    if(citedPages[numCitedPage] === undefined){
        var citedPageRoot = window.document;
    }
    else{
        var citedPageRoot = citedPages[numCitedPage];
    }

    var citationHTML = $("#"+commentCellId, citedPageRoot).html();
    var divPosTopOffset = window.getComputedStyle(self).getPropertyValue("font-size").match(/(\d+)px/)[1];
    $("#v2exBR_citation_div").html(citationHTML)
        .css({
            top:$(self).offset().top,
            left:$(self).offset().left + $(self).width()
        })
        .fadeIn(100);
}, function(){
    $("#v2exBR_citation_div").fadeOut(100);
});


$(".v2exBR-reply-citation").click(function(){
    var commentCellId = $(this).attr("v2exBR-commentCellId");
    var numCitedPage = parseInt($(this).attr("v2exBR-citedPage"));
    if(commentCellId == "null") return;

    if(numCitedPage == numCurrentPage){
        $("html, body").animate({
            scrollTop: $("#" + commentCellId).offset().top
        }, 500);
    }
    else{
        window.location.href = threadUrl + "?p=" + numCitedPage + "&v2exBR_commentCellId=" + commentCellId; 
    }
    
});

(function(){
    var commentCellId = window.location.href.match(/v2exBR_commentCellId=(r_\d+)/);
    if(commentCellId != null){
        commentCellId = commentCellId[1];
        $("html, body").animate({
            scrollTop: $("#" + commentCellId).offset().top
        }, 500);
    }
})();

function bindCitationElements(numPageLoaded){
    $("span.v2exBR-reply-citation").each(function(){
        var self = this;
        var replyNo = parseInt($(this).text().match(/>>(\d+)/)[1]);
        var citedCommentCellId = "";
        var numCitedPage = Math.ceil(replyNo / 100);
        var isMultiPage = ($("a.page_current").length > 0);
        
        if(numCitedPage != numPageLoaded) return true;

        if(numCitedPage != numCurrentPage){
            if(!isMultiPage){ //cited a non-existent comment ID
                return true;
            }

            if(citedPages[numCitedPage] != undefined){
                citedCommentCellId = getCommentCellIdFromReplyNo(citedPages[numCitedPage], replyNo);
                registerCitation(self, citedCommentCellId, numCitedPage);
            }
        }
        else if((replyNo - 1) % 100 <= commentCells.length){ //cited comment is on the same page, retrieve info directly from this page
            citedCommentCellId = commentCells.get((replyNo - 1) % 100).id;
            registerCitation(self, citedCommentCellId, numCitedPage);
        }
    });
}


function getCommentCellIdFromReplyNo(documentRoot, replyNo){
    return documentRoot.find(".no").filter(function(){
        return parseInt($(this).text()) == replyNo;
    }).parents("div.cell").get(0).id;
}

function registerCitation(elem, id, numPage){
    $(elem).attr("v2exBR-commentCellId", id);
    $(elem).attr("v2exBR-citedPage", numPage);
}

function makeCitedReply(username, commentNo){
    replyContent = $("#reply_content");
    oldContent = replyContent.val();

    userTag = "@" + username + " ";
    commentTag = ">>" + commentNo + " \n";

    newContent = commentTag + userTag;
    if(oldContent.length > 0){
        if (oldContent != commentTag + userTag) {
            newContent = oldContent + "\n" + commentTag + userTag;
        }
    } else {
        newContent = commentTag + userTag;
    }

    replyContent.focus();
    replyContent.val(newContent);
    moveEnd($("#reply_content"));
}


