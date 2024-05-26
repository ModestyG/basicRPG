let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
ctx.globalCompositeOperation = "destination-over"; // Makes it so the outline appears above the sprites despite being drawn first
ctx.imageSmoothingEnabled = false;

const CANVASWIDTH = 600;
const CANVASHEIGHT = 600;
const CENTERX = CANVASWIDTH / 2;
const CENTERY = CANVASHEIGHT / 2;

class GameManager {
  constructor() {
    this.instantiated = [];
    this.instantiatedHUD = [];
    this.scale = 3;
    this.colliders = [];
    this.debugMode = true;
  }
  sortObjects() {
    this.instantiated.sort(
      //Sortera object i instantiated så att objekten med högst y animeras sist
      (a, b) =>
        b.pos.y +
        (b.getComponent(Animator)
          ? b.getComponent(Animator).spriteSheet.yOffset * gameManager.scale
          : b.getComponent(SpriteRenderer).spriteSheet.yOffset *
            gameManager.scale) -
        (a.pos.y +
          (a.getComponent(Animator)
            ? a.getComponent(Animator).spriteSheet.yOffset * gameManager.scale
            : a.getComponent(SpriteRenderer).spriteSheet.yOffset *
              gameManager.scale))
    );
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

  getDistance(target) {
    return Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2);
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

  instantiate(pos = new Vector2(0, 0), hud = false) {
    this.pos = pos;
    if (hud) {
      gameManager.instantiatedHUD.push(this);
    } else {
      gameManager.instantiated.push(this);
    }
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

  addComponent(...components) {
    components.forEach((component) => {
      if (component instanceof Component) {
        this.components.push(component);
        if (component.active) {
          this.activeComponents.push(component);
        }
        if (component instanceof BoxCollider) {
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
      } else {
        console.log(
          "Error: addComponent only takes objects of the type 'Component'"
        );
      }
    });
  }
  getPos() {
    //Gets the actual position where the object is standing rather than the corner of their sprite (which might be located a bit away from the visible part of the sprite)
    if (this.getComponent(Animator)) {
      return new Vector2(
        this.pos.x +
          (this.getComponent(Animator).spriteSheet.sWidth * gameManager.scale) /
            2,
        this.pos.y +
          this.getComponent(Animator).spriteSheet.yOffset * gameManager.scale
      );
    }
    return new Vector2(
      this.pos.x +
        (this.getComponent(SpriteRenderer).spriteSheet.sWidth *
          gameManager.scale) /
          2,
      this.pos.y +
        this.getComponent(SpriteRenderer).spriteSheet.yOffset *
          gameManager.scale
    );
  }
}

class SpriteSheet {
  constructor(id, sWidth, sHeight, yOffset = sHeight, columns = 1) {
    let sheetElement = document.createElement("img");
    sheetElement.src = "Sprites/sprites/" + id;
    sheetElement.style.display = "none";
    document.body.appendChild(sheetElement);
    this.sheet = sheetElement;
    this.sWidth = sWidth;
    this.sHeight = sHeight;
    this.yOffset = yOffset;
    this.columns = columns;
  }
}

class Component {
  constructor(gameObject, active, id = null) {
    this.gameObject = gameObject;
    this.active = active;
    this.id = id;
  }
}

// Components

class Animator extends Component {
  constructor(gameObject, spriteSheet) {
    super(gameObject, true);
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

class SpriteRenderer extends Component {
  //Used for objects without animation
  constructor(gameObject, spriteSheet, xIndex = 0, yIndex = 0) {
    super(gameObject, true);
    this.spriteSheet = spriteSheet;
    this.xIndex = xIndex;
    this.yIndex = yIndex;
  }
  run() {
    ctx.beginPath();
    ctx.drawImage(
      this.spriteSheet.sheet,
      this.xIndex * this.spriteSheet.sWidth,
      this.yIndex * this.spriteSheet.sHeight,
      this.spriteSheet.sWidth,
      this.spriteSheet.sHeight,
      this.gameObject.pos.x,
      this.gameObject.pos.y,
      this.spriteSheet.sWidth * gameManager.scale,
      this.spriteSheet.sHeight * gameManager.scale
    );
    ctx.stroke();
  }
}

class BoxCollider extends Component {
  constructor(
    gameObject,
    width,
    height,
    offset = new Vector2(0, 0),
    isTrigger = false,
    onTrigger = () => {},
    onTriggerEnter = () => {},
    onTriggerExit = () => {},
    onTriggerStay = () => {}
  ) {
    super(gameObject, false);
    this.width = width * gameManager.scale;
    this.height = height * gameManager.scale;
    this.offset = new Vector2(
      offset.x * gameManager.scale,
      offset.y * gameManager.scale
    );
    this.isTrigger = isTrigger;
    this.onTrigger = onTrigger;
    this.onTriggerEnter = onTriggerEnter;
    this.onTriggerExit = onTriggerExit;
    this.onTriggerStay = onTriggerStay;
    this.isTriggered = {};
  }
  checkCollision(axis) {
    gameManager.colliders.forEach((collider) => {
      if (gameManager.debugMode) {
        //Draws the outlines of all colliders if in debug mode
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
      if (collider.gameObject === this.gameObject) return; //We do not want to compare with ourselves
      if (
        // Is the collider within the same x as the moving object's collider
        this.getPos("x") < collider.getPos("x") + collider.width &&
        this.getPos("x") + this.width > collider.getPos("x") &&
        // Is the collider within the same y as the moving object's collider
        this.getPos("y") < collider.getPos("y") + collider.height &&
        this.getPos("y") + this.height > collider.getPos("y")
      ) {
        if (collider.isTrigger) {
          collider.onTrigger(this);
          if (collider.isTriggered[this]) {
            collider.onTriggerStay(this);
          } else {
            collider.onTriggerEnter(this);
            collider.isTriggered[this] = true;
          }
        } else {
          this.gameObject.pos[axis] +=
            collider.getPos(axis) > this.getPos(axis) ? -1 : 1; //Move outside of the collider depending on if they are to which side it appears on
        }
      } else if (collider.isTriggered[this]) {
        collider.isTriggered[this] = false;
        collider.onTriggerExit(this);
      }
    });
  }
  getPos(axis = "") {
    if (axis) return this.gameObject.pos[axis] + this.offset[axis];
    else return this.gameObject.pos;
  }
}

class Controller extends Component {
  constructor(
    gameObject,
    horizontalPositive,
    horizontalNegative,
    verticalPositive,
    verticalNegative
  ) {
    super(gameObject, true);
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
  run() {
    this.gameObject.transform(
      new Vector2(
        this.gameObject.getHorizontalMovement(),
        this.gameObject.getVerticalMovement()
      ),
      this.gameObject.speed
    );
    this.gameObject.chooseAnimation();
  }
}
