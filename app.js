const express = require('express'),
    router = express.Router(),
    app = express(),
    path = require('path'),
    port = process.env.PORT || 3000
   
   
   
    ;
//require("./util/uploadfilerouter.js")(app);
app.use(require("./util/commonImageUpload.js"));
/*const server = app.listen(port, function() {
    console.log('Listening on port ' + server.address().address + ":" + port);
});*/
app.use(express.static(path.join(__dirname, 'tmp')));
const server = app.listen(port, "127.0.0.5", function() {
    console.log('Listening on port ' + server.address().address + ":" + port);
});