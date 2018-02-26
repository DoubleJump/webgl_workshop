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
	load_mesh('base', 'json/skateboard_base.json');
	load_mesh('top', 'json/skateboard_top.json');
	load_mesh('trucks', 'json/skateboard_trucks.json');
	load_mesh('wheels', 'json/skateboard_wheels.json');

	load_texture('orange', 'img/mc_orange.jpg'),
	load_texture('blue', 'img/mc_blue.jpg'),

	load_shader('normals', 'glsl/normals.glsl');
	load_shader('matcap', 'glsl/matcap.glsl',
	{
		matcap: {value: null},
	});
	load_shader('metal', 'glsl/wheels.glsl', 
	{
		colour: {value: new THREE.Vector4(1,0,0,1) },
	});

	requestAnimationFrame(update);
}
window.addEventListener('load', preload);

function init() 
{
	app.input = Input();
	app.last_time = performance.now(); //@todo replace with Threejs clock thingy

	app.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
	app.camera.position.z = 1;
	app.scene = new THREE.Scene();

	app.carousel = 
	{
		root: new THREE.Group(),
		items: [],
		index: 0,
	};

	var meshes = app.assets.meshes;
	var materials = app.assets.materials;
	var textures = app.assets.textures;

	var num_skateboards = 6;
	for(var i = 0; i < num_skateboards; ++i)
	{
		var skateboard = {};

		skateboard.wheel_colour = new THREE.Vector4(1,0,0,1);
		skateboard.truck_colour = new THREE.Vector4(0,0,1,1);
		skateboard.base_texture = textures.blue;

		var wheel_mat = materials.metal.clone();
		wheel_mat.uniforms.colour.value = skateboard.wheel_colour;

		var truck_mat = materials.metal.clone();
		truck_mat.uniforms.colour.value = skateboard.truck_colour;

		/*
		var base_mat = materials.artwork.clone();
		base_mat.uniforms.image.value = skateboard.base_texture;
		*/

		skateboard.top = new THREE.Mesh(meshes.top, materials.normals);
		skateboard.base = new THREE.Mesh(meshes.base, materials.normals);
		skateboard.wheels = new THREE.Mesh(meshes.wheels, wheel_mat);
		skateboard.trucks = new THREE.Mesh(meshes.trucks, truck_mat);

		var group = new THREE.Group();
		group.position.x = i * 0.5;
		group.rotation.z = 90 * THREE.Math.DEG2RAD;
		group.parent = app.carousel.root;
		group.add(skateboard.top);
		group.add(skateboard.base);
		group.add(skateboard.wheels);
		group.add(skateboard.trucks);
		skateboard.group = group;

		app.carousel.items.push(skateboard);
		app.carousel.root.add(group);
	}

	app.scene.add(app.carousel.root);

	app.renderer = new THREE.WebGLRenderer({antialias: false});
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
	carousel.root.position.x = THREE.Math.lerp(carousel.root.position.x, -carousel.index * 0.5, dt * 5.0);


	if(key_down(Keys.Y))
	{
		carousel.items[2].wheel_colour.set(0,1,0,1);
	}

	for(var i = 0; i < carousel.items.length; ++i)
	{
		var item = carousel.items[i].group;

		var scale = item.scale.x;
		if(i === carousel.index)
		{
			scale = THREE.Math.lerp(scale, 1.0, dt * 5.0);
			item.scale.setScalar(scale);
			item.rotation.y = THREE.Math.lerp(item.rotation.y, 30.0 * THREE.Math.DEG2RAD, dt * 5.0);
		}
		else
		{
			scale = THREE.Math.lerp(scale, 0.5, dt * 5.0);
			item.scale.setScalar(scale);
			item.rotation.y = THREE.Math.lerp(item.rotation.y, 0.0, dt * 5.0);
		}
	}
	
	render();
	update_input();
}

function render() 
{
	var scene = app.scene;
	var cam = app.camera;

	app.renderer.render(scene, cam);
}

