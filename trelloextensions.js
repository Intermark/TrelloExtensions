
//internals
var filtered = false, //watch for filtered cards
    reg = /\[(.*)\]\s?/m; //parse regexp- accepts anything between []
    //iconUrl = chrome.extension.getURL('images/storypoints-icon.png');

//what to do when DOM loads
$(function(){
    //watch filtering
    $('.js-filter-toggle').live('mouseup',function(e){
        setTimeout(function(){
            filtered=$('.js-filter-cards').hasClass('is-on');
        });
    });

    $('body').bind('DOMSubtreeModified',function(e){
        if($(e.target).hasClass('list'))
            readList($(e.target));
    });

    $('.js-share').live('mouseup',function(){
        setTimeout(checkExport);
    });

    function readList($c) {
        $c.each(function(){
            if(!this.list) new List(this);
        });
    }

    readList($('.list'));

});

//.list pseudo
function List(el){
    if(el.list)return;
    el.list=this;

    var $list=$(el),
        busy = false,
        to,
        to2;

    var $total=$('<span class="list-total">')
        .bind('DOMNodeRemovedFromDocument',function(){
            clearTimeout(to);
            to=setTimeout(function(){
                $total.appendTo($list.find('.list-header h2'));
            });
        })
        .appendTo($list.find('.list-header h2'));

    $list.bind('DOMNodeInserted',function(e){
        if($(e.target).hasClass('list-card') && !e.target.listCard) {
            clearTimeout(to2);
            to2=setTimeout(readCard,0,$(e.target));
        }
    });

    function readCard($c){
        $c.each(function(){
            if($(this).hasClass('placeholder')) return;
            if(!this.listCard) new ListCard(this);
        });
    }

    readCard($list.find('.list-card'));
}

//.list-card pseudo
function ListCard(el){
    if(el.listCard)return;
    el.listCard=this;

    var points=-1,
        parsed,
        that=this,
        busy=false,
        busy2=false,
        to,
        to2,
        ptitle,
        $card=$(el)
            .bind('DOMNodeInserted',function(e){
                if(!busy && ($(e.target).hasClass('list-card-title') || e.target==$card[0])) {
                    clearTimeout(to2);
                    to2=setTimeout(getPoints);
                }
            }),
        $badge=$('<div class="badge badge-points point-count" style="background-image: url('+iconUrl+')"/>')
            .bind('DOMSubtreeModified DOMNodeRemovedFromDocument',function(e){
                if(busy2)return;
                busy2=true;
                clearTimeout(to);
                to = setTimeout(function(){
                    $badge.prependTo($card.find('.badges'));
                    busy2=false;
                });
            });

    function getPoints(){
        var $title=$card.find('a.list-card-title');
        if(!$title[0]||busy)return;
        busy=true;
        var title=$title[0].text;
        parsed=title.match(reg);
        points=parsed?parsed[1]:-1;
        if($card.parent()[0]){
            $title[0].textContent = title.replace(reg,'');
            $badge.text(that.points);
            $badge.attr({title: 'This card has '+that.points+' storypoint' + (that.points == 1 ? '.' : 's.')});
        }
        busy=false;
    }

    this.__defineGetter__('points',function(){
        //don't add to total when filtered out
        return parsed&&(!filtered||($card.css('opacity')==1 && $card.css('display')!='none'))?points:'';
    });

    getPoints();
}