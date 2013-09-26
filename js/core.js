/*global _, utils, PIXI, requestAnimFrame  */
Number.prototype.toRad = function () { return this * Math.PI / 180; }; // градусы в радианы например: (90).toRad();
var interactive = true;
var stage = new PIXI.Stage(0xEEEEEE, interactive);

var RENDER_ITEMS = [];

var animation = {
    loadTextureSequence: function(base_sprite_path, number_of_images, start_from, ext) {
        ext = ext || 'png';
        ext = "." + ext;

        var frames = [];
        _.each(_.range(number_of_images), function(num) {
            frames.push(PIXI.Texture.fromImage(base_sprite_path + (num + 1) + ext));
        });
        return frames;
    },
    pushToRender: function(render_ob) {
        if (!render_ob.render) { throw new Error('object must have method - render()'); }
        RENDER_ITEMS.push(render_ob);
    },
    removeFromRender: function(render_ob) {
        RENDER_ITEMS = utils.removeElFromArray(render_ob, RENDER_ITEMS);
    },
    render: function() {
        _.each(RENDER_ITEMS, function(render_item, i) {
            render_item && render_item.render();
        });
    },
    once: function(sprite, texture_array, finish_callback, start_from) {
        start_from = start_from || 0;
        var index = _.indexOf(texture_array, sprite.texture);
        var next_sprite = index === -1 ? texture_array[start_from] : texture_array[index + 1];
        if (next_sprite) {
            sprite.setTexture(next_sprite);
        } else {
            finish_callback && finish_callback();
        }
    },
    loop: function(sprite, texture_array, speed, start_from, loop_callback) {
        if (!sprite.last_time) { sprite.last_time = new Date().getTime(); }
        speed = speed || 1000;
        start_from = start_from || 0;
        var animation_delay = 1000/speed;
        var current_time = new Date().getTime();
        if ((current_time - sprite.last_time) > animation_delay) {
            sprite.last_time = current_time;
            var index = _.indexOf(texture_array, sprite.texture);
            var next_sprite = index === -1 ? texture_array[start_from] : texture_array[index + 1];
            next_sprite = next_sprite || texture_array[start_from];
            sprite.setTexture(next_sprite);
            index === texture_array.length && loop_callback && loop_callback();
        }
    },
};

$(document).ready(function() {
    var renderer = PIXI.autoDetectRenderer($(window).width()-10, $(window).height()-10);
    requestAnimFrame(animate);
    function animate() {
        requestAnimFrame(animate);
        animation.render();
        renderer.render(stage);
    }
    document.body.appendChild(renderer.view);
});

