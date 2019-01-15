/*
 * connect-php-cgi
 * https://github.com/lightscaletech/connect-php-cgi
 *
 * Copyright (c) 2019 Lightscale Tech Ltd
 * Licensed under the MIT license.
 */

'use strict';
const {spawn}  = require('child_process');

module.exports = function phpMiddleware(directory) {
    // necessary to check the .php extensions
    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }


    function run_php(req, res, match) {
        const command = 'php-cgi',
              path = match[1],
              script = directory.substring(1) + path,
              query_string = typeof match[2] != 'undefined' ? match[2] : '',
              env = {
                  CONTENT_TYPE: req.headers['content-type'],
                  CONTENT_LENGTH: req.headers['content-length'],
                  GATEWAY_INTERFACE: 'CGI/1.1',
                  PATH_INFO: path,
                  QUERY_STRING: query_string,
                  REMOTE_ADDR: req.connection.remoteAddress,
                  REQUEST_METHOD: req.method,
                  SCRIPT_NAME: path,
                  SCRIPT_FILENAME: process.cwd() + script,
                  SERVER_NAME: 'localhost',
                  SERVER_PORT: req.client.localPort,
                  SERVER_PROTOCOL: 'HTTP/' + req.httpVersion,
                  SERVER_SOFTWARE: 'connectjs/1',
                  REDIRECT_STATUS: 200
              };

        let body = [];

        req.on('data', (chunk) => body.push(chunk))
           .on('end', () => {
               let p = spawn(command, ['-f', script], {env: env}),
                   response = [],
                   errors = [];
               body = Buffer.concat(body).toString();

               p.stdin.write(body);
               p.stdin.end();

               p.stderr.on('data', (chunk) => errors.push(chunk))
                .on('end', () => errors = Buffer.concat(errors).toString());

               p.stdout.on('data', (chunk) => response.push(chunk))
                .on('end', () => response = Buffer.concat(response).toString());

               p.on('close', (code) => {
                   if(code != 0) {
                       res.writeHead(500);
                       res.write(errors);
                       res.end();
                       return;
                   }

                   let [headers, data] = response.split('\r\n\r\n', 2);
                   headers = headers.split('\r\n');
                   headers = headers.reduce((res, h) => {
                       let [k, v] = h.split(': ');
                       res[k] = v;
                       return res;
                   }, {});

                   res.writeHead(200, headers);
                   res.write(data);
                   res.end();

               });
           });
    }

    return function (req, res, next) {
        const path_regex = /([\w\/\-\_]+\.php)\??(.+)?$/;

        if(path_regex.test(req.url))
            return run_php(req, res, path_regex.exec(req.url));
        else return next();
    };
};
