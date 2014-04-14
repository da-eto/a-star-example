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

    var SearchNode = function (row, col, parent, g, h) {
        this.row = row;
        this.col = col;
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

    var SearchMap = function () {
        this.grid = [];
        this.start = null;
        this.end = null;
    };

    SearchMap.prototype = {
        neighbors: function (node) {
            var result = [];
            var r = node.row;
            var c = node.col;

            if (this.grid[r - 1] && this.grid[r - 1][c]) {
                result.push(this.grid[r - 1][c]);
            }

            if (this.grid[r] && this.grid[r][c + 1]) {
                result.push(this.grid[r][c + 1]);
            }

            if (this.grid[r + 1] && this.grid[r + 1][c]) {
                result.push(this.grid[r + 1][c]);
            }

            if (this.grid[r] && this.grid[r][c - 1]) {
                result.push(this.grid[r][c - 1]);
            }

            return result;
        },
        distance: function (from, to) {
            return Math.abs(to.row - from.row) + Math.abs(to.col - from.col);
        },
        add: function (r, c) {
            if (!this.grid[r]) {
                this.grid[r] = [];
            }

            this.grid[r][c] = new SearchNode(r, c, null, 0, 0);
        },
        setStart: function (r, c) {
            this.add(r, c);
            this.start = this.grid[r][c];
        },
        setEnd: function (r, c) {
            this.add(r, c);
            this.end = this.grid[r][c];
        }
    };

    var SearchSimulator = function (map, heuristic, delay, options) {
        this.map = map;
        this.heuristic = heuristic;
        this.options = options;
        this.delay = delay;
    };

    SearchSimulator.prototype = {
        search: function () {
            var queue = new PriorityQueue(function (node) {
                return node.f();
            });
            this.add(queue, this.map.start);
            var solver = this;

            var loop = function () {
                setTimeout(function () {
                    var node = solver.minimal(queue);

                    if (node === solver.map.end) {
                        solver.options.onEnd(solver.backtrace(solver.map.end));
                    } else {
                        var neighbors = solver.map.neighbors(node);

                        for (var i = 0; i < neighbors.length; i++) {
                            var neighbor = neighbors[i];

                            if (neighbor.closed) {
                                continue;
                            }

                            var distance = node.g + solver.map.distance(node, neighbor);

                            if (!neighbor.opened || distance < neighbor.g) {
                                neighbor.g = distance;
                                neighbor.h = neighbor.h || solver.heuristic(neighbor, solver.map.end);
                                neighbor.parent = node;

                                if (!neighbor.opened) {
                                    solver.add(queue, neighbor);
                                } else {
                                    solver.adjust(queue, neighbor);
                                }
                            }
                        }

                        if (!queue.isEmpty()) {
                            loop();
                        } else {
                            solver.options.onEnd([]);
                        }
                    }
                }, solver.delay);
            };

            loop();
        },
        adjust: function (queue, node) {
            queue.lift(queue.storage.indexOf(node));

            if (this.options.onAdjust) {
                this.options.onAdjust(node);
            }
        },
        add: function (queue, node) {
            queue.enqueue(node);
            node.opened = true;

            if (this.options.onEnqueue) {
                this.options.onEnqueue(node);
            }
        },
        minimal: function (queue) {
            var node = queue.dequeue();
            node.closed = true;

            if (this.options.onDequeue) {
                this.options.onDequeue(node);
            }

            return node;
        },
        backtrace: function (node) {
            var current = node;
            var result = [];

            while (current) {
                result.unshift(current);
                current = current.parent;
            }

            return result;
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
                $(this).attr('data-role', 'barrier').removeClass().addClass('tree').html('');
            },
            remove: function () {
                $(this).attr('data-role', 'empty').removeClass().html('');
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

            if ($characters.eq(0).is('.ui-draggable-disabled')) {
                $characters.draggable('enable');
            } else {
                $characters.draggable({
                    containment: $board,
                    zIndex: 100,
                    revert: 'invalid',
                    revertDuration: positioningDuration
                });
            }

            if ($cells.eq(0).is('.ui-droppable-disabled')) {
                $cells.droppable('enable');
            } else {
                $cells.droppable({
                    accept: function (element) {
                        return $(this).has('[data-role="empty"]').length > 0 && $(element).attr('data-role') == 'character';
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
            }

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

        this.createMap = function () {
            if (null == $board) {
                return [];
            }

            var map = new SearchMap();

            $board.find('tr').each(function (row, tr) {
                $(tr).find('td').each(function (col, td) {
                    var $cell = $(td).find('div').eq(0);
                    var role = $cell.attr('data-role');

                    if ('character' == role) {
                        if ($cell.hasClass('rabbit')) {
                            map.setStart(row, col);
                        } else {
                            map.setEnd(row, col);
                        }
                    } else if ('empty' == role) {
                        map.add(row, col);
                    }
                });
            });

            return map;
        };

        var getCell = function (row, col) {
            return $board.find('tr:eq(' + row + ')>td:eq(' + col + ')>div');
        };

        this.scoreCell = function (row, col, closed, score) {
            var $cell = getCell(row, col);

            if ($cell.length) {
                var cls = closed ? 'closed' : 'opened';
                $cell.removeClass('closed opened').addClass(cls).addClass('circle');
                var $points = $('<div class="points"></div>');
                $points.html(score);
                $cell.html('').append($points);
            }
        };

        this.markDirection = function (row, col, dir) {
            var $cell = getCell(row, col);

            if ($cell.length) {
                $cell.removeClass('from-top from-right from-bottom from-left').addClass(dir);
            }
        };

        this.markFound = function (row, col) {
            var $cell = getCell(row, col);

            if ($cell.length) {
                $cell.addClass('found');
            }
        };

        this.clearScores = function () {
            $board.find('[data-role="empty"]').removeClass().html('');
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
        board.clearScores();

        var map = board.createMap();
        var manhattan = function (from, to) {
            return Math.abs(to.row - from.row) + Math.abs(to.col - from.col);
        };
        var score = function (node) {
            if (node != map.start && node != map.end) {
                board.scoreCell(node.row, node.col, node.closed, node.f());
            }
        };

        var mark = function (node) {
            if (node.parent) {
                var pr = node.parent.row;
                var pc = node.parent.col;
                var dir = '';

                if (pr == node.row - 1 && pc == node.col) {
                    dir = 'from-top';
                } else if (pr == node.row && pc == node.col + 1) {
                    dir = 'from-right';
                } else if (pr == node.row + 1 && pc == node.col) {
                    dir = 'from-bottom';
                } else if (pr == node.row && pc == node.col - 1) {
                    dir = 'from-left';
                }

                board.markDirection(node.row, node.col, dir);
            }
        };

        var simulator = new SearchSimulator(map, manhattan, 100, {
            onEnqueue: function (node) {
                score(node);
                mark(node);
            },
            onDequeue: score,
            onAdjust: function (node) {
                score(node);
                mark(node);
            },
            onEnd: function (result) {
                for (var i = 0; i < result.length; i++) {
                    var node = result[i];

                    if (node !== map.start && node !== map.end) {
                        board.markFound(node.row, node.col);
                    }
                }

                board.enableEditor();
            }
        });

        simulator.search();
    });
});
