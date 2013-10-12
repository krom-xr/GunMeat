/*global createjs, PIXI, requestAnimFrame, _, utils, animation, stage, textures_static, BULLET_SPEED, textures_sequence, renderer, BULLET_DISTANCE_COEFFICIENT */
/*global BULLET_DESTROY_RADIUS, SOLDIER_SPEED, HEIGHT, WIDTH */

var helper = {
    killSelf: function(ob) {
        animation.removeFromRender(ob);
        ob.sprite.alpha = 0;
        setTimeout(function() {
            if (ob.sprite.mask_container) {
                ob.sprite.mask_container.removeChild(ob.sprite);
            } else {
                stage.removeChild(ob.sprite);
            }

        }, 500);
    }
};

//var setBulletMask = function(bullet, stone) {
    //if (!bullet.mask_container) {
        //var container = new PIXI.DisplayObjectContainer();
        //stage.addChild(container);
        //container.addChild(bullet);
        //var mask = new PIXI.Graphics();
        //mask.beginFill(0x0000FF, 1);
        //mask.drawRect(stone.position.x - 400, stone.position.y + 40, 1800, 800);
        //container.mask = mask;
        //bullet.mask_container = container;
    //}
//};


var Bullet = function(angle, x, y, distance) {
    //var sprite = new PIXI.Sprite(textures_static.bullet);
    var sprite = new createjs.Bitmap(textures_static.bullet());
    stage.addChild(sprite);
    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.x = x;
        sprite.y = y;
        sprite.rotation = angle;
    });
    this.sprite = sprite;
    this.distance = distance;
    this.angle = angle,
    this.x0 = x;
    this.y0 = y;
    this.start_time = new Date().getTime();
    this.animation_once = _.throttle(animation.once, 50);
};

Bullet.prototype = {
    renderFly: function() {
        var timediff = new Date().getTime() - this.start_time;
        
        this.sprite.x = this.x0 + BULLET_SPEED * timediff * Math.sin(this.angle);
        this.sprite.y = this.y0 + BULLET_SPEED * timediff * Math.cos(this.angle);
    },
    renderBoom: function() {
        var it = this;
        var wh = BULLET_DESTROY_RADIUS * 2;
        utils.setWHForEasel(this.sprite, wh, wh);
        //this.sprite.width = BULLET_DESTROY_RADIUS * 2;
        //this.sprite.height = BULLET_DESTROY_RADIUS * 2;

        it.animation_once(this.sprite, textures_sequence.boom, function(data) {
            if (data.finish) {
                it.killSelf();
                return;
            }
            //var hit_soldiers = [];
            //_.each(_.clone(soldierManager.getSoldiers()), function(soldier) {
                //var hit = utils.dotInRadius(it.sprite.position, soldier.getCurrentCoord(), BULLET_DESTROY_RADIUS);
                //hit && hit_soldiers.push(soldier);
            //});
            //var hit_stones = [];
            //_.each(stoneManager.stones, function(stone) {
                //var hit = utils.dotInRadius(it.sprite.position, stone.position, BULLET_DESTROY_RADIUS);
                //hit && hit_stones.push(stone);
            //});



            //_.each(hit_stones, function(stone) {
                //var rect1 = {x: stone.position.x - stone.width/2, y: 0, w: stone.width, h: renderer.height};
                //var rect2 = {x: 0, y: stone.position.y - stone.height/2, w: renderer.width, h: stone.height};
                ////rect.drawRect
                
                //it.setBulletMask(it.sprite, stone);

                ////if (!stone.rect_mask) {
                    ////var rect = new PIXI.Graphics();
                    ////stone.rect_mask = rect;
                    //////rect.moveTo(10, 10);

                    ////rect.beginFill(0x0000FF, 0.1);
                    ////rect.drawRect(stone.position.x - 400, stone.position.y + 40, 1800, 800);

                    //////stage.addChild(rect);
                    //////it.sprite.mask = rect;

                    ////var container = new PIXI.DisplayObjectContainer();
                    ////stage.addChild(container);

                    ////container.addChild(it.sprite);
                    ////container.mask = rect;

                    //////zcont.mask = rect;
                    
                ////}
                ////if (stone.rect_mask) {
                    //////it.sprite.mask = stone.rect_mask;
                    ////stone.rect_mask.beginFill(0x0000FF, 1);
                    ////stone.rect_mask.drawCircle(stone.position.x, stone.position.y, 5);

                ////}

                


            //});


        }, 0);

    },
    killSelf: function() { helper.killSelf(this); },
    isDistancePassed: function() {
        var xlen = Math.abs(this.sprite.x - this.x0);
        var ylen = Math.abs(this.sprite.y - this.y0);
        return (xlen * xlen + ylen * ylen) >= this.distance * this.distance;
    },
    setBulletMask: function(bullet, stone) {
        if (!bullet.mask_container) {
            var container = new PIXI.DisplayObjectContainer();
            stage.addChild(container);
            container.addChild(bullet);
            var mask = new PIXI.Graphics();
            mask.beginFill(0x0000FF, 1);
            mask.drawRect(stone.position.x - 400, stone.position.y + 40, 1800, 800);
            container.mask = mask;
            bullet.mask_container = container;
        }
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
    this.x = x; this.y = y;

    var sprite = new createjs.Bitmap(textures_static.big_gun());
    stage.addChild(sprite);
    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.x = x;
        sprite.y = y;
        sprite.rotation = angle;
    });

    //TODO тут надо сделать так чтобы нельзя было выбрать двух солдатиков одновременно
    document.addEventListener('PointerDown', function(e) {
        var is_near = utils.getLength({x: e.clientX, y: e.clientY}, {x: x, y: y});
        if (is_near < 50) { it.pointerId = e.pointerId; }
    });
    document.addEventListener('PointerMove', function(e) {
        if (!it.pointerId || it.pointerId !== e.pointerId) { return false; }

        var angle_length = utils.getAngleAndLength({x: e.clientX, y: e.clientY}, {x: x, y: y});
        sprite.rotation = - angle_length.angle.toGrad();
    }, false);

    document.addEventListener('PointerUp', function(e) {
        if (it.pointerId === e.pointerId) {
            it.pointerId = false;

            var angle_length = utils.getAngleAndLength({x: x, y: y}, {x: e.clientX, y: e.clientY});
            it.shot(angle_length.angle, angle_length.length);
        }
    });
    return this;
};

