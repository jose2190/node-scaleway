var rp = require('request-promise'),
    debug = require('debug')('node-scaleway:lib'),
    config = require('./config'),
    _ = require('lodash');


var Client = module.exports = function(options) {
  this.config = _.defaults(options || {}, config);
};


(function() {
  var client;

  this.request = function(path, method, input, options, cb) {
    client = this;

    // options parameter is optional
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    options = options || {};

    var url = client.config.api_endpoint + path.replace(/^\//, '');

    // build options
    _.defaults(options, {
      method: method,
      url: url,
      headers: {},
      resolveWithFullResponse: true
    });
    // default headers
    _.defaults(options.headers, {
      'Accept': 'application/json',
      'User-Agent': 'node-scaleway'  // FIXME: append version dynamically
    });
    // token-based authentication
    if (client.config.token) {
      _.defaults(options.headers, {
        'X-Auth-Token': client.config.token
      });
    }
    // input is passed in the options object to rp, if input is empty
    // we need to use json:true to enable automatic response JSON parsing
    _.defaults(options, {
      json: input || true
    });

    debug(method + ' ' + url, options);

    // display response from server
    if (debug.enabled) {
      options.transform = function(data, response) {
        debug(response.statusCode, {
          headers: response.headers,
          body: data
        });
        return response;
      };
    }

    if (client.config.dry_run) {
      console.error('dry-run, should call "' + options.method
                    + ' ' + options.url + '", exiting...');
      process.exit(1);
    }
    return rp(options).promise().nodeify(cb);
  };

  // HTTP verbs
  this.get = function(path, options, cb) {
    return this.request(path, 'GET', null, options, cb);
  };
  this.post = function(path, input, options, cb) {
    return this.request(path, 'POST', input, options, cb);
  };
  this.patch = function(path, input, options, cb) {
    return this.request(path, 'PATCH', input, options, cb);
  };
  this.put = function(path, input, options, cb) {
    return this.request(path, 'PUT', input, options, cb);
  };
  this.delete = function(path, options, cb) {
    return this.request(path, 'DELETE', null, options, cb);
  };

  // Helpers
  this.createServer = function(options) {
    var data = {
      organization: options.organization,
      name: options.name
    };
    data.organization = data.organization || this.config.organization;
    if (options.image) {
      data.image = options.image;
    }
    if (options.bootscript) {
      data.bootscript = options.bootscript;
    }
    if (options.root_volume) {
      data.volumes = data.volumes || {};
      data.volumes['0'] = options.root_volume;
    }
    if (options.volumes && options.volumes.length) {
      data.volumes = data.volumes || {};
      options.volumes.forEach(function(volume, idx) {
        data.volumes[(idx + 1).toString()] = volume;
      });
    }
    if (options.env) {
      data.tags = options.env;
    }

    return this.post('/servers', data);
  };

}).call(Client.prototype);
