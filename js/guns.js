/*global createjs, PIXI, requestAnimFrame, _, utils, animation, stage, textures_static, BULLET_SPEED, textures_sequence, renderer, BULLET_DISTANCE_COEFFICIENT, container */
/*global BULLET_DESTROY_RADIUS, SOLDIER_SPEED, HEIGHT, WIDTH, soldierManager, stoneManager, Bullet, sounds*/
var BigGun = function(x, y, angle, sight_color) {
    var it = this;
    this.x = x; this.y = y;

    it.sight_color = sight_color;

    var sprite = new createjs.Bitmap(textures_static.big_gun());
    stage.addChild(sprite);
    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.x = x;
        sprite.y = y;
        sprite.rotation = angle;
    });
    this.sprite = sprite;

    it.sight = new createjs.Shape();
    it.sight.alpha = 0.8;
    container.addChild(it.sight);

    var gun_rotate = sounds.gun_rotate();
    //Пушка
    document.addEventListener('PointerDown', function(e) {
        var is_near = utils.getLength({x: e.clientX, y: e.clientY}, {x: it.sprite.x, y: it.sprite.y});
        if (is_near < 100) {
            it.pointerId = e.pointerId;
            sprite.image = textures_static.big_gun_active();
        }

    });
    document.addEventListener('PointerMove', function(e) {
        if (!it.pointerId || it.pointerId !== e.pointerId) { return false; }
        gun_rotate.play();
        var angle_length = utils.getAngleAndLength({x: it.sprite.x, y: it.sprite.y}, {x: e.clientX, y: e.clientY});
        sprite.rotation = - angle_length.angle.toGrad();
        it.drawSight(it.sprite.x, it.sprite.y, angle_length);
        it.angle_length = angle_length;
    }, false);

    document.addEventListener('PointerUp', function(e) {
        if (it.pointerId === e.pointerId) {
            it.pointerId = false;

            var angle_length = utils.getAngleAndLength({x: it.sprite.x, y: it.sprite.y}, {x: e.clientX, y: e.clientY});
            var xy = it.getIntersectedXY(it.sprite.x, it.sprite.y, angle_length);

            angle_length = utils.getAngleAndLength({x: it.sprite.x, y: it.sprite.y}, {x: xy.x, y: xy.y});

            gun_rotate.pause();
            sounds.gunShot();
            it.shot(angle_length.angle, angle_length.length - 3);
            sprite.image = textures_static.big_gun();
        }
    });
    it.shot_animation = _.throttle(animation.once, 10);
    return this;
};

BigGun.prototype = {
    moveGun: function() {
        var it = this;
        it.angle_length && it.drawSight(it.sprite.x, it.sprite.y, it.angle_length);



    },
    getIntersectedXY: function(x0, y0, angle_length) {
        var x = x0 - angle_length.length * BULLET_DISTANCE_COEFFICIENT * Math.sin(angle_length.angle);
        var y = y0 - angle_length.length * BULLET_DISTANCE_COEFFICIENT * Math.cos(angle_length.angle);

        _.each(stoneManager.stones, function(stone) {
            _.each(stoneManager.getSegments(stone), function(segment) {
                var intersect = utils.intersection(segment[0], segment[1], {x: x0, y: y0}, {x: x, y: y});
                if (intersect) {
                    x = intersect.x; y = intersect.y;
                }
            });
        });
        return {x: x, y: y};
    },
    drawSight: function(x0, y0, angle_length) {
        var it = this;
        var xy = it.getIntersectedXY(x0, y0, angle_length);
        var x = xy.x, y = xy.y;

        it.sight.graphics.clear();
        it.sight.graphics.setStrokeStyle(1).beginStroke(it.sight_color);
        it.sight.graphics.moveTo(x0 - 20 * Math.sin(angle_length.angle - 90), y0 - 20 * Math.cos(angle_length.angle - 90));
        it.sight.graphics.lineTo(x, y);
    },
    shot: function(angle, distance) {
        var bullet = new Bullet(angle, this.sprite.x, this.sprite.y, distance);
        animation.pushToRender(bullet);
        animation.pushToRender(this);
    },
    render: function() {
        var it = this;
        it.shot_animation(this.sprite, textures_sequence.shot, function(data) {
            if (data.finish) {
                animation.removeFromRender(it);
                it.sprite.image = textures_static.big_gun();
            }
            //console.log(data.finish);
        });
    }
};

var Slider = function(x, y, gun) {
    var it = this;
    var sprite = new createjs.Bitmap(textures_static.slider());
    stage.addChild(sprite);

    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.x = x;
        sprite.y = y;
        sprite.alpha = 0.8;
    });

    var squeak_play;

    document.addEventListener('PointerDown', function(e) {
        e.stopPropagation(); e.preventDefault();
        var is_near = utils.getLength({x: e.clientX, y: e.clientY}, {x: x, y: y});
        if (is_near < 100) {
            it.pointerId = e.pointerId;
            it.start_pos = {x: e.clientX, y: e.clientY};
            sprite.alpha = 0.5;
        }

    });
    document.addEventListener('PointerMove', function(e) {
        e.stopPropagation(); e.preventDefault();
        if (!it.pointerId || it.pointerId !== e.pointerId) { return false; }

        if (!squeak_play) {
            sounds.squeak();
            squeak_play = true;
        }

        var length = utils.getLength({x: e.clientX, y: e.clientY}, it.start_pos)/300;
        if (e.clientY < it.start_pos.y) { length = -length; }
        var y = gun.sprite.y + length;
        if (y > HEIGHT - 180 || y < 180) { return false; }
        gun.sprite.y = y;
        gun.moveGun();
    }, false);

    document.addEventListener('PointerUp', function(e) {
        e.stopPropagation(); e.preventDefault();
        if (it.pointerId === e.pointerId) {
            it.pointerId = false;

            sprite.alpha = 0.8;
            //squeak.pause();
            squeak_play = false;
        }
    });

};

var gunManager = {
    init: function() {
        var big_gun1 = new BigGun(200, HEIGHT/2, 90, 'rgb(255, 255, 100)');
        var big_gun2 = new BigGun(WIDTH - 200, HEIGHT/2, 270, 'rgb(100, 255, 100)');

        new Slider(200, 70, big_gun1);
        new Slider(WIDTH - 194, HEIGHT - 70, big_gun2);
    }
};