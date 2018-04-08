var KeyState = 
{
	RELEASED: 0,
	UP: 1,
	DOWN: 2,
	HELD: 3,
}

var Keys = 
{
	TOUCH: -1,
	MOUSE_LEFT: 0,
	MOUSE_RIGHT: 1,
	BACKSPACE: 8,
	TAB: 9,
	ENTER: 13,
	SHIFT: 16,
	CTRL: 17,
	ALT: 18,
	CAPS: 20,
	ESC: 27,
	SPACE: 32,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	ZERO: 48,
	ONE: 49,
	TWO: 50,
	THREE: 51,
	FOUR: 52,
	FIVE: 53,
	SIX: 54,
	SEVEN: 55,
	EIGHT: 56,
	NINE: 57,
	A: 65,
	B: 66,
	C: 67,
	D: 68, 
	E: 69,
	F: 70,
	G: 71,
	H: 72,
	I: 73,
	J: 74,
	K: 75,
	L: 76,
	M: 77,
	N: 78,
	O: 79,
	P: 80,
	Q: 81,
	R: 82,
	S: 83,
	T: 84,
	U: 85,
	V: 86,
	W: 87,
	X: 88,
	Y: 89,
	Z: 90,
}

function Mouse()
{
	var m = {};
	m.position = new THREE.Vector3();
	m.last_position = new THREE.Vector3();
	m.delta = new THREE.Vector3();
	return m;
}

var input;
function Input()
{
	var r = {};
	r.mouse = Mouse();
	r.keys = new Uint8Array(256);

	window.addEventListener('keydown', on_key_down);
	window.addEventListener('keyup', on_key_up);
	window.addEventListener('mouseup', on_key_up);
	window.addEventListener('mousedown', on_key_down);
	window.addEventListener('mousemove', on_mouse_move);
  	
	var wrapper = document.querySelector('.wrapper');
  	wrapper.addEventListener("touchstart", on_touch_start);
  	wrapper.addEventListener("touchmove", on_touch_move);
  	wrapper.addEventListener("touchend", on_touch_end);

	input = r;
	return r;
}

function update_input()
{
	for(var i = 0; i < 256; ++i)
	{
		if(input.keys[i] === KeyState.DOWN) input.keys[i] = KeyState.HELD;
		else if(input.keys[i] === KeyState.UP) input.keys[i] = KeyState.RELEASED;
	}

	var m = input.mouse;
	m.delta.x = m.position.x - m.last_position.x;
	m.delta.y = m.position.y - m.last_position.y;
	m.last_position.x = m.position.x;
	m.last_position.y = m.position.y;
}

function key_up(code)
{
	return input.keys[code] === KeyState.UP;
}
function key_down(code)
{
	return input.keys[code] === KeyState.DOWN;
}
function key_held(code)
{
	return input.keys[code] === KeyState.HELD || input.keys[code] === KeyState.DOWN;
}
function key_released(code)
{
	return input.keys[code] === KeyState.RELEASED || input.keys[code] === KeyState.UP;
}

function on_key_down(e)
{
	var kc = e.keyCode || e.button;
	if(input.keys[kc] != KeyState.HELD) input.keys[kc] = KeyState.DOWN;
}
function on_key_up(e)
{
	var kc = e.keyCode || e.button;
	if(input.keys[kc] != KeyState.RELEASED) input.keys[kc] = KeyState.UP;
}
function on_mouse_move(e)
{
	input.mouse.position.x = e.clientX;
	input.mouse.position.y = e.clientY;
}


function on_touch_start(e)
{
	var t = e.changedTouches[0];
	input.mouse.position.x = t.clientX;
	input.mouse.position.y = t.clientY;
	input.mouse.last_position.x = t.clientX;
	input.mouse.last_position.y = t.clientY;
	input.keys[Keys.MOUSE_LEFT] = KeyState.DOWN;
}

function on_touch_move(e)
{
	var t = e.changedTouches[0];
	input.mouse.position.x = t.clientX;
	input.mouse.position.y = t.clientY;
}

function on_touch_end(e)
{
	var t = e.changedTouches[0];
	input.mouse.position.x = 0;
	input.mouse.position.y = 0;
	input.keys[Keys.MOUSE_LEFT] = KeyState.UP;
}