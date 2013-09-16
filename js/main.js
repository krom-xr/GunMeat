/*global PIXI, requestAnimFrame, _, utils, animation, stage */
//TODO Вращение пушки
//TODO поворот - выстрел - без дистанции


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

        this.sprite.position.x = this.x0 + BULLET_SPEED * timediff * Math.sin(this.angle.toRad());
        this.sprite.position.y = this.y0 + BULLET_SPEED * timediff * Math.cos(this.angle.toRad());
    },
    renderBoom: function() {
        var it = this;
        animation.once(this.sprite, textures_sequence.boom, function() {
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

    sprite.rotation = angle.toRad();

    stage.addChild(sprite);


    sprite.interactive = true;

    var drag = false;
    sprite.mousedown = function() {
        drag = true;

    };
    sprite.mousemove = function() {

    };
    sprite.mouseup = function() {
        if (drag) {
            it.shot(-90);
            it.shot(-75);
            it.shot(-60);
            it.shot(-45);
            it.shot(-30);
            it.shot(-15);
            it.shot(0);
            it.shot(15);
            it.shot(30);
            it.shot(45);
            it.shot(60);
            it.shot(75);
            it.shot(90);

            it.shot(105);
            it.shot(120);
            it.shot(135);
            it.shot(150);
            it.shot(165);
            it.shot(180);
            it.shot(-105);
            it.shot(-120);
            it.shot(-135);
            it.shot(-150);
            it.shot(-165);
            it.shot(-180);

            drag = false;
        }
    };
    this.x = x; this.y = y;
    this.sprite = sprite;
};

BigGun.prototype = {
    shot: function(angle) {
        var bullet = new Bullet(angle, this.x, this.y, 500);
        animation.pushToRender(bullet);
    }
};


var Soldier = function() {
    var sprite = new PIXI.Sprite(textures_static.soldier);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = 50;
    sprite.position.y = 50;
    stage.addChild(sprite);
    this.sprite = sprite;
    animation.pushToRender(this);
};

Soldier.prototype = {
    dots: [
        {x: 50, y: 50},
        {x: 80, y: 70},
        {x: 60, y: 150},

    ],
    renderRun: function() {

    },
    render: function() {
        //this.sprite.position.x += 1;
    }
}

$(document).ready(function() {
    var big_gun1 = new BigGun(70, $(window).height()/2, 270);
    var big_gun2 = new BigGun($(window).width()-70, $(window).height()/2, 90);
    var soldier1 = new Soldier();
});

