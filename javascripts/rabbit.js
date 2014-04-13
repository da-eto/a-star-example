jQuery(document).ready(function ($) {

    var board = new (function (container) {
        var $container = $(container);

        var $board = null;
        var $characters = null;
        var $cells = null;

        var barrier = {
            create: function () {
                $(this).attr('data-role', 'barrier').removeClass().addClass('tree');
            },
            remove: function () {
                $(this).attr('data-role', 'empty').removeClass();
            }
        };

        var positioningDuration = 250;

        this.init = function (rows, columns) {
            if (rows < 0 || columns < 0 || (rows * columns) < 2) {
                alert("Can't create board with " + rows + " rows and " + columns + " columns");
                return;
            }

            $container.children().remove();

            $board = $('<table class="table table-bordered game-board"></table>');
            var rowElements = [];

            for (var i = 0; i < rows; i++) {
                var $tr = $('<tr></tr>');
                var colElements = [];

                for (var j = 0; j < columns; j++) {
                    // TODO: WIP: remove
//                    colElements.push($('<td><div data-role="empty" class="circle from-top"><div class="points">23</div></div></td>'));
                    colElements.push($('<td><div data-role="empty"></div></td>'));
                }

                $tr.append(colElements);
                rowElements.push($tr);
            }

            $board.append(rowElements);

            $board.find('td:first>div').attr('data-role', 'character').html('').removeClass().addClass('rabbit');
            $board.find('td:last>div').attr('data-role', 'character').html('').removeClass().addClass('carrot');

            $characters = $board.find('[data-role="character"]');
            $cells = $board.find('td');

            this.enableEditor();

            $container.append($board);
        };

        this.enableEditor = function () {
            if (null == $board) {
                alert("Can't enable editor for non existent board");
                return;
            }

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
                    var $person = $(ui.draggable);
                    var $oldParent = $person.parent();
                    var $target = $(this);

                    $target.removeClass('drag-over');
                    $target.children().detach().appendTo($oldParent);
                    $person
                        .detach()
                        .appendTo($target)
                        .css({
                            left: parseInt($person.css('left'), 10) + $oldParent.offset().left - $target.offset().left,
                            top: parseInt($person.css('top'), 10) + $oldParent.offset().top - $target.offset().top
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

            $board.on('click', '[data-role="empty"]', barrier.create);
            $board.on('click', '[data-role="barrier"]', barrier.remove);
        };

        this.disableEditor = function () {
            if (null == $board) {
                alert("Can't disable editor for non existent board");
                return;
            }

            $characters.draggable('disable');
            $cells.droppable('disable');
            $board.off('click', '[data-role="empty"]', barrier.create);
            $board.off('click', '[data-role="barrier"]', barrier.remove);
        };

        return this;
    })('.game-container');

    $('[data-role="drawer"]').on('click', function () {
        var rows = parseInt($('#dimRows').val(), 10);
        rows = rows >= 1 ? rows : 1;

        var columns = parseInt($('#dimColumns').val(), 10);
        columns = columns >= 1 ? columns : 1;

        if (rows * columns < 2) {
            columns = 2;
        }

        $('#dimRows').val(rows);
        $('#dimColumns').val(columns);

        board.init(rows, columns);
    });

    $('[data-role="starter"]').on('click', function () {
        board.disableEditor();
    });
});
