/*global createjs, PIXI, requestAnimFrame, _, utils, animation, stage, textures_static, BULLET_SPEED, textures_sequence, renderer, BULLET_DISTANCE_COEFFICIENT, container */
/*global BULLET_DESTROY_RADIUS, SOLDIER_SPEED, HEIGHT, WIDTH, soldierManager, gunManager, sounds, require */
var helper = {
    _stones_map_ctx: false,
    kill: function(ob) {
        animation.removeFromRender(ob);
        ob.sprite.alpha = 0;
        setTimeout(function() {
            if (ob.sprite.mask_container) {
                ob.sprite.mask_container.removeChild(ob.sprite);
            } else {
                stage.removeChild(ob.sprite);
            }

        }, 500);
    },
    getSpecialCanvas: function() {
        var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
        canvas.width = WIDTH; canvas.height = HEIGHT;
        ctx.fillStyle = "black";
        return {ctx: ctx, canvas: canvas};
    },
    getStonesMapCtx: function(callback) {
        if (this._stones_map_ctx === 'wait') { return; }
        if (this._stones_map_ctx) { callback(this._stones_map_ctx); return; }
        this._stones_map_ctx = 'wait';
        var it = this;
        var canv = helper.getSpecialCanvas();
        canv.ctx.fillStyle = 'red';
        canv.ctx.fillRect(0, 0, WIDTH, HEIGHT);
        canv.ctx.fillStyle = 'black';
        _.each(stoneManager.stones, function(stone) {
            _.each(stoneManager.getVertices(stone), function(dot, i) {
                i ? canv.ctx.lineTo(dot.x, dot.y) : canv.ctx.moveTo(dot.x, dot.y);
            });
        });
        canv.ctx.fill();
        it._stones_map_ctx = canv.ctx;
        callback(it._stones_map_ctx);
    }
};

var Bullet = function(angle, x, y, distance) {
    //var sprite = new PIXI.Sprite(textures_static.bullet);
    var sprite = new createjs.Bitmap(textures_static.bullet());
    stage.addChild(sprite);
    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.rotation = angle;
    });
    sprite.x = x;
    sprite.y = y;
    this.sprite = sprite;
    this.distance = distance;
    this.angle = angle,
    this.x0 = x;
    this.y0 = y;
    this.start_time = new Date().getTime();
    this.animation_once = _.throttle(animation.once, 20);
};

