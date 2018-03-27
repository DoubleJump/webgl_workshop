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
	// MESHES 
	load_meshes(
	{
		casing: 'json/casing.json',
		pads: 'json/pads.json',
		speakers: 'json/speakers.json',
		headrest: 'json/headrest.json',
		cap: 'json/cap.json',
	});

	// TEXTURES 
	load_textures(
	{
		blank: 'img/blank.png',
		albedo: 'img/albedo.jpg',
		normal: 'img/normal.jpg',
		roughness: 'img/roughness.jpg',
		ambient_occlusion: 'img/ambient_occlusion.jpg',
		envmap: 'img/envmap.jpg',
		envmap_blurred: 'img/env_blurred.jpg',
		shadow: 'img/shadow.png',
	});

	// SHADERS 
	load_shader('debug', 'glsl/debug.glsl');

	
	/*
	load_shader('background', 'glsl/background.glsl',
	{
		colourA: {value: hex_to_rgb('#4972A8') },
		colourB: {value: hex_to_rgb('#132C65') },
	});
	*/

	load_shader('background', 'glsl/background.glsl',
	{
		colourA: {value: hex_to_rgb('#252341') },
		colourB: {value: hex_to_rgb('#0c0b1a') },
	});

	load_shader('metal', 'glsl/wheels.glsl', 
	{
		colour: {value: new THREE.Vector3(1,1,1) },
		envmap: {value: null},
		envmap_blurred: {value: null},
		//shinyness: {value: 1.0},
		highlight: {value: 0.0},
		albedo: {value: null},
		ao: {value: null},
		roughness: {value: null},
		normal_map: {value: null},
		ambient: {value: new THREE.Vector3(0.05,0.02,05)}
	});

	load_shader('shadow', 'glsl/shadow.glsl',
	{
		shadow: {value: null },
	});
}
window.addEventListener('load', preload);

function init() 
{
	app.debug_mode = false;
	//app.dat_gui = new dat.GUI();

	app.last_tick = performance.now(); //@todo replace with Threejs clock thingy

	app.input = Input();
	app.scene = new THREE.Scene();
	app.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
	app.camera.position.set(0,0,1.4);

	var carousel = app.carousel;
	var meshes = app.assets.meshes;
	var materials = app.assets.materials;
	var textures = app.assets.textures;

	textures.envmap_blurred.minFilter = THREE.LinearFilter;
	textures.envmap_blurred.magFilter = THREE.LinearFilter;
	textures.envmap_blurred.wrapS = THREE.RepeatWrapping;
	textures.envmap_blurred.wrapT = THREE.RepeatWrapping;

	// BACKGROUND

	meshes.quad = new THREE.PlaneGeometry(2, 2);
	materials.background.depthTest = false;
	materials.background.dithering = true;

	app.background = new THREE.Mesh(meshes.quad, materials.background);
	app.scene.add(app.background);

	// HEADPHONES

	var spinner = new THREE.Group();
	app.spinner = spinner;
	spinner.velocity = 0;
	spinner.spinning = false;

	var product = new THREE.Group();
	app.product = product;
	spinner.add(product);
	product.rotation.x = radians(15);

	var casing_material = materials.metal.clone();
	casing_material.setAll
	({
		colour: hex_to_rgb('#246dcb'),
		albedo: textures.albedo,
		ao: textures.ambient_occlusion,
		envmap: textures.envmap,
		envmap_blurred: textures.envmap_blurred,
		normal_map: textures.normal
	});
	var casing = new THREE.Mesh(meshes.casing, casing_material);
	casing.name = 'casing';
	product.add(casing);

	var headrest_material = materials.metal.clone();
	headrest_material.setAll
	({
		colour: new THREE.Vector3(0.2,0.2,0.2),
		albedo: textures.albedo,
		ao: textures.ambient_occlusion,
		envmap: textures.envmap_blurred,
		envmap_blurred: textures.envmap_blurred,
		normal_map: textures.normal
	});

	var headrest = new THREE.Mesh(meshes.headrest, headrest_material);
	headrest.name = 'headrest';
	product.add(headrest);


	var pads_material = materials.metal.clone();
	pads_material.setAll
	({
		colour: new THREE.Vector3(0.2,0.2,0.2),
		albedo: textures.albedo,
		ao: textures.ambient_occlusion,
		envmap: textures.envmap_blurred,
		envmap_blurred: textures.envmap_blurred,
		normal_map: textures.normal
	});

	var pads = new THREE.Mesh(meshes.pads, pads_material);
	pads.name = 'pads';
	product.add(pads);


	var speakers_material = materials.metal.clone();
	speakers_material.setAll
	({
		colour: hex_to_rgb('#246dcb'),
		albedo: textures.albedo,
		ao: textures.ambient_occlusion,
		envmap: textures.envmap,
		envmap_blurred: textures.envmap_blurred,
		normal_map: textures.normal
	});

	var speakers = new THREE.Mesh(meshes.speakers, speakers_material);
	speakers.name = 'speakers';
	product.add(speakers);


	var cap_material = materials.metal.clone();
	cap_material.setAll
	({
		colour: hex_to_rgb('#ffffff'),
		albedo: textures.albedo,
		ao: textures.ambient_occlusion,
		envmap: textures.envmap,
		envmap_blurred: textures.envmap_blurred,
		normal_map: textures.normal
	});

	var cap = new THREE.Mesh(meshes.cap, cap_material);
	cap.name = 'cap';
	product.add(cap);


	// SHADOW

	var shadow_mesh = new THREE.PlaneGeometry(1, 1);
	materials.shadow.transparent = true;
	materials.shadow.uniforms.shadow.value = textures.shadow;
	var shadow = new THREE.Mesh(shadow_mesh, materials.shadow);
	shadow.position.y = -0.7;
	shadow.rotation.x = radians(-90);
	spinner.add(shadow);

	app.scene.add(spinner);

	// RAYCASTING

	app.raycaster = new THREE.Raycaster();


	// UI

	app.ui = 
	{
		menu_bg: document.querySelector('.menu-bg'),
		menu: document.querySelector('.menu'),
	};

	app.menu_open = false;

	// COLOUR PICKER
	/*
	app.picker = document.querySelector('.colour-picker');
	app.picker.addEventListener('change', function(e)
	{
		var component = app.carousel.current_component;
		if(!component) return;
		var colour = component.material.uniforms.colour.value;
		hex_to_rgb(colour, e.target.value, true);
	});
	*/


	// START RENDERER

	app.renderer = new THREE.WebGLRenderer({antialias: true});
	app.renderer.setSize(window.innerWidth, window.innerHeight);
	document.querySelector('.webgl').appendChild(app.renderer.domElement);

	app.init = true;
}

