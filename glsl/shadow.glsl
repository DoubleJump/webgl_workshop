varying vec2 _uv;

void main() 
{
	_uv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

varying vec2 _uv;

uniform sampler2D shadow;

void main() 
{
    float sample = (1.0-texture2D(shadow, _uv).r) * 0.3;
	gl_FragColor = vec4(0.0,0.0,0.0, sample);
}