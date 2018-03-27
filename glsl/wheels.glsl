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

	// Our meshes two uv maps
	_uv = uv;

	// Eye is the direction of vertex to the camera
	_eye = vec3(modelViewMatrix * vec4(position, 1.0));
	_eye = normalize(_eye);

	// Transform the vertex into is final place on the screen
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

varying vec3 _normal;
varying vec2 _uv;
varying vec3 _eye;

uniform vec3 colour;
uniform vec3 ambient;

uniform float highlight;
uniform sampler2D envmap;
uniform sampler2D envmap_blurred;
uniform sampler2D albedo;
uniform sampler2D roughness;
uniform sampler2D ao;
uniform sampler2D normal_map;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float fresnel(vec3 E, vec3 N, float bias, float scale, float power)
{
	float r = bias + scale * pow(1.0 + dot(E, N), power);
	return r;
}

vec2 env_map_equirect(vec3 norm, float flip) 
{
	float phi = acos(-norm.y);
	float theta = atan(flip * norm.x, norm.z) + PI;
	return vec2(theta / (TAU), phi / PI);
}


void main() 
{
	vec3 normal = texture2D(normal_map, _uv).rgb * _normal;

	float fr = fresnel(_eye, normal, 0.0, 1.0, 2.0);

	mat4 inv_view = -viewMatrix;
	vec3 ecEyeDir = -_eye;
    vec3 wcEyeDir = vec3(inv_view * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(inv_view * vec4(normal, 0.0));

    vec3 ref = reflect(-wcEyeDir, normalize(wcNormal));
    vec2 ruv = env_map_equirect(ref, 1.0);

    vec3 env_smooth = texture2D(envmap, ruv).rgb;
    env_smooth *= env_smooth * 1.3;

    vec3 env_rough = texture2D(envmap_blurred, ruv).rgb;
    env_rough = env_rough * colour;

    float rough_sample = 1.0-texture2D(roughness, _uv).r * 2.0;

	vec3 env = mix(env_rough,env_smooth, rough_sample);
	env = mix(env_rough,env, fr);

	//vec3 albedo_sample = texture2D(albedo, _uv).rgb;
	//vec3 base = colour * albedo_sample.b;

	float ao_sample  = texture2D(ao, _uv).r;

	vec3 rgb = env;//mix(env * colour,env_smooth, fr);
	rgb *= ao_sample;

	rgb += vec3(0.02,0.01,0.05);

    // Add highlight glow
	vec3 highlight_colour = vec3(0.8,0.8,0.8) * highlight * (fr + 0.3);
	rgb += highlight_colour;

	gl_FragColor = vec4(rgb, 1.0);
}