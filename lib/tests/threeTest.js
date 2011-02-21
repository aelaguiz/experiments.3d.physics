ThreeTest = function ThreeTest(container, stats) {
	var _self = this,
		_container = container,
		_stats = stats;
		
	var _camera,
		_scene,
		_renderer;
		
	var _metrics = {
		width: 720,
		height: 320
	}
	
	function init() {
		initView();
		initGrid();
		initLights();
		
		setInterval(loop, 1000/30);		
	}
		
	function initView() {
		_camera = new THREE.Camera( 45, _metrics.width / _metrics.height, 1, 2000 );
//		_camera.position.y = 200;
		_camera.position.z = 800;
		
		_scene = new THREE.Scene();
		
		_renderer = new THREE.CanvasRenderer();
		_renderer.setSize( _metrics.width, _metrics.height );
		
		_container.appendChild(_renderer.domElement);
	}
	
	function initGrid() {
		var geometry = new THREE.Geometry(),
			material;

		geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - 500, 0, 0 ) ) );
		geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( 500, 0, 0 ) ) );
 
		material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );
 
		for ( var i = 0; i <= 10; i ++ ) {
 
			var line = new THREE.Line( geometry, material );
			line.position.y = - 120;
			line.position.z = ( i * 100 ) - 500;
			_scene.addObject( line );
 
			var line = new THREE.Line( geometry, material );
			line.position.x = ( i * 100 ) - 500;
			line.position.y = - 120;
			line.rotation.y = 90 * Math.PI / 180;
			_scene.addObject( line );

		}
	}
	
	function initLights() {
		_scene.addLight( new THREE.AmbientLight( Math.random() * 0x202020 ) );
		
/*		var debugCanvas = document.createElement( 'canvas' );
		debugCanvas.width = 512;
		debugCanvas.height = 512;
		debugCanvas.style.position = 'absolute';
		debugCanvas.style.top = '0px';
		debugCanvas.style.left = '0px';
 
		_container.appendChild( debugCanvas );
 
		var debugContext = debugCanvas.getContext( '2d' );
		debugContext.setTransform( 1, 0, 0, 1, 256, 256 );
		debugContext.strokeStyle = '#000000';*/
	}
	
	function loop() {
		var timer = new Date().getTime() * 0.0010;
 
		_camera.position.x = Math.cos( timer ) * 1000;
		_camera.position.y = Math.sin( timer ) * 1000;
		_camera.position.z = Math.sin( timer ) * 1000;
		
		_renderer.render( _scene, _camera );
		
		_stats.update();
	}
	
	init();
}

function main() {
	var container = document.createElement('div'),
		stats = new Stats();
	
	document.body.appendChild(container);
	
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	
	container.appendChild(stats.domElement);
	
	threeTest = new ThreeTest(container, stats);
}

main();
