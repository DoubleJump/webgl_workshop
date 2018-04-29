var app = 
{
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

	// Meshes

	load_mesh('casing', 'json/casing.json');
	load_mesh('pads', 'json/pads.json');
	load_mesh('speakers', 'json/speakers.json');
	load_mesh('cap', 'json/cap.json');

	// Textures

	load_texture('ambient_occlusion', 'img/ambient_occlusion.jpg');
	load_texture('shadow', 'img/shadow.jpg');
	load_texture('matcap_violet', 'img/matcaps/mat_violet.jpg');
	load_texture('matcap_grey', 'img/matcaps/mat_grey.jpg');
	load_texture('matcap_pink', 'img/matcaps/mat_pink.jpg');
	load_texture('matcap_yellow', 'img/matcaps/mat_yellow.jpg');
	load_texture('matcap_black', 'img/matcaps/mat_black.jpg');
	load_texture('matcap_white', 'img/matcaps/mat_white.jpg');

	// Shaders

	load_shader('matcap', 'glsl/matcap.glsl',
	{
		matcap: {value: null },
		highlight: {value: 0.0},
		ao: {value: null},
	});

	load_shader('shadow', 'glsl/shadow.glsl',
	{
		shadow: {value: null },
	});
}
window.addEventListener('load', preload);

