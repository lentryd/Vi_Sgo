(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-5f6e93ce"],{"78ef":function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),Object.defineProperty(e,"withParams",{enumerable:!0,get:function(){return n.default}}),e.regex=e.ref=e.len=e.req=void 0;var n=s(i("8750"));function s(t){return t&&t.__esModule?t:{default:t}}function a(t){return a="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},a(t)}var o=function(t){if(Array.isArray(t))return!!t.length;if(void 0===t||null===t)return!1;if(!1===t)return!0;if(t instanceof Date)return!isNaN(t.getTime());if("object"===a(t)){for(var e in t)return!0;return!1}return!!String(t).length};e.req=o;var r=function(t){return Array.isArray(t)?t.length:"object"===a(t)?Object.keys(t).length:String(t).length};e.len=r;var l=function(t,e,i){return"function"===typeof t?t.call(e,i):i[t]};e.ref=l;var d=function(t,e){return(0,n.default)({type:t},(function(t){return!o(t)||e.test(t)}))};e.regex=d},8750:function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var n="web"===Object({NODE_ENV:"production",BASE_URL:"/"}).BUILD?i("cb69").withParams:i("0234").withParams,s=n;e.default=s},a55b:function(t,e,i){"use strict";i.r(e);var n=function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",[t.loading||t.domain.checking||t.ttslogin.loading||t.auth.checking?i("Loader",{directives:[{name:"show",rawName:"v-show",value:!t.lid,expression:"!lid"}]}):t._e(),i("md-dialog-confirm",{attrs:{"md-active":!t.loading&&!t.addUser&&!t.lid&&t.alredyLogIn,"md-title":"Добавить аккаунт?","md-content":"На этом устройстве уже был выполнен вход.<br/>Для открытия приложения нажмите <b>Отмена</b>","md-confirm-text":"Добавить","md-cancel-text":"Отмена"},on:{"md-cancel":function(e){return t.$router.replace("/diary")},"md-confirm":function(e){t.addUser=!0}}}),i("md-dialog",{staticClass:"login",attrs:{"md-active":!!t.lid,"md-fullscreen":!1}},[t.loading?i("Loader"):t._e(),i("md-dialog-title",[t._v("Добавить пользовятеля?")]),i("UserInfo",{attrs:{id:t.lid,cache:!1},on:{error:function(e){null==e&&(t.alert="Ссылка неактивна",t.lid=!1)}}}),i("md-dialog-actions",[i("md-button",{staticClass:"md-primary",attrs:{disabled:t.loading},on:{click:function(e){return t.$router.replace("/diary")}}},[t._v("Отмена")]),i("md-button",{staticClass:"md-primary",attrs:{disabled:t.loading},on:{click:t.checkLink}},[t._v("Добавить")])],1)],1),t.loading||t.lid||!t.addUser?t._e():i("md-steppers",{attrs:{"md-linear":"","md-vertical":"","md-active-step":t.step},on:{"update:mdActiveStep":function(e){t.step=e},"update:md-active-step":function(e){t.step=e}}},[i("md-step",{attrs:{id:"Domain","md-label":"Домен","md-editable":!1,"md-description":t.domain.checking?"Проверка...":null,"md-done":!0===t.domain.checked&&!0===t.domain.suitable,"md-error":!0===t.domain.checked&&!1===t.domain.suitable?"Сайт не подходит":""}},[i("p",[t._v("Ниже нужно указать ссылку на ваш сетевой город.")]),i("i",[t._v(" Например: "),i("a",{attrs:{href:"//sgo.rso23.ru/",target:"_blank"}},[t._v("https://sgo.rso23.ru/")]),t._v(" или "),i("a",{attrs:{href:"//212.220.99.65/",target:"_blank"}},[t._v("http://212.220.99.65/")])]),i("md-field",{staticClass:"md-layout-item md-xsmall-size-100 md-small-size-60 md-medium-size-40 md-large-size-30 md-xlarge-size-20"},[i("md-icon",[t._v("link")]),i("label",[t._v("Ссылка")]),i("md-input",{attrs:{autocomplete:"off"},model:{value:t.domain[0],callback:function(e){t.$set(t.domain,0,"string"===typeof e?e.trim():e)},expression:"domain[0]"}})],1),i("md-button",{staticClass:"md-primary",attrs:{disabled:t.domain.checking},on:{click:t.checkDomain}},[t._v(t._s(t.domain.checking?"Проверка...":"Продолжить"))])],1),i("md-step",{attrs:{id:"TTSLogin","md-editable":!t.auth.checking,"md-done":t.ttslogin[0].length>0,"md-label":"Образовательная организация","md-description":t.ttslogin.loading?"Загрузка формы...":null}},[t.ttslogin.selectors.length?i("p",[t._v(" Ниже вам нужно выбрать ваше учебное заведение (как в сетевом) ")]):t._e(),t._l(t.ttslogin.selectors,(function(e,n){return i("md-field",{key:e.id,staticClass:"md-layout-item md-xsmall-size-100 md-small-size-70 md-medium-size-50 md-large-size-40 md-xlarge-size-30",class:t.validationSelect(e.name)},[i("label",{attrs:{for:e.id}},[t._v(t._s(t.ttslogin.labels[e.id]))]),i("md-select",{attrs:{id:e.id,name:e.name},on:{"md-selected":function(e){return t.loadItems(n)}},model:{value:e.value,callback:function(i){t.$set(e,"value",i)},expression:"selector.value"}},t._l(e.options,(function(e){return i("md-option",{key:e.id,attrs:{value:e.id}},[t._v(t._s(e.name))])})),1),e.options.length>0&&!t.checkSelector(e.name)?i("span",{staticClass:"md-helper-text"},[t._v("Выберите "+t._s(t.ttslogin.labelsInfo[e.id]))]):t._e(),i("span",{staticClass:"md-error"},[t._v("Вы забыли выбрать "+t._s(t.ttslogin.labelsInfo[e.id]))])],1)})),t.ttslogin.selectors.length?i("md-button",{staticClass:"md-primary",attrs:{disabled:t.ttslogin.loading},on:{click:t.makeTTSLogin}},[t._v(t._s(t.ttslogin.loading?"Загрузка...":"Продолжить"))]):t._e()],2),i("md-step",{attrs:{id:"Authorization","md-label":"Авторизация"}},[i("p",[t._v(" Ниже нужно ввести логин и пароль для входа в сетевой город. ")]),i("i",[t._v("Эти данные хранятся на нашем сервере и не передаются третьим лицам.")]),i("md-field",{staticClass:"md-layout-item md-xsmall-size-100 md-small-size-60 md-medium-size-40 md-large-size-30 md-xlarge-size-20",class:t.validationAuth("login")},[i("label",[t._v("Логин")]),i("md-input",{attrs:{autocomplete:"login"},model:{value:t.auth.login,callback:function(e){t.$set(t.auth,"login",e)},expression:"auth.login"}}),t.$v.auth&&!t.$v.auth.login.required?i("span",{staticClass:"md-error"},[t._v("Вы забыли ввести логин")]):t.auth.checked&&!t.auth.suitable&&t.$v.auth&&!t.$v.auth.login.suitable?i("span",{staticClass:"md-error"},[t._v("Логин введен неверно")]):t._e()],1),i("md-field",{staticClass:"md-layout-item md-xsmall-size-100 md-small-size-60 md-medium-size-40 md-large-size-30 md-xlarge-size-20",class:t.validationAuth("password")},[i("label",[t._v("Пароль")]),i("md-input",{attrs:{type:"password",autocomplete:"password"},model:{value:t.auth.password,callback:function(e){t.$set(t.auth,"password",e)},expression:"auth.password"}}),t.$v.auth&&!t.$v.auth.password.required?i("span",{staticClass:"md-error"},[t._v("Вы забыли ввести пароль")]):t.auth.checked&&!t.auth.suitable&&t.$v.auth&&!t.$v.auth.password.suitable?i("span",{staticClass:"md-error"},[t._v("Пароль введен неверно")]):t._e()],1),i("md-button",{staticClass:"md-primary",attrs:{disabled:t.auth.checking},on:{click:t.checkAuth}},[t._v(t._s(t.auth.checking?"Проверка...":"Войти"))])],1)],1),i("md-snackbar",{attrs:{"md-position":"center","md-active":!!t.alert},on:{"update:mdActive":function(e){return e?"":t.alert=!1}}},[i("span",[t._v(t._s(t.alert))])])],1)},s=[],a=(i("7db0"),i("b0c0"),i("d3b7"),i("ac1f"),i("5319"),i("b85c")),o=i("5530"),r=i("2f62"),l=i("d4f4"),d=i.n(l),c=i("555f"),u=i("dac6"),h={data:function(){return{lid:null,alert:!1,loading:!0,addUser:!1,alredyLogIn:!1,step:"Domain",domain:{0:"",checked:!1,checking:!1,suitable:!1},ttslogin:{0:"",labels:{countries:"Страна",states:"Регион",provinces:"Округ/Район",cities:"Населённый пункт",funcs:"Тип ОО",schools:"Образовательная организация"},labelsInfo:{countries:"cтрану",states:"регион",provinces:"округ/район",cities:"населённый пункт",funcs:"тип ОО",schools:"образовательную организацию"},selectors:[],loading:!1},auth:{login:"",password:"",checked:!1,checking:!1,suitable:!1}}},computed:Object(o["a"])(Object(o["a"])({},Object(r["c"])({connectedUsers:function(t){return t.settings.storage.connectedUsers}})),{},{uid:{get:function(){return this.$store.state.settings.storage.uid},set:function(t){return this.$store.state.settings.storage.uid=t,!0}}}),methods:Object(o["a"])(Object(o["a"])({},Object(r["b"])(["CheckHost","AuthForm","SelectItems","AddUser","AddUserViaLink"])),{},{validationSelect:function(t){var e,i=this.$v[t],n=this.ttslogin.selectors.find((function(e){return e.name==t}));if(i)return{"md-invalid":i.$invalid&&i.$dirty&&(null===n||void 0===n||null===(e=n.options)||void 0===e?void 0:e.length)}},validationAuth:function(t){var e,i=null===(e=this.$v.auth)||void 0===e?void 0:e[t];if(i)return{"md-invalid":i.$invalid&&i.$dirty||i.$model===this.auth["old_".concat(t)]}},checkSelector:function(t){var e=this.ttslogin.selectors.find((function(e){return e.name==t}));return!!e&&!!e.options.find((function(t){return t.id==e.value}))},checkDomain:function(){var t=this;this.domain.checked=!1,this.domain.checking=!0,this.domain.suitable=!1,this.domain[0]=this.domain[0].replace(/https*:\/\/|\/.*/g,""),this.CheckHost(this.domain[0]).then((function(e){e&&(t.loadForm(),t.step="TTSLogin"),t.domain.checked=!0,t.domain.suitable=e})).catch((function(e){console.error(e),t.domain.checked=!1,t.alert="Произошла ошибка, попробуйте ещё раз"})).finally((function(){return t.domain.checking=!1}))},loadForm:function(){var t=this;this.$v.$reset(),this.ttslogin[0]="",this.ttslogin.loading=!0,this.ttslogin.selectors=[],this.AuthForm(this.domain[0]).then((function(e){return t.ttslogin.selectors=e})).catch((function(e){t.loadForm(),console.error(e)})).finally((function(){return t.ttslogin.loading=!1}))},loadItems:function(t){var e=this;if(this.ttslogin.selectors.length!=t+1&&null!=this.ttslogin.selectors[t].value){this.$v.$reset(),this.ttslogin[0]="",this.ttslogin.loading=!0;for(var i=this.ttslogin.selectors[t].name,n={},s=0;s<=t;s++){var a=this.ttslogin.selectors[s];n[a.name]=a.value}for(var o=t+1;o<this.ttslogin.selectors.length;o++)this.ttslogin.selectors[o].value=null,this.ttslogin.selectors[o].options=[];this.SelectItems({host:this.domain[0],lastElem:i,selected:n}).then((function(i){return e.ttslogin.selectors[t+1].options=i})).catch((function(i){console.error(i),e.loadItems(t)})).finally((function(){return e.ttslogin.loading=!1}))}},makeTTSLogin:function(){if(this.$v.$touch(),!this.$v.$invalid){var t,e=Object(a["a"])(this.ttslogin.selectors);try{for(e.s();!(t=e.n()).done;){var i=t.value;this.ttslogin[0]&&(this.ttslogin[0]+="&"),this.ttslogin[0]+=i.name+"="+i.value}}catch(n){e.e(n)}finally{e.f()}this.step="Authorization",this.$v.$reset()}},checkAuth:function(){var t=this;this.$v.$touch(),this.$v.$invalid||(this.auth.checking=!0,this.auth.suitable=!1,this.auth.old_login=this.auth.old_password=null,this.AddUser({host:this.domain[0],ttsLogin:this.ttslogin[0],login:this.auth.login,password:this.auth.password}).then((function(e){t.uid=e,t.connectedUsers.push(e),t.$router.replace("/diary")})).catch((function(e){switch(t.auth.checked=!0,e.code){case 4007:t.auth.suitable=!1;break;case 4005:t.auth.checked=!1,t.alert="Сервер не получил требуемых данных";break;case 4006:t.auth.checked=!1,t.alert="Ошибка парсера, попробуй ещё раз";break;case 4008:t.auth.checked=!1,t.alert=t.domain[0]+" не отвечает, попробуйте войти позже";break;default:t.auth.checked=!1,t.alert="Неизвестная ошибка, попробуйте ещё раз"}console.error(e)})).finally((function(){t.auth.checking=!1,t.auth.old_login=t.auth.login,t.auth.old_password=t.auth.password})))},checkLink:function(){var t=this;this.loading=!0,this.AddUserViaLink(this.lid).then((function(e){t.uid=e,t.connectedUsers.push(e),t.$router.replace("/diary")})).catch((function(e){t.lid=!1,t.alert="Ссылка неактивна",console.error(e)}))}}),validations:function(){var t,e=this,i={},n=Object(a["a"])(this.ttslogin.selectors);try{var s=function(){var n=t.value;i[n.name]={exist:function(){return e.checkSelector(n.name)}}};for(n.s();!(t=n.n()).done;)s()}catch(o){n.e(o)}finally{n.f()}return"Authorization"==this.step?{auth:{login:{required:d.a},password:{required:d.a}}}:i},mounted:function(){var t=this;this.loading=!0,this.lid=this.$route.params.lid,this.addUser=!!this.$route.params.addUser,this.$root.$children[0].checkExist().then((function(e){e||(t.addUser=!0),t.alredyLogIn=e})).finally((function(){return t.loading=!1}))},components:{Loader:c["a"],UserInfo:u["a"]}},m=h,f=(i("d6db"),i("2877")),g=Object(f["a"])(m,n,s,!1,null,null,null);e["default"]=g.exports},cb69:function(t,e,i){"use strict";(function(t){function i(t){return i="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i(t)}Object.defineProperty(e,"__esModule",{value:!0}),e.withParams=void 0;var n="undefined"!==typeof window?window:"undefined"!==typeof t?t:{},s=function(t,e){return"object"===i(t)&&void 0!==e?e:t((function(){}))},a=n.vuelidate?n.vuelidate.withParams:s;e.withParams=a}).call(this,i("c8ba"))},d4f4:function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var n=i("78ef"),s=(0,n.withParams)({type:"required"},(function(t){return"string"===typeof t?(0,n.req)(t.trim()):(0,n.req)(t)}));e.default=s},d6db:function(t,e,i){"use strict";var n=i("e67a"),s=i.n(n);s.a},e67a:function(t,e,i){}}]);
//# sourceMappingURL=chunk-5f6e93ce.1c07bbaa.js.map