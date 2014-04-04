var pbx = {
	main: '',
	users: TAFFY(),
	lines: TAFFY(),
	groups: TAFFY()
};

function gen_id() {
	var id = '', i;
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (i = 0; i < 9; i++) id += possible.charAt(Math.floor(Math.random() * possible.length));
	return id;
}

function supports_html5_storage() {
  try {
    return 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
}

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
	var data = {};

	if (pbx_main === 'users') {
		data.users = pbx.users().get();
	}

	inject('t_'+pbx_main, 'main', data);

	// setup editable hooks
	$('#main [data-e="y"]').editable();
}

function set_main(main) {
	pbx_main = main;

	render_menu();
	render_main();
}

function init_db() {
	pbx.users.insert([{ id: gen_id(), caller_id: 'Bob', name: 'Billy Bob', email: 'bob@bobson.com' }]);
}

function editable_handler(response, newValue) {
	console.log(this);
	console.log(arguments);
}

$(document).ready(function() {
	// editable settings
	$.fn.editable.defaults.mode = 'inline';
	$.fn.editable.defaults.success = editable_handler;

	init_db();
	set_main('users');
});

