let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

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
  constructor(draw) {
    this.width = 100;
    this.height = 100;
    this.pos = new Vector2(0, 0);
    this.draw = draw;
    this.horizontalMovement = 0;
    this.verticalMovement = 0;
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
}

class Animator {
  constructor(gameObject, spriteSheet, sWidth, sHeight, columns, rows) {
    this.gameObject = gameObject;
    this.spriteSheet = spriteSheet;
    this.sWidth = sWidth;
    this.sHeight = sHeight;
    this.columns = columns;
    this.rows = rows;
    this.column = 0;
    this.row = 0;
  }
  animate(timestamp) {
    ctx.beginPath();
    console.log(document.getElementById(this.spriteSheet));
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
class Player extends GameObject {
  constructor() {
    super(function (timestamp) {
      animator.animate(timestamp);
    });
    this.movingRight = false;
    this.movingLeft = false;
    this.movingUp = false;
    this.movingDown = false;
    this.speed = 4;
    this.animator = null;
  }
  getVerticalMovement() {
    return (player.movingDown ? 1 : 0) - (player.movingUp ? 1 : 0);
  }
  getHorizontalMovement() {
    return (player.movingRight ? 1 : 0) - (player.movingLeft ? 1 : 0);
  }
  chooseAnimation() {
    if (this.getHorizontalMovement() > 0) {
      this.animator.row = 1;
    } else if (this.getHorizontalMovement() < 0) {
      this.animator.row = 3;
    } else if (this.getVerticalMovement() > 0) {
      this.animator.row = 0;
    } else if (this.getVerticalMovement() < 0) {
      this.animator.row = 2;
    } else {
      this.animator.spriteSheet = "playerIdle";
    }
  }
}

player = new Player();
animator = new Animator(player, "playerWalking", 48, 48, 6, 10);
player.animator = animator;
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
  player.chooseSpritesheet();
  gameManager.instantiated.forEach((obj) => {
    obj.draw(timestamp);
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
    player.animator.spriteSheet = "playerWalking";
  }
  if (e.key == "d") {
    player.movingRight = true;
    player.animator.spriteSheet = "playerWalking";
  }
  if (e.key == "w") {
    player.movingUp = true;
    player.animator.spriteSheet = "playerWalking";
  }
  if (e.key == "s") {
    player.movingDown = true;
    player.animator.spriteSheet = "playerWalking";
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
