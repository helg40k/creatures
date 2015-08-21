function Ball(r, p, v) {
  this.radius = r;
  this.point = p;
  this.vector = v;
  this.maxVec = 5;
//    this.maxVec = 15;
  this.numSegment = Math.floor(r / 3 + 2);
  this.boundOffset = [];
  this.boundOffsetBuff = [];
  this.sidePoints = [];
  this.path = new Path({
                         fillColor: {
                           hue: Math.random() * 360,
                           saturation: 1,
                           brightness: 1
                         },
                         blendMode: 'screen'
                       });

  for (var i = 0; i < this.numSegment; i ++) {
    this.boundOffset.push(this.radius);
    this.boundOffsetBuff.push(this.radius);
    this.path.add(new Point());
    this.sidePoints.push(new Point({
                                     angle: 360 / this.numSegment * i,
                                     length: 1
                                   }));
  }
}

Ball.prototype = {
  iterate: function() {
    this.checkBorders();
    if (this.vector.length > this.maxVec)
      this.vector.length = this.maxVec;
    this.point += this.vector;
    this.updateShape();
  },

  checkBorders: function() {
    var size = view.size;
//    var size = {width: 1000, height: 700};
    var smallRadius = this.radius;
//    var smallRadius = 0;
    if (this.point.x < smallRadius) {

      var reactRadius = this.radius;
      var dist = this.point.x;
      if (dist < reactRadius && dist != 0) {
//        var overlap = reactRadius - dist;
//        var direction = (this.point - (new Point({ x: 0 , y: this.point.y }) / 100)).normalize(overlap * 0.015);
//        this.vector += direction;

        var minTd = size.width;
        for (var i = 0; i < this.numSegment; i ++) {
          var tp = this.getSidePoint(i);
          var td = tp.getDistance(new Point({ x: 0, y: tp.y }));
          if (minTd > td) {
            minTd = td;
          }
          if (td < reactRadius) {
            this.boundOffsetBuff[i] -= (reactRadius - td) / 2;
          }
        }

        this.updateBounds();
      }

      if (180 === this.vector.angle) {
        this.vector.angle = 0;
      } else if (180 > this.vector.angle) {
        this.vector.angle = 90 - (this.vector.angle - 90);
      } else {
        this.vector.angle = 360 - (this.vector.angle - 180);
      }

    }
    if (this.point.x > size.width - smallRadius) {
      if (0 === this.vector.angle) {
        this.vector.angle = 180;
      } if (90 < this.vector.angle) {
        this.vector.angle = 90 + (90 - this.vector.angle);
      } else {
        this.vector.angle = 180 + (360 - this.vector.angle);
      }
    }
    if (this.point.y < smallRadius) {
      if (90 === this.vector.angle) {
        this.vector.angle = 270;
      } else if (90 < this.vector.angle) {
        this.vector.angle = 360 - (90 - this.vector.angle);
      } else {
        this.vector.angle = 180 + (180 - this.vector.angle);
      }
    }
    if (this.point.y > size.height - smallRadius) {
      if (270 === this.vector.angle) {
        this.vector.angle = 90;
      } else if (270 > this.vector.angle) {
        this.vector.angle = 0 + (360 - this.vector.angle);
      } else {
        this.vector.angle = 90 + (this.vector.angle - 180);
      }
    }
  },

  updateShape: function() {
    var segments = this.path.segments;
    for (var i = 0; i < this.numSegment; i ++)
      segments[i].point = this.getSidePoint(i);

    this.path.smooth();
    for (var i = 0; i < this.numSegment; i ++) {
      if (this.boundOffset[i] < this.radius / 4)
        this.boundOffset[i] = this.radius / 4;
      var next = (i + 1) % this.numSegment;
      var prev = (i > 0) ? i - 1 : this.numSegment - 1;
      var offset = this.boundOffset[i];
      offset += (this.radius - offset) / 15;
      offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
      this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
    }
  },

  react: function(b) {
    var dist = this.point.getDistance(b.point);
    if (dist < this.radius + b.radius && dist != 0) {
      var overlap = this.radius + b.radius - dist;
      var direc = (this.point - b.point).normalize(overlap * 0.015);
      this.vector += direc;
      b.vector -= direc;

      this.calcBounds(b);
      b.calcBounds(this);
      this.updateBounds();
      b.updateBounds();
    }
  },

  reactBorder: function(b) {
    var dist = this.point.x;
    if (dist < this.radius && dist != 0) {
      var overlap = this.radius - dist;
      var direction = (this.point).normalize(overlap * 0.015);
      this.vector += direction;

      for (var i = 0; i < this.numSegment; i ++) {
        var tp = this.getSidePoint(i);
        var td = tp.getDistance(new Point({ x: tp.x, y: 0 }));
        if (td < this.radius) {
          this.boundOffsetBuff[i] -= (this.radius  - td) / 2;
        }
      }

      this.updateBounds();
    }
  },

  getBoundOffset: function(b) {
    var diff = this.point - b;
    var angle = (diff.angle + 180) % 360;
    return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
  },

  calcBounds: function(b) {
    for (var i = 0; i < this.numSegment; i ++) {
      var tp = this.getSidePoint(i);
      var bLen = b.getBoundOffset(tp);
      var td = tp.getDistance(b.point);
      if (td < bLen) {
        this.boundOffsetBuff[i] -= (bLen  - td) / 2;
      }
    }
  },

  getSidePoint: function(index) {
    return this.point + this.sidePoints[index] * this.boundOffset[index];
  },

  updateBounds: function() {
    for (var i = 0; i < this.numSegment; i ++)
      this.boundOffset[i] = this.boundOffsetBuff[i];
  }
};

//--------------------- main ---------------------

var balls = [];
var numBalls = 18;
for (var i = 0; i < numBalls; i++) {
  var position = Point.random() + (view.size / 2);
  var vector = new Point({
                           angle: 360 * Math.random(),
                           length: Math.random() * 10
                         });
  var radius = 100;
//    var radius = Math.random() * 60 + 60;
  balls.push(new Ball(radius, position, vector));
}

function onFrame() {
  for (var i = 0; i < balls.length - 1; i++) {
    for (var j = i + 1; j < balls.length; j++) {
      balls[i].react(balls[j]);
    }
  }
  for (var i = 0, l = balls.length; i < l; i++) {
    balls[i].iterate();
  }
}
