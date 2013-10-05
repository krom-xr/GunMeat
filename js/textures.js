/*global PIXI, animation */
var getImg = function(src) {
    var img = new Image();
    img.src = src;
    return img;
};

var textures_static = {
    //bullet: PIXI.Texture.fromImage('img/ball.png'),
    //big_gun: PIXI.Texture.fromImage('img/cannon.png'),
    big_gun: getImg('img/cannon.png'),
    //soldier: PIXI.Texture.fromImage('img/soldier/soldier_1.png'),

    //stone1: PIXI.Texture.fromImage('img/stones/stone1.png'),
    //stone2: PIXI.Texture.fromImage('img/stones/stone2.png'),
    //stone3: PIXI.Texture.fromImage('img/stones/stone3.png'),

};
var textures_sequence = {
    //boom: animation.loadTextureSequence('/img/explosion/Explosion_Sequence_A ', 27, 1),
    //soldier_run: animation.loadTextureSequence('/img/soldier/soldier_', 8, 1)

};
