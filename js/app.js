var app = 
{
	init: false,
	current_colour: 'ultraviolet',
	assets:
	{
		meshes: {},
		textures: {},
		materials: {},
		load_count: 0,
		total: 0,
	},
};

function preload()
{
	app.preloader = document.querySelector('.preloader');
	

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
		ambient_occlusion: 'img/ambient_occlusion.jpg',
		shadow: 'img/shadow.jpg',
		matcap_violet: 'img/matcaps/mat_violet.jpg',
		matcap_grey: 'img/matcaps/mat_grey.jpg',
		matcap_pink: 'img/matcaps/mat_pink.jpg',
		matcap_yellow: 'img/matcaps/mat_yellow.jpg',
		matcap_black: 'img/matcaps/mat_black.jpg',
		matcap_white: 'img/matcaps/mat_white.jpg',
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

	app.last_tick = performance.now(); //@todo replace with Threejs clock thingy

	app.input = Input();
	app.scene = new THREE.Scene();
	app.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
	app.camera.position.set(0,0,1.5);

	var meshes = app.assets.meshes;
	var materials = app.assets.materials;
	var textures = app.assets.textures;


	// HEADPHONES

	var spinner = new THREE.Group();
	app.spinner = spinner;
	app.spin_scale = 0;
	spinner.velocity = 0;
	spinner.spinning = false;

	var product = new THREE.Group();
	app.product = product;
	spinner.add(product);
	product.rotation.x = radians(15);

	var casing_material = materials.matcap.clone();
	casing_material.setAll
	({
		matcap: textures.matcap_violet,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});
	var casing = new THREE.Mesh(meshes.casing, casing_material);
	casing.name = 'casing';
	product.add(casing);

	var speakers_material = materials.matcap.clone();
	speakers_material.setAll
	({
		matcap: textures.matcap_violet,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});

	var speakers = new THREE.Mesh(meshes.speakers, speakers_material);
	speakers.name = 'speakers';
	product.add(speakers);

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
		bg: document.querySelector('.background'),
		bg_text: document.querySelector('.background h2'),
		bg_angle: document.querySelector('.angle'),
		marker: document.querySelector('.marker'),
		label: document.querySelector('.marker-label'),
		marker_text: document.querySelector('.marker p'),
		colour_label: document.querySelector('.colour-picker p'),
		colours: document.querySelectorAll('.colour'),
		burger_lines: document.querySelectorAll('.burger div'),
	};

	for(var i = 0; i < app.ui.colours.length; ++i)
	{
		app.ui.colours[i].addEventListener('click', on_colour_click);
	}

	app.highlight_colour = new THREE.Vector3(0.2,0.6,0.9);

	// START RENDERER

	var renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.querySelector('.webgl').appendChild(renderer.domElement);
	app.renderer = renderer;

	app.init = true;

	build_animations();
	app.animations.intro.restart();

	requestAnimationFrame(update);
}

function update(t)
{
	requestAnimationFrame(update);
	
	var dt = (t - app.last_tick) / 1000;
	app.last_tick = t;

	if(app.assets_loaded === false) return;

	if(key_down(Keys.F)) app.debug_mode = !app.debug_mode;
	if(app.debug_mode) debug_camera_movement(camera, dt);

	var ui = app.ui;
	var camera = app.camera;
	var spinner = app.spinner;
	var product = app.product;
	var components = product.children;

	spinner.scale.setScalar(app.spin_scale);


	for(var i = 0; i < product.children.length; ++i)
	{
		var child = product.children[i];
		if(child.material.uniforms.highlight)
			child.material.uniforms.highlight.value = 0.0;
	}
	
	ui.marker.classList.remove('visible');

	var normalized_mouse = new THREE.Vector3();
	screen_to_normalized_device(normalized_mouse, input.mouse.position);
	app.raycaster.setFromCamera(normalized_mouse, camera);
	var intersects = app.raycaster.intersectObjects(components, true);
	if(intersects.length > 0)
	{
		var hit = intersects[0];

		if(hit.object.material.uniforms.highlight)
		{
			var point = new THREE.Vector3();
			world_to_screen(point, hit.point, app.camera);
			ui.marker.classList.add('visible');
			ui.marker.style.transform = 'translate(' + point.x + 'px, ' + point.y + 'px)';
			ui.marker_text.innerText = hit.object.name;
			hit.object.material.uniforms.highlight.value = 1.0;
		}
	}


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

	app.renderer.render(app.scene, app.camera);
	update_input();
}