function update(t)
{
	requestAnimationFrame(update);
	
	var dt = (t - app.last_tick) / 1000;
	app.last_tick = t;

	if(app.assets_loaded === false) return;

	if(key_down(Keys.F))
	{
		app.debug_mode = !app.debug_mode;
	}

	var camera = app.camera;

	if(app.debug_mode)
	{
		debug_camera_movement(camera, dt);
	}

	if(key_down(Keys.M))
	{
		app.menu_open = !app.menu_open;
	}

	if(app.menu_open)
	{
		app.ui.menu_bg.classList.add('open');
		app.ui.menu.classList.add('open');
		camera.position.x = THREE.Math.lerp(camera.position.x, 0.45, dt * 7.0);
	}
	else
	{
		app.ui.menu_bg.classList.remove('open');
		app.ui.menu.classList.remove('open');
		camera.position.x = THREE.Math.lerp(camera.position.x, 0, dt * 7.0);
	}

	// Raycasting

	var product = app.product;
	var components = product.children;

	for(var i = 0; i < product.children.length; ++i)
	{
		var child = product.children[i];
		if(child.material.uniforms.highlight)
			child.material.uniforms.highlight.value = 0.0;
	}
	

	var normalized_mouse = new THREE.Vector3();
	screen_to_normalized_device(normalized_mouse, input.mouse.position);
	app.raycaster.setFromCamera(normalized_mouse, camera);
	var intersects = app.raycaster.intersectObjects(components, true);
	if(intersects.length > 0)
	{
		var hit = intersects[0];

		if(key_down(Keys.MOUSE_LEFT))
		{
			//spinner.can_spin = true;
			//carousel.current_component = hit.object;

			switch(hit.object.name)
			{
				case 'base':
				{
					//show texture picker
					break;
				}
				case 'wheels':
				{
					//show colour picker
					/*
					carousel.current_board.spin_velocity = 0;
					var point = new THREE.Vector3();
					world_to_screen(point, hit.point, app.camera);
					
					app.picker.style.transform = 'translate(' + point.x + 'px, ' + point.y + 'px)';
					app.picker.click();
					*/
					break;
				}
				case 'trucks':
				{
					//show colour picker
					break;
				}
			}
		}

		if(hit.object.material.uniforms.highlight)
			hit.object.material.uniforms.highlight.value = 1.0;
	}


	// Keyboard cycling
	var spinner = app.spinner;

	if(key_down(Keys.MOUSE_LEFT) &! spinner.spinning)
	{
		spinner.spinning = true;	
	}
	if(key_up(Keys.MOUSE_LEFT))
	{
		if(spinner.spinning)
		{
			spinner.velocity = input.mouse.delta.x * dt;
		}
		spinner.spinning = false;
	}

	if(spinner.spinning)
	{
		spinner.velocity = input.mouse.delta.x * dt;
	}

	spinner.rotation.y += spinner.velocity;
	spinner.velocity *= 0.91;

	


	// ANIMATE BACKGROUND GRADIENT

	/*
	var current_grad = app.colours[carousel.index];
	blend_gradient(carousel.gradient, carousel.gradient, current_grad, dt * 5.0);
	carousel.background.material.uniforms.colourA.value = carousel.gradient.a;
	carousel.background.material.uniforms.colourB.value = carousel.gradient.b;
	*/


	render();
	update_input();
}

function render() 
{
	app.renderer.render(app.scene, app.camera);
}

