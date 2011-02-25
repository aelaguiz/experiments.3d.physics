Physics = function Physics() {
	
}

/*var b2body = new b2BodyDef(),
			circle = new b2CircleDef(),
			radius = Math.random() * 80+20,
			x = _metrics.world.width-radius-10-_metrics.boxThickness,
			y = -_metrics.world.height+radius+10+_metrics.boxThickness,
			restitution = Math.random();
			
		circle.radius = radius;
		circle.density = 1.0;
		circle.friction = 1.0;
		circle.restitution = restitution;
		
		b2body.AddShape(circle);
		b2body.userData = {element: addSphereVisual(x,y,radius, restitution)};
	
		b2body.position.Set( x, y );
		//b2body.linearVelocity.Set( Math.random() * 400 - 200, Math.random() * 400 - 200 );
		//b2body.linearVelocity.Set( 100, 100 );
		var body = _world.CreateBody(b2body);
		
		var force = 500000;
		
		body.ApplyImpulse( new b2Vec2(-force, force), new b2Vec2(_metrics.world.width, -_metrics.world.height) );
		//body.ApplyImpulse( new b2Vec2(Math.random() * 400 , Math.random() * 400 ), new b2Vec2(0,0) );
		_missles.push( body );*/

/*
 * Creates a box in the physics world, coordinates in model coordinates (not screen)
 */
Physics.prototype.createSphere = function createSphere(world, x,y,radius,density,friction,restitution) {
	var b2body = new b2BodyDef(),
		circle = new b2CircleDef();
		
	circle.radius = radius;
	circle.density = density;
	circle.friction = friction;
	circle.restitution = restitution;
	
	b2body.AddShape(circle);
	b2body.position.Set( x, y );
	
	return world.CreateBody(b2body);
}
		
/*
 * Creates a box in the physics world, coordinates in model coordinates (not screen)
 */
Physics.prototype.createBox = function createBox(world, x,y,width,height,density,friction,restitution) {
	var boxSd = new b2BoxDef();
	boxSd.extents.Set(width, height);
	boxSd.density = density;
	boxSd.friction = friction;
	boxSd.restitution = restitution;
	
	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(x, y);
	
	return world.CreateBody(boxBd);
}

Physics.prototype.syncCoords =  function syncCoords(physicsBody, gameObjectModel) {
	gameObjectModel.x = physicsBody.m_position0.x;
	gameObjectModel.y = physicsBody.m_position0.y;
}

PH = new Physics();

GameUtil = {
	/**
	 * Converts model coordinates to screen coordinates for a point
	 */
	screenPoint: function screenPoint(x,y,screenPoint) {
		screenPoint.x = x<<1;
		screenPoint.y = y<<1;
	},
	/**
	 * Converts model coordinates to screen coordinates for a rectangle
	 */
	screenRect: function screenRect(x,y,width,height,screenRect) {
		screenRect.x = x-width>>1;
		screenRect.y = y-height>>1;
		screenRect.width = width;
		screenRect.height = height;
	},
	zeroPoint: new b2Vec2(0,0)
}
View = function View() {
	
} 
/**
 * Directions bit mask
 */
DIRS = {
	none: 0x00,
	left: 0x01,
	right: 0x02,
	up: 0x04,
	down: 0x08,
	
	stringVal: function stringVal(dir) {
		var ret = "";
		
		if(dir & DIRS.right) {
			ret = "right";			
		}
		else if(dir & DIRS.left) {
			ret = "left";
		}
		
		if(dir & DIRS.up) {
			if('' != ret)
				ret += " + ";
				
			ret += "up";
		}
		else if(dir & DIRS.down) {
			if('' != ret)
				ret += " + ";
				
			ret += "down";
		}
		
		if('' == ret) {
			ret = "none";
		}
		
		return ret;
	},
	
	opposite: function opposite(dir) {
		var ret = DIRS.none;
		
		if(dir & DIRS.right) {
			ret |= DIRS.left;			
		}
		else if(dir & DIRS.left) {
			ret |= DIRS.right;
		}
		
		if(dir & DIRS.up) {
			ret |= DIRS.down;
		}
		else if(dir & DIRS.down) {
			ret |= DIRS.up;
		}
		
		return ret;
	}
}

