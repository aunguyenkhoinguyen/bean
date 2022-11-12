var config = {
    config_item: {
        length: 2000,
        duration: 2,
        velocity: 100,
        effect: -0.8,
        size: 10,
        color: '#2b95ff', // color hình
        time: 2000,
    },
};


// class point
var Point = (function() {

    function Point(x, y) {
        this.x = (typeof x !== 'undefined') ? x : 0;
        this.y = (typeof y !== 'undefined') ? y : 0;
    }
    Point.prototype.clone = function() {
        return new Point(this.x, this.y);
    };
    Point.prototype.length = function(length) {
        if (typeof length == 'undefined')
            return Math.sqrt(this.x * this.x + this.y * this.y);
        this.normalize();
        this.x *= length;
        this.y *= length;
        return this;
    };
    Point.prototype.normalize = function() {
        var length = this.length();
        this.x /= length;
        this.y /= length;
        return this;
    };
    return Point;
})();


// class Particle
var Particle = (function() {

    function Particle() {
        this.position = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
        this.age = 0;
    }
    Particle.prototype.initialize = function(x, y, dx, dy) {
        this.position.x = x;
        this.position.y = y;
        this.velocity.x = dx;
        this.velocity.y = dy;
        this.acceleration.x = dx * config.config_item.effect;
        this.acceleration.y = dy * config.config_item.effect;
        this.age = 0;
    };
    Particle.prototype.update = function(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.age += deltaTime;
    };
    Particle.prototype.draw = function(context, image) {
        function ease(t) {
            return (--t) * t * t + 1;
        }
        var size = image.width * ease(this.age / config.config_item.duration);
        context.globalAlpha = 1 - this.age / config.config_item.duration;
        context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size,
            size);
    };
    return Particle;
})();


// class ParticlePool
var ParticlePool = (function() {
    var config_item,
        firstActive = 0,
        firstFree = 0,
        duration = config.config_item.duration;

    function ParticlePool(length) {
        config_item = new Array(length);
        for (var i = 0; i < config_item.length; i++)
            config_item[i] = new Particle();
    }
    ParticlePool.prototype.add = function(x, y, dx, dy) {
        config_item[firstFree].initialize(x, y, dx, dy);

        firstFree++;
        if (firstFree == config_item.length) firstFree = 0;
        if (firstActive == firstFree) firstActive++;
        if (firstActive == config_item.length) firstActive = 0;
    };
    ParticlePool.prototype.update = function(deltaTime) {
        var i;

        // update active config_item
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++)
                config_item[i].update(deltaTime);
        }
        if (firstFree < firstActive) {
            for (i = firstActive; i < config_item.length; i++)
                config_item[i].update(deltaTime);
            for (i = 0; i < firstFree; i++)
                config_item[i].update(deltaTime);
        }

        // remove inactive config_item
        while (config_item[firstActive].age >= duration && firstActive != firstFree) {
            firstActive++;
            if (firstActive == config_item.length) firstActive = 0;
        }


    };
    ParticlePool.prototype.draw = function(context, image) {
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++)
                config_item[i].draw(context, image);
        }
        if (firstFree < firstActive) {
            for (i = firstActive; i < config_item.length; i++)
                config_item[i].draw(context, image);
            for (i = 0; i < firstFree; i++)
                config_item[i].draw(context, image);
        }
    };
    return ParticlePool;
})();


// canvas
(function(canvas) {
    var context = canvas.getContext('2d'),
        config_item = new ParticlePool(config.config_item.length),
        particleRate = config.config_item.length / config.config_item.duration, // config_item/sec
        time;

    // vẽ hình trái tim
    function pointOnHeart(t) {
        return new Point(
            160 * Math.pow(Math.sin(t), 3),
            130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
        );
    }

    var image = (function() {
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');
        canvas.width = config.config_item.size;
        canvas.height = config.config_item.size;

        function to(t) {
            var point = pointOnHeart(t);
            point.x = config.config_item.size / 2 + point.x * config.config_item.size / 500;
            point.y = config.config_item.size / 2 - point.y * config.config_item.size / 500;
            return point;
        }
        context.beginPath();
        var t = -Math.PI;
        var point = to(t);
        context.moveTo(point.x, point.y);
        while (t < Math.PI) {
            t += 0.5;
            point = to(t);
            context.lineTo(point.x, point.y);
        }
        context.closePath();
        context.fillStyle = config.config_item.color;
        context.fill();
        var image = new Image();
        image.src = canvas.toDataURL();
        return image;
    })();


    function render() {
        requestAnimationFrame(render);
        var newTime = new Date().getTime() / config.config_item.time,
            deltaTime = newTime - (time || newTime);
        time = newTime;
        context.clearRect(0, 0, canvas.width, canvas.height);
        var amount = particleRate * deltaTime;
        for (var i = 0; i < amount; i++) {
            var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
            var dir = pos.clone().length(config.config_item.velocity);
            config_item.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
        }
        config_item.update(deltaTime);
        config_item.draw(context, image);
    }

    function onResize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    window.onresize = onResize;


    onResize();
    render()

})(document.getElementById('heart'));