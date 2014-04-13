jQuery(document).ready(function ($) {
    var $board = $('.game-board');

    $board.find('div').draggable({
        containment: ".game-board",
        revert: 'invalid'
    });

    $board.find('td').droppable({
        accept: function() {
            return ($(this).has('div').length == 0);
        },
        drop: function (event, ui) {
            var $character = $(ui.draggable);
            $character.detach();
            var $target = $(this);

            $target.append($character);
            $target.removeClass('drag-over');
            $character.css({
                left: 0,
                top: 0
            })
        },
        over: function () {
            $(this).addClass('drag-over');
        },
        out: function () {
            $(this).removeClass('drag-over');
        }
    });
});