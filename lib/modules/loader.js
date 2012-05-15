var paths = [
    '/assets/js/link.js',
    'linkshui/cli',
    'linkshui/history',
    'linkshui/order-divm'
];
var def_module_count = paths.length;

// Extract all module paths
var ordered_uris = [];
for (var uri in env_config.structure) {
    paths.push(env_config.structure[uri].__file);
    ordered_uris.push(uri); // remember the order so we can match them up (prob not necessary)
}
// Load using require js
require(paths, function(_, LinkshuiCli, LinkshuiHistory, LinkshuiOrderDivM) {
    // Build environment
    var env = new Link.Mediator('lshui-env');
    env.addModule('#hist', new LinkshuiHistory());
    env.addModule('#cli', new LinkshuiCli('lshui-cli-input'));
    env.addModule('#divm', new LinkshuiOrderDivM('lshui-env'));

    // Add config modules
    var Modules = Array.prototype.slice.call(arguments, def_module_count);
    for (var i=0; i < ordered_uris.length; i++) {
        var uri = ordered_uris[i];
        var Module = Modules[i];
        env.addModule(uri, new Module(env_config.structure[uri]));
    }

    // Logging
    if (env_config.logging_enabled) {
        Link.logMode('traffic', true);
    }
    
    // Wire the app to the window
    Link.attachToWindow(env, function(request, response) {
        // Add to the history
        var cmd = (request.uri == '#cli' && request.method == 'post') ? request.body.cmd : request.uri;
        env.dispatch({ uri:'#hist', method:'post', 'content-type':'js/object', body:{ cmd:cmd, response:response }}, function() {
            env.dispatch({ uri:'#hist', method:'get', 'accept':'text/html' }, function(response) {
                document.getElementById('lshui-hist').innerHTML = response.body;
            });
        });
        // Get HTML out of the response
        var html = Link.renderResponseToHtml(response);
        // Send to the div manager
        env.dispatch({ uri:'#divm/0', method:'put', 'content-type':'text/html', body:html });
    });
    
    // Set up the prompt
    var prompt_elem = document.getElementById('lshui-cli-prompt');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var twoDigits = function(v) { return ((v < 10) ? '0' : '') + v; };
    var setPrompt = function() {
        var now = new Date();
        prompt_elem.innerHTML = '' + twoDigits(now.getHours()) + ':' + twoDigits(now.getMinutes()) + ' ' + months[now.getMonth()] + twoDigits(now.getDate());
    };
    setInterval(setPrompt, 10000); // Update every 10 seconds, which is precise enough for minutes
    setPrompt();
});