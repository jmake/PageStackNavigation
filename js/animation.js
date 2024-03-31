
var Bird = function () {
  var scope = this;

  THREE.Geometry.call(this);

  v(5, 0, 0);
  v(-5, -2, 1);
  v(-5, 0, 0);
  v(-5, -2, -1);

  v(0, 2, -6);
  v(0, 2, 6);
  v(2, 0, 0);
  v(-3, 0, 0);

  f3(0, 2, 1);
  // f3( 0, 3, 2 );

  f3(4, 7, 6);
  f3(5, 6, 7);

  this.computeCentroids();
  this.computeFaceNormals();

  function v(x, y, z) {
    scope.vertices.push(new THREE.Vector3(x, y, z));
  }

  function f3(a, b, c) {
    scope.faces.push(new THREE.Face3(a, b, c));
  }
};

Bird.prototype = Object.create(THREE.Geometry.prototype);
// Based on http://www.openprocessing.org/visuals/?visualID=6910

var Flock = function () {
  var vector = new THREE.Vector3(),
    _acceleration,
    _width = 500,
    _height = 500,
    _depth = 200,
    _goal,
    _neighborhoodRadius = 200,
    _maxSpeed = 5,
    _maxSteerForce = 0.1,
    _avoidWalls = false;

  this.position = new THREE.Vector3();
  this.velocity = new THREE.Vector3();
  _acceleration = new THREE.Vector3();

  this.setGoal = function (target) {
    _goal = target;
  };

  this.setAvoidWalls = function (value) {
    _avoidWalls = value;
  };

  this.setWorldSize = function (width, height, depth) {
    _width = width;
    _height = height;
    vector;
    _depth = depth;
  };

  this.run = async function (flocks) {
    if (_avoidWalls) {
      vector.set(-_width, this.position.y, this.position.z);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);

      vector.set(_width, this.position.y, this.position.z);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);

      vector.set(this.position.x, -_height, this.position.z);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);

      vector.set(this.position.x, _height, this.position.z);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);

      vector.set(this.position.x, this.position.y, -_depth);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);

      vector.set(this.position.x, this.position.y, _depth);
      vector = this.avoid(vector);
      vector.multiplyScalar(5);
      _acceleration.addSelf(vector);
    }

    if (Math.random() > 0.5) {
      this.flock(flocks);
    }

    this.move();
  };

  this.flock = function (flocks) {
    if (_goal) {
      _acceleration.addSelf(this.reach(_goal, 0.005));
    }

    _acceleration.addSelf(this.alignment(flocks));
    _acceleration.addSelf(this.cohesion(flocks));
    _acceleration.addSelf(this.separation(flocks));
  };

  this.move = function () {
    this.velocity.addSelf(_acceleration);

    var l = this.velocity.length();

    if (l > _maxSpeed) {
      this.velocity.divideScalar(l / _maxSpeed);
    }

    this.position.addSelf(this.velocity);
    _acceleration.set(0, 0, 0);
  };

  this.checkBounds = function () {
    if (this.position.x > _width) this.position.x = -_width;
    if (this.position.x < -_width) this.position.x = _width;
    if (this.position.y > _height) this.position.y = -_height;
    if (this.position.y < -_height) this.position.y = _height;
    if (this.position.z > _depth) this.position.z = -_depth;
    if (this.position.z < -_depth) this.position.z = _depth;
  };

  //

  this.avoid = function (target) {
    var steer = new THREE.Vector3();

    steer.copy(this.position);
    steer.subSelf(target);

    steer.multiplyScalar(1 / this.position.distanceToSquared(target));

    return steer;
  };

  this.repulse = function (target) {
    var distance = this.position.distanceTo(target);

    if (distance < 150) {
      var steer = new THREE.Vector3();

      steer.sub(this.position, target);
      steer.multiplyScalar(0.1 / distance);

      _acceleration.addSelf(steer);
    }
  };

  this.reach = function (target, amount) {
    var steer = new THREE.Vector3();

    steer.sub(target, this.position);
    steer.multiplyScalar(amount);

    return steer;
  };

  this.alignment = function (flocks) {
    var flock,
      velSum = new THREE.Vector3(),
      count = 0;

    for (var i = 0, il = flocks.length; i < il; i++) {
      if (Math.random() > 0.6) continue;

      flock = flocks[i];

      distance = flock.position.distanceTo(this.position);

      if (distance > 0 && distance <= _neighborhoodRadius) {
        velSum.addSelf(flock.velocity);
        count++;
      }
    }

    if (count > 0) {
      velSum.divideScalar(count);

      var l = velSum.length();

      if (l > _maxSteerForce) {
        velSum.divideScalar(l / _maxSteerForce);
      }
    }

    return velSum;
  };

  this.cohesion = function (flocks) {
    var flock,
      distance,
      posSum = new THREE.Vector3(),
      steer = new THREE.Vector3(),
      count = 0;

    for (var i = 0, il = flocks.length; i < il; i++) {
      if (Math.random() > 0.6) continue;

      flock = flocks[i];
      distance = flock.position.distanceTo(this.position);

      if (distance > 0 && distance <= _neighborhoodRadius) {
        posSum.addSelf(flock.position);
        count++;
      }
    }

    if (count > 0) {
      posSum.divideScalar(count);
    }

    steer.sub(posSum, this.position);

    var l = steer.length();

    if (l > _maxSteerForce) {
      steer.divideScalar(l / _maxSteerForce);
    }

    return steer;
  };

  this.separation = function (flocks) {
    var flock,
      distance,
      posSum = new THREE.Vector3(),
      repulse = new THREE.Vector3();

    for (var i = 0, il = flocks.length; i < il; i++) {
      if (Math.random() > 0.6) continue;

      flock = flocks[i];
      distance = flock.position.distanceTo(this.position);

      if (distance > 0 && distance <= _neighborhoodRadius) {
        repulse.sub(this.position, flock.position);
        repulse.normalize();
        repulse.divideScalar(distance);
        posSum.addSelf(repulse);
      }
    }

    return posSum;
  };
};

