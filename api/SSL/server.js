'use strict';

var app = require('../server.js');

require('greenlock-express')
    .init({
        packageRoot: __dirname,

        maintainerEmail: "jesseogunlaja@gmail.com",

        configDir: './greenlock.d',

        // whether or not to run at cloudscale
        cluster: false
    })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);
