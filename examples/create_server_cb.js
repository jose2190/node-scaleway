#!/usr/bin/env node

"use strict";

var Client = require('..'),
    util = require('util'),
    argv = require('minimist')(process.argv.slice(2));
var client = new Client();


// Parsing arguments
var data = {
  organization: argv.organization || client.config.organization,
  name: argv.name || 'node-scaleway server'
};
if (argv.bootscript) {
  data.bootscript = argv.bootscript;
}
if (argv.image) {
  data.image = argv.image;
}
if (argv.snapshot) {
  data.volumes = {
    0: {
      base_snapshot: argv.snapshot,
      name: 'snapshot',
      volume_type: 'l_ssd',
      organization: argv.organization || client.config.organization
    }
  };
}
if (argv.tags) {
  data.tags = argv.tags;
}


// API interractions
console.log('Creating server...');
client.post('/servers', data, function(err, res) {
  if (err) {
    console.error(
      'Cannot create server',
      util.inspect(err, {showHidden: false, depth: null})
    );
  } else {
    // Everything is OK
    console.log(
      'Server created: ',
      util.inspect(res.body.server, { showHidden: false, depth: null })
    );

    // Starting server
    if (argv.start) {
      console.log('Starting created server...');
      client.post(
        '/servers/' + res.body.server.id + '/action',
        { action: 'poweron' },
        function(err, res) {
          if (err) {
            // Failed
            console.error(
              'Cannot start server',
              util.inspect(err, {showHidden: false, depth: null})
            );
          } else {
            // Everything is OK
            console.log(
              'Server started: ',
              util.inspect(res.body.task, { showHidden: false, depth: null })
            );
          }
        });
    }
  }
});
