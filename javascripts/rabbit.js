jQuery(document).ready(function ($) {

    var $board = $('.game-board');
    var $characters = $board.find('[data-role="character"]');
    var $cells = $board.find('td');
    var positioningDuration = 250;

    $characters.draggable({
        containment: $board,
        zIndex: 100,
        revert: 'invalid',
        revertDuration: positioningDuration
    });

    $cells.droppable({
        accept: function (element) {
            return $(this).has('[data-role="empty"]').length > 0 && $(element).data('role') == 'character';
        },
        drop: function (event, ui) {
            var $character = $(ui.draggable);
            var $oldParent = $character.parent();
            var $target = $(this);

            $target.removeClass('drag-over');
            $target
                .children()
                .detach()
                .appendTo($oldParent);
            $character
                .detach()
                .appendTo($target)
                .css({
                    left: parseInt($character.css('left'), 10) + $oldParent.offset().left - $target.offset().left,
                    top: parseInt($character.css('top'), 10) + $oldParent.offset().top - $target.offset().top
                })
                .animate({
                    left: 0,
                    top: 0
                }, positioningDuration);
        },
        over: function () {
            $(this).addClass('drag-over');
        },
        out: function () {
            $(this).removeClass('drag-over');
        }
    });
});