PlayerModel = function PlayerModel(x,y) {
	this.x = x;
	this.y = y;
	
	this.width = 5;
	this.height = 10;
	
	this.physics = {
		friction: 1.0,
		density: 1,
		restitution: 0.0,
		forces: {
			continueMove: 500,
			newMove: 100,
			newDirection: 4000
		},
		body: undefined
	}
	
	this.state = {
		direction: DIRS.none
	}
}

PlayerView = function PlayerView(playerModel) {
	View.call(this);
	
	this.playerModel = playerModel;
}

PlayerView.prototype = new View();
PlayerView.prototype.constructor = PlayerView;

PlayerView.prototype.render = function render( graphics, viewPort) {
	var player = this.playerModel,
		sr = {},
		rect = GameUtil.screenRect(player.x,player.y,player.width,player.height,sr);
		
	graphics.beginPath();
	graphics.rect(sr.x, sr.y, sr.width, sr.height);
	graphics.stroke();
}

PlayerController = function PlayerController(playerModel) {
	this.playerModel = playerModel;
}

/**
 * Expects canvas local coordinates
 */
PlayerController.prototype.setMousePos = function setMousePos(x,y) {
	var self = this,
		player = this.playerModel,
		calcDir = DIRS.none,
		force,
		forceDir;
	
	if(x > player.x)
		calcDir |= DIRS.right;
	else if(x < player.x)
		calcDir |= DIRS.left;
		
	if(y > player.y) {
		calcDir = DIRS.none;
	}
	else if(y < player.y) {
		calcDir |= DIRS.up;
	}
		
	/*
	 * If there has been a direction change
	 */
	if(calcDir != player.state.direction) {
		console.log("New direction = " + DIRS.stringVal(calcDir) + " at " + player.x.toFixed(2) + "," + player.y.toFixed(2));
	
		if(undefined !== this.movementTimer) {
			clearInterval(this.movementTimer);
			delete this.movementTimer;
		}
		
		forceDir = calcDir;
		
		if(DIRS.none == player.state.direction) { // If currently not moving, the new movement should be a "new move"
			force = player.physics.forces.newMove;
		}
		else {
			if(DIRS.none == calcDir) { // If stopping, new movement should be a new direction (aka stop)
				console.log("Stopping");
				force = player.physics.forces.newDirection;
				forceDir = DIRS.opposite(player.state.direction);
			}
			else {
				force = player.physics.forces.newDirection;
			}
		}
		
		player.state.direction = calcDir;
		
		if(null != player.physics.body.m_contactList) {
			this.applyDirection(force, forceDir);
		}
		
		if(DIRS.none != calcDir) {
			this.movementTimer = setInterval(function() { self.movementTick(player.physics.forces.continueMove); }, 500);
		}
	}
}

PlayerController.prototype.movementTick = function movementTick(force) {
	var player = this.playerModel;
	
	if(null != player.physics.body.m_contactList) {
		this.applyDirection(force, player.state.direction);
	}
}

/**
 * Adds the correct force for the specified direction
 */
PlayerController.prototype.applyDirection = function applyDirection(force, forceDir) {
	var player = this.playerModel,
		newForce = this.getDirectionForce(forceDir, force);
	
	// Apply the new movement force
	player.physics.body.ApplyForce(newForce, GameUtil.zeroPoint);
	console.log("Applying movement force " + newForce.x);
}

/**
 * Creates a force vector for lateral movement of the player
 */
PlayerController.prototype.getDirectionForce = function getDirectionForce(dir, force) {
	if(dir & DIRS.right) {
		// Moving to the right, force from the left
		return new b2Vec2(force, 0);
	}
	else if(dir & DIRS.left) {
		// Moving to the left, force from the right
		return new b2Vec2(-force, 0);
	}
	
	// No force
	return new b2Vec2(0,0);
}

