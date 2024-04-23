let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const CANVASWIDTH = 600;
const CANVASHEIGHT = 600;
const CENTERX = CANVASWIDTH / 2;
const CENTERY = CANVASHEIGHT / 2;

class GameManager {
  constructor() {
    this.instantiated = [];
    this.scale = 3;
    this.colliders = [];
    this.debugMode = true;
  }
}
gameManager = new GameManager();

class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.xVar = x;
    this.y = y;
    this.yVar = y;
  }
  set x(val) {
    this.xVar = val;
  }
  get x() {
    return this.xVar;
  }
  set y(val) {
    this.yVar = val;
  }
  get y() {
    return this.yVar;
  }
}

class GameObject {
  constructor() {
    this.horizontalMovement = 0;
    this.verticalMovement = 0;
    this.components = [];
    this.activeComponents = []; // Components with a "run" function that runs every update

    this.pos = new Vector2(); // This is the variable we call upon when getting or changing position
    this.posVariable = new Vector2(); // This is the variable within which we actually store the position
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

  addComponent(type, ...constructors) {
    let component = new type(this, ...constructors);
    this.components.push(component);
    if (component.active) {
      this.activeComponents.push(component);
    }
    if (type == BoxCollider) {
      let gameObject = this;
      gameManager.colliders.push(component);
      Object.defineProperty(this, "pos", {
        set(val) {
          this.posVariable = val;
          Object.defineProperty(this.pos, "x", {
            set(val) {
              if (this.x != val) {
                this.xVar = val;
                gameObject.getComponent(BoxCollider).checkCollision("x");
              } else {
                this.xVar = val;
              }
            },
            get() {
              return this.xVar;
            },
          });
          Object.defineProperty(this.pos, "y", {
            set(val) {
              if (this.y != val) {
                this.yVar = val;
                gameObject.getComponent(BoxCollider).checkCollision("y");
              } else {
                this.yVar = val;
              }
            },
            get() {
              return this.yVar;
            },
          });
        },
        get() {
          return this.posVariable;
        },
      });
    }
  }

  getHeight() {
    return this.getComponent(Animator).sHeight;
  }
}

class SpriteSheet {
  constructor(id, sWidth, sHeight, columns = 1) {
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
    this.active = true;
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

class BoxCollider {
  constructor(
    gameObject,
    width,
    height,
    offset = new Vector2(0, 0),
    isTrigger = false
  ) {
    this.width = width * gameManager.scale;
    this.height = height * gameManager.scale;
    this.offset = new Vector2(
      offset.x * gameManager.scale,
      offset.y * gameManager.scale
    );
    this.gameObject = gameObject;
    this.isTrigger = isTrigger;
  }
  checkCollision(axis) {
    gameManager.colliders.forEach((collider) => {
      if (gameManager.debugMode) {
        //Draws the outlines of all colliders if in debug mode
        ctx.globalCompositeOperation = "destination-over"; // Makes it so the outline appears above the sprites despite being drawn first
        ctx.strokeStyle = "#00FF00";
        ctx.beginPath();
        ctx.strokeRect(
          collider.getPos("x"),
          collider.getPos("y"),
          collider.width,
          collider.height
        );
        ctx.stroke();
      }
      if (collider === this) return; //We do not want to compare with ourselves
      if (
        // Is the collider within the same x as the moving object's collider
        this.getPos("x") < collider.getPos("x") + collider.width &&
        this.getPos("x") + this.width > collider.getPos("x") &&
        // Is the collider within the same y as the moving object's collider
        this.getPos("y") < collider.getPos("y") + collider.height &&
        this.getPos("y") + this.height > collider.getPos("y")
      )
        if (this.isTrigger) {
          //Put code for onTrigger
        } else {
          this.gameObject.pos[axis] +=
            collider.getPos(axis) > this.getPos(axis) ? -1 : 1; //Move outside of the collider depending on if they are to which side it appears on
        }
    });
  }
  getPos(axis = "") {
    if (axis) return this.gameObject.pos[axis] + this.offset[axis];
    else return this.gameObject.pos;
  }
}

class Controller {
  constructor(
    gameObject,
    horizontalPositive,
    horizontalNegative,
    verticalPositive,
    verticalNegative
  ) {
    this.active = false;

    addEventListener("keydown", (e) => {
      if (e.key == horizontalNegative) {
        gameObject.movingLeft = true;
      }
      if (e.key == horizontalPositive) {
        gameObject.movingRight = true;
      }
      if (e.key == verticalPositive) {
        gameObject.movingUp = true;
      }
      if (e.key == verticalNegative) {
        gameObject.movingDown = true;
      }
    });
    addEventListener("keyup", (e) => {
      if (e.key == horizontalNegative) {
        gameObject.movingLeft = false;
      }
      if (e.key == horizontalPositive) {
        gameObject.movingRight = false;
      }
      if (e.key == verticalPositive) {
        gameObject.movingUp = false;
      }
      if (e.key == verticalNegative) {
        gameObject.movingDown = false;
      }
    });
  }
}

// Game specific classes (Should move all of below to different file to separate game engine from game)

class Entity extends GameObject {
  constructor(idleSpritesheet, walkingSpritesheet) {
    super();
    this.idleSpritesheet = idleSpritesheet;
    this.walkingSpritesheet = walkingSpritesheet;

    this.speed = 6; //Base entity speed
  }
}

class Player extends Entity {
  constructor() {
    super(
      new SpriteSheet("characters/playerIdle.png", 48, 48, 6),
      new SpriteSheet("characters/playerWalking.png", 48, 48, 6)
    );
    this.addComponent(Animator, this);
    this.addComponent(Controller, "d", "a", "w", "s");
    this.addComponent(BoxCollider, 13, 5, new Vector2(18, 35));

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

//Game specific variables------------------------------------------------------------------------------------------

let player = new Player();
player.instantiate(new Vector2(250, 100));

let slime = new Entity(
  new SpriteSheet("characters/slime.png", 32, 32, 4),
  new SpriteSheet("characters/slime.png", 32, 32, 4)
);

let counter = new GameObject();
counter.addComponent(Animator, new SpriteSheet("objects/counter.png", 78, 33));
counter.addComponent(BoxCollider, 78, 17, new Vector2(0, 16));
counter.addComponent(BoxCollider, 15, 16, new Vector2(63, 0));
counter.instantiate(new Vector2(200, 200));

if (gameManager.debugMode) {
  addEventListener("mousedown", function (e) {
    //Add so you know where your mouse has clicked
    var rect = canvas.getBoundingClientRect();
    console.log(
      "Clicked x:",
      e.clientX - rect.left,
      "y:",
      e.clientY - rect.top
    );
  });
}

let lastTimestamp = 0,
  maxFPS = 10,
  timestep = 1000 / maxFPS;

function update(timestamp) {
  ctx.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
  player.transform(
    new Vector2(player.getHorizontalMovement(), player.getVerticalMovement()),
    player.speed
  );
  player.chooseAnimation();
  gameManager.instantiated.sort(
    //Sortera object i instantiated så att objekten med högst y animeras sist
    (a, b) =>
      b.pos.y +
      b.getComponent(Animator).spriteSheet.sHeight -
      (a.pos.y + a.getComponent(Animator).spriteSheet.sHeight)
  );
  gameManager.instantiated.forEach((obj) => {
    obj.activeComponents.forEach((component) => {
      component.run(timestamp);
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

requestAnimationFrame(update);
