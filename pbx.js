var pbx_main = '';

function inject(source, dest, data) {
	// grab the template source by id
	// compile it and return html with context
	// insert into html of the dest id
	var src = $('#'+source).html();
	var template = Handlebars.compile(src || '');
	var html = template(data || {});
	$('#'+dest).html(html);
	console.log('injected', source, dest);
}

function render_menu() {
	// grab the datas for active state and badge counts
	var data = {};
	data.active = pbx_main;
	data.users = 12;
	data.lines = 8;
	data.groups = 1;

	inject('t_menu', 'menu', data);	
}

function render_main() {
	// probably have to get data and shit
	inject('t_'+pbx_main, 'main');
}

function set_main(main) {
	pbx_main = main;

	render_menu();
	render_main();
}

$(document).ready(function() {
	set_main('users');
});