BigGun.prototype = {
    shot: function(angle, distance) {
        var bullet = new Bullet(angle, this.x, this.y, distance * BULLET_DISTANCE_COEFFICIENT);
        animation.pushToRender(bullet);
    }
};


var Soldier = function(x, y, angle) {
    var it = this;
    var sprite = new createjs.Bitmap(textures_static.soldier());
    stage.addChild(sprite);
    sprite.image.after_load(function() {
        sprite.regX  = sprite.image.width * 0.5;
        sprite.regY = sprite.image.height * 0.5;
        sprite.x = x;
        sprite.y = y;
        sprite.rotation = angle;
    });

    var draw = false;

    document.addEventListener('PointerDown', function(e) {
        e.stopPropagation(); e.preventDefault();
        var is_near = utils.getLength({x: e.clientX, y: e.clientY}, {x: it.sprite.x, y: it.sprite.y});
        if (is_near < 50) { 
            it.pointerId = e.pointerId;
            it.dots = [];
        }
    });
    document.addEventListener('PointerMove', function(e) {
        if (!it.pointerId || it.pointerId !== e.pointerId) { return false; }
        it.dots.push({x: e.clientX, y: e.clientY});
    }, false);
    document.addEventListener('PointerUp', function(e) {
        if (it.pointerId === e.pointerId) {
            it.pointerId = false;
            it.start_time = new Date().getTime();
            it.setDotLengths(it.dots);
            animation.pushToRender(it);
        }
    });

    stage.addChild(sprite);


    this.angle = angle;
    this.sprite = sprite;
    this.dots = [];
    this.x0 = x;
    this.y0 = y;

    this.sprite.width = 100;
    this.sprite.height = 100;
    this.animation_loop = _.throttle(animation.loop, 10/SOLDIER_SPEED);
};

