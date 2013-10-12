var page = require('page');
var proxy = require('proxy');

// page('/', user.list);
// page('/blog/:repo', proxy.load, user.show);
// page('/blog/:repo/:id', proxy.load, user.edit);
// page('*', notfound);

page('/', proxy.load);
page();
