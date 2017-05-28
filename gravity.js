function Vector (x, y) {
    this.x = x || 0
    this.y = y || 0
}

Vector.prototype = {
    constructor: Vector,

    toString: function () {
        return 'Vector(' + this.x + ',' + this.y + ')'
    },

    set: function (value) {
        if (typeof value === 'object') {
            this.x = value.x
            this.y = value.y
        } else if (typeof value === 'number') {
            this.x = this.y = value
        }

        return this
    },

    equals: function (obj) {
        return obj.x === this.x && obj.y === this.y
    },

    clone: function () {
        return new Vector(this.x, this.y)
    },

    mul: function (multiplier) {
        if (multiplier instanceof Vector) {
            return new Vector(this.x * multiplier.x, this.y * multiplier.y)
        } else {
            return new Vector(this.x * multiplier, this.y * multiplier)
        }
    },

    div: function (divider) {
        return new Vector(this.x / divider, this.y / divider)
    },

    add: function (operand) {
        if (operand instanceof Vector) {
            return new Vector(this.x + operand.x, this.y + operand.y)
        } else {
            return new Vector(this.x + operand, this.y + operand)
        }
    },

    sub: function (operand) {
        if (operand instanceof Vector) {
            return new Vector(this.x - operand.x, this.y - operand.y)
        } else {
            return new Vector(this.x - operand, this.y - operand)
        }
    },

    dot: function (operand) {
        return this.x * operand.x + this.y * operand.y
    },

    length: function () {
        return Math.sqrt(this.dot(this))
    },

    lengthSq: function () {
        return this.dot(this)
    },

    setLength: function (len) {
        return this.normalize().mul(l)
    },

    normalize: function () {
        return this.div(this.length())
    },

    truncate: function (max) {
        if (this.length() > max) {
            return this.normalize().mul(max)
        } else {
            return this
        }
    },

    dist: function (v) {
        return Math.sqrt(this.distSq(v))
    },

    distSq: function (v) {
        var dx = this.x - v.x, dy = this.y - v.y
        return dx * dx + dy * dy
    }
}

function Circle (c, r, v) {
    this.c = c
    this.r = r
    this.m = r * r * Math.PI
    this.v = v
    this.a = new Vector()

    var color = (~~(Math.random() * 0xffffff)).toString(16)
    while (color.length < 6) color = '0' + color
    this.color = '#' + color
}

function checkCol (a, b) {
    var d = a.c.sub(b.c), r = a.r + b.r
    return d.lengthSq() < r * r
}

function resCol (a, b) {
    var d = a.c.sub(b.c)
    d.set(d.normalize())

    var v = b.v.sub(a.v)
    var dot = d.dot(v)

    if (dot >= 0) {
        var tm = a.m + b.m
        var c = d.mul(2 * dot / tm)

        a.v.set(a.v.add(c.mul(b.m)))
        b.v.set(b.v.sub(c.mul(a.m)))
    }
}

var refreshFunction = (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        setTimeout(callback, 1000 / 60)
    }
)

var canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d')
var w = canvas.width, h = canvas.height, scale = 1, origin = new Vector(0, 0)
var showVVector = true

function translate (realx, realy) {
    var tx = realx / scale, ty = realy / scale
    origin.set(origin.add(new Vector(realx, realy)))
    ctx.translate(tx, ty)
}

translate(w / 2, h / 2)

var mouse = {
    p: new Vector(),
    v: new Vector()
}

var gravity = 45, particles = []

$('#vvector').change(function () {
    showVVector = $(this).is(':checked')
})

$('#gravity').change(function () {
    gravity = +$(this).val()
})

$(window)
    .on('keypress', function (e) {
        var times = e.key === 'a' ? 0.95 : e.key === 's' ? 1 / 0.95 : 1
        if (scale * times > 0.01 && scale * times < 10) {
            scale *= times
            ctx.scale(times, times)
            var delta = new Vector(w / 2, h / 2).sub(origin).mul(1 - times)
            translate(delta.x, delta.y)
        }
    })
    .on('keydown', function (e) {
        switch (e.which) {
            case 37:
                translate(10, 0);
                break;
            case 38:
                translate(0, 10);
                break;
            case 39:
                translate(-10, 0);
                break;
            case 40:
                translate(0, -10);
                break;
        }
    })

$(canvas)
    .on('mousedown', function (e) {
        e = e.originalEvent
        var rect = canvas.getBoundingClientRect()
        mouse.p.x = e.pageX - rect.left
        mouse.p.y = e.pageY - rect.top
        mouse.v.set(0)
        var sizeBase = +$("#size").val()
        mouse.circle = new Circle(mouse.p.sub(origin).div(scale), Math.random() * sizeBase + 15, new Vector())
    })
    .on('mouseup', function (e) {
        e = e.originalEvent
        var rect = canvas.getBoundingClientRect()
        var destx = e.pageX - rect.left
        var desty = e.pageY - rect.top
        mouse.v.set(new Vector(destx, desty).sub(mouse.p).div(50))
        mouse.circle.v.set(mouse.v)
        particles.push(mouse.circle)
        $("#counter").html(particles.length)
    })

function computeForces () {
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i]
        p.a.set(0)

        for (var j = 0; j < i; j++) {
            var p2 = particles[j]
            var d = p.c.sub(p2.c)
            var norm = Math.sqrt(100 + d.lengthSq())
            var mag = gravity / (norm * norm * norm)

            p.a.set(p.a.sub(d.mul(mag * p2.m)))
            p2.a.set(p2.a.add(d.mul(mag * p.m)))
        }
    }
}

function computeCollision () {
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i]
        for (var j = 0; j < i; j++) {
            var p2 = particles[j]

            if (checkCol(p, p2)) resCol(p, p2)
        }
    }
}

function doPhysics (dt) {
    for (var i = 0; i < particles.length; i++) {
        var p1 = particles[i]
        p1.c.set(p1.c.add(p1.v.mul(0.5 * dt)))
    }

    computeForces()
    for (var i = 0; i < particles.length; i++) {
        var p2 = particles[i]
        p2.v.set(p2.v.add(p2.a.mul(dt)))
        p2.c.set(p2.c.add(p2.v.mul(0.5 * dt)))
    }
    computeCollision()
}

function update () {
    for (var k = 0; k < 4; k++) doPhysics(0.25)
    render()
    refreshFunction(update)
}

function render () {
    ctx.clearRect(- origin.x / scale, - origin.y / scale, w / scale , h / scale)

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i]
        ctx.beginPath()
        ctx.arc(p.c.x, p.c.y, p.r, 0, Math.PI * 2, false)
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.closePath()

        if (showVVector) {
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 2])
            ctx.beginPath()
            ctx.moveTo(p.c.x, p.c.y)
            var dest = p.c.add(p.v.mul(30))
            ctx.lineTo(dest.x, dest.y)
            ctx.stroke()
        }
    }
}

update()
