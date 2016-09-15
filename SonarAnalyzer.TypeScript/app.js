"use strict";
var net = require('net');
var analyzerHost_1 = require('./analyzerHost');
console.log('Starting app');
function handleInput(input, sock) {
    var analyzer = new analyzerHost_1.AnalyzerHost();
    return sock == null
        ? analyzer.analyzeFilesOnce(input)
        : analyzer.analyzeFiles(input, function (str) { return sock.write(str); });
}
if (process.argv.length > 3) {
    console.log('Running locally');
    console.log(handleInput(['..\\Samples\\SampleSolution\\ConsoleApplication1\\file1.ts'], null));
}
else {
    var server = net.createServer(function (sock) {
        var remoteAddress = sock.remoteAddress;
        var remotePort = sock.remotePort;
        // We have a connection - a socket object is assigned to the connection automatically
        console.log('CONNECTED: ' + remoteAddress + ':' + remotePort);
        // Add a 'data' event handler to this instance of socket
        sock.on('data', function (data) {
            console.log('DATA ' + remoteAddress + ': ' + data);
            handleInput(JSON.parse('' + data), sock);
        });
        // Add a 'close' event handler to this instance of socket
        sock.on('close', function (data) {
            console.log('CLOSED: ' + remoteAddress + ':' + remotePort);
        });
    });
    var port = parseInt(process.argv[2]);
    server.listen(port, '127.0.0.1');
    console.log('Listening on port ' + port);
}
//# sourceMappingURL=app.js.map