// Global
var SCREEN_WIDTH = window.innerWidth,
  SCREEN_HEIGHT = window.innerHeight,
  SCREEN_WIDTH_HALF = SCREEN_WIDTH / 2,
  SCREEN_HEIGHT_HALF = SCREEN_HEIGHT / 2;

var camera, scene, renderer, birds, bird;

var flock, flocks;


function init() 
{
  camera = new THREE.PerspectiveCamera(
    75,
    SCREEN_WIDTH / SCREEN_HEIGHT,
    1,
    10000
  );
  camera.position.z = 450;

  scene = new THREE.Scene();

  birds = [];
  flocks = [];

  for (var i = 0; i < 200; i++) {
    flock = flocks[i] = new Flock();
    flock.position.x = Math.random() * 400 - 200;
    flock.position.y = Math.random() * 400 - 200;
    flock.position.z = Math.random() * 400 - 200;
    flock.velocity.x = Math.random() * 2 - 1;
    flock.velocity.y = Math.random() * 2 - 1;
    flock.velocity.z = Math.random() * 2 - 1;
    flock.setAvoidWalls(true);
    flock.setWorldSize(500, 500, 400);

    bird = birds[i] = new THREE.Mesh(
      new Bird(),
      new THREE.MeshBasicMaterial({
        color: Math.random() * 0xffffff,
        side: THREE.DoubleSide
      })
    );
    bird.phase = Math.floor(Math.random() * 62.83);

    bird.position = flocks[i].position;
    scene.add(bird);
  }

container = document.getElementById('scene3d');
var w = container.offsetWidth;
var h = container.offsetHeight;

//document.body.appendChild( container );
document.addEventListener("mousemove", onDocumentMouseMove, false);

  renderer = new THREE.CanvasRenderer();
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
//renderer.setSize(w, h);

container.appendChild( renderer.domElement );

/*
  renderer = new THREE.CanvasRenderer();
  //renderer.autoClear = false;
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  document.addEventListener("mousemove", onDocumentMouseMove, false);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);
*/
}

// Handlers

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  //console.log({ x: event.clientX, y: event.clientY });
  var vector = new THREE.Vector3(
    event.clientX - SCREEN_WIDTH_HALF,
    -event.clientY + SCREEN_HEIGHT_HALF,
    0
  );

  for (var i = 0, il = flocks.length; i < il; i++) {
    flock = flocks[i];

    vector.z = flock.position.z;

    flock.repulse(vector);
  }
}

// Animation

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  for (var i = 0, il = birds.length; i < il; i++) {
    flock = flocks[i];
    flock.run(flocks);

    bird = birds[i];

    color = bird.material.color;
    color.r = color.g = color.b = (500 - bird.position.z) / 1000;

    // Rotate bird as it flies
    bird.rotation.y = Math.atan2(-flock.velocity.z, flock.velocity.x);
    bird.rotation.z = Math.asin(flock.velocity.y / flock.velocity.length());

    // Flap wings!
    bird.phase = (bird.phase + (Math.max(0, bird.rotation.z) + 0.1)) % 62.83;
    bird.geometry.vertices[5].y = bird.geometry.vertices[4].y =
      Math.sin(bird.phase) * 5;
  }

  renderer.render(scene, camera);
}

// Main
(async () => {
  try {
    await init();
    await animate();
    // console.log(flocks.length, flocks[0].position.z)
  } catch (e) {
    init = null;
    animate = null;
    renderer = null;
  }
})();