Bullet.prototype = {
    getStoneDots: function(stone) {
        var it = this;
        var far_dist = BULLET_DESTROY_RADIUS * 125;

        var stone_dots = stoneManager.getVertices(stone);

        var max_min = stoneManager.getMaxMinAngleDot(stone, it.sprite.x, it.sprite.y);
        var far_dot1 = utils.getCoordByKxb({x: it.sprite.x, y: it.sprite.y}, {x: max_min.min.x, y: max_min.min.y}, far_dist);
        var far_dot2 = utils.getCoordByKxb({x: it.sprite.x, y: it.sprite.y}, {x: max_min.max.x, y: max_min.max.y}, far_dist);

        var third_vertice;
        _.each(stone_dots, function(dot, i) {
            if (dot.x === max_min.min.x && dot.y === max_min.min.y) {
                third_vertice = stone_dots[i + 1];
                if (!third_vertice) { third_vertice = stone_dots[0]; }
            }
        });

        return [
            {x: max_min.min.x, y: max_min.min.y, start: true},
            {x: far_dot1.x, y: far_dot1.y},
            {x: far_dot2.x, y: far_dot2.y},
            {x: max_min.max.x, y: max_min.max.y},
            {x: third_vertice.x, y: third_vertice.y},
            {x: max_min.min.x, y: max_min.min.y}
        ];
    },
    getMaskDots: function(stones_arr) {
        var it = this;
        var line_dots = [];
        _.each(stones_arr, function(stone) {
            line_dots = line_dots.concat(it.getStoneDots(stone));
        });
        return line_dots;
    },
    setMask: function(mask_dots) {
        var trace = new createjs.Shape();
        trace.graphics.beginStroke('rgba(0,0,0,1)');

        _.each(mask_dots, function(dot) {
            dot.start ?
                trace.graphics.moveTo(dot.x, dot.y) :
                trace.graphics.lineTo(dot.x, dot.y);
        });
        trace.graphics
            .moveTo(0, 0)
            .lineTo(WIDTH, 0)
            .lineTo(WIDTH, HEIGHT)
            .lineTo(0, HEIGHT)
            .lineTo(0, 0);

        this.sprite.mask = trace;

    },
    hitSoldiers: function() {
        var it = this;
        return _.filter(soldierManager.getSoldiers(), function(soldier) {
            return !soldier.unbrekable && utils.dotInRadius({x: it.sprite.x, y: it.sprite.y}, soldier.getCurrentCoord(), BULLET_DESTROY_RADIUS);
        });

    },
    killSoldiers: function(soldiers, mask_dots) {
        var canvas, ctx, canv;
        
        _.each(soldiers, function(soldier) {
            if (soldier.is_dead) { return; }
            if (!canvas) {
                canv = helper.getSpecialCanvas();

                _.each(mask_dots, function(dot) {
                    dot.start ?
                        canv.ctx.moveTo(dot.x, dot.y) :
                        canv.ctx.lineTo(dot.x, dot.y);
                });
                canv.ctx.fillStyle = "black"; canv.ctx.fill();
            }

            var im_data = canv.ctx.getImageData(soldier.sprite.x, soldier.sprite.y, 1, 1).data;
            if (!im_data[3]) {
                soldier.killSelf();
            }
        });
    },
    boomOnStone: function() {
        if (this.on_stone !== undefined) { return this.on_stone; }
        var it = this;
        var canv = helper.getSpecialCanvas();
        _.each(stoneManager.stones, function(stone) {
            _.each(stoneManager.getVertices(stone), function(dot, i) {
                i ? canv.ctx.lineTo(dot.x, dot.y) : canv.ctx.moveTo(dot.x, dot.y);
            });
        });
        canv.ctx.fill();

        var im_data = canv.ctx.getImageData(it.sprite.x, it.sprite.y, 1, 1).data;
        it.on_stone = !!im_data[3];
        return it.on_stone;
    },
    renderFly: function() {
        var timediff = new Date().getTime() - this.start_time;
        
        this.sprite.x = this.x0 + BULLET_SPEED * timediff * Math.sin(this.angle);
        this.sprite.y = this.y0 + BULLET_SPEED * timediff * Math.cos(this.angle);
    },
    renderBoom: function() {
        var it = this;
        var wh = BULLET_DESTROY_RADIUS * 2;

        this.playSound();
        this.sprite.x = this.x0 + this.distance * Math.sin(this.angle);
        this.sprite.y = this.y0 + this.distance * Math.cos(this.angle);

        it.animation_once(it.sprite, textures_sequence.boom, function(data) {
            if (data.finish) {
                it.killSelf();
                return;
            }
            if (it.boomOnStone()) { return; }

            var mask_dots = it.getMaskDots(stoneManager.stones);
            it.setMask(mask_dots);
            it.killSoldiers(it.hitSoldiers(), mask_dots);

        }, 0);
        utils.setWHForEasel(it.sprite, wh, wh); // если подставить перед animantion_once - то происходит какой-то глюк - строб в начале взрыва

    },
    killSelf: function() { helper.kill(this); },
    playSound: function() {
        if (this.is_sound_played) { return false; }
        this.is_sound_played = true;
        sounds.explosion(); //.play();
    },
    isDistancePassed: function() {
        if (this.is_distance_passed) { return true; }

        //sounds.explosion.stop();
        var xlen = Math.abs(this.sprite.x - this.x0);
        var ylen = Math.abs(this.sprite.y - this.y0);
        this.is_distance_passed = (xlen * xlen + ylen * ylen) >= this.distance * this.distance;
        return this.is_distance_passed;
    },
    render: function() {
        if (this.isDistancePassed()) {
            this.renderBoom();
        } else {
            this.renderFly();
        }
    },
};



