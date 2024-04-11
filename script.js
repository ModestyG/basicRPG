let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const CANVASWIDTH = 600;
const CANVASHEIGHT = 600;
const CENTERX = CANVASWIDTH / 2;
const CENTERY = CANVASHEIGHT / 2;

gameManager = {
  instantiated: [],
};

class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class GameObject {
  constructor() {
    this.width = 100;
    this.height = 100;
    this.pos = new Vector2(0, 0);
    this.horizontalMovement = 0;
    this.verticalMovement = 0;
    this.components = [];
  }
  instantiate(pos = new Vector2(0, 0)) {
    this.pos = pos;
    gameManager.instantiated.push(this);
  }
  transform(direction, speed) {
    if (typeof direction == "number") {
      direction = (direction * Math.PI) / 180;
    } else if (direction instanceof Vector2) {
      if (!direction.x && !direction.y) {
        return new Vector2(this.pos.x, this.pos.y);
      }
      direction = Math.atan2(direction.y, direction.x);
    } else {
      console.log(
        `Error: Transform only takes types Vector2 and Number, not "${typeof direction}"`
      );
    }
    this.pos.x += Math.cos(direction) * speed;
    this.pos.y += Math.sin(direction) * speed;

    return new Vector2(this.pos.x, this.pos.y);
  }
  getComponent(type) {
    return this.components.find((element) => element instanceof type);
  }
}

// Components

class Animator {
  constructor(gameObject, spriteSheet, sWidth, sHeight, columns) {
    this.gameObject = gameObject;
    this.spriteSheet = spriteSheet;
    this.sWidth = sWidth;
    this.sHeight = sHeight;
    this.columns = columns;
    this.column = 0;
    this.row = 0;
  }
  run(timestamp) {
    ctx.beginPath();
    ctx.drawImage(
      document.getElementById(this.spriteSheet),
      this.column * this.sWidth,
      this.row * this.sHeight,
      this.sWidth,
      this.sHeight,
      this.gameObject.pos.x,
      this.gameObject.pos.y,
      this.gameObject.width,
      this.gameObject.height
    );
    ctx.stroke();
    if (timestamp - lastTimestamp < timestep) {
      return;
    }
    lastTimestamp = timestamp;
    this.column = (this.column + 1) % this.columns;
  }
}

// Game specific classes (Should move all of below to different file to separate game engine from game)

class Entity extends GameObject {
  constructor(idleSpritesheet, walkingSpritesheet) {
    super();
    this.idleSpritesheet = idleSpritesheet;
    this.walkingSpritesheet = walkingSpritesheet;

    this.movingRight = false;
    this.movingLeft = false;
    this.movingUp = false;
    this.movingDown = false;

    this.speed = 4; //Base entity speed
  }
  chooseAnimation() {
    let animator = this.getComponent(Animator);
    if (this.getHorizontalMovement() || this.getVerticalMovement()) {
      animator.spriteSheet = this.walkingSpritesheet;
    }
    if (this.getHorizontalMovement() > 0) {
      animator.row = 1;
    } else if (this.getHorizontalMovement() < 0) {
      animator.row = 3;
    } else if (this.getVerticalMovement() > 0) {
      animator.row = 0;
    } else if (this.getVerticalMovement() < 0) {
      animator.row = 2;
    } else {
      animator.spriteSheet = this.idleSpritesheet;
    }
  }
  getVerticalMovement() {
    return (this.movingDown ? 1 : 0) - (this.movingUp ? 1 : 0);
  }
  getHorizontalMovement() {
    return (this.movingRight ? 1 : 0) - (this.movingLeft ? 1 : 0);
  }
}

class Player extends Entity {
  constructor() {
    super("playerIdle", "playerWalking");
    this.components.push(new Animator(this, "playerIdle", 48, 48, 6));
  }
}

player = new Player();
playerAnimator = player.getComponent(Animator);
player.instantiate(new Vector2(300, 100));

direction = 0;

let lastTimestamp = 0,
  maxFPS = 15,
  timestep = 1000 / maxFPS;

function update(timestamp) {
  ctx.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
  player.transform(
    new Vector2(player.getHorizontalMovement(), player.getVerticalMovement()),
    player.speed
  );
  player.chooseAnimation();
  gameManager.instantiated.forEach((obj) => {
    obj.components.forEach((component) => {
      component.run(timestamp);
    });
  });
  requestAnimationFrame(update);
}

function clamp(num, min, max) {
  num = Math.min(Math.max(num, min), max);
}

// Player movement

addEventListener("keydown", (e) => {
  if (e.key == "a") {
    player.movingLeft = true;
  }
  if (e.key == "d") {
    player.movingRight = true;
  }
  if (e.key == "w") {
    player.movingUp = true;
  }
  if (e.key == "s") {
    player.movingDown = true;
  }
});
addEventListener("keyup", (e) => {
  if (e.key == "a") {
    player.movingLeft = false;
  }
  if (e.key == "d") {
    player.movingRight = false;
  }
  if (e.key == "w") {
    player.movingUp = false;
  }
  if (e.key == "s") {
    player.movingDown = false;
  }
});

requestAnimationFrame(update);
