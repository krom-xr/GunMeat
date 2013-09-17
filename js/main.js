/*global PIXI, requestAnimFrame, _, utils, animation, stage, textures_static, BULLET_SPEED, textures_sequence, BULLET_DISTANCE_COEFFICIENT */
//TODO Вращение пушки
//TODO поворот - выстрел - без дистанции


var Bullet = function(angle, x, y, distance) {
    var sprite = new PIXI.Sprite(textures_static.bullet);
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

        this.sprite.position.x = this.x0 + BULLET_SPEED * timediff * Math.sin(this.angle);
        this.sprite.position.y = this.y0 + BULLET_SPEED * timediff * Math.cos(this.angle);
    },
    renderBoom: function() {
        var it = this;
        console.log(stage);

        animation.once(this.sprite, textures_sequence.boom, function() {
            it.killSelf();
        }, 1);

    },
    killSelf: function() {
        stage.removeChild(this.sprite);
        animation.removeFromRender(this);
    },
    isDistancePassed: function() {
        var xlen = Math.abs(this.sprite.position.x - this.x0);
        var ylen = Math.abs(this.sprite.position.y - this.y0);
        return (xlen * xlen + ylen * ylen) >= this.distance * this.distance;
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


var BigGun = function(x, y, angle) {
    var it = this;
    var sprite = new PIXI.Sprite(textures_static.big_gun);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = x;
    sprite.position.y = y;

    sprite.rotation = angle;

    stage.addChild(sprite);


    sprite.setInteractive(true);

    var drag = false;
    var start_coord = { x: sprite.position.x, y: sprite.position.y };
    var stop_coord;
    sprite.mousedown = function(data) {
        drag = true;
    };
    sprite.mousemove = function(data) {
        if (!drag) { return false; }
        var angle_length = utils.getAngleAndLength(start_coord, data.global);
        sprite.rotation =  - angle_length.angle;
    };

    sprite.mouseupoutside = function(data){
        if (!drag) { return; }
        stop_coord = data.global.clone();
        var angle_length = utils.getAngleAndLength(start_coord, stop_coord);
        it.shot(angle_length.angle, angle_length.length);
        drag = false;
    };

    this.x = x; this.y = y;
    this.sprite = sprite;
};

BigGun.prototype = {
    shot: function(angle, distance) {
        var bullet = new Bullet(angle, this.x, this.y, distance * BULLET_DISTANCE_COEFFICIENT);
        animation.pushToRender(bullet);
    }
};


var Soldier = function(x, y, angle) {
    var it = this;
    var sprite = new PIXI.Sprite(textures_static.soldier);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = x;
    sprite.position.y = y;

    sprite.rotation = angle.toRad();

    sprite.setInteractive(true);

    sprite.mousemove = function(mouseData){
        if (it.is_mouse_down){
            var data = mouseData.global.clone();
            it.dots.push(data);
        }
    };

    sprite.mousedown = function(mouseData){
        it.is_mouse_down = true;
        it.dots = [];
    };

    sprite.mouseupoutside = function(mouseData){
        it.is_mouse_down = false;
        it.current_dot_index = 0;
        it.dots = it.normalize_path();
        this.start_time = new Date().getTime();
        animation.pushToRender(it);
    };

    stage.addChild(sprite);
    this.angle = angle;
    this.sprite = sprite;
};

Soldier.prototype = {
    dots: [],
    current_dot_index: 0,
    is_mouse_down: false,
    get_line_points: function line(x0, y0, x1, y1){
        // source: http://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
        // Работает плохо, линия не плавная
        var line_dots = [];
        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        while(true){
          if ((x0===x1) && (y0===y1)) {
              return line_dots;
          }
          var e2 = 2*err;
          if (e2 >-dy){ err -= dy; x0  += sx; }
          if (e2 < dx){ err += dx; y0  += sy; }
          line_dots.push({x:x0, y:y0});
        }
    },
    normalize_path: function(){
        // Заполняет пробелы в пути
        // Нужно еще удалить дубли
        var result_path = [];
        var current_index = 0;
        while (current_index + 1 < this.dots.length){
            result_path.push(this.dots[current_index]);
            if ( (Math.abs((this.dots[current_index].x-this.dots[current_index+1].x))>1) ||
                 (Math.abs((this.dots[current_index].y-this.dots[current_index+1].y))>1) ){
                result_path = result_path.concat(this.get_line_points(this.dots[current_index].x,
                                                         this.dots[current_index].y,
                                                         this.dots[current_index+1].x,
                                                         this.dots[current_index+1].y));
            }
            current_index += 1;
        }
        return result_path;
    },
    renderRun: function() {
        if (this.current_dot_index < this.dots.length){
            
            // Нужно сделать нормальное определение направления
            var dx = this.sprite.position.x - this.dots[this.current_dot_index].x;
            var dy = this.sprite.position.y - this.dots[this.current_dot_index].y;
            this.sprite.rotation = Math.tan(dx, dy) + this.angle.toRad(-90);

            this.sprite.position.x = this.dots[this.current_dot_index].x;
            this.sprite.position.y = this.dots[this.current_dot_index].y;
            this.current_dot_index += 1;
        }else{
            animation.removeFromRender(this);
        }
    },
    render: function() {
        this.renderRun();
    },
};

$(document).ready(function() {
    var big_gun1 = new BigGun(70, $(window).height()/2, (270).toRad());
    var big_gun2 = new BigGun($(window).width()-70, $(window).height()/2, (90).toRad());
    var soldier1 = new Soldier(50, 50, 90);
});
