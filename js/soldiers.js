/*global createjs, PIXI, requestAnimFrame, _, utils, animation, stage, textures_static, BULLET_SPEED, textures_sequence, renderer, BULLET_DISTANCE_COEFFICIENT, container */
/*global BULLET_DESTROY_RADIUS, SOLDIER_SPEED, HEIGHT, WIDTH, helper, stoneManager, sounds  */
var Soldier = function(x, y, angle, player, trace_color) {
    var it = this;
    it.type = 'soldier';
    it.unbrekable = true;
    it.player = player;

    it.soldier_run = it.player === 'player1' ? textures_sequence.soldier_run1 : textures_sequence.soldier_run2;

    var sprite = new createjs.Bitmap(textures_static.soldier(player));
    stage.addChild(sprite);
    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.x = x;
        sprite.y = y;
        sprite.rotation = angle;
    });

    var draw = false;

    var checkStoneIntersect = _.throttle(it.checkStoneIntersect, 100);
    //var checkStoneIntersect = it.checkStoneIntersect;
    document.addEventListener('PointerDown', function(e) {
        e.stopPropagation(); e.preventDefault();
        if (it.is_run) { return false; }
        var is_near = utils.getLength({x: e.clientX, y: e.clientY}, {x: it.sprite.x, y: it.sprite.y});
        if (is_near > 50) { return false; }
        var sold = _.find(soldierManager.soldiers, function(soldier) { return soldier.pointerId === e.pointerId; });
        if (sold) { return false; }

        var trace = new createjs.Shape();
        trace.graphics.setStrokeStyle(10).beginStroke(trace_color);
        trace.graphics.moveTo(e.clientX, e.clientY);
        trace.alpha = 0.8;
        container.addChild(trace);
        it.trace = trace;
        it.pointerId = e.pointerId;
        it.dots = [];
    });
    document.addEventListener('PointerMove', function(e) {
        if (!it.pointerId || it.pointerId !== e.pointerId) { return false; }
        var x = e.clientX, y = e.clientY;
        var dot = {x: x, y: y};
        it.dots.push(dot);
        it.trace.graphics.lineTo(x, y);

        //console.time('one');
        checkStoneIntersect(it.dots, stoneManager.stones, function(intersect) {
            if (!intersect) { return; }
            it.pointerId = false;
            it.trace.graphics.clear();

        });
        //console.timeEnd('one');
    }, false);
    document.addEventListener('PointerUp', function(e) {
        if (it.pointerId === e.pointerId) {
            it.pointerId = false;
            it.dots = it.optimizeDots(it.dots);
            it.setDotLengths(it.dots);

            it.run();
            //animation.pushToRender(it);
            //it.trace.alpha = 0.5;
        }
    });

    stage.addChild(sprite);

    this.run_sound = sounds.run();

    this.angle = angle;
    this.sprite = sprite;
    this.dots = [];
    this.x0 = x;
    this.y0 = y;

    this.sprite.width = 100;
    this.sprite.height = 100;
    this.animation_loop = _.throttle(animation.loop, 10/SOLDIER_SPEED);
};

