const useragent = require('express-useragent');
const compression = require('compression');
const expressWS = require('express-ws');
const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const app = express();
expressWS(app);

// Подключаем базы данных
const Users = require('../database/users');
const Links = require('../database/links');
const Tokens = require('../database/tokens');

// Инициализируем базы данных
Users.init().catch(console.error);
Links.init().catch(console.error);
Tokens.init().catch(console.error);

// Парсим тело ответа и т.д.
app.use(express.json());
app.use(useragent.express());
app.use(express.urlencoded({extended: true}));

// Работаем с вебсокетами
app.use(require('./ws'));

// Что-то похожее на api
app.get('/users/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  new Promise((res) => {
    Links.read(req.params.id)
        .then(({tid}) => tid)
        .catch(() => req.params.id)
        .then((id) => Tokens.read(id))
        .then(({uid}) => res(uid))
        .catch(() => res(req.params.id));
  })
      .then((id) => Users.read(id))
      .then((data) => {
        delete data.login;
        delete data.ttsLogin;
        delete data.password;
        res.json(data);
      })
      .catch(() => res.status(404).json({exist: false}));
});
app.get('/exist/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(Tokens.exist(req.params.id));
});

// Отдаем файлы приложения
app.use(compression());
app.get(/^\/(css|img|js)\/(.+)/, (req, res) => res.sendFile(
    path.join(__dirname, 'public', req.params[0], req.params[1]),
    {
      maxAge: 86400000,
    },
    (err) => {
      if (err) res.sendStatus(err.statusCode);
    },
));
app.get('/favicon.ico', (_req, res) => res.sendFile(
    path.join(__dirname, 'public', 'favicon.ico'),
    (err) => {
      if (err) res.sendStatus(err.statusCode);
    },
));
app.get(/^((?!\.websocket).)*$/, (_req, res) => res.sendFile(
    path.join(__dirname, 'public', 'index.html'),
    (err) => {
      if (err) res.sendStatus(err.statusCode);
    },
));

// Запускаем сервер
expressWS(
    app,
    http
        .createServer(
          process.env.ONLY_HTTPS == 1 ?
          (req, res) => {
            res.writeHead(302, {'Access-Control-Allow-Origin': '*', 'Location': `https://${req.headers.host}:${process.env.HTTPS_PORT}${req.url}`});
            res.end();
          } :
          app,
        )
        .listen(process.env.PORT),
);
expressWS(
    app,
    https
        .createServer(
            {
              key: fs.readFileSync(__dirname + '/ssl/private.key'),
              cert: fs.readFileSync(__dirname + '/ssl/certificate.crt'),
            },
            app,
        )
        .listen(process.env.HTTPS_PORT),
);
console.clear();
console.info(' Инфо '.info, 'Сервер запущен');
