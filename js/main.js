/*global PIXI, requestAnimFrame, _, utils, animation, stage, textures_static, BULLET_SPEED, textures_sequence, renderer, BULLET_DISTANCE_COEFFICIENT */
/*global BULLET_DESTROY_RADIUS, SOLDIER_SPEED */

var helper = {
    killSelf: function(ob) {
        animation.removeFromRender(ob);
        setTimeout(function() { stage.removeChild(ob.sprite); }, 500);
    }
};

var Bullet = function(angle, x, y, distance) {
    var sprite = new PIXI.Sprite(textures_static.bullet);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = x;
    sprite.position.y = y;
    this.sprite = sprite;
    this.position = this.sprite.position;
    stage.addChild(sprite);

    this.distance = distance;
    this.angle = angle,
    //this.power = power,
    this.x0 = x;
    this.y0 = y;
    this.start_time = new Date().getTime();
    this.animation_once = _.throttle(animation.once, 30);
};

Bullet.prototype = {
    renderFly: function() {
        var timediff = new Date().getTime() - this.start_time;
        
        if (this.isHalfDistancePassed()) {
            this.sprite.scale.x -= 1/this.distance;
            this.sprite.scale.y -= 1/this.distance;
        } else {
            this.sprite.scale.x += 1/this.distance;
            this.sprite.scale.y += 1/this.distance;
        }

        this.sprite.position.x = this.x0 + BULLET_SPEED * timediff * Math.sin(this.angle);
        this.sprite.position.y = this.y0 + BULLET_SPEED * timediff * Math.cos(this.angle);
    },
    renderBoom: function() {
        var it = this;
        this.sprite.width = BULLET_DESTROY_RADIUS * 2;
        this.sprite.height = BULLET_DESTROY_RADIUS * 2;

        it.animation_once(this.sprite, textures_sequence.boom, function() {
            var hit_soldiers = [];
            _.each(_.clone(soldierManager.getSoldiers()), function(soldier) {
                var hit = utils.dotInRadius(it.sprite.position, soldier.getCurrentCoord(), BULLET_DESTROY_RADIUS);
                hit && hit_soldiers.push(soldier);
            });
            var hit_stones = [];
            _.each(stoneManager.stones, function(stone) {
                var hit = utils.dotInRadius(it.sprite.position, stone.position, BULLET_DESTROY_RADIUS);
                hit && hit_stones.push(stone);
            });
            console.log(hit_soldiers);
            console.log(hit_stones);



            _.each(hit_stones, function(stone) {
                var rect1 = {x: stone.position.x - stone.width/2, y: 0, w: stone.width, h: renderer.height};
                var rect2 = {x: 0, y: stone.position.y - stone.height/2, w: renderer.width, h: stone.height};
                console.log(utils.dotInRect(rect1, it.sprite.position));
                console.log(utils.dotInRect(rect2, it.sprite.position));


            });


            it.killSelf();
        }, 1);

    },
    killSelf: function() { helper.killSelf(this); },
    isDistancePassed: function() {
        var xlen = Math.abs(this.sprite.position.x - this.x0);
        var ylen = Math.abs(this.sprite.position.y - this.y0);
        return (xlen * xlen + ylen * ylen) >= this.distance * this.distance;
    },
    isHalfDistancePassed: function () {
        //TODO тут неправильная математика
        return this.sprite.position.x > this.distance/2 || this.sprite.position.y > this.distance/2;
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
    var sprite = new PIXI.Sprite(textures_static.big_gun);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = x;
    sprite.position.y = y;

    sprite.rotation = angle;

    stage.addChild(sprite);


    sprite.setInteractive(true);

    var drag = false;
    var start_coord = { x: sprite.position.x, y: sprite.position.y };
    var stop_coord;
    sprite.mousedown = function(data) {
        drag = true;
    };
    sprite.mousemove = function(data) {
        if (!drag) { return false; }
        var angle_length = utils.getAngleAndLength(data.global, start_coord);
        sprite.rotation = - angle_length.angle;
    };

    sprite.mouseupoutside = function(data){
        if (!drag) { return; }
        stop_coord = data.global.clone();
        var angle_length = utils.getAngleAndLength(start_coord, stop_coord);
        it.shot(angle_length.angle, angle_length.length);
        drag = false;
    };

    this.x = x; this.y = y;
    this.sprite = sprite;
};

BigGun.prototype = {
    shot: function(angle, distance) {
        var bullet = new Bullet(angle, this.x, this.y, distance * BULLET_DISTANCE_COEFFICIENT);
        animation.pushToRender(bullet);
    }
};


var Soldier = function(x, y, angle) {
    var it = this;
    var sprite = new PIXI.Sprite(textures_static.soldier);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = x;
    sprite.position.y = y;

    sprite.rotation = angle.toRad();

    sprite.setInteractive(true);

    var draw = false;
    sprite.mousedown = function(data) {
        it.dots = [];
        draw = true;
    };
    sprite.mousemove = function(data) {
        if (!draw) { return false; }
        it.dots.push(data.global.clone());
    };
    sprite.mouseupoutside = function(data) {
        it.start_time = new Date().getTime();
        draw = false;
        it.setDotLengths(it.dots);
        animation.pushToRender(it);
    };

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
        soldierManager.killSoldier(this);
        helper.killSelf(this);
    },
    getCurrentCoord: function() { return {x: this.sprite.position.x, y: this.sprite.position.y}; },
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
        var angle = utils.getAngleAndLength(search_dot, search_dot_prev).angle;

        var xy = utils.getCoordByKxb(search_dot_prev, search_dot, lengthdiff);



        this.sprite.rotation  = - angle;
        this.sprite.position.x = xy.x;
        this.sprite.position.y = xy.y;

        this.sprite.width = 100;
        this.sprite.height = 100;
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
        var stone1 = this.getRandomStoneSprite();
        stone1.position.x = 650;
        stone1.position.y = 350;
        stone1.anchor.x = 0.5;
        stone1.anchor.y = 0.5;

        var stone2 = this.getRandomStoneSprite();
        stone2.position.x = 850;
        stone2.position.y = 350;
        stone2.anchor.x = 0.5;
        stone2.anchor.y = 0.5;

        stone1.width = 100;
        stone1.height =100;
        stone2.width = 100;
        stone2.height = 100;
        stage.addChild(stone1);
        stage.addChild(stone2);

        this.stones.push(stone1);
        this.stones.push(stone2);
    },
    stones: [],
    getRandomStoneSprite: function() {
        //var texture = _.sample(this.stone_textures);
        var texture = textures_static.stone1;
        var sprite = new PIXI.Sprite(texture);
        return sprite;
    },
};