Soldier.prototype = {
    run: function() {
        var it = this;
        it.unbrekable = false;
        it.is_run = true;
        it.start_time = new Date().getTime();
        it.trace.alpha = 0.5;
        animation.pushToRender(it);
        this.run_sound.play();
    },
    stop: function() {
        var it = this;
        it.unbrekable = true;
        it.is_run = false;
        it.sprite.image = textures_static.soldier_unbrekable();

        setTimeout(function() {
            animation.removeFromRender(it);
        }, 500);

        this.run_sound.pause();
    },
    optimizeDots: function(dots, optimized) {
        var it = this;
        if (!optimized) {
            optimized = [dots.shift()];
        }
        var last_dot = optimized[optimized.length - 1];
        while (dots.length) {
            var dot = dots.shift();
            var len = utils.getLength(dot, last_dot);
            if (dots.length === 0) {
                optimized.push(dot);
                return optimized;
            } else if (len > 50) {
                optimized.push(dot);
                return it.optimizeDots(dots, optimized);
            }
        }
        return optimized;
    },
    checkStoneIntersect: function(dots, stones, callback) {
        var it = this;
        _.each(dots, function(dot, i) {
            if (!i) { return; }
            if (dot.intersect_checked) {  return; }
            var prev_dot = dots[i - 1];
            if (dot.x === prev_dot.x && dot.y === prev_dot.y) { return; }

            //var intersect = utils.dotShape(stoneManager.getVertices(stone), dot);
            
            _.each(stoneManager.stones, function(stone) {
                _.each(stoneManager.getSegments(stone), function(segment) {
                    var intersect = utils.segmentIntersetion(segment[0], segment[1], dot, prev_dot);
                    intersect && callback(true);
                });
                var intersect = stoneManager.checkDotInStone(dot, stone);
                intersect && callback(true);

            });

            //_.each(stoneManager.getAllSegments(), function(segment) {
                //var intersect = utils.segmentIntersetion(segment[0], segment[1], dot, prev_dot);
                //intersect && callback(true);
            //});
            prev_dot.intersect_checked = true;
        });
        
    },
    killSelf: function() {
        var it = this;
        this.is_dead = true;
        this.sprite.image = textures_static.soldier_killed(this.player);
        this.run_sound.pause();
        sounds.dead();
        soldierManager.killSoldier(this);

    },
    getCurrentCoord: function() { return {x: this.sprite.x, y: this.sprite.y}; },
    setDotLengths: function(dots) {
        _.each(dots, function(dot, i) {
            if (i === 0) { dot.current_length = 0; return; }
            var prev_dot = dots[i - 1];
            dot.current_length = prev_dot.current_length + utils.getLength(dot, prev_dot);
        });

    },
    renderRun: function() {
        var it = this;
        var dots = it.dots;


        var timediff = new Date().getTime() - this.start_time;
        var possible_x = this.x0 + SOLDIER_SPEED * timediff;
        var possible_y = this.y0 + SOLDIER_SPEED * timediff;
        var possible_length = utils.getLength({x: this.x0, y: this.y0}, {x: possible_x, y: possible_y});

        var search_dot = _.find(dots, function(dot) { return dot.current_length > possible_length; });
        
        if (!search_dot) {
            it.stop();
            return false;
        }
        var search_dot_prev = dots[_.indexOf(dots, search_dot) - 1];

        var lengthdiff = possible_length  - search_dot_prev.current_length;
        var angle = utils.getAngleAndLength(search_dot, search_dot_prev).angle.toGrad();

        var xy = utils.getCoordByKxb(search_dot_prev, search_dot, lengthdiff);



        this.sprite.rotation  = - angle;
        this.sprite.x = xy.x;
        this.sprite.y = xy.y;

        if (this.isFlagIntersect()) {
            alert(this.player + " win!!!");
        }


        this.animation_loop(this.sprite, this.soldier_run );
    },
    isFlagIntersect: function() {
        var len = utils.getLength({x: this.sprite.x, y: this.sprite.y}, {x: WIDTH/2, y: HEIGHT/2});
        return len < 20;

    },
    renderDeath: function() { this.sprite.image = textures_static.soldier_killed(); },
    renderStop: function() { this.sprite.image = textures_static.soldier_unbrekable(); },
    render: function() {
        if (this.is_dead) {
            this.renderDeath();
        } else if (this.is_run) {
            this.renderRun();
        } else {
            this.renderStop();
        }
    },
};

var soldierManager = {
    init: function() {
        var left = 50;
        var right = WIDTH - 50;

        var trace_color1 = 'rgba(255,255,100,1)';
        var trace_color2 = 'rgb(100, 255, 100)';
        var soldier1 = new Soldier(left, HEIGHT - 50,  90, 'player1', trace_color1);
        var soldier2 = new Soldier(left, HEIGHT - 150, 90, 'player1', trace_color1);
        var soldier3 = new Soldier(left, HEIGHT - 250, 90, 'player1', trace_color1);
        var soldier4 = new Soldier(left, HEIGHT - 350, 90, 'player1', trace_color1);
        var soldier5 = new Soldier(left, HEIGHT - 450, 90, 'player1', trace_color1);
        this.addSoldier(soldier1).addSoldier(soldier2).addSoldier(soldier3).addSoldier(soldier4).addSoldier(soldier5);

        var soldier6 = new Soldier(right,  150, 270, 'player2', trace_color2);
        var soldier7 = new Soldier(right,  250, 270, 'player2', trace_color2);
        var soldier8 = new Soldier(right,  50,  270, 'player2', trace_color2);
        var soldier9 = new Soldier(right,  350, 270, 'player2', trace_color2);
        var soldier10 = new Soldier(right, 450, 270, 'player2', trace_color2);
        this.addSoldier(soldier6).addSoldier(soldier7).addSoldier(soldier8).addSoldier(soldier9).addSoldier(soldier10);

    },
    soldiers: [],
    addSoldier: function(soldier) {
        this.soldiers.push(soldier);
        return this;
    },
    getSoldiers: function() {
        return this.soldiers;
    },
    killSoldier: function(soldier) {
        var it = this;
        utils.removeElFromArray(soldier, this.soldiers);
        setTimeout(function() {
            helper.kill(soldier);
        }, 60000);

        setTimeout(function() {
            it.respawn(soldier.player);
        }, 10000);
    },
    respawn: function(player) {
        var x = 50, y = 50, angle = 90;
        if (player === 'player2') {
            x = WIDTH - x; y = HEIGHT - y, angle = 270;
        }
        this.addSoldier(new Soldier(x, y, angle, player));
    }
};
