var ThreeBox = function ThreeBox(container, stats) {
	var _self = this,
		_container = container,
		_stats = stats;
		
	var _camera,
		_scene,
		_renderer;
	
	var _metrics = {
		stage: {
			width: 720,
			height: 420
		},
		world: {
			width: 720,
			height: 300  
		},
		boxThickness: 50
	}
	
	var _frameRate = 30;
	
	var _timeStep = 1/10,
		_iterations = 1;
	
	var _worldAABB,
		_world;

	var _missles = [];
	
	var _mouseX,
		_mouseY,
		_mouseDown = false;
		
	var _cameraAngleX = 90,
		_cameraAngleY = 0;
		
	var _fov = 45,
		_near = 1,
		_far = 3000;
	
	function init() {
		initView();
		initAxis();
		initLights();
		initBox2d();
		
		initEvents();
		
		setInterval(loop, 1000/_frameRate);		
	}
	
	function initEvents() {
		/*
		 * Event handlers
		 */
		document.onmousemove = function(event){
			if(undefined !== _mouseX) {
				var deltaX = event.offsetX-_mouseX,
					deltaY = event.offsetY-_mouseY;
				
				_cameraAngleX += deltaX;
				_cameraAngleY += deltaY;
				
				_camera.position.x = Math.cos( _cameraAngleX * (Math.PI/180)) * 1000;
				_camera.position.y = Math.sin( _cameraAngleY * (Math.PI/180)) * 1000;
			}
			
			_mouseX = event.offsetX;
			_mouseY = event.offsetY;
		};
		document.onmousedown = function(event){
			_mouseDown = true;
			
			addRandMissle();
		};
		document.onmouseup = function(event){
			_mouseDown = false;
		};
	}
	
	function initBox2d() {
		var boundsX1 = -_metrics.world.width,
			boundsY1 = -_metrics.world.height,
			boundsX2 = _metrics.world.width,
			boundsY2 = _metrics.world.height,
			width = Math.abs(boundsX2-boundsX1),
			height=Math.abs(boundsY2-boundsY1),
			boxThickness = _metrics.boxThickness;
		 	
		/*
		 * Create world
		 */
		_worldAABB = new b2AABB();
		_worldAABB.minVertex.Set( boundsX1*2, boundsY1*2 );
		_worldAABB.maxVertex.Set( boundsX2*2, boundsY2*2);

		_world = new b2World( _worldAABB, new b2Vec2( 0, -10.0 ), true );
		
		//drawBox(boundsX1,boundsY1,boundsX2,boundsY2);
		
		/*
		 * Draw walls
		 */
		
		
		// Floor
		drawWall(boundsX1, boundsY1, width, boxThickness, 0, boundsY1+boxThickness/2, 0);
		
		// Ceiling
		drawWall(boundsX1, -boundsY1, width, boxThickness, 0, boundsY2-boxThickness/2, 0);
		
		// Left wall
		drawWall(boundsX1, -boundsY1, boxThickness, height, boundsX1+boxThickness/2, 0, 0);
		
		// Right wall
		drawWall(boundsX2, boundsY1, boxThickness, height, boundsX2-boxThickness/2, 0, 0);
	}
	
	function drawWall(x,y,width,height, cX,cY,cZ) {
		/*
		 * Create box
		 */
		var boxSd = new b2BoxDef();
		boxSd.extents.Set(width, height);
		boxSd.friction = 1;
		var boxBd = new b2BodyDef();
		boxBd.AddShape(boxSd);
		boxBd.position.Set(x, y);
		
		_world.CreateBody(boxBd);
		drawBox(x,y,width,height, cX, cY, cZ);
	}
	
	function drawBox(x1,y1, width,height, centerX, centerY, centerZ) {
		var material = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, wireframe: false } ),
		//	geometry = new Cube(width, height, _far*2, 100, 100),
			geometry = new Cube(width, height, 200, 1, 1),
			cube = new THREE.Mesh( geometry, material );

		cube.overdraw = false;
		cube.doublesided = true;
		
		cube.position.x = centerX;
		cube.position.y = centerY;
		cube.position.z = centerZ;
		//cube.position.z = 0;
		
		_scene.addObject(cube);
	}
	
	function addSphereVisual(x,y,radius, restitution) {
		var sphere,
		 	geometry,
			material = new THREE.MeshBasicMaterial( { color: 0xffff + (0xff*restitution), wireframe: true } );
		
		geometry = new Sphere( radius, 14, 7, false );
			
		sphere = new THREE.Mesh( geometry, material );
		sphere.overdraw = false;
		sphere.doubleSided = true;

		sphere.position.x = x;
		sphere.position.y = y;
		sphere.position.z = 0;

		_scene.addObject( sphere );
		return sphere;
	}
	
	function addSphere() {
		var b2body = new b2BodyDef(),
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
		_missles.push( body );
	}
	
	function addCubeVisual(x,y,width,height,depth, restitution) {
		var geometry = new Cube( width,height,depth, 1, 1 ),
			material = new THREE.MeshBasicMaterial( { color: 0xffff + (0xff*restitution), wireframe: true } ),
			cube = new THREE.Mesh( geometry, material );
		
		cube.overdraw = true;
		cube.doubleSided = true;

		cube.position.x = x;
		cube.position.y = y;
		cube.position.z = 0;
 
		_scene.addObject( cube );
		return cube;
	}
	
	function addCube() {
		var b2body = new b2BodyDef(),
			box = new b2BoxDef(),
			width = Math.random() * 80+20,
			height = width,
			depth = height,
			x = _metrics.world.width-width-1-_metrics.boxThickness,
			y = -_metrics.world.height+height+1+_metrics.boxThickness,
			restitution = Math.random();
			
		box.extents.Set(width/2, height/2);
		box.density = 1.0;
		box.friction = 1.0;
		box.restitution = restitution;
		
		b2body.AddShape(box);
		b2body.userData = {element: addCubeVisual(x,y,width,height,depth, restitution)};
	
		b2body.position.Set( x, y );
		//b2body.linearVelocity.Set( Math.random() * 400 - 200, Math.random() * 400 - 200 );
		//b2body.linearVelocity.Set( 100, 100 );
		var body = _world.CreateBody(b2body);
		
		var force = 500000;
		
		body.ApplyImpulse( new b2Vec2(-force, force), new b2Vec2(_metrics.world.width, -_metrics.world.height) );
		//body.ApplyImpulse( new b2Vec2(Math.random() * 400 , Math.random() * 400 ), new b2Vec2(0,0) );
		_missles.push( body );
	}
	
	function addRandMissle() {
		var rVal = Math.random() * 2;
		
		
		if(rVal > 1) {
			addSphere();
		}
		else {
			addCube();
		}
		//addCube();
	}
		
	function initView() {
		_camera = new THREE.Camera( _fov, _metrics.stage.width / _metrics.stage.height, _near, _far );
		//_camera.position.y = 200;
		_camera.position.z = 1000;
		
		_scene = new THREE.Scene();
		
		_renderer = new THREE.CanvasRenderer();
		_renderer.setSize( _metrics.stage.width, _metrics.stage.height );
		
		_container.appendChild(_renderer.domElement);
	}
	
	function initAxis() {
		var geometryX = new THREE.Geometry(),
			geometryY = new THREE.Geometry(),
			geometryZ = new THREE.Geometry(),
			material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } ),
			lineX,
			lineY,
			lineZ;

		
		geometryX.vertices.push( new THREE.Vertex( new THREE.Vector3( 1000, 0, 0 ) ) );
		geometryX.vertices.push( new THREE.Vertex( new THREE.Vector3( -1000, 0, 0 ) ) );
		
		geometryY.vertices.push( new THREE.Vertex( new THREE.Vector3( 0, 1000, 0 ) ) );
		geometryY.vertices.push( new THREE.Vertex( new THREE.Vector3( 0, -1000, 0 ) ) );
		
		geometryZ.vertices.push( new THREE.Vertex( new THREE.Vector3( 0, 0, 1000 ) ) );
		geometryZ.vertices.push( new THREE.Vertex( new THREE.Vector3( 0, 0, -1000 ) ) );
		
		lineX = new THREE.Line( geometryX, material );
		_scene.addObject( lineX );
		
		lineY = new THREE.Line( geometryY, material );
		_scene.addObject( lineY );
		
		lineZ = new THREE.Line( geometryZ, material );
		_scene.addObject( lineZ );

	}
	
	function initLights() {
		_scene.addLight( new THREE.AmbientLight( Math.random() * 0x202020 ) );
	}
	
	function loop() {
		/*_world.m_gravity.x = Math.sin(_cameraAngleX * (Math.PI/180))*100;
		_world.m_gravity.y = -Math.cos(_cameraAngleY * (Math.PI/180))*100;*/
		
		_world.Step(_timeStep, _iterations);
		
		for(var i = 0, max = _missles.length; i < max; i++) {
			var body = _missles[i];
			var missle = body.m_userData.element;

			missle.rotation.z = body.m_rotation0;
			
			missle.position.x = body.m_position0.x;
			missle.position.y = body.m_position0.y;
			
		}
		
		_renderer.render( _scene, _camera );
		
		_stats.update();
	}
	
	init();
}

function main() {
	var container = document.createElement('div'),
		stats = new Stats(),
		threeBox;
	
	document.body.appendChild(container);
	
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	
	container.appendChild(stats.domElement);
	
	threeBox = new ThreeBox(container, stats);
}

main();