var stone_array = [
    [1, 0, 0],
    [1, 0, 1],
    [0, 1, 0],
    [0, 0, 0],
    [1, 0, 1],
];


var randomStoneGrid = function() {
    //var horiz_size = _.range(_.random(2, 7));
    //var vert_size = _.range(_.random(2, 7));
    var vert_size = _.range(20);
    var horiz_size = _.range(10);

    var container = [];
    _.each(horiz_size, function() {
        var arr = [];
        _.each(vert_size, function() {
            arr.push(_.sample([0, 0, 0, 0, 0, 0, 0, 0, 1]));
        });
        container.push(arr);
    });
    return [[1]];
    //return container;
};


var Stones = function(stone_array, size, xy) {
    var it = this;
    var width = stone_array[0].length;
    var height = stone_array.height;
    var container = new PIXI.DisplayObjectContainer();

    //container.anchor.x = 0.5;
    //container.anchor.y = 0.5;

    container.position.x = xy.x;
    container.position.y = xy.y;

    stage.addChild(container);
    this.container = container;

    _.each(stone_array, function(subarray, i) {
        it.setVerticalStones(subarray, i, size);
    });
};
Stones.prototype = {
    stone_rotations: [
        (0).toRad(),
        (45).toRad(),
        (90).toRad(),
        (180).toRad(),
        (270).toRad()
    ],
    stones: [],
    stone_textures: [textures_static.stone1, textures_static.stone2, textures_static.stone3],
    setVerticalStones: function(stones_arr, pos, stone_size) {
        var it = this;
        //var stone_oversize = 0.7 * stone_size;
        var stone_oversize = 0;
        _.each(stones_arr, function(ob, i) {
            if (ob) {
                var sprite = it.getRandomStoneSprite();


                sprite.anchor.x = 0.5;
                sprite.anchor.y = 0.5;
                sprite.position.x = i * stone_size;
                sprite.position.y = pos * stone_size;
                //sprite.rotation = _.sample(it.stone_rotations);
                sprite.rotation = _.sample(_.random(0, 360).toRad());


                sprite.width = stone_size + stone_oversize;
                sprite.height = stone_size + stone_oversize;

                //sprite.scale.x = _.sample([1, -1]) * _.sample([0.2, 0.3, 0.4]);
                //sprite.scale.y = _.sample([1, -1]) * _.sample([0.2, 0.3, 0.4]);;

                sprite.interactive = true;
                sprite.dragging = true;

                it.container.addChild(sprite);

                sprite.dragging = false;
                sprite.mousedown = sprite.touchstart = function(data)
                {
                    // stop the default event...
                    data.originalEvent.preventDefault();
                    
                    // store a refference to the data
                    // The reason for this is because of multitouch
                    // we want to track the movement of this particular touch
                    this.data = data;
                    this.alpha = 0.9;
                    this.dragging = true;
                };


                sprite.mouseup = sprite.mouseupoutside = sprite.touchend = sprite.touchendoutside = function(data)
                {
                    this.alpha = 1;
                    this.dragging = false;
                    // set the interaction data to null
                    this.data = null;
                };
                
                // set the callbacks for when the mouse or a touch moves
                sprite.mousemove = sprite.touchmove = function(data)
                {
                    if(this.dragging)
                    {
                        // need to get parent coords..
                        var newPosition = this.data.getLocalPosition(this.parent);
                        this.position.x = newPosition.x;
                        this.position.y = newPosition.y;
                    }
                };
            }

        });
    },
    getRandomStoneSprite: function() {
        //var texture = _.sample(this.stone_textures);
        var texture = this.stone_textures[0];
        var sprite = new PIXI.Sprite(texture);
        return sprite;
    },
};


$(document).ready(function() {
    var big_gun1 = new BigGun(70, $(window).height()/2, (90).toRad());
    var big_gun2 = new BigGun($(window).width()-70, $(window).height()/2, (270).toRad());
    soldierManager.init();
    stoneManager.init();

    //var stone = new Stones(randomStoneGrid(), 90, {x: 610, y: 350});
    //new Stones(randomStoneGrid(), 90, {x: 300, y: 500});
    //stone = new Stones(randomStoneGrid(), 90, {x: 600, y: 800});
    //stone = new Stones(randomStoneGrid(), 90, {x: 1600, y: 500});

});
