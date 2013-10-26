/*global _, utils, requestAnimFrame, getImg, createjs */
Number.prototype.toRad = function () { return this * Math.PI / 180; }; // градусы в радианы например: (90).toRad();
Number.prototype.toGrad = function() { return this * 180 / Math.PI; }; // радианы в градусы
var WIDTH, HEIGHT, stage;
var RENDER_ITEMS = [];

var animation = {
    loadTextureSequence: function(base_sprite_path, number_of_images, start_from, ext) {
        ext = ext || 'png';
        ext = "." + ext;

        var frames = [];
        _.each(_.range(number_of_images), function(num) {
            frames.push(getImg(base_sprite_path + (num + 1) + ext));
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
    once: function(sprite, texture_array, callback, start_from) {
        var index = _.indexOf(texture_array, sprite.image);
        start_from = start_from || 0;
        var next_sprite = index === -1 ? texture_array[start_from] : texture_array[index + 1];

        if (next_sprite) {
            sprite.image = next_sprite;
            sprite.regX  = sprite.image.width * 0.5;
            sprite.regY = sprite.image.height * 0.5;

            callback({index: index, finish: false});
        } else {
            callback({index: index, finish: true});
        }
    },
    loop: function(sprite, texture_array, start_from, loop_callback) {
        start_from = start_from || 0;
        var index = _.indexOf(texture_array, sprite.image);
        var next_sprite = index === -1 ? texture_array[start_from] : texture_array[index + 1];
        next_sprite = next_sprite || texture_array[start_from];
        sprite.image = next_sprite;
        index === texture_array.length && loop_callback && loop_callback();
    },
};



$(document).ready(function() {
    WIDTH = $(window).width()-10;
    HEIGHT = $(window).height()-10;

    var canvas = $("#main_canvas").get(0);
    canvas.width = WIDTH; canvas.height = HEIGHT;
    stage = new createjs.Stage(canvas);
    //createjs.Ticker.addEventListener("tick", function tick(event) {
        //animation.render();
        //stage.update(event); 
    //});

    requestAnimationFrame(animate);
    function animate() {
        requestAnimationFrame(animate);
        animation.render(); 
        stage.update(); 

    }
    //setInterval(function() {
        //animation.render();
        //stage.update();
    //}, 17);
    //renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT);
    //requestAnimFrame(animate);
    //function animate() {
        //requestAnimFrame(animate);
        //animation.render();
        //renderer.render(stage);
    //}
    //document.body.appendChild(renderer.view);
});

