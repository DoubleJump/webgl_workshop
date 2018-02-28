varying vec3 _normal;
varying vec2 _uv;

void main()
{ 
	_normal = normalMatrix * normal;
	_uv = uv;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

varying vec3 _normal;
varying vec2 _uv;

uniform sampler2D image;

void main() 
{
	vec4 sample = texture2D(image, _uv);
	gl_FragColor = sample;
}