var stoneManager = {
    init: function() {
        //var stone1 = this.newStone(textures_static.stone1(), 450, 400);
        //var stone2 = this.newStone(textures_static.stone2(), 500, 900);
        //var stone3 = this.newStone(textures_static.stone3(), 550, 700);
        //var stone4 = this.newStone(textures_static.stone2(), 1450, 850);
        //var stone5 = this.newStone(textures_static.stone1(), 1300, 400);
        //var stone6 = this.newStone(textures_static.stone2(), 1250, 650);
        //var stone7 = this.newStone(textures_static.stone3(), 1050, 100);
        //var stone8 = this.newStone(textures_static.stone2(), 950, 300);
        //var stone9 = this.newStone(textures_static.stone1(), 1000, 700);
        //var stone10 = this.newStone(textures_static.stone2(), 800, 650);

        //var stone11 = this.newStone(textures_static.stone1(),   600  ,200  );
        //var stone12 = this.newStone(textures_static.stone2(),   750 ,50    );
        //var stone13 = this.newStone(textures_static.stone3(),   750 , 450  );
        //var stone14 = this.newStone(textures_static.stone2(),   1350 ,100  );
        //var stone15 = this.newStone(textures_static.stone1(),   1300, 250  );
        //var stone16 = this.newStone(textures_static.stone2(),   1050, 550   );
        //var stone17 = this.newStone(textures_static.stone3(),   1200, 800   );
        //var stone18 = this.newStone(textures_static.stone2(),   750 , 850   );
        //var stone19 = this.newStone(textures_static.stone1(),   1050, 950   );
        //var stone20 = this.newStone(textures_static.stone2(),  800 , 250  );

        //this.stones.push(stone1);
        //this.stones.push(stone2);
        //this.stones.push(stone3);
        //this.stones.push(stone4);
        //this.stones.push(stone5);
        //this.stones.push(stone6);
        //this.stones.push(stone7);
        //this.stones.push(stone8);
        //this.stones.push(stone9);
        //this.stones.push(stone10);


        //this.stones.push(stone11);
        //this.stones.push(stone12);
        //this.stones.push(stone13);
        //this.stones.push(stone14);
        //this.stones.push(stone15);
        //this.stones.push(stone16);
        //this.stones.push(stone17);
        //this.stones.push(stone18);
        //this.stones.push(stone19);
        //this.stones.push(stone20);
        
        
        var stone1 = this.newStone(textures_static.stone1(), 450, 400);
        var stone2 = this.newStone(textures_static.stone2(), 500, 900);
        var stone3 = this.newStone(textures_static.stone3(), 550, 700);
        var stone4 = this.newStone(textures_static.stone2(), 1450, 850);
        var stone5 = this.newStone(textures_static.stone1(), 1300, 400);
        var stone6 = this.newStone(textures_static.stone2(), 1250, 650);
        var stone7 = this.newStone(textures_static.stone3(), 1050, 100);
        var stone8 = this.newStone(textures_static.stone2(), 950, 300);
        var stone9 = this.newStone(textures_static.stone1(), 1000, 700);
        var stone10 = this.newStone(textures_static.stone2(), 800, 650);

        //var stone11 = this.newStone(textures_static.stone1(),   600  ,200  );
        //var stone12 = this.newStone(textures_static.stone2(),   750 ,50    );
        //var stone13 = this.newStone(textures_static.stone3(),   750 , 450  );
        //var stone14 = this.newStone(textures_static.stone2(),   1350 ,100  );
        //var stone15 = this.newStone(textures_static.stone1(),   1300, 250  );
        //var stone16 = this.newStone(textures_static.stone2(),   1050, 550   );
        //var stone17 = this.newStone(textures_static.stone3(),   1200, 800   );
        //var stone18 = this.newStone(textures_static.stone2(),   750 , 850   );
        //var stone19 = this.newStone(textures_static.stone1(),   1050, 950   );
        //var stone20 = this.newStone(textures_static.stone2(),  800 , 250  );

        this.stones.push(stone1);
        this.stones.push(stone2);
        this.stones.push(stone3);
        this.stones.push(stone4);
        this.stones.push(stone5);
        this.stones.push(stone6);
        this.stones.push(stone7);
        this.stones.push(stone8);
        this.stones.push(stone9);
        this.stones.push(stone10);


        //this.stones.push(stone11);
        //this.stones.push(stone12);
        //this.stones.push(stone13);
        //this.stones.push(stone14);
        //this.stones.push(stone15);
        //this.stones.push(stone16);
        //this.stones.push(stone17);
        //this.stones.push(stone18);
        //this.stones.push(stone19);
        //this.stones.push(stone20);
    },
    checkDotInStone: function(dot, stone) {
        var w = stone.width_by_scale - 10, h = stone.height_by_scale - 10;
        var x = stone.x - w/2, y = stone.y - h/2;
        if ( (x < dot.x && dot.x < x + w) &&
             (y < dot.y && dot.y < y + h) ) { return true; }
        return false;

    },
    getVertices: function(sprite) {
        if (sprite.versites) { return sprite.versites; }
        var x = sprite.x;
        var y = sprite.y;
        var half_w = sprite.width_by_scale/2 - 10;
        var half_h = sprite.height_by_scale/2 - 10;
        sprite.versites = [
            //{x: x - 33, y: y - 27},
            //{x: x - 8, y: y - 29},
            //{x: x - 8, y: y - 29},
            //{x: x + 31, y: y - 38},
            //{x: x + 31, y: y - 38},
            //{x: x + 31, y: y + 38},
            //{x: x - 45, y: y + 26},


            {x: x - half_w, y: y - half_h},
            {x: x + half_w, y: y - half_h},
            {x: x + half_w, y: y + half_h},
            {x: x - half_w, y: y + half_h}
        ];

        return sprite.versites;
    },
    getMaxMinAngleDot: function(sprite, x, y) {
        var dots = stoneManager.getVertices(sprite);
        var max_angle = -100000, min_angle = 10000, max_dot, min_dot;
        var y_max = -10000;
        _.each(dots, function(dot) { if (dot.y > y_max) { y_max = dot.y; }});
        var reverse_flag = y > y_max;

        _.each(dots, function(dot) {
            var angle = reverse_flag ? utils.getAngle(dot, {x: x, y: y}) :  angle = utils.getAngle({x: x, y: y}, dot);
            if (max_angle < angle) {
                max_angle = angle;
                max_dot = dot;
            }
            if (min_angle > angle) {
                min_angle = angle;
                min_dot = dot;
            }
        });
        return {max: max_dot, min: min_dot};
    },
    getAllSegments: function() {
        var it = this;
        if (!it.all_segments) {
            it.all_segments = [];
            _.each(stoneManager.stones, function(stone) {
                _.each(stoneManager.getSegments(stone), function(segment) {
                    it.all_segments.push(segment);
                });
            });
        }
        return it.all_segments;
    },
    getSegments: function(stone) {
        if (!stone.segments) {
            var vertices = stoneManager.getVertices(stone);
            stone.segments = [
                [vertices[0], vertices[1]],
                [vertices[1], vertices[2]],
                [vertices[2], vertices[3]],
                [vertices[3], vertices[0]],
            ];
        }
        return stone.segments;
    },
    newStone: function(img, x, y) {
        var sprite = new createjs.Bitmap(img);
        stage.addChild(sprite);
        sprite.image.after_load(function() {
            sprite.regX  = sprite.image.width * 0.5;
            sprite.regY = sprite.image.height * 0.5;
            sprite.x = x;
            sprite.y = y;
            utils.setWHForEasel(sprite, 100, 100);
        });
        return sprite;
    },
    stones: [],
};

