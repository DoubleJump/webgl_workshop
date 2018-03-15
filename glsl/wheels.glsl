// attribute vec3 position; -- supplied by THREE
attribute vec2 uv2;

varying vec3 _normal;
varying vec2 _uv;
varying vec2 _uv2;
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
	_uv2 = uv2;

	// Eye is the direction of vertex to the camera
	_eye = vec3(modelViewMatrix * vec4(position, 1.0));
	_eye = normalize(_eye);

	// Transform the vertex into is final place on the screen
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

varying vec3 _normal;
varying vec2 _uv;
varying vec2 _uv2;
varying vec3 _eye;

uniform vec4 colour;
uniform float highlight;
uniform sampler2D envmap;
uniform sampler2D envmap_blurred;
uniform sampler2D lightmap;
uniform sampler2D diffuse;
uniform float shinyness;

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

vec3 desaturate(vec3 color, float amount)
{
	vec3 gray = vec3(dot(vec3(0.3, 0.59, 0.11), color));
	return vec3(mix(gray, color, amount));
}

void main() 
{
	mat4 inv_view = -viewMatrix;

	vec3 ecEyeDir = -_eye;
    vec3 wcEyeDir = vec3(inv_view * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(inv_view * vec4(_normal, 0.0));

    vec3 ref = reflect(-wcEyeDir, normalize(wcNormal));
    vec2 ruv = env_map_equirect(ref, -1.0);
    vec3 env_smooth = texture2D(envmap, ruv).rgb;
    vec3 env_rough = texture2D(envmap_blurred, ruv).rgb;

	float fr = fresnel(_eye, _normal, 0.0, 1.0, 2.0);

	// Lightmap
	float lm = texture2D(lightmap, _uv2).r * 1.65;
	lm = lm * (lm * 1.2);

    vec3 diff = texture2D(diffuse, _uv).rgb;
    diff *= mix(env_rough, env_smooth, shinyness);
    diff *= colour.rgb;
    diff = desaturate(diff, 1.0-fr);

	vec3 env = mix(diff,env_smooth, fr);

    vec3 rgb = env * lm;
    rgb += vec3(0.03,0.03,0.0);

    float alpha = 1.0;

    // Add highlight glow
	vec3 highlight_colour = vec3(0.2,0.4,1.0) * highlight * (fr + 0.3);
	rgb += highlight_colour;

	gl_FragColor = vec4(rgb, alpha);
}