var app = 
{
	init: false,
	assets:
	{
		meshes: {},
		textures: {},
		materials: {},
		load_count: 0,
	},
};

function preload()
{
	// MESHES //
	load_mesh('base', 'json/skateboard_base.json');
	load_mesh('top', 'json/skateboard_top.json');
	load_mesh('trucks', 'json/skateboard_trucks.json');
	load_mesh('wheels', 'json/skateboard_wheels.json');

	// TEXTURES //
	load_texture('blank', 'img/blank.png'),
	load_texture('lightmap', 'img/lightmap.png'),
	load_texture('env', 'img/env_map.jpg'),
	load_texture('pattern', 'img/pattern.jpg'),

	// SHADERS //
	//load_shader('normals', 'glsl/normals.glsl');

	load_shader('background', 'glsl/background.glsl',
	{
		colour: {value: new THREE.Vector3(0.2,0.1,0.3,1) },
	});

	load_shader('overlay', 'glsl/vignette.glsl');

	load_shader('metal', 'glsl/wheels.glsl', 
	{
		colour: {value: new THREE.Vector4(1,1,1,1) },
		envmap: {value: null},
		lightmap: {value: null},
		diffuse: {value: null},
		shinyness: {value: 1.0},
	});

	requestAnimationFrame(update);
}
window.addEventListener('load', preload);

function init() 
{

	app.input = Input();
	app.last_time = performance.now(); //@todo replace with Threejs clock thingy

	app.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
	app.camera.position.z = 3;
	app.scene = new THREE.Scene();

	app.carousel = 
	{
		root: new THREE.Group(),
		items: [],
		background: null,
		index: 0,
		gap: 3.4,
	};

	app.colours = 
	[
		new THREE.Vector3(0.1,0.1,0.11),
		new THREE.Vector3(0.3,0.14,0.18),
		new THREE.Vector3(0.1,0.12,0.42),
	];

	var meshes = app.assets.meshes;
	var materials = app.assets.materials;
	var textures = app.assets.textures;

	meshes.quad = new THREE.PlaneGeometry(2, 2);
	materials.background.depthTest = false;
	app.carousel.background = new THREE.Mesh(meshes.quad, materials.background);
	app.scene.add(app.carousel.background);

	/*
	materials.physical = new THREE.MeshPhysicalMaterial(
	{
		color: '#FFFFFF',
	});

	var light = new THREE.DirectionalLight(0xffffff, 0.8);
	light.position.set(3.0,3.0,-0.2);
	app.scene.add(light);
	*/

	var num_skateboards = 3;
	for(var i = 0; i < num_skateboards; ++i)
	{
		var skateboard = {};

		var group = new THREE.Group();
		skateboard.group = group;
		group.position.x = i * app.carousel.gap;
		//group.rotation.x = 30 * THREE.Math.DEG2RAD;
		group.rotation.z = 90 * THREE.Math.DEG2RAD;
		group.parent = app.carousel.root;

		var top_mat = materials.metal.clone();
		top_mat.uniforms.lightmap.value = textures.lightmap;
		top_mat.uniforms.diffuse.value = textures.blank;
		top_mat.uniforms.envmap.value = textures.env;
		top_mat.uniforms.shinyness.value = 0.0;

		skateboard.top = new THREE.Mesh(meshes.top, top_mat);
		group.add(skateboard.top);

		var base_mat = materials.metal.clone();
		base_mat.uniforms.lightmap.value = textures.lightmap;
		base_mat.uniforms.diffuse.value = textures.pattern;
		base_mat.uniforms.envmap.value = textures.env;
		base_mat.uniforms.shinyness.value = 0.1;
		
		skateboard.base = new THREE.Mesh(meshes.base, base_mat);
		group.add(skateboard.base);

		var wheels_mat = materials.metal.clone();
		wheels_mat.uniforms.lightmap.value = textures.lightmap;
		wheels_mat.uniforms.diffuse.value = textures.blank;
		wheels_mat.uniforms.envmap.value = textures.env;
		wheels_mat.uniforms.shinyness.value = 0.4;

		skateboard.wheels = new THREE.Mesh(meshes.wheels, wheels_mat);
		group.add(skateboard.wheels);

		var trucks_mat = materials.metal.clone();
		trucks_mat.uniforms.lightmap.value = textures.lightmap;
		trucks_mat.uniforms.diffuse.value = textures.blank;
		trucks_mat.uniforms.envmap.value = textures.env;
		trucks_mat.uniforms.shinyness.value = 0.3;

		skateboard.trucks = new THREE.Mesh(meshes.trucks, trucks_mat);
		group.add(skateboard.trucks);

		app.carousel.items.push(skateboard);
		app.carousel.root.add(group);
	}

	app.scene.add(app.carousel.root);

	/*
	app.carousel.overlay = new THREE.Mesh(meshes.quad, materials.overlay);
	materials.overlay.depthTest = false;
	app.scene.add(app.carousel.overlay);
	*/

	// COLOUR PICKER
	app.colour = new THREE.Vector3();

	var picker = document.createElement('input');
	picker.setAttribute('type', 'color');
	document.body.append(picker);
	picker.addEventListener('change', function(e)
	{
		var current_board = app.carousel.items[app.carousel.index];
		var colour = current_board.wheels.material.uniforms.colour.value;
		hex_to_rgb(colour, e.target.value, true);
	});
	picker.style.position = 'absolute';
	picker.style.top = '30px';
	picker.style.left = '30px';
	app.picker = picker;

	app.renderer = new THREE.WebGLRenderer({antialias: true});
	app.renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(app.renderer.domElement);

	app.init = true;
	console.log('init')
}

