/*global _*/
if (typeof global !== 'undefined') {
    window._ = global._;
}
var utils = {};
/*
 * возвращает значение гет параметра из урл адреса.
 * url - строка урл
 * param - строка с именем параметра
 * если параметр не существует возвращает undefined,
 * если существуте но без значения - возвращает '' (напр. http://localhost?param&test=3, т.е получается что param = '')
 * getUrlParam("http://yandex.ru?foo=bar&other=other", foo); // вернет bar
 * */
utils.getUrlParam = function (url, param) {
    var params = url.split('#')[0].split('?')[1];
    if (!params) { return; }
    params = params.split("&");
    var result = _.find(params, function (val) {
        return val.split('=')[0] === param;
    });
    if (!result) { return; }
    return result.split('=')[1] || '';
};

/*
 * возвращает объект вида {foo: 'bar', ...}, где ключи соответствуют гет параметрам в строке url
 * */
utils.getUrlParams = function(url) {
    if (!url) { url = document.location.href; }
    var params = url.split('?')[1];
    if (!$.trim(params)) { return false; }

    var result = {};

    $.each(params.split("&"), function(i, splitted) {
        splitted = splitted.split('=');
        result[splitted[0]] = decodeURIComponent(splitted[1]);
    });
    return result;
};

/*
 * обновляет гет параметры урл адреса,
 * url - строка урл
 * params - объект с названиями и значениями параметров ({param1: 'param1', param2: 'param2'})
 * */
utils.updateUrlParams = function (url, params) {
    var temp  = url.split('#');
    var temp2 = temp.shift();
    var hash = temp.join('#'); // вдруг там такой хэш с несколькими знаками #
    temp = temp2.split('?');
    var address = temp[0];
    var parametrs = temp[1] ? temp[1].split('&') : '';
    var updatedParams = $.map(parametrs, function (val) {
        var param = val.split('=')[0];
        if (params[param] !== undefined) {
            val = param + "=" + params[param];
            delete params[param];
        }
        return val;
    });
    if (Object.keys(params).length) {
        var k;
        for (k in params) {
            if (params.hasOwnProperty(k)) {
                updatedParams.push(k + '=' + params[k]);
            }
        }
    }
    updatedParams = updatedParams.length ? '?' + updatedParams.join('&') : '';
    hash = hash ? '#' + hash : '';
    return address + updatedParams + hash;
};

/* возвращает новый объект в котором осутсвуют ключи со значением undefined */
utils.clear_undefined = function(params_dict) {
    var data = {};
    $.each(params_dict, function(key, value) {
        if (value === undefined || value === null) { return; }
        data[key] = value;
    });
    return data;
};

/* удаляет элемент из массива */
utils.removeElFromArray = function (el, arr) { 
    var index = $.inArray(el, arr);
    if (index !== -1) { arr.splice(index, 1); }
    return arr; 
};

/* пытается преобразовать данные в json,
 * если получает объект то возвращается объект,
 * иначе false */
utils.tryToJsonParse = function(data) {
    if (typeof data === "object") { return data; }
    try { return $.parseJSON(data); } catch (e) {}
    return false;
};

/*if no container defined, document will be used */
utils.isElementInDomContainer = function(element, container) {
    if (!container) { container = document; }
    while (element) {
        element = element.parentNode;
        if (element === container) { return true; }
    }
    return false;
};

/* создает новый класс с css правилами. Который можно впоследствии применить к элементу */
utils.createCssClass = function(classname, rules) {
    var style = document.createElement('style');

    var arr = [];
    $.each(rules, function(rulename, rule) { arr.push(rulename + ":" + rule); });
    arr = arr.join("; ");

    style.innerHTML = "." + classname + "{" + arr + "}";
    style.type = 'text/css';

    var head = document.getElementsByTagName('head')[0];
    head.appendChild(style);
    return classname;
};

utils.isParent = function(el, parent) {
    if ( el === parent ) { return true; }
    return el.parentNode ? utils.isParent(el.parentNode, parent) : false;
};

utils.getGeoLocation = function (callback) {
    callback = callback || $.noop;
    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
            function (position) {
                callback(false, { latitude: position.coords.latitude, longitude: position.coords.longitude });
            },
            callback,
            { enableHighAccuracy: true, timeout: 10 * 1000 * 1000, maximumAge: 0 }
        );
    } else { callback(4); }
};
utils.geo_errs = {
    1: 'Permission denied',
    2: 'Position unavailable',
    3: 'Request timeout',
    4: 'Geolocation is not supported'
};

utils.getUrlFromNgPattern = function(url, params) {
    var url_splitted = url.split("/");
    var params_rest = {};
    $.each(params, function(key, value) {
        var url_splitted_index = $.inArray((':' + key), url_splitted);
        if (url_splitted_index !== -1) {
            url_splitted.splice(url_splitted_index, 1, value);
        } else {
            params_rest[key] = value;
        }
    });
    return utils.updateUrlParams(url_splitted.join("/"), params_rest);
};

