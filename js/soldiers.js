var Soldier = function(x, y, angle) {
    var it = this;
    it.type = 'soldier';
    var sprite = new createjs.Bitmap(textures_static.soldier());
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
        var is_near = utils.getLength({x: e.clientX, y: e.clientY}, {x: it.sprite.x, y: it.sprite.y});
        if (is_near > 50) { return false; }
        var sold = _.find(soldierManager.soldiers, function(soldier) { return soldier.pointerId === e.pointerId; });
        if (sold) { return false; }

        var trace = new createjs.Shape();
        trace.graphics.setStrokeStyle(10).beginStroke('rgba(255,0,255,1)');
        trace.graphics.moveTo(e.clientX, e.clientY);
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
            it.start_time = new Date().getTime();
            it.dots = it.optimizeDots(it.dots);
            it.setDotLengths(it.dots);

            animation.pushToRender(it);
            it.trace.alpha = 0.5;

            setTimeout(function() {
                //it.trace.graphics.clear();
            }, 2000);
        }
    });

    stage.addChild(sprite);


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
    optimizeDots: function(dots, optimized) {
        var it = this;
        if (!optimized) {
            optimized = [dots.shift()];
        }
        var last_dot = optimized[optimized.length - 1];
        while (dots.length) {
            var dot = dots.shift();
            var len = utils.getLength(dot, last_dot);
            if (len > 50) {
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
        this.sprite.image = textures_static.soldier_killed();
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
        
        if (!search_dot) { return false; }
        var search_dot_prev = dots[_.indexOf(dots, search_dot) - 1];

        var lengthdiff = possible_length  - search_dot_prev.current_length;
        var angle = utils.getAngleAndLength(search_dot, search_dot_prev).angle.toGrad();

        var xy = utils.getCoordByKxb(search_dot_prev, search_dot, lengthdiff);



        this.sprite.rotation  = - angle;
        this.sprite.x = xy.x;
        this.sprite.y = xy.y;

        this.animation_loop(this.sprite, textures_sequence.soldier_run);
    },
    renderDeath: function() { this.sprite.image = textures_static.soldier_killed(); },
    render: function() {
        this.is_dead ?  this.renderDeath() : this.renderRun();
    },
};

var soldierManager = {
    init: function() {
        var soldier1 = new Soldier(50, 50, 0);
        var soldier2 = new Soldier(150, 150, 190);
        var soldier3 = new Soldier(250, 250, 45);
        var soldier4 = new Soldier(350, 350, 20);
        var soldier5 = new Soldier(550, 350, 569);
        this.addSoldier(soldier1).addSoldier(soldier2).addSoldier(soldier3).addSoldier(soldier4).addSoldier(soldier5);

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
        utils.removeElFromArray(soldier, this.soldiers);
        setTimeout(function() {
            helper.kill(soldier);
        }, 60000);
    }
};

var stoneManager = {
    init: function() {
        var stone1 = this.newStone(textures_static.stone1(), 450, 400);
        var stone2 = this.newStone(textures_static.stone2(), 500, 900);
        var stone3 = this.newStone(textures_static.stone3(), 550, 700);
        var stone4 = this.newStone(textures_static.stone2(), 1450, 850);
        var stone5 = this.newStone(textures_static.stone1(), 1300, 400);
        var stone6 = this.newStone(textures_static.stone2(), 1250, 650);
        var stone7 = this.newStone(textures_static.stone3(), 1050, 100);
        var stone8 = this.newStone(textures_static.stone2(), 950, 300);
        var stone9 = this.newStone(textures_static.stone1(), 1000, 700);
        var stone10 = this.newStone(textures_static.stone2(), 800, 650);

        var stone11 = this.newStone(textures_static.stone1(),   600  ,200  );
        var stone12 = this.newStone(textures_static.stone2(),    750 ,50    );
        var stone13 = this.newStone(textures_static.stone3(),   750 , 450  );
        var stone14 = this.newStone(textures_static.stone2(),   1350 ,100  );
        var stone15 = this.newStone(textures_static.stone1(),   1300, 250  );
        var stone16 = this.newStone(textures_static.stone2(),   1050, 550   );
        var stone17 = this.newStone(textures_static.stone3(),   1200, 800   );
        var stone18 = this.newStone(textures_static.stone2(),   750 , 850   );
        var stone19 = this.newStone(textures_static.stone1(),   1050, 950   );
        var stone20 = this.newStone(textures_static.stone2(),  800 , 250  );

        this.stones.push(stone1);
        this.stones.push(stone2);
        this.stones.push(stone3);
        this.stones.push(stone4);
        this.stones.push(stone5);
        this.stones.push(stone6);
        this.stones.push(stone7);
        this.stones.push(stone8);
        this.stones.push(stone9);
        this.stones.push(stone10);


        this.stones.push(stone11);
        this.stones.push(stone12);
        this.stones.push(stone13);
        this.stones.push(stone14);
        this.stones.push(stone15);
        this.stones.push(stone16);
        this.stones.push(stone17);
        this.stones.push(stone18);
        this.stones.push(stone19);
        this.stones.push(stone20);
    },
    checkDotInStone: function(dot, stone) {
        var w = stone.width_by_scale - 10, h = stone.height_by_scale - 10;
        var x = stone.x - w/2, y = stone.y - h/2;
        if ( (x < dot.x && dot.x < x + w) &&
             (y < dot.y && dot.y < y + h) ) { return true; }
        return false;

    },
    getVertices: function(sprite) {
        if (sprite.versites) { return sprite.versites; }
        var x = sprite.x;
        var y = sprite.y;
        var half_w = sprite.width_by_scale/2 - 10;
        var half_h = sprite.height_by_scale/2 - 10;
        sprite.versites = [{x: x - half_w, y: y - half_h}, {x: x + half_w, y: y - half_h}, {x: x + half_w, y: y + half_h}, {x: x - half_w, y: y + half_h}];
        return sprite.versites;
    },
    getMaxMinAngleDot: function(sprite, x, y) {
        var dots = stoneManager.getVertices(sprite);
        var max_angle = -100000, min_angle = 10000, max_dot, min_dot;
        var y_max = -10000;
        _.each(dots, function(dot) { if (dot.y > y_max) { y_max = dot.y; }});
        var reverse_flag = y > y_max;

        _.each(dots, function(dot) {
            var angle = reverse_flag ? utils.getAngle(dot, {x: x, y: y}) :  angle = utils.getAngle({x: x, y: y}, dot);
            if (max_angle < angle) {
                max_angle = angle;
                max_dot = dot;
            }
            if (min_angle > angle) {
                min_angle = angle;
                min_dot = dot;
            }
        });
        return {max: max_dot, min: min_dot};
    },
    getAllSegments: function() {
        var it = this;
        if (!it.all_segments) {
            it.all_segments = [];
            _.each(stoneManager.stones, function(stone) {
                _.each(stoneManager.getSegments(stone), function(segment) {
                    it.all_segments.push(segment);
                });
            });
        }
        return it.all_segments;
    },
    getSegments: function(stone) {
        if (!stone.segments) {
            var vertices = stoneManager.getVertices(stone);
            stone.segments = [
                [vertices[0], vertices[1]],
                [vertices[1], vertices[2]],
                [vertices[2], vertices[3]],
                [vertices[3], vertices[0]],
            ];
        }
        return stone.segments;
    },
    newStone: function(img, x, y) {
        var sprite = new createjs.Bitmap(img);
        stage.addChild(sprite);
        sprite.image.after_load(function() {
            sprite.regX  = sprite.image.width * 0.5;
            sprite.regY = sprite.image.height * 0.5;
            sprite.x = x;
            sprite.y = y;
            utils.setWHForEasel(sprite, 100, 100);
        });
        return sprite;
    },
    stones: [],
};




