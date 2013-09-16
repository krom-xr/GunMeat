/*global PIXI, animation */
var textures_static = {
    bullet: PIXI.Texture.fromImage('img/ball.png'),
    big_gun: PIXI.Texture.fromImage('img/cannon.png'),
    soldier: PIXI.Texture.fromImage('img/soldier_top_down.png')

};
var textures_sequence = {
    boom: animation.loadTextureSequence('/img/explosion/Explosion_Sequence_A ', 27, 1)
};