Soldier.prototype = {
    killSelf: function() {
        soldierManager.killSoldier(this);
        helper.killSelf(this);
    },
    getCurrentCoord: function() { return {x: this.sprite.position.x, y: this.sprite.position.y}; },
    setDotLengths: function(dots) {
        _.each(dots, function(dot, i) {
            if (i === 0) { dot.current_length = 0; return; }
            var prev_dot = dots[i - 1];
            dot.current_length = prev_dot.current_length + utils.getLength(dot, prev_dot);
        });

    },
    renderRun: function() {
        var it = this;
        var dots = it.dots;


        var timediff = new Date().getTime() - this.start_time;
        var possible_x = this.x0 + SOLDIER_SPEED * timediff;
        var possible_y = this.y0 + SOLDIER_SPEED * timediff;
        var possible_length = utils.getLength({x: this.x0, y: this.y0}, {x: possible_x, y: possible_y});

        var search_dot = _.find(dots, function(dot) { return dot.current_length > possible_length; });
        
        if (!search_dot) { return false; }
        var search_dot_prev = dots[_.indexOf(dots, search_dot) - 1];

        var lengthdiff = possible_length  - search_dot_prev.current_length;
        var angle = utils.getAngleAndLength(search_dot, search_dot_prev).angle.toGrad();

        var xy = utils.getCoordByKxb(search_dot_prev, search_dot, lengthdiff);



        this.sprite.rotation  = - angle;
        this.sprite.x = xy.x;
        this.sprite.y = xy.y;

        this.animation_loop(this.sprite, textures_sequence.soldier_run);
    },
    render: function() {
        this.renderRun();
    },
};

var soldierManager = {
    init: function() {
        var soldier1 = new Soldier(50, 50, 0);
        var soldier2 = new Soldier(150, 150, 190);
        var soldier3 = new Soldier(250, 250, 45);
        var soldier4 = new Soldier(350, 350, 20);
        var soldier5 = new Soldier(550, 350, 569);
        this.addSoldier(soldier1).addSoldier(soldier2).addSoldier(soldier3).addSoldier(soldier4).addSoldier(soldier5);

    },
    soldiers: [],
    addSoldier: function(soldier) {
        this.soldiers.push(soldier);
        return this;
    },
    getSoldiers: function() {
        return this.soldiers;
    },
    killSoldier: function(soldier) {
        utils.removeElFromArray(soldier, this.soldiers);
    }
};

var stoneManager = {
    init: function() {
        this.newStone(textures_static.stone1(), 300, 300);

    },
    newStone: function(img, x, y) {
        var sprite = new createjs.Bitmap(img);
        stage.addChild(sprite);
        sprite.image.after_load(function() {
            spr = sprite;
            sprite.regX  = sprite.image.width * 0.5;
            sprite.regY = sprite.image.height * 0.5;
            sprite.x = x;
            sprite.y = y;
            utils.setWHForEasel(sprite, 100, 100);
        });
    },
    stones: [],
};


var inverseGrOb = function(inverse, area_w, area_h) {
    var x = 0, y = 1;
    var xmax = 0, xmin = 10000000;
    var path = [];
    for (var i = 0; i < inverse.currentPath.points.length; i+=2) {
        path.push([inverse.currentPath.points[i], inverse.currentPath.points[i + 1]]);
    }
    inverse.clear();

    _.each(path, function(dot) { if (xmax < dot[0]) { xmax = dot[0]; } });
    _.each(path, function(dot) { if (xmin > dot[0]) { xmin = dot[0]; } });

    inverse.beginFill("0x00FF00", 1);
    inverse.moveTo(xmin, 0);
    inverse.lineTo(0, 0);
    inverse.lineTo(0, area_h);
    inverse.lineTo(xmin, area_h);
    inverse.lineTo(xmin, 0);

    inverse.beginFill("0x00FFff", 1);
    inverse.moveTo(xmax, 0);
    inverse.lineTo(xmax, area_h);
    inverse.lineTo(area_w, area_h);
    inverse.lineTo(area_w, 0);
    inverse.lineTo(xmax, 0);

    _.each(path, function(dot, i) {
        var dot2 = path[i + 1];
        if (!dot2) { return false; }

        if (dot[x] < dot2[x]) {
            inverse.beginFill("0xfff000");
            inverse.moveTo(dot[x], dot[y]);
            inverse.lineTo(dot[x], 0);
            inverse.lineTo(dot2[x], 0);
            inverse.lineTo(dot2[x], dot2[y]);
            inverse.lineTo(dot[x], dot[y]);
        } else {
            inverse.beginFill("0xfff000");
            inverse.moveTo(dot[x], dot[y]);
            inverse.lineTo(dot[x], area_h);
            inverse.lineTo(dot2[x], area_h);
            inverse.lineTo(dot2[x], dot2[y]);
            inverse.lineTo(dot[x], dot[y]);
        }
    });
};


$(document).ready(function() {

    var big_gun1 = new BigGun(70, HEIGHT/2, 90);
    var big_gun2 = new BigGun(WIDTH - 70, HEIGHT/2, 270);
    soldierManager.init();
    stoneManager.init();


});




