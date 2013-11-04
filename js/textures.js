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

    soldier: function(player) { return player === 'player1' ? getImg('img/soldier/soldier1.png') : getImg('img/soldier/soldier2.png'); },
    soldier_killed: function(player) { return player === 'player1' ? getImg('img/soldier/is_dead1.png') : getImg('img/soldier/is_dead2.png'); },
    soldier_unbrekable: function() { return getImg('img/soldier/unbrekable.png'); },


    stone1: function() { return getImg('img/stones/stone1.png'); },
    stone2: function() { return getImg('img/stones/stone2.png'); },
    stone3: function() { return getImg('img/stones/stone3.png'); },

    flag_: function() { return getImg('img/flag_.png'); },
    flag: function() { return getImg('img/flag.png'); },
};
var textures_sequence = {
    boom: animation.loadTextureSequence('img/explosion/Explosion_Sequence_A ', 27, 1),
    soldier_run1: animation.loadTextureSequence('img/soldier/run1/soldier_', 8, 1),
    soldier_run2: animation.loadTextureSequence('img/soldier/run2/soldier_', 8, 1),
    shot: animation.loadTextureSequence('img/shot/shot', 8, 1)

};
