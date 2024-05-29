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

    this.inventory = [];
    this.inventorySize = 4;
    this.inventorySlots = [];

    for (let i = 0; i < this.inventorySize; i++) {
      let newSlot = new InventorySlot();
      this.inventorySlots.push(newSlot);
      newSlot.instantiate(new Vector2(10 + i * 80, 530), true);
      newSlot.contentObject.instantiate(
        new Vector2(newSlot.pos.x + 9, newSlot.pos.y + 9),
        true,
        1
      );
    }
  }

  run() {
    //Make interactions work
    removeEventListener("keydown", this.interaciton);
    eBtn.pos = new Vector2(-Infinity, -Infinity);
    this.interactable.sort((a, b) => a.distance - b.distance);
    let closest = this.interactable[0];

    if (closest.distance <= this.interactable[0].range) {
      eBtn.pos = new Vector2(
        closest.gameObject.pos.x -
          3.5 * gameManager.scale +
          closest.offset.x +
          closest.width / 2,
        closest.gameObject.pos.y - 7 * gameManager.scale
      );
      this.interaciton = (e) => {
        if (e.key == this.interactable[0].key) {
          this.interactable[0].func();
        }
      };
      addEventListener("keydown", this.interaciton);
    }

    //Inventory View
    for (let i = 0; i < this.inventorySize; i++) {
      const item = this.inventory[i];
      const slot = this.inventorySlots[i];
      if (item) {
        slot.contentObject.getComponent(SpriteRenderer).yIndex = item.yIndex;
        slot.contentObject.getComponent(SpriteRenderer).xIndex = item.xIndex;
      } else {
        slot.contentObject.getComponent(SpriteRenderer).yIndex = 0;
        slot.contentObject.getComponent(SpriteRenderer).xIndex = 0;
      }
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

class NPC extends Entity {
  constructor() {
    if (Math.random() > 0.5) {
      super(
        new SpriteSheet("characters/knightIdle.png", 48, 48, 41, 6),
        new SpriteSheet("characters/knightWalking.png", 48, 48, 41, 6)
      );
    } else {
      super(
        new SpriteSheet("characters/goblinIdle.png", 48, 48, 41, 6),
        new SpriteSheet("characters/goblinWalking.png", 48, 48, 41, 6)
      );
    }
    this.addComponent(
      //new BoxCollider(this, 13, 5, new Vector2(18, 35)),
      new NPCController(this)
    );
    this.speed = 4;

    this.request = getRandomObjValue(ITEMS);
  }
}

class Box extends GameObject {
  constructor(inside) {
    super();
    this.inside = inside;
    this.addComponent(
      new SpriteRenderer(
        this,
        new SpriteSheet("objects/objects.png", 16, 16, 14),
        5
      ),
      new BoxCollider(this, 14, 11, new Vector2(1, 3)),
      new InteractionHandler(
        this,
        () => {
          this.pickup();
        },
        14,
        11,
        new Vector2(1, 3)
      )
    );
  }
  pickup() {
    if (player.inventory.length < player.inventorySize) {
      player.inventory.push(this.inside);
    }
  }
}

class Item {
  constructor(name, xIndex, yIndex) {
    this.name = name;
    this.xIndex = xIndex;
    this.yIndex = yIndex;
  }
}

class InventorySlot extends GameObject {
  constructor() {
    super();
    this.addComponent(
      new SpriteRenderer(this, new SpriteSheet("HUD/inventorySlot.png", 22, 22))
    );
    this.contentObject = new GameObject();
    this.contentObject.addComponent(
      new SpriteRenderer(
        this.contentObject,
        new SpriteSheet("HUD/inventorySheet.png", 16, 16)
      )
    );
  }
}

class NPCController extends Component {
  constructor(gameObject) {
    super(gameObject, true);
    this.finalDestination = new Vector2(130, 245);
    this.destination = new Vector2(130, 245 + 30 * NPCs.length);
    this.arrived = false;
    this.leaving = false;
    this.interacitonHandler = new InteractionHandler(
      this.gameObject,
      () => {
        this.hand();
      },
      13,
      19,
      new Vector2(18, 26)
    );
    this.gameObject.getComponent(Animator).row = 2;
  }
  run() {
    if (!this.arrived) {
      this.gameObject.getComponent(Animator).spriteSheet =
        this.gameObject.walkingSpritesheet;
      this.gameObject.transform(
        new Vector2(
          this.destination.x - this.gameObject.getPos().x,
          this.destination.y - this.gameObject.getPos().y
        ),
        this.gameObject.speed
      );
      if (this.destination.getDistance(this.gameObject.getPos()) < 6) {
        this.arrived = true;
        this.gameObject.getComponent(Animator).spriteSheet =
          this.gameObject.idleSpritesheet;
        if (
          !this.leaving &&
          this.finalDestination.getDistance(this.gameObject.getPos()) < 6
        ) {
          this.gameObject.addComponent(this.interacitonHandler);

          wantSlot.contentObject.getComponent(SpriteRenderer).yIndex =
            this.gameObject.request.yIndex;
          wantSlot.contentObject.getComponent(SpriteRenderer).xIndex =
            this.gameObject.request.xIndex;
        }
      }
    }
  }
  hand() {
    if (
      player.inventory[0] &&
      this.gameObject.request.name == player.inventory[0].name
    ) {
      player.inventory.shift();
      wantSlot.contentObject.getComponent(SpriteRenderer).yIndex = 0;
      wantSlot.contentObject.getComponent(SpriteRenderer).xIndex = 0;
      this.gameObject.removeComponent(InteractionHandler);
      this.leaving = true;
      this.destination = new Vector2(415, 670);
      this.arrived = false;
      player.interactable.splice(
        player.interactable.indexOf(this.interacitonHandler),
        1
      );
      NPCs.splice(NPCs.indexOf(this.gameObject), 1);
      NPCs.forEach((npc) => {
        npc.getComponent(NPCController).arrived = false;
        npc.getComponent(NPCController).destination.y -= 30;
      });
      this.gameObject.getComponent(Animator).row = 0;
    }
  }
}

function getRandomObjValue(obj) {
  var keys = Object.keys(obj);
  return obj[keys[(keys.length * Math.random()) << 0]];
}

//Game specific variables------------------------------------------------------------------------------------------

ITEMS = {
  stick: new Item("stick", 4, 3),
  ironOre: new Item("ironOre", 5, 2),
  ironIngot: new Item("ironIngot", 5, 1),
};

let NPCs = [];

let player = new Player();
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

new Box(ITEMS["stick"]).instantiate(new Vector2(540, 220));
new Box(ITEMS["ironOre"]).instantiate(new Vector2(540, 290));
new Box(ITEMS["ironIngot"]).instantiate(new Vector2(540, 360));

trash = new GameObject();
trash.addComponent(
  new SpriteRenderer(trash, new SpriteSheet("HUD/trash.png", 22, 22)),
  new BoxCollider(trash, 22, 22),
  new InteractionHandler(
    trash,
    () => {
      player.inventory.shift();
    },
    22,
    22,
    new Vector2(0, 0)
  )
);
trash.instantiate(new Vector2(534, 534));

let eBtn = new GameObject();
eBtn.addComponent(
  new SpriteRenderer(eBtn, new SpriteSheet("HUD/E-button.png", 7, 7))
);
eBtn.instantiate(new Vector2(-Infinity, -Infinity), true);

let wantSlot = new InventorySlot();
wantSlot.instantiate(new Vector2(40, 125), true);
wantSlot.contentObject.instantiate(
  new Vector2(wantSlot.pos.x + 9, wantSlot.pos.y + 9),
  true,
  1
);

let borders = new GameObject();
borders.addComponent(
  new SpriteRenderer(
    borders,
    new SpriteSheet("HUD/inventorySheet.png", 16, 16) // PLaceholder sprite
  ),
  new BoxCollider(borders, 700, 20, new Vector2(-50, 0)),
  new BoxCollider(borders, 700, 20, new Vector2(-50, 200)),
  new BoxCollider(borders, 20, 700, new Vector2(-20, 0)),
  new BoxCollider(borders, 20, 700, new Vector2(200, 0))
);
borders.instantiate();

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
  timestep = 1000 / maxFPS,
  timer = 0;

function update(timestamp) {
  ctx.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
  gameManager.sortObjects();
  gameManager.instantiatedHUD.forEach((obj) => {
    obj.activeComponents.forEach((component) => {
      component.run(timestamp);
    });
  });
  gameManager.instantiated.forEach((obj) => {
    obj.activeComponents.forEach((component) => {
      component.run(timestamp);
    });
  });

  player.run();

  if (timer >= 40) {
    NPCs.push(new NPC());
    NPCs[NPCs.length - 1].instantiate(new Vector2(280, 470));
    timer = 0;
  }
  if (!(timestamp - lastTimestamp < timestep)) {
    timer++;
    lastTimestamp = timestamp;
  }
  requestAnimationFrame(update);
}

function clamp(num, min, max) {
  num = Math.min(Math.max(num, min), max);
}

requestAnimationFrame(update);