function start() 
{
	app.debug_mode = false;

	// Create a new scene, and time tracker

	app.input = Input();
	app.time = new THREE.Clock();
	app.scene = new THREE.Scene();

	// Camera

	var field_of_view = 60;
	var aspect_ratio = window.innerWidth / window.innerHeight;
	var near_clip = 0.01;
	var far_clip = 100;

	app.camera = new THREE.PerspectiveCamera(field_of_view, aspect_ratio, near_clip, far_clip);

	// Pull the camera away from the center a bit so
	// we can see the headphones
	app.camera.position.set(0,0,1.5);

	// Asset shortucts

	var meshes = app.assets.meshes;
	var materials = app.assets.materials;
	var textures = app.assets.textures;

	// Spinner

	var spinner = new THREE.Group();
	spinner.spin_speed = 0;
	app.spinner = spinner;

	// Headphones

	var headphones = new THREE.Group();
	app.headphones = headphones;
	headphones.rotation.x = radians(15);

	// Casing

	var casing_material = materials.matcap.clone();
	casing_material.uniforms.matcap.value = textures.matcap_violet;
	casing_material.uniforms.ao.value = textures.ambient_occlusion;

	var casing = new THREE.Mesh(meshes.casing, casing_material);
	casing.name = 'casing';

	// Speakers

	var speakers_material = materials.matcap.clone();
	speakers_material.uniforms.matcap.value = textures.matcap_violet;
	speakers_material.uniforms.ao.value = textures.ambient_occlusion;

	var speakers = new THREE.Mesh(meshes.speakers, speakers_material);
	speakers.name = 'speakers';

	// Pads

	var pads_material = materials.matcap.clone();
	pads_material.uniforms.matcap.value = textures.matcap_grey;
	pads_material.uniforms.ao.value = textures.ambient_occlusion;

	var pads = new THREE.Mesh(meshes.pads, pads_material);
	pads.name = 'pads';

	// Cap

	var cap_material = materials.matcap.clone();
	cap_material.uniforms.matcap.value = textures.matcap_white;
	cap_material.uniforms.ao.value = textures.ambient_occlusion;

	var cap = new THREE.Mesh(meshes.cap, cap_material);
	cap.name = 'cap';

	// Scene Heirarchy [Guide link to scene structure]

	headphones.add(casing);
	headphones.add(speakers);
	headphones.add(pads);
	headphones.add(cap);
	spinner.add(headphones);
	app.scene.add(spinner);

	// Shadow

	var shadow_mesh = new THREE.PlaneGeometry(1, 1);
	materials.shadow.transparent = true;
	materials.shadow.uniforms.shadow.value = textures.shadow;
	var shadow = new THREE.Mesh(shadow_mesh, materials.shadow);
	shadow.position.y = -0.7;
	shadow.rotation.x = radians(-90);
	spinner.add(shadow);

	// Raycaster [Guide link to raycasting]

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

	// Listen for mouse clicks on the colour buttons

	for(var i = 0; i < app.ui.colours.length; ++i)
	{
		app.ui.colours[i].addEventListener('click', on_colour_click);
	}

	// Create a renderer

	var renderer = new THREE.WebGLRenderer(
	{
		antialias: true, //[Guide link to AA]
		alpha:true //Lets dom elements behind show through
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.querySelector('.webgl').appendChild(renderer.domElement);
	app.renderer = renderer;

	// Animations

	build_animations();
	app.animations.intro.restart();

	// Begin update loop

	requestAnimationFrame(update);
}

function update(t)
{
	requestAnimationFrame(update);
	
	// dt or 'delta time' is the amount of time
	// since the last update. We can use this value
	// to scale our inputs so they smooth out 
	// any variations in framerate

	var dt = app.time.getDelta();
	debug_camera_movement(app.camera, dt);
	update_spinner(dt);
	update_raycaster();
	app.renderer.render(app.scene, app.camera);

	update_input();
}

function update_spinner(dt)
{
	var spinner = app.spinner;

	// If we are dragging set the spin velocity
	// to amount og horizontal mouse movement
	if(key_held(Keys.MOUSE_LEFT))
		spinner.spin_speed = input.mouse.delta.x * dt;

	// Stop the spinner spinning too fast
	spinner.spin_speed = clamp(spinner.spin_speed, -0.5,0.5);
	spinner.rotation.y += spinner.spin_speed;

	// Slow the spinner down over time
	spinner.spin_speed *= 0.91;
}

function update_raycaster()
{
	var marker = app.ui.marker;
	var marker_text = app.ui.marker_text;
	var camera = app.camera;
	var headphones = app.headphones;
	var components = headphones.children;

	// Reset the highlight effect on all the headphone parts

	for(var i = 0; i < components.length; ++i)
	{
		var child = components[i];
		if(child.material.uniforms.highlight)
			child.material.uniforms.highlight.value = 0.0;
	}
	
	// Reset the marker

	marker.classList.remove('visible');

	// Convert the mouse screen position to camera
	// viewport coordinates [guide to viewport coordinates]
	var viewport = screen_to_viewport(input.mouse.position);
	app.raycaster.setFromCamera(viewport, camera);

	// Fire a ray into the scene and see if it hits any of the
	// headphone parts
	var intersects = app.raycaster.intersectObjects(components, true);
	if(intersects.length > 0)
	{
		// If more than one item is hit the result is sorted by distance
		// [0] will be the closest object hit

		var hit = intersects[0];
		
		// If the ray hits an object we update its material to 
		// be highlighted and set the UI marker to its position

		if(hit.object.material.uniforms.highlight)
		{
			var point = world_to_screen(hit.point, app.camera);
			marker.classList.add('visible');
			marker.style.transform = 'translate(' + point.x + 'px, ' + point.y + 'px)';
			marker_text.innerText = hit.object.name;
			hit.object.material.uniforms.highlight.value = 1.0;
		}
	}
}


function on_colour_click(e)
{
	var colour = e.target.getAttribute('data-colour');

	if(app.current_colour === colour) return;
	app.current_colour = colour;

	var ui = app.ui;
	var casing = app.headphones.children[0];
	var speakers = app.headphones.children[1]; 
	var bg;
	var bg_text;
	var label;
	var label_text;
	var burger;
	var gradient_a;
	var gradient_b;

	switch(colour)
	{
		case 'ultraviolet':
		{
			matcap = app.assets.textures.matcap_violet;
			bg = '#E9E7F7';
			bg_text = '#BFA4FA';
			label = '#00A4FF';
			label_text = '#625DA0';
			burger = '#261493';
			gradient_a =  '#d25afc';
			gradient_b = '#2700bd';
			break;
		}
		case 'hotpink':
		{
			matcap = app.assets.textures.matcap_pink;
			bg = '#f7e7f4';
			bg_text = '#ccafc6';
			label = '#e20aa4';
			label_text = '#a37e97';
			burger = '#931477';
			gradient_a = '#D2C900';
			gradient_b = '#EA00BD';
			break;
		}
		case 'solarflare':
		{
			matcap = app.assets.textures.matcap_yellow;
			bg = '#FAFCFA';
			bg_text = '#E8E39C';
			label = '#FF5500';
			label_text = '#FFC715';
			burger = '#D8860E';
			gradient_a = '#F7495E';
			gradient_b = '#F7FF00';
			break;
		}
		case 'midnight':
		{
			matcap = app.assets.textures.matcap_black;
			bg = '#EDEDED';
			bg_text = '#C9C6CC';
			label = '#000000';
			label_text = '#2F2F33';
			burger = '#2F2F33';
			gradient_a = '#393B42';
			gradient_b = '#0F1112';
			break;
		}
	}

	ui.bg_text.innerHTML = colour;
	casing.material.uniforms.matcap.value = matcap;
	speakers.material.uniforms.matcap.value = matcap;

	ui.bg.style.background = bg;
	ui.bg_text.style.color = bg_text;
	ui.label.style.fill = label;
	ui.colour_label.style.color = label_text;

	for(var i = 0; i < ui.burger_lines.length; ++i)
	{
		ui.burger_lines[i].style.background = burger;
	}

	var stops = ui.bg_angle.querySelectorAll('stop');
	stops[0].setAttribute('stop-color', gradient_a);
	stops[1].setAttribute('stop-color', gradient_b);

	for(var i = 0; i < app.ui.colours.length; ++i)
	{
		app.ui.colours[i].classList.remove('active');
	}
	e.target.classList.add('active');

	app.animations.colour_switch.restart();
}