utils.getAngleAndLength = function(start_coord, stop_coord) {
    var length = Math.sqrt(Math.pow(start_coord.x - stop_coord.x, 2) + Math.pow(start_coord.y - stop_coord.y, 2));
    var sinA = Math.sqrt(Math.pow(start_coord.x - stop_coord.x, 2)) / length;
    var angle = Math.asin(sinA);

    if (start_coord.y < stop_coord.y && start_coord.x < stop_coord.x) { angle = angle; }
    if (start_coord.y > stop_coord.y && start_coord.x < stop_coord.x) { angle = (180).toRad() - angle; }
    if (start_coord.y < stop_coord.y && start_coord.x > stop_coord.x) { angle = - angle; }
    if (start_coord.y > stop_coord.y && start_coord.x > stop_coord.x) { angle = -1* ((180).toRad() - angle); }

    if (start_coord.y === stop_coord.y && start_coord.x > stop_coord.x) { angle = (270).toRad(); }
    if (start_coord.y === stop_coord.y && start_coord.x < stop_coord.x) { angle = (90).toRad(); }
    if (start_coord.x === stop_coord.x && start_coord.y > stop_coord.y) { angle = (180).toRad(); }
    if (start_coord.x === stop_coord.x && start_coord.y < stop_coord.y) { angle = (0).toRad(); }

    return {angle: angle, length: length};
};
utils.getAngle = function(start_coord, stop_coord) {
    return utils.getAngleAndLength(start_coord, stop_coord).angle;
};


utils.getLength = function(start_coord, stop_coord) {
    return Math.sqrt(Math.pow(start_coord.x - stop_coord.x, 2) + Math.pow(start_coord.y - stop_coord.y, 2));
};

utils.dotInRadius = function(center, dot, radius) {
    var length = utils.getAngleAndLength(center, dot).length;
    return radius > length;
};

/* rect - {x: 10, y:10, w: 100, h: 200}*/
utils.dotInRect = function(rect, dot) {
    if (dot.x < rect.x) { return false; }
    if (dot.y < rect.y) { return false; }
    if (dot.x > rect.x + rect.w) { return false; }
    if (dot.y > rect.y + rect.h) { return false; }
    return true;
};

utils.getCoordByKxb2 = function(dot1, dot2, length) {
    var length_between_dots = utils.getLength(dot1, dot2);
    if (length_between_dots < length) {
        dot2.x = dot2.x * 10; 
        dot2.y = dot2.y * 10;
        utils.getCoordByKxb2(dot1, dot2, length);
    }
    var x = dot1.x + (dot2.x - dot1.x)/2;
    var y = dot1.y + (dot2.y - dot1.y)/2;
    if (x === 0) { return {x: dot1.x, y: dot1.y + length}; }
    if (y === 0) { return {x: dot1.x + length, y: dot1.y}; }

    var length_possible = utils.getLength(dot1, {x:x, y:y});
    if (Math.abs(length_possible - length) < 1) { return {x: x, y: y}; }

    if (length_possible > length) {
        return utils.getCoordByKxb(dot1, {x:x, y:y}, length);
    }
    if (length_possible < length) {
        return utils.getCoordByKxb({x:x, y:y}, dot2, length - length_possible);
    }
};

utils.getCoordByKxb = function(dot1, dot2, length) {
    var length_between_dots = utils.getLength(dot1, dot2);
    if (length_between_dots < length) {
        var x3 = dot2.x > dot1.x ? dot2.x + 100 : dot2.x - 100;
        var y3 = (dot2.y - dot1.y) * (x3 - dot1.x)/(dot2.x - dot1.x) + dot1.y;
        return utils.getCoordByKxb(dot1, {x: x3, y: y3}, length);
    }
    var x = dot1.x + (dot2.x - dot1.x)/2;
    var y = dot1.y + (dot2.y - dot1.y)/2;
    if (x === 0) { return {x: dot1.x, y: dot1.y + length}; }
    if (y === 0) { return {x: dot1.x + length, y: dot1.y}; }

    var length_possible = utils.getLength(dot1, {x:x, y:y});
    if (Math.abs(length_possible - length) < 1) { return {x: x, y: y}; }

    if (length_possible > length) {
        return utils.getCoordByKxb(dot1, {x:x, y:y}, length);
    }
    if (length_possible < length) {
        return utils.getCoordByKxb({x:x, y:y}, dot2, length - length_possible);
    }
};

utils.setWHForEasel = function(easel_bmp, w, h) {
    var orig_w = easel_bmp.image.width;
    var orig_h = easel_bmp.image.height;
    var scale_w = w/orig_w;
    var scale_h = h/orig_h;
    easel_bmp.width_by_scale = w;
    easel_bmp.height_by_scale = h;
    easel_bmp.scaleX = scale_w;
    easel_bmp.scaleY = scale_h;
};
