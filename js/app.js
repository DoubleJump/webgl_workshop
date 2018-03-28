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
		cap: 'json/cap.json',
	});

	// TEXTURES 
	load_textures(
	{
		normal: 'img/normal.jpg',
		roughness: 'img/roughness.jpg',
		ambient_occlusion: 'img/ambient_occlusion.jpg',
		shadow: 'img/shadow.jpg',
		matcap_red: 'img/matcaps/mat_red.jpg',
		matcap_grey: 'img/matcaps/mat_grey.jpg',
		matcap_white: 'img/matcaps/mat_white.jpg'
	});

	// SHADERS 
	load_shader('debug', 'glsl/debug.glsl');

	load_shader('matcap', 'glsl/matcap.glsl',
	{
		matcap: {value: null },
		highlight: {value: 0.0},
		ao: {value: null},
		normal_map: {value: null},
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


	// HEADPHONES

	var spinner = new THREE.Group();
	app.spinner = spinner;
	spinner.rotation.y = -3.78;
	spinner.velocity = 0;
	spinner.spinning = false;

	var product = new THREE.Group();
	app.product = product;
	spinner.add(product);
	product.rotation.x = radians(15);

	var casing_material = materials.matcap.clone();
	casing_material.setAll
	({
		matcap: textures.matcap_red,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});
	var casing = new THREE.Mesh(meshes.casing, casing_material);
	casing.name = 'casing';
	product.add(casing);


	var pads_material = materials.matcap.clone();
	pads_material.setAll
	({
		matcap: textures.matcap_grey,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});
	var pads = new THREE.Mesh(meshes.pads, pads_material);
	pads.name = 'pads';
	product.add(pads);

	var speakers_material = materials.matcap.clone();
	speakers_material.setAll
	({
		matcap: textures.matcap_red,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});

	var speakers = new THREE.Mesh(meshes.speakers, speakers_material);
	speakers.name = 'speakers';
	product.add(speakers);

	var cap_material = materials.matcap.clone();
	cap_material.setAll
	({
		matcap: textures.matcap_white,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
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
		//menu_bg: document.querySelector('.menu-bg'),
		//menu: document.querySelector('.menu'),
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

	var renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.querySelector('.webgl').appendChild(renderer.domElement);
	app.renderer = renderer;

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
		//app.ui.menu_bg.classList.add('open');
		//app.ui.menu.classList.add('open');
		//camera.position.x = THREE.Math.lerp(camera.position.x, 0.45, dt * 7.0);
	}
	else
	{
		//app.ui.menu_bg.classList.remove('open');
		//app.ui.menu.classList.remove('open');
		//camera.position.x = THREE.Math.lerp(camera.position.x, 0, dt * 7.0);
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

	render();
	update_input();
}

function render() 
{
	app.renderer.render(app.scene, app.camera);
}

