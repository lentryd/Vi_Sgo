(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-18ef6774"],{"159b":function(t,e,r){var o=r("da84"),s=r("fdbc"),a=r("17c2"),n=r("9112");for(var i in s){var l=o[i],c=l&&l.prototype;if(c&&c.forEach!==a)try{n(c,"forEach",a)}catch(u){c.forEach=a}}},"17c2":function(t,e,r){"use strict";var o=r("b727").forEach,s=r("a640"),a=r("ae40"),n=s("forEach"),i=a("forEach");t.exports=n&&i?[].forEach:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}},4160:function(t,e,r){"use strict";var o=r("23e7"),s=r("17c2");o({target:"Array",proto:!0,forced:[].forEach!=s},{forEach:s})},"4de4":function(t,e,r){"use strict";var o=r("23e7"),s=r("b727").filter,a=r("1dde"),n=r("ae40"),i=a("filter"),l=n("filter");o({target:"Array",proto:!0,forced:!i||!l},{filter:function(t){return s(this,t,arguments.length>1?arguments[1]:void 0)}})},5530:function(t,e,r){"use strict";r.d(e,"a",(function(){return a}));r("a4d3"),r("4de4"),r("4160"),r("e439"),r("dbb4"),r("b64b"),r("159b");function o(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function s(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);e&&(o=o.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,o)}return r}function a(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?s(Object(r),!0).forEach((function(e){o(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):s(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}},a55b:function(t,e,r){"use strict";r.r(e);var o=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("transition-group",{staticClass:"card",attrs:{tag:"form",name:"auth"}},[r("h3",{key:"header1"},[t._v("Авторизация")]),t.fromsSelected.length?t._e():r("div",{key:"host1",staticClass:"input-field"},[r("input",{directives:[{name:"model",rawName:"v-model",value:t.host,expression:"host"}],class:{invalid:null!=t.oldValue.host&&!t.suitedHost&&t.oldValue.host==t.host},attrs:{id:"link",type:"text",autocomplete:"off"},domProps:{value:t.host},on:{input:function(e){e.target.composing||(t.host=e.target.value)}}}),r("label",{attrs:{for:"link"}},[t._v("Домен")]),r("span",{staticClass:"helper-text",attrs:{"data-error":t.message.error}},[t._v(" "+t._s(t.message.default)+" ")])]),t._l(t.fromsSelected,(function(e){return r("div",{key:e.id,staticClass:"input-field",attrs:{name:e.name}},[r("select",{directives:[{name:"model",rawName:"v-model",value:e.value,expression:"select.value"}],staticClass:"browser-default",attrs:{name:e.name,"data-fn":t.checkOptions(e)},on:{change:[function(r){var o=Array.prototype.filter.call(r.target.options,(function(t){return t.selected})).map((function(t){var e="_value"in t?t._value:t.value;return e}));t.$set(e,"value",r.target.multiple?o:o[0])},function(r){return t.selected(e.name)}]}},t._l(e.options,(function(o){return r("option",{key:e.name+o.id,attrs:{disabled:null==o.id},domProps:{value:o.id}},[t._v(t._s(o.name))])})),0)])})),t.fromsSelected.length&&t.fromsSelected[t.fromsSelected.length-1].value?r("div",{key:"login1",staticClass:"input-field"},[r("input",{directives:[{name:"model",rawName:"v-model",value:t.login,expression:"login"}],class:{invalid:null!=t.oldValue.login&&(0==t.authError&&!t.login||1==t.authError&&t.oldValue.login==t.login)},attrs:{id:"login",type:"text",autocomplete:"login"},domProps:{value:t.login},on:{input:function(e){e.target.composing||(t.login=e.target.value)}}}),r("label",{attrs:{for:"login"}},[t._v("Логин")]),r("span",{staticClass:"helper-text",attrs:{"data-error":t.authError?"Тут ошибочка":"Ты забыл ввести логин"}},[t._v("Введи логин")])]):t._e(),t.fromsSelected.length&&t.fromsSelected[t.fromsSelected.length-1].value?r("div",{key:"password1",staticClass:"input-field"},[r("input",{directives:[{name:"model",rawName:"v-model",value:t.password,expression:"password"}],class:{invalid:null!=t.oldValue.password&&(0==t.authError&&!t.password||1==t.authError&&t.oldValue.password==t.password)},attrs:{id:"password",type:"password",autocomplete:"password"},domProps:{value:t.password},on:{input:function(e){e.target.composing||(t.password=e.target.value)}}}),r("label",{attrs:{for:"password"}},[t._v("Пароль")]),r("span",{staticClass:"helper-text",attrs:{"data-error":t.authError?"Тут ошибочка":"Ты забыл ввести пароль"}},[t._v("Введи пароль")])]):t._e(),0==t.fromsSelected.length||t.fromsSelected[t.fromsSelected.length-1].value?r("button",{key:"btn1",staticClass:"btn waves-effect waves-light light-blue darken-1",attrs:{disabled:t.attemptingLogin},on:{click:t.sudmit}},[t._v(" "+t._s(t.fromsSelected.length?t.attemptingLogin?"Подожди...":"Войти":"Проверить")+" "),r("i",{staticClass:"material-icons right"},[t._v("arrow_forward")])]):t._e()],2)},s=[],a=(r("99af"),r("7db0"),r("c740"),r("b0c0"),r("d3b7"),r("ac1f"),r("5319"),r("b85c")),n=r("5530"),i=r("2f62"),l={data:function(){return{host:"",login:"",password:"",message:{default:"Введи ссылку на дневник",error:""},oldValue:{host:null,login:null,password:null},authError:null,suitedHost:null,attemptingLogin:!1,fromsSelected:[]}},methods:Object(n["a"])(Object(n["a"])({},Object(i["b"])(["SendMessage"])),{},{sudmit:function(t){t.preventDefault(),0==this.fromsSelected.length?this.checkHost():this.logIn()},logIn:function(){var t=this;this.authError=null;var e="",r=this.fromsSelected,o=this.oldValue.login=this.login,s=this.oldValue.password=this.password;if(r[r.length-1].value){if(!o||!s)return this.authError=!1;this.attemptingLogin=!0;var n,i=Object(a["a"])(r);try{for(i.s();!(n=i.n()).done;){var l=n.value;l&&(e&&(e+="&"),e+="".concat(l.name,"=").concat(l.value))}}catch(c){i.e(c)}finally{i.f()}this.SendMessage({method:"AddUser",data:{host:this.host,username:o,password:s,ttsLogin:e}}).then((function(e){var r=e.id;return localStorage.uid=r,t.$router.replace("diary")})).catch((function(e){4007==e.code?(t.authError=!0,t.attemptingLogin=!1):4008==e.code?M.toast({html:"Сайт лег, попробуй позже"}):4006==e.code?M.toast({html:"Ошибка парсера, попробуй ещё раз"}):M.toast({html:"Неизвестная ошибка, попробуй ещё раз"}),console.error(e)}))}},checkHost:function(){var t=this,e=this.message.default;if(!this.host)return this.oldValue.host="",void(this.message.error="Ты забыл ввести ссылку");this.suitedHost=!0,this.message.default="Проверяю домен, подожди...",this.oldValue.host=this.host=this.host.replace(/https*:*\/*|\/.*/g,""),this.SendMessage({method:"CheckHost",data:{host:this.host}}).then((function(r){var o=r.canWork;if(t.suitedHost=o,t.message.default=e,!o)return t.message.default=e,void(t.message.error="Я не могу работать с этим сайтом");t.loadForm()})).catch((function(r){t.message.default=e,t.message.error=r.msg,t.suitedHost=!1,console.error(r)}))},loadForm:function(){var t=this,e=this.message.default;this.message.default="Получаю форму авторизации, подожди...",this.SendMessage({method:"AuthForm",data:{host:this.host}}).then((function(r){var o=r.selectors;t.fromsSelected=o,t.message.default=e})).catch((function(r){t.message.default=e,t.message.error=r.msg,t.suitedHost=!1,console.error(r)}))},selected:function(t){var e=this,r={},o=this.fromsSelected.findIndex((function(e){return e.name==t}))+1;if(o!=this.fromsSelected.length){for(var s=o;s<this.fromsSelected.length;s++)this.fromsSelected[s].value=null,this.fromsSelected[s].options=[{id:null,name:""}];for(var a=0;a<o;a++){var n=this.fromsSelected[a],i=n.name,l=n.value;r[i]=l}this.SendMessage({method:"SelectedData",data:{host:this.host,lastElem:t,selected:r}}).then((function(t){var r=t.items;return e.fromsSelected[o].options=r})).catch(console.error)}},checkOptions:function(t){t.options.find((function(e){return e.id==t.value}))||(t.value=null,t.options.unshift({id:null,name:"Тут нужно выбрать"}))}}),beforeCreate:function(){var t=this;fetch("/exist/".concat(localStorage.uid)).then((function(t){return t.json()})).then((function(e){e&&t.$router.replace("diary")}))}},c=l,u=r("2877"),d=Object(u["a"])(c,o,s,!1,null,null,null);e["default"]=d.exports},a640:function(t,e,r){"use strict";var o=r("d039");t.exports=function(t,e){var r=[][t];return!!r&&o((function(){r.call(null,e||function(){throw 1},1)}))}},b64b:function(t,e,r){var o=r("23e7"),s=r("7b0b"),a=r("df75"),n=r("d039"),i=n((function(){a(1)}));o({target:"Object",stat:!0,forced:i},{keys:function(t){return a(s(t))}})},c740:function(t,e,r){"use strict";var o=r("23e7"),s=r("b727").findIndex,a=r("44d2"),n=r("ae40"),i="findIndex",l=!0,c=n(i);i in[]&&Array(1)[i]((function(){l=!1})),o({target:"Array",proto:!0,forced:l||!c},{findIndex:function(t){return s(this,t,arguments.length>1?arguments[1]:void 0)}}),a(i)},dbb4:function(t,e,r){var o=r("23e7"),s=r("83ab"),a=r("56ef"),n=r("fc6a"),i=r("06cf"),l=r("8418");o({target:"Object",stat:!0,sham:!s},{getOwnPropertyDescriptors:function(t){var e,r,o=n(t),s=i.f,c=a(o),u={},d=0;while(c.length>d)r=s(o,e=c[d++]),void 0!==r&&l(u,e,r);return u}})},e439:function(t,e,r){var o=r("23e7"),s=r("d039"),a=r("fc6a"),n=r("06cf").f,i=r("83ab"),l=s((function(){n(1)})),c=!i||l;o({target:"Object",stat:!0,forced:c,sham:!i},{getOwnPropertyDescriptor:function(t,e){return n(a(t),e)}})}}]);
//# sourceMappingURL=chunk-18ef6774.0eb01a72.js.map