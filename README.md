# connect-php-cgi

PHP middleware for https://github.com/senchalabs/connect

This is a heavily modified fork of https://github.com/ddprrt/connect-php.
The aim of the fork is to get the middleware passing post and get data to php
correctly. I also wanted it to handle headers from PHP.

The way it was originally build just run a script with the php cli command.
This just runs a script and dumps the output to stdout. I've switched it to use
php-cgi makes it work more like apache modphp or fastcgi.

## Disclaimer

This plugin is a very early stage, and was primarily designed to provide a better PHP integration with [`grunt-contrib-connect`](https://github.com/gruntjs/grunt-contrib-connect). So for now, it was only tested with Grunt on a rather basic test set.

Its main goal is to parse and execute `.php` files whenever a request to such a file is made.

Do not use this in production. Its good for local development. Use a traditional
PHP webserver setup for production ever Apache mod_php or another server like
nginx with fastcgi.

## Getting Started
I haven't added this to the npm repo yet so to install you have to go direct
from git.

Install the module with: `npm install git+https://github.com/lightscaletech/connect-php-cgi.git`

## Using it with [Gulp](https://gulpjs.com/)

To use this with Gulp get the `gulp-serve` package. You can then setup middleware
for this.

Try something like this:

``` javascript
const gulp-serve = require('gulp-serve'),
      connectphp = require('connect-php-cgi'),
      target = './dist';

const server = serve({
    root: target,
    middleware: connectphp(target)
});

exports.serve = server;

```


## Using it with [Grunt](http://gruntjs.com/)

`grunt-contrib-connect` at the moment is very tight in it's execution and has no way to easily add another middleware to its execution stack as it was possible with `grunt-connect`. However, it is still possible to override the usually used `middleware` function. So, to just execute `.php` files we can easily set it up like this:

```javascript
module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);

    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    //Add this to the beginning of your Gruntfile.js
    var phpMiddleware = require('connect-php-cgi');

    grunt.initConfig({
        ...
        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                hostname: 'localhost',
                middleware: function(connect, options) {
                    // The directory where connect is executed
                    var directory = options.directory
                      || options.base[options.base.length - 1];
                    // Return an array of all middlewares
                    return [
                        phpMiddleware(directory)
                    ]
                }
            },
            ...
        }
    });
};
```

To sneak in our middleware into `grunt-contrib-connect`'s original middleware stack, we have to recreate a good chunk of their implementation. Add this to the middleware part described above:

```javascript
...
middleware: function(connect, options) {
    var middlewares = [];
    var directory = options.directory || options.base[options.base.length - 1];
    if (!Array.isArray(options.base)) {
        options.base = [options.base];
    }

    // Magic happens here
    middlewares.push(phpMiddleware(directory));

    options.base.forEach(function(base) {
        // Serve static files.
        middlewares.push(connect.static(base));
    });

    // Make directory browse-able.
    middlewares.push(connect.directory(directory));
    return middlewares;
}
...
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

* 0.0.1 - very early, initial release

## Requirements

* [connect](https://github.com/senchalabs/connect) 2.7.11
* PHP 5.4.0

## License
Copyright (c) 2013 Stefan Baumgartner. Licensed under the MIT license.
