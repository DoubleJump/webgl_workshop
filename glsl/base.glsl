varying vec3 _normal;
varying vec2 _uv;
varying vec3 _eye;

void main()
{ 
	_normal = normalMatrix * normal;
	_eye = vec3(modelViewMatrix * vec4(position, 1.0));
	_uv = uv;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

varying vec3 _normal;
varying vec2 _uv;
varying vec3 _eye;

uniform sampler2D image;
uniform sampler2D matcap;

void main() 
{
	vec3 r = reflect(_eye, _normal);
	float m = 2.0 * sqrt(pow(r.x, 2.0) + pow(r.y, 2.0) + pow(r.z + 1.0, 2.0));
	vec2 ruv = r.xy / m + 0.5;
	float lighting = texture2D(matcap, 1.0-ruv).r + 0.5;

	vec4 sample = texture2D(image, _uv);

	vec3 rgb = sample.rgb * lighting;

	gl_FragColor = vec4(rgb, 1.0);
}