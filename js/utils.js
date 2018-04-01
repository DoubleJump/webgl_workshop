function hex_to_rgb(hex) 
{
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(!result) return;

    var r = parseInt(result[1], 16) / 255;
    var g = parseInt(result[2], 16) / 255;
    var b = parseInt(result[3], 16) / 255;

    return new THREE.Vector3(r,g,b);
}

THREE.Material.prototype.set = function(name, value)
{
	this.uniforms[name].value = value;
}

THREE.Material.prototype.setAll = function(uniforms)
{
	for(var k in uniforms)
	{
		this.uniforms[k].value = uniforms[k];
	}
}

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

function screen_to_normalized_device(out, screen)
{
	var width = app.renderer.domElement.width;
	var height = app.renderer.domElement.height;
	out.x = (screen.x / width) * 2 - 1;
	out.y = - (screen.y / height) * 2 + 1;
}

function world_to_screen(out, world, camera)
{
	var width = app.renderer.domElement.width / 2;
	var height = app.renderer.domElement.height / 2;

	var pos = world.clone();
	pos.project(camera);
	out.x = (pos.x * width) + width;
	out.y = -(pos.y * height) + height;
}

function load_shader(name, url, uniforms, options)
{
	app.assets.total++;
	app.assets.load_count++;

	var rq = new XMLHttpRequest(); 
	rq.responseType = 'text';
    rq.open('GET', url, true);
    rq.onload = function(e)
    {
        if(e.target.status === 200)
        {
        	var result = e.target.response;
        	var split = result.split('========');
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

function load_meshes(meshes)
{
	for(var m in meshes)
	{
		var name = m;
		var url = meshes[m];
		load_mesh(name, url);
	}
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

function load_textures(textures)
{
	for(var t in textures)
	{
		var name = t;
		var url = textures[t];
		load_texture(name, url);
	}	
}

function check_assets_loaded()
{
	if(app.assets.load_count === 0 && app.init === false)
	{
		//app.preloader.root.style.display = 'none';
		init();
	}
}

function debug_camera_movement(camera, dt)
{
	var speed = 1.0;
	if(key_held(Keys.A)) camera.position.x -= speed * dt;
	if(key_held(Keys.D)) camera.position.x += speed * dt;
	if(key_held(Keys.W)) camera.position.z -= speed * dt;
	if(key_held(Keys.S)) camera.position.z += speed * dt;
	if(key_held(Keys.E)) camera.position.y += speed * dt;
	if(key_held(Keys.Q)) camera.position.y -= speed * dt;
}