const compression = require('compression');
const expressWS = require('express-ws');
const Parser = require('../parser');
const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const app = express();
const activeParsers = {};
expressWS(app);

// Подключаем базы данных
const Users = require('../database/users');
Users.init().catch(console.error);

// Парсим тело ответа и т.д.
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Работаем с вебсокетами
app.ws('/', (ws, req) => {
  /**
   * Проверяем авторизацию в системе
   * @return {boolean} `true` если пользователь авторизован
   */
  ws.checkAuth = function() {
    return Users.exist(
        req.query.uid,
    );
  };

  /**
   * Получить парсер пользователя
   * @return {Promise<Parser>}
   */
  ws.parser = function() {
    return new Promise((res, rej) => {
      if (req.query.uid in activeParsers) {
        res(activeParsers[req.query.uid]);
      } else {
        Users.read(req.query.uid)
            .then((data) => (
              [data.host, data.login, data.password, data.ttsLogin]
            ))
            .then((data) => (
              activeParsers[req.query.uid] = new Parser(...data),
              res(activeParsers[req.query.uid])
            ))
            .catch(rej);
      }
    });
  };

  /**
   * Метод для отправки ошибок в парсере
   * @param {*} err Пойманная ошибка
   */
  ws.sendCatch = function(err) {
    if (err.fr === true && err.auth()) {
      ws.sendError(
          err.message,
          4007,
      );
    } else if (err.fr === true && err.work()) {
      ws.sendError(
          err.message,
          4008,
      );
    } else {
      ws.sendError(
          err.message,
          4006,
      );
    }
  };

  /**
   * Метод для отправки ошибок
   * @param {string} msg Сообщение ошибки
   * @param {number} code Код ошибки
   */
  ws.sendError = function(msg, code = 4000) {
    const {mid = null, method = 'Message'} = ws.appData;
    ws.send(JSON.stringify({
      ok: false,
      mid,
      method,
      error: {
        msg,
        code,
      },
    }));
    ws.appData = {};
  };

  /**
   * Метод для отправки данных
   * @param {*} data Данные, которые нужно отправить
   */
  ws.sendData = function(data) {
    const {mid = null, method = 'Message'} = ws.appData;
    ws.send(JSON.stringify({
      ok: true,
      mid,
      method,
      data,
    }));
    ws.appData = {};
  };

  // Говорим клиенту, что мы готовы
  ws.send(JSON.stringify({
    ok: true,
    method: 'Open',
    data: {},
  }));

  // Слушаем новые сообщения от пользователя
  ws.on('message', (msg) => {
    // Парсим сообщение
    try {
      ws.appData = JSON.parse(msg);
    } catch (e) {
      ws.appData = {};
      ws.sendError(
          'Не удалось понять ваше сообщение',
          4001,
      );
      return;
    }
    if (typeof ws.appData != 'object') {
      ws.appData = {};
      ws.sendError(
          'Сообщение должно быть объектом',
          4002,
      );
      return;
    }
    if (!ws.appData.method) {
      ws.sendError(
          'Сообщение должно содержать method',
          4003,
      );
      return;
    }
    switch (ws.appData.method) {
      case 'CheckHost':
        if (!ws.appData?.data?.host) {
          ws.sendError(
              'Для этого метода необходимо передать параметр host',
              4005,
          );
          return;
        }
        Parser.checkHost(ws.appData.data.host)
            .then(() => ws.sendData({
              canWork: true,
            }))
            .catch(() => ws.sendData({
              canWork: false,
            }));
        break;
      case 'AuthForm':
        if (!ws.appData?.data?.host) {
          ws.sendError(
              'Для этого метода необходимо передать параметр host',
              4005,
          );
          return;
        }
        Parser.authData(ws.appData.data.host)
            .then((selectors) => ws.sendData({selectors}))
            .catch(ws.sendCatch);
        break;
      case 'SelectedData':
        if (!ws.appData?.data?.host) {
          ws.sendError(
              'Для этого метода необходимо передать параметр host',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.lastElem) {
          ws.sendError(
              'Для этого метода необходимо передать параметр lastElem',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.selected) {
          ws.sendError(
              'Для этого метода необходимо передать параметр selected',
              4005,
          );
          return;
        }
        Parser.selectedData(
            ws.appData.data.host,
            {
              lastElem: ws.appData.data.lastElem,
              alreadySelected: ws.appData.data.selected,
            },
        )
            .then((items) => ws.sendData({items}))
            .catch(ws.sendCatch);
        break;
      case 'AddUser':
        if (!ws.appData?.data?.host) {
          ws.sendError(
              'Для этого метода необходимо передать параметр host',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.ttsLogin) {
          ws.sendError(
              'Для этого метода необходимо передать параметр ttsLogin',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.username) {
          ws.sendError(
              'Для этого метода необходимо передать параметр username',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.password) {
          ws.sendError(
              'Для этого метода необходимо передать параметр password',
              4005,
          );
          return;
        }
        new Parser(
            ws.appData.data.host,
            ws.appData.data.username,
            ws.appData.data.password,
            ws.appData.data.ttsLogin,
        )
            .logIn({
              done() {
                Users.add({
                  host: ws.appData.data.host,
                  login: ws.appData.data.username,
                  password: ws.appData.data.password,
                  ttsLogin: ws.appData.data.ttsLogin,
                })
                    .then((id) => {
                      activeParsers[id] = this;
                      req.query.uid = id;
                      ws.sendData({id});
                    });
              },
            })
            .catch(ws.sendCatch);
        break;
      // Пользовательские методы
      case 'LogIn':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.parser()
            .then((parser) => parser.logIn())
            .then(() => ws.sendData({auth: true}))
            .catch(ws.sendCatch);
        break;
      case 'LogOut':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.parser()
            .then((parser) => parser.logOut({
              done() {
                this.at = 0;
                this.ver = 0;
                this.tokenTimeOut = 0;
              },
            }))
            .then(() => ws.sendData({auth: false}))
            .catch(ws.sendCatch);
        break;
      case 'CheckAuth':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.parser()
            .then((parser) => ws.sendData({need: parser.needAuth}))
            .catch(ws.sendCatch);
        break;
      case 'TimeOutAuth':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.parser()
            .then((parser) => {
              let time = parser.tokenTimeOut - Date.now();
              if (time < 0) time = 0;
              ws.sendData({time});
            })
            .catch(ws.sendCatch);
        break;
      case 'GetRange':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.parser()
            .then((parser) => ws.sendData({range: parser.range}))
            .catch(ws.sendCatch);
        break;
      case 'GetSubjectsID':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.parser()
            .then((parser) => ws.sendData({subjects: parser.subjects}))
            .catch(ws.sendCatch);
        break;
      case 'GetDiary':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        if (!ws.appData?.data?.start) {
          ws.sendError(
              'Для этого метода необходимо передать параметр start',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.end) {
          ws.sendError(
              'Для этого метода необходимо передать параметр end',
              4005,
          );
          return;
        }
        ws.parser()
            .then((parser) => {
              if (parser.needAuth) {
                ws.sendError(
                    'Для начала нужно авторизоваться в сетевом',
                    4007,
                );
              } else return parser;
            })
            .then((parser) => parser.getDiary({
              start: new Date(ws.appData.data.start),
              end: new Date(ws.appData.data.end),
            }))
            .then(ws.sendData)
            .catch(ws.sendCatch);
        break;
      case 'GetSubject':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        if (!ws.appData?.data?.id) {
          ws.sendError(
              'Для этого метода необходимо передать параметр id',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.start) {
          ws.sendError(
              'Для этого метода необходимо передать параметр start',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.end) {
          ws.sendError(
              'Для этого метода необходимо передать параметр end',
              4005,
          );
          return;
        }
        ws.parser()
            .then((parser) => {
              if (parser.needAuth) {
                ws.sendError(
                    'Для начала нужно авторизоваться в сетевом',
                    4007,
                );
              } else return parser;
            })
            .then((parser) => parser.getSubject({
              start: new Date(ws.appData.data.start),
              end: new Date(ws.appData.data.end),
              id: ws.appData.data.id,
            }))
            .then(ws.sendData)
            .catch(ws.sendCatch);
        break;
      case 'GetJournal':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        if (!ws.appData?.data?.start) {
          ws.sendError(
              'Для этого метода необходимо передать параметр start',
              4005,
          );
          return;
        }
        if (!ws.appData?.data?.end) {
          ws.sendError(
              'Для этого метода необходимо передать параметр end',
              4005,
          );
          return;
        }
        ws.parser()
            .then((parser) => {
              if (parser.needAuth) {
                ws.sendError(
                    'Для начала нужно авторизоваться в сетевом',
                    4007,
                );
              } else return parser;
            })
            .then((parser) => parser.getJournal({
              start: new Date(ws.appData.data.start),
              end: new Date(ws.appData.data.end),
            }))
            .then(ws.sendData)
            .catch(ws.sendCatch);
        break;
      case 'GetTotalMarks':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.parser()
            .then((parser) => {
              if (parser.needAuth) {
                ws.sendError(
                    'Для начала нужно авторизоваться в сетевом',
                    4007,
                );
              } else return parser;
            })
            .then((parser) => parser.getTotalMarks())
            .then(ws.sendData)
            .catch(ws.sendCatch);
        break;
      default:
        ws.sendError(
            'Требуемый метод неизвестен',
            4004,
        );
        break;
    }
  });
});

// Что-то похожее на api
app.get('/exist/:id', (req, res) => res.json(Users.exist(req.params.id)));

// Отдаем файлы приложения
app.use(compression());
app.get('/:dir/:file', (req, res) => res.sendFile(
    path.join(__dirname, 'public', req.params.dir, req.params.file),
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
            res.writeHead(302, {'Location': `https://${req.headers.host}:${process.env.HTTPS_PORT}${req.url}`});
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
console.log('Server started...');
