const useragent = require('express-useragent');
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
app.ws('/', (ws, req) => {
  /**
   * Проверяем авторизацию в системе
   * @return {boolean} `true` если пользователь авторизован
   */
  ws.checkAuth = function() {
    return Tokens.exist(req.query.uid);
  };

  /**
   * Получаем информацию о пользователе по токену
   * @return {Promise<Object>} информация о пользователе
   */
  ws.userInfo = function() {
    return Tokens.read(req.query.uid)
        .then(({uid}) => Users.read(uid));
  };

  /**
   * Сохраняем информацию о пользователе по токену
   * @param {Object} data Новая информация о пользователе
   * @return {Promise<Object>} информация о пользователе
   */
  ws.userSaveInfo = function(data) {
    return Tokens.read(req.query.uid)
        .then(({uid}) => Users.write(uid, data));
  };

  /**
   * Получаем информацию об устройстве
   * @return {Object} информацию об устройстве
   */
  ws.deviceInfo = function() {
    const {
      isDesktop,
      isAndroid,
      isWindows,
      isTablet,
      isMobile,
      platform,
      isiPhone,
      browser,
      version,
      isMac,
      os,
    } = req.useragent;
    return {
      os,
      browser,
      version,
      platform,
      img: isTablet ?
            (
              isAndroid ? 'tablet_android' :
              isMac ? 'tablet_mac' :
              'tablet'
            ) :
            isMobile ?
            (
              isAndroid ? 'phone_android' :
              isiPhone ? 'phone_iphone' :
              'smartphone'
            ) :
            isDesktop ?
            (
              isWindows ? 'desktop_windows' :
              isMac ? 'desktop_mac' :
              'computer'
            ) :
            'device_unknown',
    };
  };

  /**
   * Получить парсер пользователя
   * @return {Promise<Parser>}
   */
  ws.parser = function() {
    return new Promise((res, rej) => {
      let udata;
      ws.userInfo()
          .then((data) => udata = data)
          .then(() => udata.id in activeParsers)
          .then((bool) => !bool ?
              activeParsers[udata.id] = new Parser(
                  udata.host,
                  udata.login,
                  udata.password,
                  udata.ttsLogin,
              ):
              activeParsers[udata.id],
          )
          .then(res)
          .catch(rej);
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
        if (!ws.appData?.data?.login) {
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
        if (!ws.appData?.data?.ttsLogin) {
          ws.sendError(
              'Для этого метода необходимо передать параметр ttsLogin',
              4005,
          );
          return;
        }
        let uid;
        let parser;
        new Parser(
            ws.appData.data.host,
            ws.appData.data.login,
            ws.appData.data.password,
            ws.appData.data.ttsLogin,
        )
            .logIn()
            .then((p) => parser = p)
            .then(() => Users.add({
              host: ws.appData.data.host,
              login: ws.appData.data.login,
              photo: parser.photo,
              email: parser.email,
              lastName: parser.lastName,
              firstName: parser.firstName,
              password: ws.appData.data.password,
              ttsLogin: ws.appData.data.ttsLogin,
            }))
            .then((id) => (
              uid = id,
              activeParsers[id] = parser
            ))
            .then(() => Tokens.add({
              uid,
              limited: false,
              ctime: new Date(),
              cdevice: ws.deviceInfo(),
            }))
            .then((id) => (
              req.query.uid = id,
              ws.sendData({id})
            ))
            .catch(ws.sendCatch);
        break;
      case 'AddUserViaLink':
        if (!ws.appData?.data?.id) {
          ws.sendError(
              'Для этого метода необходимо передать параметр id',
              4005,
          );
          return;
        }
        Links.write(ws.appData.data.id, {work: false})
            .then(({tid}) => Tokens.read(tid))
            .then(({uid, limited}) => {
              if (limited === true) {
                throw new Error('You don\'t have rights to this operation.');
              }
              return Tokens.add({
                uid,
                limited: true,
                ctime: new Date(),
                cdevice: ws.deviceInfo(),
              });
            })
            .then((id) => (
              req.query.uid = id,
              ws.sendData({id})
            ))
            .catch(ws.sendCatch);
        break;
      // Пользовательские методы
      case 'ChangeUser':
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
        req.query.uid = ws.appData.data.id;
        ws.sendData({changed: ws.checkAuth()});
        break;
      case 'GetAuthLink':
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
        Tokens.read(ws.appData.data.id)
            .then(({id, limited}) => {
              if (limited === true) {
                throw new Error('You don\'t have rights to this operation.');
              }
              return Links.connectionLink(id);
            })
            .then((id) => `http${req.secure ? 's' : ''}://${req.hostname}/login/${id}`)
            .then((link) => ws.sendData({link}))
            .catch(ws.sendCatch);
        break;
      case 'LogIn':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.parser()
            .then((p) => p.needAuth ? p.logIn() : {})
            .then((p) => p.readUserUpdate === false ?
              (
                p.readUserUpdate = true,
                ws.userSaveInfo({
                  photo: p.photo,
                  email: p.email,
                  lastName: p.lastName,
                  firstName: p.firstName,
                })
              ) :
              void 0,
            )
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
            .then((parser) =>
              parser.tokenTimeOut - Date.now() > 1000 ?
                parser.logOut() :
                void 0,
            )
            .then(() => ws.sendData({auth: false}))
            .catch(ws.sendCatch);
        break;
      case 'Exit':
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
        Tokens.del(ws.appData.data.id)
            .then(() => ws.sendData({leave: true}))
            .catch(ws.sendCatch);
        break;
      case 'Unlimited':
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
        Tokens.read(req.query.uid)
            .then(({limited}) => {
              if (limited === true) {
                throw new Error('You don\'t have rights to this operation.');
              }
              return Tokens.write(ws.appData.data.id, {limited: false});
            })
            .then(({limited}) => ws.sendData({limited}))
            .catch(ws.sendCatch);
        break;
      case 'CanShare':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        Tokens.read(req.query.uid)
            .then(({limited}) => ws.sendData({can: !limited}))
            .catch(ws.sendCatch);
        break;
      case 'CommonUsers':
        if (!ws.checkAuth()) {
          ws.sendError(
              'Для этого метода нужна авторизация в системе',
              4009,
          );
          return;
        }
        ws.userInfo()
            .then(({id}) => Tokens.commonUser(id))
            .then((users) => ws.sendData({users}))
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
            .then((parser) => ws.sendData({
              need: parser.tokenTimeOut - Date.now() <= 1000,
            }))
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
      case 'GetTypes':
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
            .then((parser) => parser.getTypes())
            .then((types) => ws.sendData({types}))
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
      case 'GetMark':
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
        ws.parser()
            .then((parser) => {
              if (parser.needAuth) {
                ws.sendError(
                    'Для начала нужно авторизоваться в сетевом',
                    4007,
                );
              } else return parser;
            })
            .then((parser) => parser.getMark({id: ws.appData.data.id}))
            .then((mark) => ws.sendData({mark}))
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
              start: new Date(
                  ws.appData.data.start,
              ),
              end: new Date(
                  ws.appData.data.end,
              ),
              id: ws.appData.data.id,
            }))
            .then((subject) => ws.sendData({subject}))
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

  // Говорим клиенту, что мы готовы
  ws.send(JSON.stringify({
    ok: true,
    method: 'Open',
  }));
});

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
console.info('Server started...');
