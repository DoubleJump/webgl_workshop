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
		normal_map: {value: null},
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
	app.spin_scale = 0;
	spinner.velocity = 0;
	spinner.spinning = false;
	app.spinner = spinner;

	// Headphones

	var headphones = new THREE.Group();
	app.headphones = headphones;
	headphones.rotation.x = radians(15);

	// Casing

	var casing_material = materials.matcap.clone();
	casing_material.setAll
	({
		matcap: textures.matcap_violet,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});
	var casing = new THREE.Mesh(meshes.casing, casing_material);
	casing.name = 'casing';

	// Speakers

	var speakers_material = materials.matcap.clone();
	speakers_material.setAll
	({
		matcap: textures.matcap_violet,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});

	var speakers = new THREE.Mesh(meshes.speakers, speakers_material);
	speakers.name = 'speakers';

	// Pads

	var pads_material = materials.matcap.clone();
	pads_material.setAll
	({
		matcap: textures.matcap_grey,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});

	var pads = new THREE.Mesh(meshes.pads, pads_material);
	pads.name = 'pads';

	// Cap

	var cap_material = materials.matcap.clone();
	cap_material.setAll
	({
		matcap: textures.matcap_white,
		ao: textures.ambient_occlusion,
		normal_map: textures.normal,
	});

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
	
	var dt = app.time.getDelta();
	debug_camera_movement(app.camera, dt);
	update_spinner(dt);
	app.renderer.render(app.scene, app.camera);

	update_input();
}

function update_spinner(dt)
{
	var spinner = app.spinner;

	spinner.scale.setScalar(app.spin_scale);

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

	// Stop the spinner spinning too fast
	spinner.velocity = clamp(spinner.velocity, -0.5,0.5);
	spinner.rotation.y += spinner.velocity;

	// Slow the spinner down over time
	spinner.velocity *= 0.91;
}

function update_raycaster(dt)
{
	var marker = app.ui.marker;
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

	for(var i = 0; i < app.ui.colours.length; ++i)
	{
		app.ui.colours[i].classList.remove('active');
	}
	e.target.classList.add('active');

	app.animations.colour_switch.restart();

	var ui = app.ui;
	var casing = app.headphones.children[0];
	var speakers = app.headphones.children[1]; 

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