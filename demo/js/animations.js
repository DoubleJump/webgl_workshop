function build_animations()
{
	app.animations = {};

	app.animations.intro = new TimelineMax({paused:true}).
		from('.angle', 1.6, {x:1200}, 1.0).
		fromTo(app.spinner.scale, 1.0, {x:0.0001, y:0.0001, z:0.0001}, {x:1, y:1, z:1}, 1.4).
		fromTo(app.spinner.rotation, 1.8, {y:0}, {y:radians(720)}, 1.4).
		from('.background h2', 0.5, {opacity:0}, 2.0).
		from('.burger', 0.5, {x:-50, opacity:0}, 2.3).
		from('.colour-picker', 0.5, {x:-50, opacity:0}, 2.3).
		from('nav', 0.5, {x:50, opacity:0}, 2.3).
		from('.price', 0.5, {x:50, opacity:0}, 2.3).
		to(app.preloader, 1.5, {opacity:0, onComplete:function()
		{
			app.preloader.style.display = 'none';
		}}, 0.0);


	var spin = '+=' + radians(540);

	app.animations.colour_switch = new TimelineMax({paused:true}).
		to(app.spinner.rotation, 1.6, {y:spin, ease: Power4.easeOut}, 0.0).
		to(app.spinner.scale, 0.3, {x: 1, y:1, z:1}, 0.3).
		to(app.spinner.scale, 0.3, {x: 1.2, y:1.2, z:1.2}, 0.0).
		to(app.ui.bg_text, 0.0, {opacity: 0}, 0.0).
		to(app.ui.bg_text, 0.3, {opacity: 0.24}, 0.1);

}