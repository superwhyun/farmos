var express = require('express');
var swaggerNodeRunner = require('swagger-node-runner');
var swaggerUi = require('swagger-ui-express');
var history = require('connect-history-api-fallback');
var cors = require('cors');

require('database.js')(require('jsonfile').readFileSync('../conf/config.json'))
const docs = '/docs';

var app = express();
app.use(cors({    
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}))

app.use(history({
    verbose: false,
    rewrites: [
        {
            from: /\/docs/,
            to: function (context) {
                return context.parsedUrl.pathname;
            }
        }
    ]
}));

var config = {
    appRoot: __dirname,
    swagger: 'api/swagger/swagger.yaml'
}

swaggerNodeRunner.create(config, function (err, swaggerRunner) {
    if (err) {
        throw err;
    }

    const swaggerExpress = swaggerRunner.expressMiddleware()
    swaggerExpress.register(app)

    app.use(express.static('public'));
    app.use(docs, swaggerUi.serve, swaggerUi.setup(require('yamljs').load('./api/swagger/swagger.yaml')));

    var port = swaggerExpress.runner.swagger.host.split(':')[1]
    app.listen(port, function () {
        console.log(`api listening on http://${swaggerExpress.runner.swagger.host + docs}`)
    })
})
