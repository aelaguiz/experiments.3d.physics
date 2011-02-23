PlayerModel = function PlayerModel(x,y) {
	this.x = x;
	this.y = y;
	
	this.width = 5;
	this.height = 10;
	
	this.physics = {
		body: undefined
	}
}

PlayerView = function PlayerView() {
}

PlayerView.prototype = {
	render: function render(player, graphics, viewPort) {
		var x = player.x-viewPort.x,
			y = player.y-viewPort.y,
			width = (x+player.width > viewPort.width ? viewPort.width-x : player.width),
			height = (y+player.height > viewPort.height ? viewPort.height-y : player.height);
			
		graphics.beginPath();
		graphics.rect(x,y,width,height);
		graphics.stroke();
	}
}

PlayerController = function PlayerController() {
}

PlayerController.prototype = {
	initPhysics: function initPhysics(player, world) {
		var boxSd = new b2BoxDef();
		boxSd.extents.Set(player.width, player.height);
		boxSd.density = 1;
		boxSd.friction = 1;
		boxSd.restitution = 0.0;
		
		var boxBd = new b2BodyDef();
		boxBd.AddShape(boxSd);
		boxBd.position.Set(player.x, player.y);
		
		player.physics.body = world.CreateBody(boxBd);
		
		//var force = 500000;
		//player.physics.body.ApplyImpulse( new b2Vec2(-force, force), new b2Vec2(-10, -10) );
		
	},
	synchPhysical: function synchPhysical(player) {
		player.x = player.physics.body.m_position0.x;
		player.y = player.physics.body.m_position0.y;
		
		//console.log("Player is at " + player.x + ", " + player.y);
	}
}

PlatformModel = function PlatformModel(x,y,width,height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	
	this.physics = {
		friction: 1.0,
		restitution: 1.0,
		body: undefined
	};
}

PlatformView = function PlatformView() {
}

PlatformView.prototype = {
	render: function render(platform, graphics, viewPort) {
		var x = platform.x-viewPort.x,
			y = platform.y-viewPort.y,
			width = (x+platform.width > viewPort.width ? viewPort.width-x : platform.width),
			height = (y+platform.height > viewPort.height ? viewPort.height-y : platform.height);
			
		graphics.beginPath();
		graphics.rect(x,y,width,height);
		graphics.stroke();
	}
}

PlatformController = function PlatformController() {
	
}

PlatformController.prototype = {
	initPhysics: function initPhysics(platform, world) {
		var boxSd = new b2BoxDef();
		boxSd.extents.Set(platform.width, platform.height);
		boxSd.friction = platform.physics.friction;
		boxSd.restitution = platform.physics.restitution;
		
		var boxBd = new b2BodyDef();
		boxBd.AddShape(boxSd);
		boxBd.position.Set(platform.x, platform.y);
		
		platform.physics.body = world.CreateBody(boxBd);
	},
	synchPhysical: function synchPhysical(platform) {
		platform.x = platform.physics.body.m_position0.x;
		platform.y = platform.physics.body.m_position0.y;
	}
}

MapModel = function MapModel() {
	this.world = {
		width: 10000,
		height: 2000
	}
	
	this.platforms = [ 
		new PlatformModel(50, 50, 200, 30)
	]
}

WorldModel = function WorldModel() {	
	this.physics = {
		worldAABB: undefined,
		world: undefined
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
	this.player = new PlayerModel(20, 10),

	this.mouseX;
	this.mouseY;
	this.mouseDown = false;
}

WorldView = function WorldView(worldModel) {
	this.worldModel = worldModel;
	this.platformView = new PlatformView();
	this.playerView = new PlayerView();
}

WorldView.prototype = {
	init: function init() {

	},
	render: function render(graphics) {
		graphics.clearRect(0, 0, this.worldModel.metrics.stage.width, this.worldModel.metrics.stage.height);
		
		for(var i = 0, max = this.worldModel.map.platforms.length; i < max; i++) {
			var platform = this.worldModel.map.platforms[i];
			
			this.platformView.render(platform,graphics, this.worldModel.metrics.viewPort);
		}
		
		this.playerView.render(this.worldModel.player, graphics, this.worldModel.metrics.viewPort);
	}
}


WorldController = function WorldController(canvas, stats) {
	var _self = this;
	
	var _timeStep = 1/10,
		_iterations = 1;
		
	var _frameRate = 30;
	
	var _canvas = canvas,
		_stats = stats;
		
	var _worldModel = new WorldModel(), 
		_worldView = new WorldView(_worldModel),
		_platformController = new PlatformController(),
		_playerController = new PlayerController();
		
	this.init = function init() {
		this.initEvents();
		this.initPhysics();
		
		_worldView.init();
		
		setInterval(function() { _self.loop(); }, 1000/_frameRate);	
	}

	this.initPhysics = function initPhysics() {
		var boundsX1 = 0,
			boundsY1 = 0,
			boundsX2 = _worldModel.map.world.width,
			boundsY2 = _worldModel.map.world.height,
			width = Math.abs(boundsX2-boundsX1),
			height= Math.abs(boundsY2-boundsY1);
		 	
		/*
		 * Create world
		 */
		_worldModel.physics.worldAABB = new b2AABB();
		_worldModel.physics.worldAABB.minVertex.Set( boundsX1, boundsY1 );
		_worldModel.physics.worldAABB.maxVertex.Set( boundsX2, boundsY2);

		_worldModel.physics.world = new b2World( _worldModel.physics.worldAABB, new b2Vec2( 100.0, 100.0 ), true );
		
		/*
		 * Create platforms
		 */
		 for(var i = 0, max = _worldModel.map.platforms.length; i < max; i++) {
			var platform = _worldModel.map.platforms[i];
			
			_platformController.initPhysics(platform, _worldModel.physics.world);
		}
		
		_playerController.initPhysics(_worldModel.player, _worldModel.physics.world);
	}
	
	this.initEvents = function initEvents() {
		/*
		 * Event handlers
		 */
		document.onmousemove = function(event){
			if(undefined !== _worldModel.mouseX) {
				var deltaX = event.offsetX-_worldModel.mouseX,
					deltaY = event.offsetY-_worldModel.mouseY;
				
			}
			
			_worldModel.mouseX = event.offsetX;
			_worldModel.mouseY = event.offsetY;
		};
		document.onmousedown = function(event){
			_worldModel.mouseDown = true;
		};
		document.onmouseup = function(event){
			_worldModel.mouseDown = false;
		};
	}
	
	this.tick = function tick() {
		_worldModel.physics.world.Step(_timeStep, _iterations);
		
		for(var i = 0, max = _worldModel.map.platforms.length; i < max; i++) {
			var platform = _worldModel.map.platforms[i];
			
			_platformController.synchPhysical(platform);
		}
		
		_playerController.synchPhysical(_worldModel.player);
	}
	
	this.render = function render() {
		var graphics = _canvas.getContext('2d');
		
		_worldView.render(graphics);
	}
	
	this.loop = function loop() {
		this.tick();
		this.render();
		
		_stats.update();
	}
	
	this.init();
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
}

main();
