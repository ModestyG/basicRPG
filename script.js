class Entity extends GameObject {
  constructor(idleSpritesheet, walkingSpritesheet) {
    super();
    this.idleSpritesheet = idleSpritesheet;
    this.walkingSpritesheet = walkingSpritesheet;
    this.addComponent(new Animator(this, idleSpritesheet));

    this.speed = 6; //Base entity speed
  }
}

class Player extends Entity {
  constructor() {
    super(
      new SpriteSheet("characters/playerIdle.png", 48, 48, 41, 6),
      new SpriteSheet("characters/playerWalking.png", 48, 48, 41, 6)
    );
    this.addComponent(
      new Controller(this, "d", "a", "w", "s"),
      new BoxCollider(this, 13, 5, new Vector2(18, 35))
    );
    this.movingRight = false;
    this.movingLeft = false;
    this.movingUp = false;
    this.movingDown = false;

    this.interactable = [];
    this.interaciton = null;
  }

  run() {
    //Make interactions work (Interactable[0] is the closest interactable)
    removeEventListener("keydown", this.interaciton);
    this.interactable.sort((a, b) => a.distance - b.distance);
    if (this.interactable[0].distance <= this.interactable[0].range) {
      this.interaciton = (e) => {
        if (e.key == this.interactable[0].key) {
          this.interactable[0].func();
        }
      };
      addEventListener("keydown", this.interaciton);
    }
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

  addInteractable(interactable) {
    this.interactable.push(interactable);
    console.log(this.interactable);
  }
  removeInteractable(interactable) {
    let idx = this.interactable.indexOf(interactable);
    if (idx != -1) this.interactable.splice(idx, 1);
    console.log(this.interactable);
  }
}

class InteractionHandler extends Component {
  constructor(gameObject, func, width, height, offset, range = 50, key = "e") {
    super(gameObject, true);
    this.range = range;
    this.key = key;
    this.func = func;
    this.width = width * gameManager.scale;
    this.height = height * gameManager.scale;
    this.offset = new Vector2(
      offset.x * gameManager.scale,
      offset.y * gameManager.scale
    );
    this.distance = Infinity;
    player.interactable.push(this);
  }
  run() {
    this.distance = this.getPlayerDistance();
  }
  getPlayerDistance() {
    //Returns the player's shortest distance to the object
    if (player.getPos().x < this.getCornerPos().x) {
      //If player is to the left of the object

      if (player.getPos().y < this.getCornerPos().y) {
        //Top left corner
        return player.getPos().getDistance(this.getCornerPos());
      } else if (player.getPos().y < this.getCornerPos().y + this.height) {
        //Left wall
        return this.getCornerPos().x - player.getPos().x;
      } else {
        //Bottom left corner
        return player
          .getPos()
          .getDistance(
            new Vector2(
              this.getCornerPos().x,
              this.getCornerPos().y + this.height
            )
          );
      }
    } else if (player.getPos().x < this.getCornerPos().x + this.width) {
      // On the same x as the object

      if (player.getPos().y < this.getCornerPos().y) {
        //Top wall
        return this.getCornerPos().y - player.getPos().y;
      } else if (player.getPos().y < this.getCornerPos().y + this.height) {
        //Inside the object
        return 0;
      } else {
        //Bottom wall
        return player.getPos().y - (this.getCornerPos().y + this.height);
      }
    } else {
      //Player is to the right of the object

      if (player.getPos().y < this.getCornerPos().y) {
        //Top right corner
        return player
          .getPos()
          .getDistance(
            new Vector2(
              this.getCornerPos().x + this.width,
              this.getCornerPos().y
            )
          );
      } else if (player.getPos().y < this.getCornerPos().y + this.height) {
        //Right wall
        return player.getPos().x - (this.getCornerPos().x + this.width);
      } else {
        //Bottom right corner
        return player
          .getPos()
          .getDistance(
            new Vector2(
              this.getCornerPos().x + this.width,
              this.getCornerPos().y + this.height
            )
          );
      }
    }
    return 0;
  }
  getCornerPos() {
    return new Vector2(
      this.gameObject.pos.x + this.offset.x,
      this.gameObject.pos.y + this.offset.y
    );
  }
}

//Game specific variables------------------------------------------------------------------------------------------

let player = new Player();
let playerCollider = player.getComponent(BoxCollider);
player.instantiate(new Vector2(250, 100));

let counter = new GameObject();
counter.addComponent(
  new SpriteRenderer(counter, new SpriteSheet("objects/counter.png", 78, 33))
);
counter.addComponent(
  new BoxCollider(counter, 78, 17, new Vector2(0, 16)),
  new BoxCollider(counter, 15, 16, new Vector2(63, 0))
);
counter.instantiate(new Vector2(15, 130));

let box = new GameObject();
box.addComponent(
  new SpriteRenderer(
    box,
    new SpriteSheet("objects/objects.png", 16, 16, 14),
    5
  ),
  new BoxCollider(box, 14, 11, new Vector2(1, 3)),
  new InteractionHandler(
    box,
    () => {
      console.log("one");
    },
    14,
    11,
    new Vector2(1, 3)
  )
);
box.instantiate(new Vector2(540, 280));

let box2 = new GameObject();
box2.addComponent(
  new SpriteRenderer(
    box2,
    new SpriteSheet("objects/objects.png", 16, 16, 14),
    5
  ),
  new BoxCollider(box2, 14, 11, new Vector2(1, 3)),
  new InteractionHandler(
    box2,
    () => {
      console.log("two");
    },
    14,
    11,
    new Vector2(1, 3)
  )
);
box2.instantiate(new Vector2(400, 280));

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

// Update (Avoid changing)----------------------------------------

let lastTimestamp = 0,
  maxFPS = 10,
  timestep = 1000 / maxFPS;

function update(timestamp) {
  ctx.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
  gameManager.sortObjects();
  gameManager.instantiated.forEach((obj) => {
    obj.activeComponents.forEach((component) => {
      component.run(timestamp);
    });
  });
  player.run();

  if (!(timestamp - lastTimestamp < timestep)) {
    lastTimestamp = timestamp;
  }
  requestAnimationFrame(update);
}

function clamp(num, min, max) {
  num = Math.min(Math.max(num, min), max);
}

requestAnimationFrame(update);
