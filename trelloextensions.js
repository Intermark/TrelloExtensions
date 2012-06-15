
//internals
var filtered = false; //watch for filtered cards
var regEx = /\[(.*)\]\s?/m; //parse regexp- accepts anything between []
var iconUrl = chrome.extension.getURL('images/clipboard.png');

//what to do when DOM loads
$(function(){
    //watch filtering
    $('.js-filter-toggle').live('mouseup',function(e){
        setTimeout(function() {
            filtered=$('.js-filter-cards').hasClass('is-on');
        });
    });

    $('body').bind('DOMSubtreeModified',function (e) {
        if ($(e.target).is('.list')) {
            initLists($(e.target));
        }
    });

    $('.js-share').live('mouseup',function(){
        setTimeout(checkExport);
    });

    function initLists($lists) {
        $lists.each(function () {
            if(!this.list) new List(this);
        });
    }

    initLists($('.list'));

    $('<textarea>').attr('id', 'hidden-text-clipboard-helper').hide().appendTo($('body'));
});

var List = function (el) {
    if (el.list) return;
    el.list = this;

    var $list = $(el);
    var addCardTimeout;

    $list.on('DOMNodeInserted', function (e) {
        var $el = $(e.target);
        if ($el.is('.list-card') && !$el[0].card) {
            clearTimeout(addCardTimeout);
            addCardTimeout = setTimeout(initCards, 0, $el);
        }
    });

    var initCards = function ($cards) {
        $cards.each(function () {
            if(!this.card) new Card(this);
        });
    };

    initCards($('.list-card', $list));
};

var Card = function (el) {
    if (el.card) return;
    el.card = this;

    var hidingText = false;
    var hidingTextTimeout;
    var $card = $(el)
        .on('DOMNodeInserted', function (e) {
            if (!hidingText && ($(e.target).is('.list-card-title') || e.target == $card[0])) {
                clearTimeout(hidingTextTimeout);
                hidingTextTimeout = setTimeout(hideText);
            }
        });

    var addBadgeTimeout;
    var badgeBeingAdded = false;
    var $badge = $('<div>')
        .addClass('badge hidden-text')
        .css('background-image', 'url(' + iconUrl + ')')
        .on('DOMSubtreeModified DOMNodeRemovedFromDocument', function (e) {
            if (badgeBeingAdded || $badge.attr('title') === noHiddenText) {
                return;
            }
            badgeBeingAdded = true;
            clearTimeout(addBadgeTimeout);
            addBadgeTimeout = setTimeout(function () {
                $badge.prependTo($('.badges', $card));
                badgeBeingAdded = false;
            });
        })
        .on('click', function (e) {
            copyToClipboard($badge.attr('title'));
            return false; //prevent click event from bubbling up
        });

    var noHiddenText = '#{none}#';
    var hideText = function () {
        var $title = $('a.list-card-title', $card);
        if ($title[0]) {
            hidingText = true;
            var titleText = $title[0].text;
            var matches = titleText.match(regEx);
            var hiddenText = matches ? matches[1] : noHiddenText;
            if ($card.parent()[0]) {
                $title[0].textContent = titleText.replace(regEx, '');
                $badge.attr({title: hiddenText });
            }
        }
        hidingText = false;
    };

    hideText();
};

var copyToClipboard = function(text) {
    chrome.extension.sendRequest({ text: text });
};