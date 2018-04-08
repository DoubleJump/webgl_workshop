//VERTEXSHADER

varying vec3 _normal;

void main()
{ 
	_normal = normalMatrix * normal;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

//FRAGMENTSHADER

varying vec3 _normal;

void main() 
{
	// Use the surface normal as a colour
	// x,y,z and r,g,b are the same thing
	// to a shader
	vec3 N = (_normal / 2.0) + 0.5;
	gl_FragColor = vec4(N, 1.0);
}