/*global createjs, PIXI, requestAnimFrame, _, utils, animation, stage, textures_static, BULLET_SPEED, textures_sequence, renderer, BULLET_DISTANCE_COEFFICIENT */
/*global BULLET_DESTROY_RADIUS, SOLDIER_SPEED, HEIGHT, WIDTH */

var helper = {
    killSelf: function(ob) {
        animation.removeFromRender(ob);
        ob.sprite.alpha = 0;
        setTimeout(function() {
            if (ob.sprite.mask_container) {
                ob.sprite.mask_container.removeChild(ob.sprite);
            } else {
                stage.removeChild(ob.sprite);
            }

        }, 500);
    }
};

//var setBulletMask = function(bullet, stone) {
    //if (!bullet.mask_container) {
        //var container = new PIXI.DisplayObjectContainer();
        //stage.addChild(container);
        //container.addChild(bullet);
        //var mask = new PIXI.Graphics();
        //mask.beginFill(0x0000FF, 1);
        //mask.drawRect(stone.position.x - 400, stone.position.y + 40, 1800, 800);
        //container.mask = mask;
        //bullet.mask_container = container;
    //}
//};


var Bullet = function(angle, x, y, distance) {
    //var sprite = new PIXI.Sprite(textures_static.bullet);
    var sprite = new createjs.Bitmap(textures_static.bullet());
    stage.addChild(sprite);
    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.rotation = angle;
    });
    sprite.x = x;
    sprite.y = y;
    this.sprite = sprite;
    this.distance = distance;
    this.angle = angle,
    this.x0 = x;
    this.y0 = y;
    this.start_time = new Date().getTime();
    this.animation_once = _.throttle(animation.once, 50);
};

Bullet.prototype = {
    renderFly: function() {
        var timediff = new Date().getTime() - this.start_time;
        
        this.sprite.x = this.x0 + BULLET_SPEED * timediff * Math.sin(this.angle);
        this.sprite.y = this.y0 + BULLET_SPEED * timediff * Math.cos(this.angle);
    },
    getStoneDots: function(stone) {
        var it = this;
        var far_dist = BULLET_DESTROY_RADIUS * 125;

        var stone_dots = stoneManager.getVertices(stone);

        var max_min = stoneManager.getMaxMinAngleDot(stone, it.sprite.x, it.sprite.y);
        var far_dot1 = utils.getCoordByKxb({x: it.sprite.x, y: it.sprite.y}, {x: max_min.min.x, y: max_min.min.y}, far_dist);
        var far_dot2 = utils.getCoordByKxb({x: it.sprite.x, y: it.sprite.y}, {x: max_min.max.x, y: max_min.max.y}, far_dist);

        var third_vertice;
        _.each(stone_dots, function(dot, i) {
            if (dot.x === max_min.min.x && dot.y === max_min.min.y) {
                third_vertice = stone_dots[i + 1];
                if (!third_vertice) { third_vertice = stone_dots[0]; }
            }
        });

        return [
            {x: max_min.min.x, y: max_min.min.y, start: true},
            {x: far_dot1.x, y: far_dot1.y},
            {x: far_dot2.x, y: far_dot2.y},
            {x: max_min.max.x, y: max_min.max.y},
            {x: third_vertice.x, y: third_vertice.y},
            {x: max_min.min.x, y: max_min.min.y}
        ];
    },
    getMaskDots: function(stones_arr) {
        var it = this;
        var line_dots = [];
        _.each(stones_arr, function(stone) {
            line_dots = line_dots.concat(it.getStoneDots(stone));
        });
        return line_dots;
    },
    setMask: function(mask_dots) {
        var trace = new createjs.Shape();
        trace.graphics.beginStroke('rgba(0,0,0,1)');

        _.each(mask_dots, function(dot) {
            dot.start ?
                trace.graphics.moveTo(dot.x, dot.y) :
                trace.graphics.lineTo(dot.x, dot.y);
        });
        trace.graphics
            .moveTo(0, 0)
            .lineTo(WIDTH, 0)
            .lineTo(WIDTH, HEIGHT)
            .lineTo(0, HEIGHT)
            .lineTo(0, 0);

        this.sprite.mask = trace;

    },
    hitSoldiers: function() {
        var it = this;
        return _.filter(soldierManager.getSoldiers(), function(soldier) {
            return utils.dotInRadius({x: it.sprite.x, y: it.sprite.y}, soldier.getCurrentCoord(), BULLET_DESTROY_RADIUS); });

    },
    killSoldiers: function(soldiers, mask_dots) {
        var canvas, ctx;
        _.each(soldiers, function(soldier) {
            if (soldier.is_dead) { return; }
            if (!canvas) {
                canvas = document.createElement('canvas');
                ctx = canvas.getContext('2d');
                canvas.width = WIDTH; canvas.height = HEIGHT;

                _.each(mask_dots, function(dot) {
                    dot.start ?
                        ctx.moveTo(dot.x, dot.y) :
                        ctx.lineTo(dot.x, dot.y);
                });
                ctx.fillStyle = "black"; ctx.fill();
            }

            var im_data = ctx.getImageData(soldier.sprite.x, soldier.sprite.y, 1, 1).data;
            if (!im_data[3]) {
                soldier.killSelf();
            }
        });
    },
    renderBoom: function() {
        var it = this;
        var wh = BULLET_DESTROY_RADIUS * 2;

        it.animation_once(it.sprite, textures_sequence.boom, function(data) {
            if (data.finish) {
                it.killSelf();
                return;
            }
            var mask_dots = it.getMaskDots(stoneManager.stones);
            it.setMask(mask_dots);
            it.killSoldiers(it.hitSoldiers(), mask_dots);

        }, 0);
        utils.setWHForEasel(it.sprite, wh, wh); // если подставить перед animantion_once - то происходит какой-то глюк - строб в начале взрыва

    },
    killSelf: function() { helper.killSelf(this); },
    isDistancePassed: function() {

        var xlen = Math.abs(this.sprite.x - this.x0);
        var ylen = Math.abs(this.sprite.y - this.y0);
        console.log(this.sprite.x, this.x0);
        //console.log(xlen, ylen);
        //console.log('dist', this.distance);
        return (xlen * xlen + ylen * ylen) >= this.distance * this.distance;
    },
    setBulletMask: function(bullet, stone) {
        if (!bullet.mask_container) {
            var container = new PIXI.DisplayObjectContainer();
            stage.addChild(container);
            container.addChild(bullet);
            var mask = new PIXI.Graphics();
            mask.beginFill(0x0000FF, 1);
            mask.drawRect(stone.position.x - 400, stone.position.y + 40, 1800, 800);
            container.mask = mask;
            bullet.mask_container = container;
        }
    },
    render: function() {
        if (this.isDistancePassed()) {
            this.renderBoom();
        } else {
            this.renderFly();
        }
    },
};


