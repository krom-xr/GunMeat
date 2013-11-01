/*global PIXI, animation */
var getImg = function(src) {
    var img = new Image();
    img.after_load = function(callback) {
        if (img.width) {
            callback();
        } else {
            img.onload = callback;
        }
    };
    img.src = src;
    return img;
};

var textures_static = {
    background: function() { return getImg('img/background.png'); },
    bullet: function() { return getImg('img/ball.png'); },
    big_gun: function() { return getImg('img/cannon.png'); },
    big_gun_active: function() { return getImg('img/cannon_active.png'); },
    soldier: function() { return getImg('img/soldier/soldier_1.png'); },// PIXI.Texture.fromImage('img/soldier/soldier_1.png'),

    stone1: function() { return getImg('img/stones/stone1.png'); },
    stone2: function() { return getImg('img/stones/stone2.png'); },
    stone3: function() { return getImg('img/stones/stone3.png'); },
};
var textures_sequence = {
    boom: animation.loadTextureSequence('img/explosion/Explosion_Sequence_A ', 27, 1),
    soldier_run: animation.loadTextureSequence('img/soldier/soldier_', 8, 1)

};
