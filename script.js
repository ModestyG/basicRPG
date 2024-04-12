let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const CANVASWIDTH = 600;
const CANVASHEIGHT = 600;
const CENTERX = CANVASWIDTH / 2;
const CENTERY = CANVASHEIGHT / 2;

gameManager = {
  instantiated: [],
  scale: 3,
};

class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class GameObject {
  constructor() {
    this.width = 1;
    this.height = 1;
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

class SpriteSheet {
  constructor(id, sWidth, sHeight, columns) {
    let sheetElement = document.createElement("img");
    sheetElement.src = "Sprites/sprites/" + id;
    sheetElement.style.display = "none";
    document.body.appendChild(sheetElement);
    this.sheet = sheetElement;
    this.sWidth = sWidth;
    this.sHeight = sHeight;
    this.columns = columns;
  }
}

// Components

class Animator {
  constructor(gameObject, spriteSheet) {
    this.gameObject = gameObject;
    this.spriteSheet = spriteSheet;
    this.column = 0;
    this.row = 0;
  }
  run(timestamp) {
    ctx.beginPath();
    ctx.drawImage(
      this.spriteSheet.sheet,
      this.column * this.spriteSheet.sWidth,
      this.row * this.spriteSheet.sHeight,
      this.spriteSheet.sWidth,
      this.spriteSheet.sHeight,
      this.gameObject.pos.x,
      this.gameObject.pos.y,
      this.spriteSheet.sWidth * gameManager.scale,
      this.spriteSheet.sHeight * gameManager.scale
    );
    ctx.stroke();
    if (!(timestamp - lastTimestamp < timestep)) {
      this.column = (this.column + 1) % this.spriteSheet.columns;
    }
  }
}

// Game specific classes (Should move all of below to different file to separate game engine from game)

class Entity extends GameObject {
  constructor(idleSpritesheet, walkingSpritesheet) {
    super();
    this.idleSpritesheet = idleSpritesheet;
    this.walkingSpritesheet = walkingSpritesheet;

    this.speed = 4; //Base entity speed
  }
}

class Player extends Entity {
  constructor() {
    super(
      new SpriteSheet("characters/playerIdle.png", 48, 48, 6),
      new SpriteSheet("characters/playerWalking.png", 48, 48, 6)
    );
    this.components.push(new Animator(this));

    this.movingRight = false;
    this.movingLeft = false;
    this.movingUp = false;
    this.movingDown = false;
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

//Game specific variables

let slime = new Entity(
  new SpriteSheet("characters/slime.png", 32, 32, 4),
  new SpriteSheet("characters/slime.png", 32, 32, 4)
);
slime.components.push(new Animator(slime, slime.idleSpritesheet));
slime.instantiate(new Vector2(100, 100));

let player = new Player();
player.instantiate(new Vector2(300, 100));

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
      if (component instanceof Animator) {
        component.run(timestamp);
      }
    });
  });
  if (!(timestamp - lastTimestamp < timestep)) {
    lastTimestamp = timestamp;
  }
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