function update(t)
{
	requestAnimationFrame(update);
	
	if(app.assets.load_count > 0) return;
	if(app.assets.load_count === 0 && app.init === false)
	{
		init();
		return;
	}

	var dt = (t - app.last_time) / 1000;
	app.last_time = t;

	if(app.assets_loaded === false) return;

	var cam = app.camera;
	debug_camera_controls(cam, dt);

	var carousel = app.carousel;

	if(key_down(Keys.LEFT)) carousel.index --;
	if(key_down(Keys.RIGHT)) carousel.index ++;

	carousel.index = clamp(carousel.index, 0, carousel.items.length-1);
	carousel.root.position.x = THREE.Math.lerp(carousel.root.position.x, -carousel.index * carousel.gap, dt * 5.0);


	if(key_down(Keys.Y))
	{
		var current_board = carousel.items[carousel.index];
		current_board.wheels.material.uniforms.colour.value.set(0,1,0,1);
	}

	for(var i = 0; i < carousel.items.length; ++i)
	{
		var item = carousel.items[i].group;

		var scale = item.scale.x;
		if(i === carousel.index)
		{
			//scale = THREE.Math.lerp(scale, 1.0, dt * 5.0);
			//item.scale.setScalar(scale);
			item.position.z = THREE.Math.lerp(item.position.z, 1.0, dt * 5.0);
			//item.rotation.y = THREE.Math.lerp(item.rotation.y, -30.0 * THREE.Math.DEG2RAD, dt * 5.0);
			item.rotation.y += dt;

		}
		else
		{
			//scale = THREE.Math.lerp(scale, 0.5, dt * 5.0);
			//item.scale.setScalar(scale);
			item.position.z = THREE.Math.lerp(item.position.z, 0.0, dt * 5.0);
			// /item.rotation.y = THREE.Math.lerp(item.rotation.y, 30 * THREE.Math.DEG2RAD, dt * 5.0);
		}
	}

	var col = carousel.background.material.uniforms.colour.value;
	col.lerp(app.colours[carousel.index], dt * 5.0);

	render();
	update_input();
}

function render() 
{
	var scene = app.scene;
	var cam = app.camera;

	app.renderer.render(scene, cam);
}

