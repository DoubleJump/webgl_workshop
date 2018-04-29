function clamp(a, min, max)
{
	if(a < min) return min;
	else if(a > max) return max;
	else return a;
}

function radians(degrees)
{
	return degrees * THREE.Math.DEG2RAD;
}

function screen_to_viewport(screen)
{
	var width = app.renderer.domElement.width;
	var height = app.renderer.domElement.height;
	var result = new THREE.Vector3();
	result.x = (screen.x / width) * 2 - 1;
	result.y = - (screen.y / height) * 2 + 1;
	return result;
}

function world_to_screen(world, camera)
{
	var width = app.renderer.domElement.width / 2;
	var height = app.renderer.domElement.height / 2;

	var pos = world.clone();
	pos.project(camera);

	var result = new THREE.Vector3();
	result.x = (pos.x * width) + width;
	result.y = -(pos.y * height) + height;
	return result;
}

function load_shader(name, url, uniforms)
{
	app.assets.total++;
	app.assets.load_count++;

	var rq = new XMLHttpRequest(); 
	rq.responseType = 'text';
    rq.open('GET', url, true);
    rq.onload = function(e)
    {
        if(e.target.status !== 200) return;
        
    	var result = e.target.response;
    	var split = result.split('//FRAGMENTSHADER');
    	var vertex_shader = split[0];
    	var fragment_shader = split[1];

    	var material = new THREE.ShaderMaterial(
		{
			uniforms: uniforms,
			vertexShader: vertex_shader,
			fragmentShader: fragment_shader
		});

		app.assets.materials[name] = material;
		app.assets.load_count--;
		check_assets_loaded();
        
    }
    rq.send();
}


function load_mesh(name, url)
{
	app.assets.total++;
	app.assets.load_count++;

	var loader = new THREE.JSONLoader();
	loader.load
	(			
		url,
		function(geometry, materials) 
		{
			app.assets.meshes[name] = geometry;
			app.assets.load_count--;
			check_assets_loaded();
		}
	);
}

function load_texture(name, url)
{
	app.assets.total++;
	app.assets.load_count++;

	var loader = new THREE.TextureLoader();
	loader.load
	(
		url,
		function(texture)
		{
			app.assets.textures[name] = texture;
			app.assets.load_count--;
			check_assets_loaded();
		}
	);
}

function check_assets_loaded()
{
	if(app.assets.load_count === 0 &! 
		app.started)
	{
		app.started = true;
		start();
	}
}

function debug_camera_movement(camera, dt)
{
	if(key_down(Keys.F)) app.debug_mode = !app.debug_mode;
	if(!app.debug_mode) return;

	var speed = 1.0;
	if(key_held(Keys.A)) camera.position.x -= speed * dt;
	if(key_held(Keys.D)) camera.position.x += speed * dt;
	if(key_held(Keys.W)) camera.position.z -= speed * dt;
	if(key_held(Keys.S)) camera.position.z += speed * dt;
	if(key_held(Keys.E)) camera.position.y += speed * dt;
	if(key_held(Keys.Q)) camera.position.y -= speed * dt;
}