var flag = {
    init: function() {
        var flag = new createjs.Bitmap(textures_static.flag());
        flag.x = WIDTH/2;
        flag.y = HEIGHT/2;

        flag.image.after_load(function() {
            flag.regX  = flag.image.width * 0.5;
            flag.regY = flag.image.height * 0.5;
        });

        stage.addChild(flag);

        var flag_ = new createjs.Bitmap(textures_static.flag_());
        flag_.x = WIDTH/2;
        flag_.y = HEIGHT/2;

        flag_.image.after_load(function() {
            flag_.regX  = flag_.image.width * 0.5;
            flag_.regY = flag_.image.height * 0.5;
        });

        container.addChild(flag_);
        
    }
};

var player = {
    init: function() {
        this.$id = $('#player');
        this.audio = this.$id.find('audio').get(0);
        this.play();


        var it = this;
        this.audio.addEventListener('ended', function() { it.play(); });

        document.addEventListener('PointerDown', function(e) {
            if ($(e.toElement).hasClass('player')) {
                var $this = $(e.toElement);
                if ($this.hasClass('pause')) {
                    $this.removeClass('pause');
                    it.audio.pause();
                } else {
                    $this.addClass('pause');
                    it.audio.play();
                }
            }
        }, false);

        //this.$id.click(function() {
            //var $this = $(this);
            //if ($this.hasClass('pause')) {
                //$this.removeClass('pause');
                //it.audio.pause();
            //} else {
                //$this.addClass('pause');
                //it.audio.play();
            //}
        //});

    },
    playlist: [
        "audio/player/mv1.ogg",
        "audio/player/mv2.ogg",
        "audio/player/mv3.ogg",
        "audio/player/mv4.ogg",
    ],
    play: function() {
        var src = this.audio.data_src;
        var index = _.indexOf(this.playlist, this.audio.data_src);

        if (index === -1 || index === 3) {
            index = 0;
        } else {
            index = index + 1;
        }

        this.audio.src = this.playlist[index];
        this.audio.data_src = this.playlist[index];
        this.audio.play();
    }

};

$(document).ready(function() {

    setTimeout(function() {
        player.init();
    }, 2000);

    setTimeout(function() {
        flag.init();
        gunManager.init();
        soldierManager.init();
        stoneManager.init();

        $('#preloader').hide('slow');
    //}, 8000); //TODO вернуть на родину
    }, 80);
});
$(document).on('contextmenu', function(e) { e.preventDefault(); e.stopPropagation(); });
$(document).on('keyup', function(e) {
    if (e.keyCode === 27) {
        if (confirm('are you want to quit?')) {
            var gui = require('nw.gui');
            var win = gui.Window.get();
            win.close();
        }
    }
});

