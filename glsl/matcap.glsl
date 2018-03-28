// attribute vec3 position; -- supplied by THREE
attribute vec2 uv2;

varying vec3 _normal;
varying vec2 _uv;
varying vec3 _eye;

//uniform mat3 normalMatrix; -- supplied by THREE
//uniform mat4 modelViewMatrix; -- supplied by THREE
//uniform mat4 projectionMatrix; -- supplied by THREE

void main() 
{
	// Normals get transformed with their own special matrix
	_normal = normalMatrix * normal;

	// Uvs just get passed on to the fragment shader
	_uv = uv;

	// Eye is the direction of vertex to the camera
	_eye = vec3(modelViewMatrix * vec4(position, 1.0));
	_eye = normalize(_eye);

	// Transform the vertex into is final place on the screen
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}


========

varying vec2 _uv;
varying vec3 _normal;
varying vec3 _eye;

uniform float hue;
uniform float highlight;
uniform sampler2D matcap;
uniform sampler2D ao;
uniform sampler2D normal_map;

float fresnel(vec3 E, vec3 N, float bias, float scale, float power)
{
	return bias + scale * pow(1.0 + dot(E, N), power);
}

void main() 
{
	vec3 normal = _normal;
	//vec3 normal = normalMatrix * texture2D(normal_map, _uv).rgb * _normal;

	float fr = fresnel(_eye, normal, 0.0, 1.0, 2.0);

	vec2 muv = vec2(viewMatrix * vec4(normalize(normal), 0)) * 0.5 + vec2(0.5,0.5);
	//muv.y = 1.0 - muv.y;

	vec3 rgb = texture2D(matcap, muv).rgb;

	float ao_sample = texture2D(ao, _uv).r;
	rgb *= ao_sample;

	// Add highlight glow
	vec3 highlight_colour = vec3(0.8,0.8,0.8) * highlight * (fr + 0.3);
	rgb += highlight_colour;


	gl_FragColor = vec4(rgb, 1.0);
}