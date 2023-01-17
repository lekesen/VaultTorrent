'use strict';

// documentation at: https://github.com/webtorrent/bittorrent-tracker

// Load necessary modules
const Server = require('bittorrent-tracker').Server;

module.exports.startServer = () => {
    const server = new Server({
        udp: true, // enable udp server
        http: false, // disable http server
        ws: false, // disable ws server
        stats: true, // enable web-based statistics
        trustProxy: false, // enable trusting x-forwarded-for header for remote IP [default=false]
        filter: function (infoHash, params, cb) {
            // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
            // omitted, all torrents are allowed. It is possible to interface with a database or
            // external system before deciding to allow/deny, because this function is async.
        
            // It is possible to block by peer id (whitelisting torrent clients) or by secret
            // key (private trackers). Full access to the original HTTP/UDP request parameters
            // are available in `params`.
        
            // This example only allows one torrent.
        
            //const allowed = (infoHash === 'aaa67059ed6bd08362da625b3ae77f6f4a075aaa')
            //if (allowed) {
              // If the callback is passed `null`, the torrent will be allowed.
              //cb(null)
            //} else {
              // If the callback is passed an `Error` object, the torrent will be disallowed
              // and the error's `message` property will be given as the reason.
              //cb(new Error('disallowed torrent'))
            //}
            cb(null);
          }
    });

    // Set up listeners to events
    server.on('error', function(err) {
        console.log(err.message);
    });

    server.on('warning', function(err) {
        console.log(err.message);
    });

    server.on('listening', function () {
        // fired when all requested servers are listening
        
        // UDP
        const udpAddr = server.udp.address();
        const udpHost = udpAddr.address;
        const udpPort = udpAddr.port;
        console.log(udpHost);
        console.log(udpPort);
        console.log(`UDP tracker: udp://${udpHost}:${udpPort}`);
        

        /*

        // HTTP
        const httpAddr = server.http.address()
        const httpHost = httpAddr.address !== '::' ? httpAddr.address : 'localhost'
        const httpPort = httpAddr.port
        console.log(`HTTP tracker: http://${httpHost}:${httpPort}/announce`)
      
        
      
        // WS
        const wsAddr = server.ws.address()
        const wsHost = wsAddr.address !== '::' ? wsAddr.address : 'localhost'
        const wsPort = wsAddr.port
        console.log(`WebSocket tracker: ws://${wsHost}:${wsPort}`)
        */
    });

    // Start tracker at designated port address
    const port = 8080;
    //const hostname = 'localhost';//'10.0.2.8';
    const host = 'localhost';

    server.listen(port, host, () => {
        // Do something on listening...
    });
    
    // listen for individual tracker messages from peers:
    
    server.on('start', function (addr) {
      console.log('got start message from ' + addr);
    });
    
    server.on('complete', function (addr) {});
    server.on('update', function (addr) {});
    server.on('stop', function (addr) {});
    /*
    // get info hashes for all torrents in the tracker server
    Object.keys(server.torrents)
    
    // get the number of seeders for a particular torrent
    server.torrents[infoHash].complete
    
    // get the number of leechers for a particular torrent
    server.torrents[infoHash].incomplete
    
    // get the peers who are in a particular torrent swarm
    server.torrents[infoHash].peers
    */
};