PlayerController.prototype.initPhysics = function initPhysics(world) {
	var player = this.playerModel;
	
	player.physics.body =  PH.createSphere(world, player.x, player.y, player.width, player.physics.density, player.physics.friction, player.physics.restitution);
	//player.physics.body =  PH.createBox(world, player.x, player.y, player.width, player.height, player.physics.density, player.physics.friction, player.physics.restitution);
	
	//var force = 500000;
	//player.physics.body.ApplyImpulse( new b2Vec2(-force, force), new b2Vec2(-10, -10) );
		
}

PlayerController.prototype.syncPhysical = function syncPhysical() {
	var player = this.playerModel;
	
	PH.syncCoords(player.physics.body, player);
	
	//console.log("Player is at " + player.x + ", " + player.y);
}

PlatformModel = function PlatformModel(x,y,width,height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	
	this.physics = {
		friction: 1.0,
		restitution: 0.0,
		body: undefined
	};
}

PlatformView = function PlatformView() {
	View.call(this);
}

PlatformView.prototype = new View();
PlatformView.prototype.constructor = PlatformView;

PlatformView.prototype.render = function render(platform, graphics, viewPort) {
	var sr = {},
		rect = GameUtil.screenRect(platform.x,platform.y,platform.width,platform.height,sr);
		
	graphics.beginPath();
	graphics.rect(sr.x, sr.y, sr.width, sr.height);
	graphics.stroke();
}

PlatformController = function PlatformController() {
	
}

PlatformController.prototype.initPhysics = function initPhysics(platform, world) {
	var boxSd = new b2BoxDef();
	boxSd.extents.Set(platform.width, platform.height);
	boxSd.friction = platform.physics.friction;
	boxSd.restitution = platform.physics.restitution;
	// Density not specified so this is a fixexd object
	
	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(platform.x, platform.y);
	
	platform.physics.body = world.CreateBody(boxBd);
}

PlatformController.prototype.syncPhysical = function syncPhysical(platform) {
	PH.syncCoords(platform.physics.body, platform);
}

MapModel = function MapModel() {
	this.world = {
		width: 10000,
		height: 2000
	}
	
	this.platforms = [ 
		new PlatformModel(50, 200, 5000, 20)
	]
}

WorldModel = function WorldModel() {	
	this.physics = {
		worldAABB: undefined,
		world: undefined,
		bodies: {
			ground: undefined
		}
	};
		
	this.metrics = {
		stage: {
			width: 720,
			height: 420
		},
		viewPort: {
			x: 0,
			y: 0, 
			width: 720,
			height: 420
		}
	}
	
	this.map = new MapModel();
	this.player = new PlayerModel(150, 50),

	this.mouseX;
	this.mouseY;
	this.mouseDown = false;
}

WorldView = function WorldView(worldModel) {
	View.call(this);
	
	this.worldModel = worldModel;
	this.platformView = new PlatformView();
	this.playerView = new PlayerView(worldModel.player);
}

WorldView.prototype = new View();
WorldView.prototype.constructor = WorldView;

WorldView.prototype.init = function init() {

}

WorldView.prototype.render = function render(graphics) {
	graphics.clearRect(0, 0, this.worldModel.metrics.stage.width, this.worldModel.metrics.stage.height);
	
	graphics.lineWidth = 1;
	
	graphics.strokeRect(0, 0, this.worldModel.metrics.stage.width, this.worldModel.metrics.stage.height);
	
	for(var i = 0, max = this.worldModel.map.platforms.length; i < max; i++) {
		var platform = this.worldModel.map.platforms[i];
		
		this.platformView.render(platform,graphics, this.worldModel.metrics.viewPort);
	}
	
	this.playerView.render(graphics, this.worldModel.metrics.viewPort);
}

WorldController = function WorldController(canvas, stats) {
	this.canvas = canvas,
	this.stats = stats;
	
	this.metrics = {
		timeStep: 1/10,
		iterations: 1,
		frameRate: 30
	}
		
	this.worldModel = new WorldModel();
	this.worldView = new WorldView(this.worldModel);
	this.platformController = new PlatformController();
	this.playerController = new PlayerController(this.worldModel.player);
}

