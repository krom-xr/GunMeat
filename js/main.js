/*global PIXI, requestAnimFrame, _, utils, animation, stage, textures_static, BULLET_SPEED, textures_sequence, BULLET_DISTANCE_COEFFICIENT */
/*global BULLET_DESTROY_RADIUS, SOLDIER_SPEED */

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

        animation.once(this.sprite, textures_sequence.boom, 5, function() {
            _.each(soldierManager.getSoldiers(), function(soldier) {
                var hit = utils.dotInRadius(it.sprite.position, soldier.getCurrentCoord(), BULLET_DESTROY_RADIUS);
                if (hit) {
                    soldier.killSelf();
                    console.log('солдат убит');
                }
            });

            it.killSelf();
        }, 1);

    },
    killSelf: function() {
        stage.removeChild(this.sprite);
        animation.removeFromRender(this);
    },
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
};

Soldier.prototype = {
    killSelf: function() {
        stage.removeChild(this.sprite);
        animation.removeFromRender(this);
    },
    getCurrentCoord: function() { return {x: this.sprite.position.x, y: this.sprite.position.y}; },
    setDotLengths: function(dots) {
        _.each(dots, function(dot, i) {
            if (i === 0) { dot.current_length = 0; return; }
            var prev_dot = dots[i - 1];
            dot.current_length = prev_dot.current_length + utils.getLength(dot, prev_dot);

            if (!dot.current_length) {
                console.log(dot, prev_dot);

            }
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
        animation.loop(this.sprite, textures_sequence.soldier_run, SOLDIER_SPEED * 200);
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
    }
};

$(document).ready(function() {
    var big_gun1 = new BigGun(70, $(window).height()/2, (90).toRad());
    var big_gun2 = new BigGun($(window).width()-70, $(window).height()/2, (270).toRad());
    soldierManager.init();

});
