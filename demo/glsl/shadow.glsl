//VERTEXSHADER

varying vec2 _uv;

void main() 
{
	_uv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

//FRAGMENTSHADER

varying vec2 _uv;

uniform sampler2D shadow;

void main() 
{
	vec3 rgb = vec3(0.0,0.0,0.0);

	// r,g and b channels are all the same
	// on a greyscale image so we can pick anyone
	// to read from
    float alpha = texture2D(shadow, _uv).r;
    alpha = 1.0 - alpha; //invert
    alpha *= 0.3; //fade the shadow out a bit

	gl_FragColor = vec4(rgb, alpha);
}