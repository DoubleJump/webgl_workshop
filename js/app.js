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
		base: 'json/skateboard_base.json',
		top: 'json/skateboard_top.json',
		trucks: 'json/skateboard_trucks.json',
		wheels: 'json/skateboard_wheels.json',
	});

	// TEXTURES 
	load_textures(
	{
		blank: 'img/blank.png',
		lightmap: 'img/lightmap.png',
		envmap: 'img/envmap.jpg',
		envmap_blurred: 'img/env_blurred.jpg',
		pattern: 'img/pattern.jpg',
	});

	// SHADERS 
	load_shader('background', 'glsl/background.glsl',
	{
		colour: {value: new THREE.Vector3(0.2,0.1,0.3,1) },
	});

	load_shader('metal', 'glsl/wheels.glsl', 
	{
		colour: {value: new THREE.Vector4(1,1,1,1) },
		envmap: {value: null},
		envmap_blurred: {value: null},
		lightmap: {value: null},
		diffuse: {value: null},
		shinyness: {value: 1.0},
		highlight: {value: 0.0},
	});
}
window.addEventListener('load', preload);

function init() 
{
	app.last_time = performance.now(); //@todo replace with Threejs clock thingy

	app.input = Input();
	app.scene = new THREE.Scene();
	app.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
	app.camera.position.z = 3;

	app.carousel = 
	{
		root: new THREE.Group(),
		items: [],
		background: null,
		index: 0,
		gap: 3.4,
		current_board: null,
		current_component: null,
		spinning: false,
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

	// BACKGROUND

	meshes.quad = new THREE.PlaneGeometry(2, 2);
	materials.background.depthTest = false;
	app.carousel.background = new THREE.Mesh(meshes.quad, materials.background);
	app.scene.add(app.carousel.background);

	// SKATEBOARDS

	var num_skateboards = 3;
	for(var i = 0; i < num_skateboards; ++i)
	{
		var skateboard = {};
		skateboard.spin_velocity = 0;

		var group = new THREE.Group();
		skateboard.group = group;
		group.position.x = i * app.carousel.gap;
		group.rotation.z = 90 * THREE.Math.DEG2RAD;
		group.parent = app.carousel.root;

		var top_mat = materials.metal.clone();
		top_mat.uniforms.lightmap.value = textures.lightmap;
		top_mat.uniforms.diffuse.value = textures.blank;
		top_mat.uniforms.envmap.value = textures.envmap;
		top_mat.uniforms.envmap_blurred.value = textures.envmap_blurred;
		top_mat.uniforms.shinyness.value = 0.0;
		skateboard.top = new THREE.Mesh(meshes.top, top_mat);
		skateboard.top.name = 'top';
		group.add(skateboard.top);

		var base_mat = materials.metal.clone();
		base_mat.uniforms.lightmap.value = textures.lightmap;
		base_mat.uniforms.diffuse.value = textures.pattern;
		base_mat.uniforms.envmap.value = textures.envmap;
		base_mat.uniforms.envmap_blurred.value = textures.envmap_blurred;
		base_mat.uniforms.shinyness.value = 0.3;
		skateboard.base = new THREE.Mesh(meshes.base, base_mat);
		skateboard.base.name = 'base';
		group.add(skateboard.base);

		var wheels_mat = materials.metal.clone();
		wheels_mat.uniforms.lightmap.value = textures.lightmap;
		wheels_mat.uniforms.diffuse.value = textures.blank;
		wheels_mat.uniforms.envmap.value = textures.envmap;
		wheels_mat.uniforms.envmap_blurred.value = textures.envmap_blurred;
		wheels_mat.uniforms.shinyness.value = 0.5;
		skateboard.wheels = new THREE.Mesh(meshes.wheels, wheels_mat);
		skateboard.wheels.name = 'wheels';
		group.add(skateboard.wheels);

		var trucks_mat = materials.metal.clone();
		trucks_mat.uniforms.lightmap.value = textures.lightmap;
		trucks_mat.uniforms.diffuse.value = textures.blank;
		trucks_mat.uniforms.envmap.value = textures.envmap;
		trucks_mat.uniforms.envmap_blurred.value = textures.envmap_blurred;
		trucks_mat.uniforms.shinyness.value = 0.8;
		skateboard.trucks = new THREE.Mesh(meshes.trucks, trucks_mat);
		skateboard.trucks.name = 'trucks';
		group.add(skateboard.trucks);

		app.carousel.items.push(skateboard);
		app.carousel.root.add(group);
	}

	app.scene.add(app.carousel.root);


	// RAYCASTING

	app.raycaster = new THREE.Raycaster();

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

	// LEFT / RIGHT BUTTONS

	var button_left = document.querySelector('.carousel-button.left');
	var button_right = document.querySelector('.carousel-button.right');
	button_left.addEventListener('click', carousel_prev);
	button_right.addEventListener('click', carousel_next);

	// INIT RENDERER

	app.renderer = new THREE.WebGLRenderer({antialias: true});
	app.renderer.setSize(window.innerWidth, window.innerHeight);
	document.querySelector('.webgl').appendChild(app.renderer.domElement);

	app.init = true;
}

function carousel_next()
{
	var carousel = app.carousel;
	carousel.index ++;
	carousel.current_component = null;
	carousel.index = clamp(carousel.index, 0, carousel.items.length-1);
	carousel.current_board = carousel.items[carousel.index];
}

function carousel_prev()
{
	var carousel = app.carousel;
	carousel.index --;
	carousel.current_component = null;
	carousel.index = clamp(carousel.index, 0, carousel.items.length-1);
	carousel.current_board = carousel.items[carousel.index];
}

function update(t)
{
	requestAnimationFrame(update);
	
	var dt = (t - app.last_time) / 1000;
	app.last_time = t;

	if(app.assets_loaded === false) return;

	var carousel = app.carousel;
	carousel.current_board = carousel.items[carousel.index];

	var camera = app.camera;

	debug_camera_movement(camera, dt);

	// Raycasting

	for(var i = 0; i < carousel.items.length; ++i)
	{
		var item = carousel.items[i].group;
		
		for(var j = 0; j < item.children.length; ++j)
		{
			var child = item.children[j];
			child.material.uniforms.highlight.value = 0.0;
		}
	}

	var normalized_mouse = new THREE.Vector3();
	screen_to_normalized_device(normalized_mouse, input.mouse.position);
	app.raycaster.setFromCamera(normalized_mouse, camera);
	var intersects = app.raycaster.intersectObjects(carousel.current_board.group.children, true);
	if(intersects.length > 0)
	{
		var hit = intersects[0];

		if(key_down(Keys.MOUSE_LEFT))
		{
			carousel.can_spin = true;
			carousel.current_component = hit.object;

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
					carousel.current_board.spin_velocity = 0;
					var point = new THREE.Vector3();
					world_to_screen(point, hit.point, app.camera);
					
					app.picker.style.transform = 'translate(' + point.x + 'px, ' + point.y + 'px)';
					app.picker.click();
					break;
				}
				case 'trucks':
				{
					//show colour picker
					break;
				}
			}
		}

		hit.object.material.uniforms.highlight.value = 1.0;
	}


	// Keyboard cycling

	if(key_down(Keys.LEFT)) carousel_prev();
	if(key_down(Keys.RIGHT)) carousel_next();

	if(key_down(Keys.MOUSE_LEFT) &! carousel.spinning)
	{
		carousel.spinning = true;	
	}
	if(key_up(Keys.MOUSE_LEFT))
	{
		if(carousel.spinning)
		{
			carousel.current_board.spin_velocity = input.mouse.delta.x * dt;
		}
		carousel.spinning = false;
	}

	if(carousel.spinning)
	{
		carousel.current_board.spin_velocity = input.mouse.delta.x * dt;
	}

	carousel.current_board.group.rotation.y += carousel.current_board.spin_velocity;
	carousel.current_board.spin_velocity *= 0.91;

	carousel.index = clamp(carousel.index, 0, carousel.items.length-1);
	carousel.root.position.x = THREE.Math.lerp(carousel.root.position.x, -carousel.index * carousel.gap, dt * 5.0);

	
	for(var i = 0; i < carousel.items.length; ++i)
	{
		var item = carousel.items[i].group;

		var scale = item.scale.x;
		if(i === carousel.index)
		{
			item.position.z = THREE.Math.lerp(item.position.z, 1.0, dt * 5.0);
		}
		else
		{
			item.position.z = THREE.Math.lerp(item.position.z, 0.0, dt * 5.0);
		}
	}

	var col = carousel.background.material.uniforms.colour.value;
	col.lerp(app.colours[carousel.index], dt * 5.0);

	render();
	update_input();
}

function render() 
{
	app.renderer.render(app.scene, app.camera);
}

