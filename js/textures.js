/*global PIXI, animation */
var textures_static = {
    bullet: PIXI.Texture.fromImage('img/bullet.png'),
    big_gun: PIXI.Texture.fromImage('img/big_gun.png'),
    soldier: PIXI.Texture.fromImage('img/soldier.png')

};
var textures_sequence = {
    boom: animation.loadTextureSequence('/img/explosion/Explosion_Sequence_A ', 27, 1)
};
