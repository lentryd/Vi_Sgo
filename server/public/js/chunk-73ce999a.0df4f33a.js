(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-73ce999a"],{"159b":function(t,e,n){var i=n("da84"),o=n("fdbc"),a=n("17c2"),r=n("9112");for(var s in o){var c=i[s],l=c&&c.prototype;if(l&&l.forEach!==a)try{r(l,"forEach",a)}catch(u){l.forEach=a}}},1784:function(t,e,n){},"17c2":function(t,e,n){"use strict";var i=n("b727").forEach,o=n("a640"),a=n("ae40"),r=o("forEach"),s=a("forEach");t.exports=r&&s?[].forEach:function(t){return i(this,t,arguments.length>1?arguments[1]:void 0)}},4160:function(t,e,n){"use strict";var i=n("23e7"),o=n("17c2");i({target:"Array",proto:!0,forced:[].forEach!=o},{forEach:o})},5530:function(t,e,n){"use strict";n.d(e,"a",(function(){return a}));n("a4d3"),n("4de4"),n("4160"),n("e439"),n("dbb4"),n("b64b"),n("159b");function i(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function o(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);e&&(i=i.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,i)}return n}function a(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?o(Object(n),!0).forEach((function(e){i(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}},"78ef":function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),Object.defineProperty(e,"withParams",{enumerable:!0,get:function(){return i.default}}),e.regex=e.ref=e.len=e.req=void 0;var i=o(n("8750"));function o(t){return t&&t.__esModule?t:{default:t}}function a(t){return a="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},a(t)}var r=function(t){if(Array.isArray(t))return!!t.length;if(void 0===t||null===t)return!1;if(!1===t)return!0;if(t instanceof Date)return!isNaN(t.getTime());if("object"===a(t)){for(var e in t)return!0;return!1}return!!String(t).length};e.req=r;var s=function(t){return Array.isArray(t)?t.length:"object"===a(t)?Object.keys(t).length:String(t).length};e.len=s;var c=function(t,e,n){return"function"===typeof t?t.call(e,n):n[t]};e.ref=c;var l=function(t,e){return(0,i.default)({type:t},(function(t){return!r(t)||e.test(t)}))};e.regex=l},"83a5":function(t,e,n){"use strict";var i=n("1784"),o=n.n(i);o.a},8750:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var i="web"===Object({NODE_ENV:"production",BASE_URL:"/"}).BUILD?n("cb69").withParams:n("0234").withParams,o=i;e.default=o},a55b:function(t,e,n){"use strict";n.r(e);var i=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[t.domain.checking||t.ttslogin.loading||t.auth.checking?n("md-progress-bar",{attrs:{"md-mode":"indeterminate"}}):t._e(),n("md-steppers",{attrs:{"md-linear":"","md-vertical":"","md-active-step":t.step},on:{"update:mdActiveStep":function(e){t.step=e},"update:md-active-step":function(e){t.step=e}}},[n("md-step",{attrs:{id:"Domain","md-label":"Домен","md-editable":!1,"md-description":t.domain.checking?"Проверка...":null,"md-done":!0===t.domain.checked&&!0===t.domain.suitable,"md-error":!0===t.domain.checked&&!1===t.domain.suitable?"Сайт не подходит":""}},[n("p",[t._v("Ниже нужно указать ссылку на ваш сетевой город.")]),n("i",[t._v(" Например: "),n("a",{attrs:{href:"//sgo.rso23.ru/",target:"_blank"}},[t._v("https://sgo.rso23.ru/")]),t._v(" или "),n("a",{attrs:{href:"//212.220.99.65/",target:"_blank"}},[t._v("http://212.220.99.65/")])]),n("md-field",{staticClass:"md-layout-item md-xsmall-size-100 md-small-size-60 md-medium-size-40 md-large-size-30 md-xlarge-size-20"},[n("md-icon",[t._v("link")]),n("label",[t._v("Ссылка")]),n("md-input",{attrs:{autocomplete:"link"},model:{value:t.domain[0],callback:function(e){t.$set(t.domain,0,"string"===typeof e?e.trim():e)},expression:"domain[0]"}})],1),n("md-button",{staticClass:"md-primary",attrs:{disabled:t.domain.checking},on:{click:t.checkDomain}},[t._v(t._s(t.domain.checking?"Проверка...":"Продолжить"))])],1),n("md-step",{attrs:{id:"TTSLogin","md-editable":!t.auth.checking,"md-done":t.ttslogin[0].length>0,"md-label":"Образовательная организация","md-description":t.ttslogin.loading?"Загрузка формы...":null}},[t.ttslogin.selectors.length?n("p",[t._v(" Ниже вам нужно выбрать ваше учебное заведение (как в сетевом) ")]):t._e(),t._l(t.ttslogin.selectors,(function(e,i){return n("md-field",{key:e.id,staticClass:"md-layout-item md-xsmall-size-100 md-small-size-70 md-medium-size-50 md-large-size-40 md-xlarge-size-30",class:t.validationSelect(e.name)},[n("label",{attrs:{for:e.id}},[t._v(t._s(t.ttslogin.labels[e.id]))]),n("md-select",{attrs:{id:e.id,name:e.name},on:{"md-selected":function(e){return t.loadItems(i)}},model:{value:e.value,callback:function(n){t.$set(e,"value",n)},expression:"selector.value"}},t._l(e.options,(function(e){return n("md-option",{key:e.id,attrs:{value:e.id}},[t._v(t._s(e.name))])})),1),e.options.length>0&&!t.checkSelector(e.name)?n("span",{staticClass:"md-helper-text"},[t._v("Выберите "+t._s(t.ttslogin.labelsInfo[e.id]))]):t._e(),n("span",{staticClass:"md-error"},[t._v("Вы забыли выбрать "+t._s(t.ttslogin.labelsInfo[e.id]))])],1)})),t.ttslogin.selectors.length?n("md-button",{staticClass:"md-primary",attrs:{disabled:t.ttslogin.loading},on:{click:t.makeTTSLogin}},[t._v(t._s(t.ttslogin.loading?"Загрузка...":"Продолжить"))]):t._e()],2),n("md-step",{attrs:{id:"Authorization","md-label":"Авторизация"}},[n("p",[t._v(" Ниже нужно ввести логин и пароль для входа в сетевой город. ")]),n("i",[t._v("Эти данные хранятся на нашем сервере и не передаются третьим лицам.")]),n("md-field",{staticClass:"md-layout-item md-xsmall-size-100 md-small-size-60 md-medium-size-40 md-large-size-30 md-xlarge-size-20",class:t.validationAuth("login")},[n("label",[t._v("Логин")]),n("md-input",{attrs:{autocomplete:"login"},model:{value:t.auth.login,callback:function(e){t.$set(t.auth,"login",e)},expression:"auth.login"}}),t.$v.auth&&!t.$v.auth.login.required?n("span",{staticClass:"md-error"},[t._v("Вы забыли ввести логин")]):t.auth.checked&&!t.auth.suitable&&t.$v.auth&&!t.$v.auth.login.suitable?n("span",{staticClass:"md-error"},[t._v("Логин введен неверно")]):t._e()],1),n("md-field",{staticClass:"md-layout-item md-xsmall-size-100 md-small-size-60 md-medium-size-40 md-large-size-30 md-xlarge-size-20",class:t.validationAuth("password")},[n("label",[t._v("Пароль")]),n("md-input",{attrs:{type:"password",autocomplete:"password"},model:{value:t.auth.password,callback:function(e){t.$set(t.auth,"password",e)},expression:"auth.password"}}),t.$v.auth&&!t.$v.auth.password.required?n("span",{staticClass:"md-error"},[t._v("Вы забыли ввести пароль")]):t.auth.checked&&!t.auth.suitable&&t.$v.auth&&!t.$v.auth.password.suitable?n("span",{staticClass:"md-error"},[t._v("Пароль введен неверно")]):t._e()],1),n("md-button",{staticClass:"md-primary",attrs:{disabled:t.auth.checking},on:{click:t.checkAuth}},[t._v(t._s(t.auth.checking?"Проверка...":"Войти"))])],1)],1),n("md-snackbar",{attrs:{"md-position":"center","md-active":t.alert,"md-closed":function(){return t.alert=!1}},on:{"update:mdActive":function(e){t.alert=e},"update:md-active":function(e){t.alert=e}}},[n("span",[t._v(t._s(t.alert))])])],1)},o=[],a=(n("99af"),n("7db0"),n("b0c0"),n("d3b7"),n("ac1f"),n("5319"),n("b85c")),r=n("5530"),s=n("2f62"),c=n("d4f4"),l=n.n(c),u={data:function(){return{alert:!1,step:"Domain",domain:{0:"",checked:!1,checking:!1,suitable:!1},ttslogin:{0:"",labels:{countries:"Страна",states:"Регион",provinces:"Округ/Район",cities:"Населённый пункт",funcs:"Тип ОО",schools:"Образовательная организация"},labelsInfo:{countries:"cтрану",states:"регион",provinces:"округ/район",cities:"населённый пункт",funcs:"тип ОО",schools:"образовательную организацию"},selectors:[],loading:!1},auth:{login:"",oldLogin:"",password:"",oldPassword:"",checked:!1,checking:!1,suitable:!1}}},methods:Object(r["a"])(Object(r["a"])({},Object(s["b"])(["CheckHost","AuthForm","SelectItems","AddUser"])),{},{validationSelect:function(t){var e,n=this.$v[t],i=this.ttslogin.selectors.find((function(e){return e.name==t}));if(n)return{"md-invalid":n.$invalid&&n.$dirty&&(null===i||void 0===i||null===(e=i.options)||void 0===e?void 0:e.length)}},validationAuth:function(t){var e,n=null===(e=this.$v.auth)||void 0===e?void 0:e[t];if(n)return{"md-invalid":n.$invalid&&n.$dirty}},checkSelector:function(t){var e=this.ttslogin.selectors.find((function(e){return e.name==t}));return!!e&&!!e.options.find((function(t){return t.id==e.value}))},checkDomain:function(){var t=this;this.domain.checked=!1,this.domain.checking=!0,this.domain.suitable=!1,this.domain[0]=this.domain[0].replace(/https*:\/\/|\/.*/g,""),this.CheckHost(this.domain[0]).then((function(e){e&&(t.loadForm(),t.step="TTSLogin"),t.domain.checked=!0,t.domain.suitable=e})).catch((function(e){console.error(e),t.domain.checked=!1,t.alert="Произошла ошибка, попробуйте ещё раз"})).finally((function(){return t.domain.checking=!1}))},loadForm:function(){var t=this;this.$v.$reset(),this.ttslogin[0]="",this.ttslogin.loading=!0,this.ttslogin.selectors=[],this.AuthForm(this.domain[0]).then((function(e){return t.ttslogin.selectors=e})).catch((function(e){t.loadForm(),console.error(e)})).finally((function(){return t.ttslogin.loading=!1}))},loadItems:function(t){var e=this;if(this.ttslogin.selectors.length!=t+1&&null!=this.ttslogin.selectors[t].value){this.$v.$reset(),this.ttslogin[0]="",this.ttslogin.loading=!0;for(var n=this.ttslogin.selectors[t].name,i={},o=0;o<=t;o++){var a=this.ttslogin.selectors[o];i[a.name]=a.value}for(var r=t+1;r<this.ttslogin.selectors.length;r++)this.ttslogin.selectors[r].value=null,this.ttslogin.selectors[r].options=[];this.SelectItems({host:this.domain[0],lastElem:n,selected:i}).then((function(n){return e.ttslogin.selectors[t+1].options=n})).catch((function(n){console.error(n),e.loadItems(t)})).finally((function(){return e.ttslogin.loading=!1}))}},makeTTSLogin:function(){if(this.$v.$touch(),!this.$v.$invalid){var t,e=Object(a["a"])(this.ttslogin.selectors);try{for(e.s();!(t=e.n()).done;){var n=t.value;this.ttslogin[0]&&(this.ttslogin[0]+="&"),this.ttslogin[0]+=n.name+"="+n.value}}catch(i){e.e(i)}finally{e.f()}this.step="Authorization",this.$v.$reset()}},checkAuth:function(){var t=this;this.$v.$touch(),this.$v.$invalid||(this.auth.checking=!0,this.auth.suitable=!1,this.AddUser({host:this.domain[0],ttsLogin:this.ttslogin[0],login:this.auth.login,password:this.auth.password}).then((function(e){localStorage.uid=e,t.$router.replace("diary")})).catch((function(e){switch(t.auth.checked=!0,e.code){case 4007:t.auth.suitable=!1;break;case 4005:t.auth.checked=!1,t.alert="Сервер не получил требуемых данных";break;case 4006:t.auth.checked=!1,t.alert="Ошибка парсера, попробуй ещё раз";break;case 4008:t.auth.checked=!1,t.alert=t.domain[0]+" не отвечает, попробуйте войти позже";break;default:t.auth.checked=!1,t.alert="Неизвестная ошибка, попробуйте ещё раз"}console.error(e)})).finally((function(){t.auth.checking=!1,t.auth.oldLogin=t.auth.login,t.auth.oldPassword=t.auth.password})))}}),validations:function(){var t,e=this,n={},i=Object(a["a"])(this.ttslogin.selectors);try{var o=function(){var i=t.value;n[i.name]={exist:function(){return e.checkSelector(i.name)}}};for(i.s();!(t=i.n()).done;)o()}catch(r){i.e(r)}finally{i.f()}return"Authorization"==this.step?{auth:{login:{required:l.a,suitable:function(t){return t!=e.auth.oldLogin}},password:{required:l.a,suitable:function(t){return t!=e.auth.oldPassword}}}}:n},beforeCreate:function(){var t=this;fetch("//".concat(Object({NODE_ENV:"production",BASE_URL:"/"}).VUE_APP_host||location.hostname,"/exist/").concat(localStorage.uid)).then((function(t){return t.json()})).then((function(e){e&&t.$router.replace("diary")})).catch()}},d=u,h=(n("83a5"),n("2877")),f=Object(h["a"])(d,i,o,!1,null,"6f578e5e",null);e["default"]=f.exports},a640:function(t,e,n){"use strict";var i=n("d039");t.exports=function(t,e){var n=[][t];return!!n&&i((function(){n.call(null,e||function(){throw 1},1)}))}},b64b:function(t,e,n){var i=n("23e7"),o=n("7b0b"),a=n("df75"),r=n("d039"),s=r((function(){a(1)}));i({target:"Object",stat:!0,forced:s},{keys:function(t){return a(o(t))}})},cb69:function(t,e,n){"use strict";(function(t){function n(t){return n="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"===typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n(t)}Object.defineProperty(e,"__esModule",{value:!0}),e.withParams=void 0;var i="undefined"!==typeof window?window:"undefined"!==typeof t?t:{},o=function(t,e){return"object"===n(t)&&void 0!==e?e:t((function(){}))},a=i.vuelidate?i.vuelidate.withParams:o;e.withParams=a}).call(this,n("c8ba"))},d4f4:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var i=n("78ef"),o=(0,i.withParams)({type:"required"},(function(t){return"string"===typeof t?(0,i.req)(t.trim()):(0,i.req)(t)}));e.default=o},dbb4:function(t,e,n){var i=n("23e7"),o=n("83ab"),a=n("56ef"),r=n("fc6a"),s=n("06cf"),c=n("8418");i({target:"Object",stat:!0,sham:!o},{getOwnPropertyDescriptors:function(t){var e,n,i=r(t),o=s.f,l=a(i),u={},d=0;while(l.length>d)n=o(i,e=l[d++]),void 0!==n&&c(u,e,n);return u}})},e439:function(t,e,n){var i=n("23e7"),o=n("d039"),a=n("fc6a"),r=n("06cf").f,s=n("83ab"),c=o((function(){r(1)})),l=!s||c;i({target:"Object",stat:!0,forced:l,sham:!s},{getOwnPropertyDescriptor:function(t,e){return r(a(t),e)}})}}]);
//# sourceMappingURL=chunk-73ce999a.0df4f33a.js.map