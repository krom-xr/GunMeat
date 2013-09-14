/*global PIXI, requestAnimFrame, _, utils */

//TODO взрыв ядер
//TODO Вращение пушки
//TODO поворот - выстрел - без дистанции



function getAnimRange (base_sprite_path, number_of_frames, ext) {
    ext = ext || 'png';
    ext = "." + ext;

    var frames = [];
    _.each(_.range(number_of_frames), function(num) {
        frames.push(PIXI.Texture.fromImage(base_sprite_path + (num + 1) + ext));
    });
    return frames;
}

function animateOnce(sprite, texture_array, animage_finish_callback) {
    var index = _.indexOf(texture_array, sprite.texture);
    if (index === -1) {
        sprite.setTexture(texture_array[0]);
    } else {
        var new_sprite = texture_array[index + 1];
        if (new_sprite) {
            sprite.setTexture(new_sprite);
        } else {
            animage_finish_callback && animage_finish_callback()
        }
    }
}

function animateLoop(sprite, texture_array) {
    var index = _.indexOf(texture_array, sprite.texture);
    if (index === -1) {
        sprite.setTexture(texture_array[0]);
    } else {
        var new_sprite = texture_array[index + 1];
        if (new_sprite) {
            sprite.setTexture(new_sprite);
        } else {
            sprite.setTexture(texture_array[0]);
        }
    }
}


Number.prototype.toRad = function () { return this * Math.PI / 180; };
var textures = {
    bullet: PIXI.Texture.fromImage('img/bullet.png'),
    big_gun: PIXI.Texture.fromImage('img/big_gun.png')
};
var textures_sprite = {
    boom: getAnimRange('/img/explosion/Explosion_Sequence_A ', 27)
};

var BULLET_SPEED = 0.09;
var Pi = Math.PI;

var RENDER_ITEMS = [];

var interactive = true;
var stage = new PIXI.Stage(0xEEEEEE, interactive);
var renderer = PIXI.autoDetectRenderer(600, 600);


var Bullet = function(angle, x, y, distance) {
    var sprite = new PIXI.Sprite(textures.bullet);
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
        animateLoop(this.sprite, textures_sprite.boom);
        animateOnce(this.sprite, textures_sprite.boom, function() {
            it.killSelf();
        });

    },
    killSelf: function() {
        stage.removeChild(this.sprite);
        RENDER_ITEMS = utils.removeElFromArray(this, RENDER_ITEMS);
    },
    isDistancePassed: function() {
        //TODO тут неправильная математика
        return this.sprite.position.x > this.distance || this.sprite.position.y > this.distance;
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


var BigGun = function(x, y) {
    var it = this;
    var sprite = new PIXI.Sprite(textures.big_gun);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = x;
    sprite.position.y = y;

    //sprite.rotation = (0).toRad();
    console.log(sprite);
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
            it.shot(45 * Math.random());
            drag = false;
        }
    };
    this.x = x; this.y = y;
    this.sprite = sprite;


};
BigGun.prototype = {
    shot: function(angle) {
        var bullet = new Bullet(angle, this.x, this.y, 500);
        RENDER_ITEMS.push(bullet);
    }
};



var bigGun = new BigGun(300, 50);

//setInterval(function() {
    //bigGun.shot(90 * Math.random());
//}, 500);

//var bullet1 = new Bullet(60, 50, 50);
//var bullet2 = new Bullet(-30, 550, 550);

document.body.appendChild(renderer.view);


requestAnimFrame(animate);
function animate() {
    requestAnimFrame(animate);

    $.each(RENDER_ITEMS, function(i, render_item) {
        render_item && render_item.render();
    });

    renderer.render(stage);
}