function on_colour_click(e)
{
	var colour = e.target.getAttribute('data-colour');

	if(app.current_colour === colour) return;
	app.current_colour = colour;

	for(var i = 0; i < app.ui.colours.length; ++i)
	{
		app.ui.colours[i].classList.remove('active');
	}
	e.target.classList.add('active');

	app.animations.colour_switch.restart();

	var ui = app.ui;
	var casing = app.product.children[0];
	var speakers = app.product.children[1]; 

	//TODO put colours in a data structure and use enums

	switch(colour)
	{
		case 'ultraviolet':
		{
			var matcap = app.assets.textures.matcap_violet;
			ui.bg.style.background = '#E9E7F7';
			ui.bg_text.style.color = '#BFA4FA';
			ui.bg_text.innerHTML = 'ultraviolet';
			casing.material.uniforms.matcap.value = matcap;
			speakers.material.uniforms.matcap.value = matcap;
			ui.label.style.fill = '#00A4FF';
			ui.colour_label.style.color = '#625DA0';

			for(var i = 0; i < ui.burger_lines.length; ++i)
			{
				ui.burger_lines[i].style.background = '#261493';
			}

			//set background gradient
			var stops = ui.bg_angle.querySelectorAll('stop');
			stops[0].setAttribute('stop-color', '#d25afc');
			stops[1].setAttribute('stop-color', '#2700bd');

			break;
		}
		case 'hotpink':
		{
			var matcap = app.assets.textures.matcap_pink;
			ui.bg.style.background = '#f7e7f4';
			ui.bg_text.style.color = '#ccafc6';
			ui.bg_text.innerHTML = 'hotpink';
			casing.material.uniforms.matcap.value = matcap;
			speakers.material.uniforms.matcap.value = matcap;
			ui.label.style.fill = '#e20aa4';
			ui.colour_label.style.color = '#a37e97';

			for(var i = 0; i < ui.burger_lines.length; ++i)
			{
				ui.burger_lines[i].style.background = '#931477';
			}

			//set background gradient
			var stops = ui.bg_angle.querySelectorAll('stop');
			stops[0].setAttribute('stop-color', '#D2C900');
			stops[1].setAttribute('stop-color', '#EA00BD');

			break;
		}
		case 'solarflare':
		{
			var matcap = app.assets.textures.matcap_yellow;
			ui.bg.style.background = '#FAFCFA';
			ui.bg_text.style.color = '#E8E39C';
			ui.bg_text.innerHTML = 'solarflare';
			casing.material.uniforms.matcap.value = matcap;
			speakers.material.uniforms.matcap.value = matcap;
			ui.label.style.fill = '#FF5500';
			ui.colour_label.style.color = '#FFC715';

			for(var i = 0; i < ui.burger_lines.length; ++i)
			{
				ui.burger_lines[i].style.background = '#D8860E';
			}

			//set background gradient
			var stops = ui.bg_angle.querySelectorAll('stop');
			stops[0].setAttribute('stop-color', '#F7495E');
			stops[1].setAttribute('stop-color', '#F7FF00');

			break;
		}
		case 'midnight':
		{
			var matcap = app.assets.textures.matcap_black;
			ui.bg.style.background = '#EDEDED';
			ui.bg_text.style.color = '#C9C6CC';
			ui.bg_text.innerHTML = 'midnight';
			casing.material.uniforms.matcap.value = matcap;
			speakers.material.uniforms.matcap.value = matcap;
			ui.label.style.fill = '#000000';
			ui.colour_label.style.color = '#2F2F33';

			for(var i = 0; i < ui.burger_lines.length; ++i)
			{
				ui.burger_lines[i].style.background = '#2F2F33';
			}

			//set background gradient
			var stops = ui.bg_angle.querySelectorAll('stop');
			stops[0].setAttribute('stop-color', '#393B42');
			stops[1].setAttribute('stop-color', '#0F1112');

			break;
		}
	}
}