WorldController.prototype.init = function init() {
	var self = this;
	
	this.initView();
	this.initEvents();
	this.initPhysics();
	
	this.worldView.init();
	
	setInterval(function() { self.loop(); }, 1000/this.metrics.frameRate);	
}

WorldController.prototype.initPhysics = function initPhysics() {
	var boundsX1 = 0,
		boundsY1 = 0,
		boundsX2 = this.worldModel.map.world.width,
		boundsY2 = this.worldModel.map.world.height,
		width = Math.abs(boundsX2-boundsX1),
		height= Math.abs(boundsY2-boundsY1);
	 	
	/*
	 * Create world
	 */
	this.worldModel.physics.worldAABB = new b2AABB();
	this.worldModel.physics.worldAABB.minVertex.Set( boundsX1, boundsY1 );
	this.worldModel.physics.worldAABB.maxVertex.Set( boundsX2, boundsY2);

	this.worldModel.physics.world = new b2World( this.worldModel.physics.worldAABB, new b2Vec2( 0.0, 10.0 ), false );
	
	/*
	 * Create ground
	 */
	this.worldModel.physics.bodies.ground = PH.createBox(this.worldModel.physics.world, 0,this.worldModel.map.world.height,this.worldModel.map.world.width,50,1,1,0);
	 
	/*
	 * Create platforms
	 */
	 for(var i = 0, max = this.worldModel.map.platforms.length; i < max; i++) {
		var platform = this.worldModel.map.platforms[i];
		
		this.platformController.initPhysics(platform, this.worldModel.physics.world);
	}
	
	this.playerController.initPhysics(this.worldModel.physics.world);
}

WorldController.prototype.initEvents = function initEvents() {
	var self = this;
	
	/*
	 * Event handlers
	 */
	document.onmousemove = function(event){
		var sp = {};
			GameUtil.screenPoint(event.offsetX,event.offsetY,sp);
			
		if(undefined !== self.worldModel.mouseX) {
			var deltaX = sp.x-self.worldModel.mouseX,
				deltaY = sp.y-self.worldModel.mouseY;
			
		}
		
		self.worldModel.mouseX = sp.x;
		self.worldModel.mouseY = sp.y;
		
		self.playerController.setMousePos(self.worldModel.mouseX, self.worldModel.mouseY);
		
		//console.log(x.toFixed(2) + "," + y.toFixed(2));
	};
	document.onmousedown = function(event){
		self.worldModel.mouseDown = true;
	};
	document.onmouseup = function(event){
		self.worldModel.mouseDown = false;
	};
}

WorldController.prototype.initView = function initView() {
	this.canvas.width = this.worldModel.metrics.stage.width;
	this.canvas.height = this.worldModel.metrics.stage.height;
}

WorldController.prototype.tick = function tick() {
	this.worldModel.physics.world.Step(this.metrics.timeStep, this.metrics.iterations);
	
	this.syncPhysical();
}

WorldController.prototype.render = function render() {
	var graphics = this.canvas.getContext('2d');
	
	this.worldView.render(graphics);
}

WorldController.prototype.loop = function loop() {
	this.tick();
	this.render();
	
	this.stats.update();
}

WorldController.prototype.syncPhysical = function syncPhysical() {
	for(var i = 0, max = this.worldModel.map.platforms.length; i < max; i++) {
		var platform = this.worldModel.map.platforms[i];
		
		this.platformController.syncPhysical(platform);
	}
	
	this.playerController.syncPhysical();
}

function main() {
	var container = document.createElement('div'),
		stats = new Stats(),
		canvas = document.createElement('canvas'),
		world;
	
	document.body.appendChild(container);
	
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	
	container.appendChild(stats.domElement);
	container.appendChild(canvas);
	
	world = new WorldController(canvas, stats);
	world.init();
	
}

main();