var BigGun = function(x, y, angle) {
    var it = this;
    this.x = x; this.y = y;

    var sprite = new createjs.Bitmap(textures_static.big_gun());
    stage.addChild(sprite);
    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.x = x;
        sprite.y = y;
        sprite.rotation = angle;
    });

    //TODO тут надо сделать так чтобы нельзя было выбрать двух солдатиков одновременно
    document.addEventListener('PointerDown', function(e) {
        var is_near = utils.getLength({x: e.clientX, y: e.clientY}, {x: x, y: y});
        if (is_near < 50) { it.pointerId = e.pointerId; }
    });
    document.addEventListener('PointerMove', function(e) {
        if (!it.pointerId || it.pointerId !== e.pointerId) { return false; }

        var angle_length = utils.getAngleAndLength({x: e.clientX, y: e.clientY}, {x: x, y: y});
        sprite.rotation = - angle_length.angle.toGrad();
    }, false);

    document.addEventListener('PointerUp', function(e) {
        if (it.pointerId === e.pointerId) {
            it.pointerId = false;

            var angle_length = utils.getAngleAndLength({x: x, y: y}, {x: e.clientX, y: e.clientY});
            it.shot(angle_length.angle, angle_length.length);
        }
    });
    return this;
};

BigGun.prototype = {
    shot: function(angle, distance) {
        var bullet = new Bullet(angle, this.x, this.y, distance * BULLET_DISTANCE_COEFFICIENT);
        animation.pushToRender(bullet);
    }
};


var Soldier = function(x, y, angle) {
    var it = this;
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



    //trace = new createjs.Shape();
    //trace.graphics.beginStroke('rgba(10,10,10,1)');
    //stage.addChild(trace);

    document.addEventListener('PointerDown', function(e) {
        e.stopPropagation(); e.preventDefault();
        var is_near = utils.getLength({x: e.clientX, y: e.clientY}, {x: it.sprite.x, y: it.sprite.y});
        if (is_near < 50) {
            console.log('test');
            console.log(e.pointerId);

            //trace.graphics.moveTo(e.clientX, e.clientY);

            it.pointerId = e.pointerId;
            it.dots = [];
        }
    });
    document.addEventListener('PointerMove', function(e) {
        if (!it.pointerId || it.pointerId !== e.pointerId) { return false; }
        var x = e.clientX, y = e.clientY;

            console.log('move');
        
        //trace.graphics.lineTo(x, y);

        it.dots.push({x: x, y: y});
    }, false);
    document.addEventListener('PointerUp', function(e) {
        if (it.pointerId === e.pointerId) {
            it.pointerId = false;
            it.start_time = new Date().getTime();
            it.setDotLengths(it.dots);
            animation.pushToRender(it);
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
    killSelf: function() {
        this.is_dead = true;
        soldierManager.killSoldier(this);
        helper.killSelf(this);
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
    render: function() {
        this.renderRun();
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
    }
};

var stoneManager = {
    init: function() {
        var stone1 = this.newStone(textures_static.stone1(), 300, 300);
        var stone2 = this.newStone(textures_static.stone2(), 500, 300);
        var stone3 = this.newStone(textures_static.stone3(), 400, 200);
        var stone4 = this.newStone(textures_static.stone2(), 400, 400);

        this.stones.push(stone1);
        this.stones.push(stone2);
        this.stones.push(stone3);
        this.stones.push(stone4);

    },
    getVertices: function(sprite) {
        var x = sprite.x;
        var y = sprite.y;
        var half_w = sprite.width_by_scale/2 - 10;
        var half_h = sprite.height_by_scale/2 - 10;
        return [{x: x - half_w, y: y - half_h}, {x: x + half_w, y: y - half_h}, {x: x + half_w, y: y + half_h}, {x: x - half_w, y: y + half_h}];
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




$(document).ready(function() {

    var big_gun1 = new BigGun(70, HEIGHT/2, 90);
    var big_gun2 = new BigGun(WIDTH - 70, HEIGHT/2, 270);
    soldierManager.init();
    stoneManager.init();


});


$(document).on('contextmenu', function(e) {
    e.preventDefault(); e.stopPropagation();
});


