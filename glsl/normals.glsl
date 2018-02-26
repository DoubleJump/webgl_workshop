varying vec3 _normal;

void main()
{ 
	_normal = normalMatrix * normal;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

varying vec3 _normal;

void main() 
{
	vec3 N = (_normal / 2.0) + 0.5;
	gl_FragColor = vec4(N, 1.0);
}