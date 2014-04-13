jQuery(document).ready(function ($) {

    // simple heap implementation of priority queue
    var PriorityQueue = function (norm) {
        this.storage = [null];
        this.norm = norm || function (e) {
            return e;
        };
    };

    PriorityQueue.prototype = {
        size: function () {
            return this.storage.length - 1;
        },
        isEmpty: function () {
            return this.size() < 1;
        },
        enqueue: function (item) {
            this.storage.push(item);
            this.lift(this.size());
        },
        dequeue: function () {
            if (this.isEmpty()) {
                return null;
            }

            this.swap(1, this.size());
            var min = this.storage.pop();
            this.down(1);
            return min;
        },
        swap: function (a, b) {
            var tmp = this.storage[a];
            this.storage[a] = this.storage[b];
            this.storage[b] = tmp;
        },
        lift: function (current) {
            var parent = Math.floor(current / 2);

            while (parent > 0) {
                if (this.norm(this.storage[current]) < this.norm(this.storage[parent])) {
                    this.swap(current, parent);
                }

                current = parent;
                parent = Math.floor(current / 2);
            }
        },
        down: function (current) {
            while (current * 2 <= this.size()) {
                var child = this.smallerChild(current);

                if (this.norm(this.storage[current]) > this.norm(this.storage[child])) {
                    this.swap(current, child);
                }

                current = child;
            }
        },
        smallerChild: function (index) {
            var left = index * 2;
            var right = left + 1;

            if (right > this.size()) {
                return left;
            }

            if (this.norm(this.storage[left]) < this.norm(this.storage[right])) {
                return left;
            }

            return right;
        }
    };

    var manhattan = function (from, to) {
        return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
    };

    var GridMap = function () {
        // TODO:
    };

    GridMap.prototype = {
        neighbors: function (cell) {
            // TODO
            return [];
        },
        distance: function (from, to) {
            return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
        }
    };

    var SearchNode = function (cell, parent, g, h) {
        this.cell = cell;
        this.parent = parent;
        this.g = g;
        this.h = h;
        this.closed = false;
        this.opened = false;
    };

    SearchNode.prototype = {
        f: function () {
            return this.g + this.h;
        }
    };

    var SearchSimulator = function (map, start, end, heuristic, delay) {
        this.map = map;
        this.start = start;
        this.end = end;
        this.delay = delay;
        this.heuristic = heuristic;
    };

    SearchSimulator.prototype = {
        search: function () {
            var queue = new PriorityQueue(function (node) {
                return node.f();
            });
            var current = new SearchNode(this.start, null, 0, 0);
            this.push(queue, current);

            while (!queue.isEmpty()) {
                var node = this.pop(queue);

                if (node.cell === this.end) {
                    return this.backtrace(this.end);
                }

                var neighbors = this.map.neighbors(node.cell);

                for (var i = 0; i < neighbors.length; i++) {
                    var neighbor = neighbors[i];

                    if (neighbor.closed) {
                        continue;
                    }

                    var distance = node.g + this.map.distance(node, neighbor);

                    if (!neighbor.opened || distance < neighbor.g) {
                        neighbor.g = distance;
                        neighbor.h = neighbor.h || this.heuristic(neighbor.cell, this.end);
                        neighbor.parent = node;

                        if (!neighbor.opened) {
                            this.push(queue, neighbor);
                        } else {
                            queue.down(queue.storage.indexOf(neighbor));
                        }
                    }
                }
            }

            return [];
        },
        push: function (queue, node) {
            queue.enqueue(node);
            node.opened = true;
            $(this).trigger('search.visited', node);
        },
        pop: function (queue) {
            var node = queue.dequeue();
            node.closed = true;
            $(this).trigger('search.closed', node);
            return node;
        },
        backtrace: function (node) {
            // TODO
            return [];
        }
    };

    // game board
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
                    return $(this).has('[data-role="empty"]').length > 0 && $(element).cell('role') == 'character';
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

        this.getMap = function () {
            if (null == $board) {
                return [];
            }

            var map = [];

            $board.find('tr').each(function (i, row) {
                map[i] = [];

                $(row).find('td').each(function (j, cell) {
                    map[i][j] = $(cell).find('div').eq(0);
                });
            });

            return map;
        };

        return this;
    })('.game-container');

    // user interaction
    $('[data-role="drawer"]').on('click', function () {
        var $dimRowsInput = $('#dimRows');
        var rows = parseInt($dimRowsInput.val(), 10);
        rows = rows >= 1 ? rows : 1;

        var $dimColumnsInput = $('#dimColumns');
        var columns = parseInt($dimColumnsInput.val(), 10);
        columns = columns >= 1 ? columns : 1;

        if (rows * columns < 2) {
            columns = 2;
        }

        $dimRowsInput.val(rows);
        $dimColumnsInput.val(columns);

        board.init(rows, columns);
    });

    $('[data-role="starter"]').on('click', function () {
        board.disableEditor();
        console.log(board.getMap());
    });
});
