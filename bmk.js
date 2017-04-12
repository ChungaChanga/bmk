var mediator, assign, APILib, courier, view; 
function ErrorRequest() {
  Error.call(this) ;
  this.name = 'ErrorRequest';
  this.message = 'Ошибка обращения к API ';

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ErrorRequest);
  } else {
    this.stack = (new Error()).stack;
  }
}
ErrorRequest.prototype = Object.create(Error.prototype);

var assign = (function() {
  var text = '',
  lang = 'en-ru', // направление перевода
  ui = 'ru',
  flags = 0x000c;
  function getParams() {
    return {
      text : text,
      lang : lang,
      ui : ui,
      flags : flags
    }
  }
  function setText(txt) {
    text = txt.trim();
  }
  function setLang(lg) {
    lang = lg;
  }
  function isOneWord() {
    return !(~text.indexOf(' ')); //
  }
  function toString() {
    return text + 'lang=' + lang;
  }
  return {
    isOneWord : isOneWord,
    setText : setText,
    setLang : setLang,
    getParams : getParams,
    toString : toString
  }
})() 


var APILib = (function() {
  
  var yandexDictionary, yandexInterpreter;
  
  
  
  yandexDictionaryAPI = {
    //https://tech.yandex.ru/dictionary/doc/dg/reference/lookup-docpage/
    
    path : 'https://dictionary.yandex.net/api/v1/dicservice.json/lookup?',
    /* каждый ключ имеет ограниченную квоту на количество переводов 
    за определенный период времени,
    больше ключей - больше раз можно воспользоваться API, меняя ключи
    */
    keys : [
      'dict.1.1.20161211T013101Z.4d434f548d2c6487.a0240ec240306be47446e646978bbb2c0f6ed6de'
    ],
    errorsRequest : {
        401 : ['Ключ API невалиден. '],
        402 : ['Ключ API заблокирован. '],
        403 : ['Превышено суточное ограничение на количество запросов.'],
        413 : ['Превышен максимальный размер текста.',true],
        501 : ['Заданное направление перевода не поддерживается.']
    },
    label : '«Реализовано с помощью сервиса' +
      '<a href=\'https://tech.yandex.ru/dictionary/\'>«Яндекс.Словарь»</a>',
    reformateResponse : function(responseObject) {
      responseObject = JSON.parse(responseObject);
      var def,result = [];
      for(var i = 0; i < responseObject.def.length; i++) {
        def = {
          formOfWord : responseObject.def[i].text,
          partOfSpeach : responseObject.def[i].pos,
          variants: []
        };
        for(var j = 0; j < responseObject.def[i].tr.length; j++) {
          def.variants.push(responseObject.def[i].tr[j].text);
        }
        result.push(def);
      }
      return result;
    },
    getPath : getPath,
    getKey : getKey,
    getLabel : getLabel,
    getCache : getCache,
    addToCache : addToCache,
    findInCache : findInCache,
    cache : {}
  };
  yandexInterpreterAPI = {
    path : 'https://translate.yandex.net/api/v1.5/tr.json/translate?',
    keys : [
      'trnsl.1.1.20161211T003418Z.db5d3b30556edece.4057f1957d715db135b319a576dea6b5c2a6f198'
    ],
    errorsRequest : {
        401 : ['Неправильный API-ключ '],
        402 : ['Ключ API заблокирован. '],
        404 : ['Превышено суточное ограничение на объем переведенного текста.'],
        413 : ['Превышен максимальный размер текста.',true],
        422 : ['Текст не может быть переведен.'],
        501 : ['Заданное направление перевода не поддерживается.']
    },
    label : '«Переведено сервисом' + 
    '<a href=\'http://translate.yandex.ru/\'>«Яндекс.Переводчик»</a>',
    reformateResponse : function(responseObject) {
      responseObject = JSON.parse(responseObject);
      //console.dir(responseObject.text[0])
      return responseObject.text[0];
    },
    getPath : getPath,
    getKey : getKey,
    getLabel : getLabel,
    getCache : getCache,
    addToCache : addToCache,
    findInCache : findInCache,
    cache : {}
  }
  function getLabel() {
    return this.label;
  }
  function getPath() {
    return this.path;
  }
  function getKey() {
    return this.keys[0];
  }
  /*function translate(path, key, params) {
    var result;
    if( result = findInCache(params) ) {
      mediator.translateCompleted(result);
    } else {
     // generateUrl(path, key, params);
      request(path, key, params);
    }
  }*/
  function addToCache(params, result) {
     //console.dir(this.cache) 
    this.cache[params.toString()] = result;
  }
  function findInCache(params) {
    /*if (!translator.cache) {
      translator.cache = {};
    }*/
   //console.log(params)  
    /*var result;
    if (result = this.cache[params.toString()]) {
      mediator.translateCompleted(result);
    } else {
      mediator.request();
    }*/
    //console.dir(this.cache)  ;
    return this.cache[params.toString()];
  }
  function getCache() {
    return this.cache;
  }
    
  return {
    selectAPI : function(API) {
      switch (API) { 
      case 'YD': return yandexDictionaryAPI;
        //break;
      case 'YI': return yandexInterpreterAPI;
       // break;
      }
    }
  }
})();
  
var courier = (function() {
  function request(path, key, params) {
    var xhr, url;
    //url = generateUrl(path, key, params);
    //url = urlCreator.addPath(path).addKey(key).addParams(params).getUrl();
    //console.dir(new URL);
    url = (new URL).addPath(path).addKey(key).addParams(params).getUrl();
    xhr = new XMLHttpRequest();
    xhr.open('GET', url );
    xhr.send();
    xhr.onload = function() {
      if (this.status === 200) {
        mediator.gotResponse(this.responseText);
      } else {
        var err = new ErrorRequest();
        err.code = this.status;
        err.url = url;
        mediator.errorRequestDetected(err);
      }
    }
    xhr.onerror = function(err) {
      err.code = this.status;
      err.url = url;
      mediator.errorRequestDetected(err)
    }
  }
  function URL() {
    this.url = '';
  }
  URL.prototype.addPath = function(path) {
    this.url += path;
    return this;
  };
  URL.prototype.addKey = function(key) {
    this.url += 'key=' + encodeURIComponent(key);
    return this;
  };
  URL.prototype.addParams = function(params) {
    for (var prop in params) {   
        this.url += '&' + prop + '=' + encodeURIComponent(params[prop]);
      }
    return this;
  };
  URL.prototype.getUrl = function() {
    return this.url;
  }

  return {
    request : request
  }
})();


var mediator = (function() {
  var API; //одно из APILib
  
  function start() {
    //инициализация букмарклета(добавление HTML, стилей, обработчиков событий)
    view.init();
  }
  function gotAssign(text) {
    var result;
    assign.setText(text);
    if ( assign.isOneWord() ) {
      API = APILib.selectAPI('YD'); //YD - yandexDictionary - словарь, много вариантов перевода
    } else {
      API = APILib.selectAPI('YI') //YI - yandexInterpreter - переводчик, 1 вариант перевода
    }
    if ( result = API.findInCache( assign.toString() ) ) {
      //console.dir( assign.toString() );
      this.translateCompleted(result);
    } else {
      this.request(API.getPath(), API.getKey(), assign.getParams());
    }
  //translator.translate( API.getPath(), API.getKey(), assign.getParams() );
  }
  function request(path, key, params) {
    courier.request(path, key, params);
  }
  function gotResponse(response) {
   // console.dir(response);

    var result;
    result = API.reformateResponse(response);
    //console.dir(result);
    this.translateCompleted(result);
  }
  function translateCompleted(result) {
    if ( assign.isOneWord() ) {
      view.selectTemplate('table') // HTML шаблон представления результата перевода 
    } else {
      view.selectTemplate('string')
    }
    view.reloadResultBlock( result );
    //console.dir(API.getLabel());
    view.reloadLabelBlock( API.getLabel() );
    //view.showWidget();
    API.addToCache(assign.toString(), result);
    //console.dir(API.getCache());
    //console.dir(API.getCache());
  }
  
  function errorRequestDetected(err) {
    if ( API.errorsRequest[err.code] ) {
      err.message += ' ' + API.errorsRequest[err.code][0];
      err.tellTheUser = API.errorsRequest[err.code][1];
    }
    this.errorDetected(err)
  }
  function errorDetected(err) {
    if (err.tellTheUser) {
      view.selectTemplate('YI');///////////
      view.reloadResultBlock( result );
      view.showWidget();
    } else {
      //console.info(err);
      console.info(err);
    }
  }
  function stop() { //отключение букмарклета
    view.stop();
  }
  
  return {
    start : start,
    gotAssign : gotAssign,
    request : request,
    gotResponse : gotResponse,
    translateCompleted : translateCompleted,
    stop : stop,
    errorRequestDetected : errorRequestDetected,
    errorDetected : errorDetected
  }
  
})();








var view = (function() {
  var HTML, CSS, eventHandler,
  prefix = 'bmk';/*Префикс, автоматически добавляется к именам классов в HTML и CSS
                  перед добавлением виджета на страницу*/
  
  function append(element) {
    document.body.appendChild(element);
  }
  function remove(element) {
    element.parentNode.removeChild(element);
  }
  
  function getByClassWithPrefix(className, pfx) {
    if (!pfx) {
      var pfx = prefix;
    }
    //console.log(className)
    var result;
    className = className.trim();
    className = '.' + pfx + className; // Добавление префикса к первому классу
    className = className.replace(/\s+/g, ' .'+pfx);//Добавление префиксов к остальных классам, если они есть
    result = document.querySelector(className)
    if (result instanceof Node) {
      return result;
    } else {
      var err = new Error('результат поиска ' + className +' - не DOM-элемент');
      mediator.errorDetected(err);
    }
  }
  HTML = (function() {
    var widget, //HTMLElement - корневой элемент букмарклета
      resultBlock, //HTMLElement - контейнер для результата перевода
      labelBlock, //HTMLElement - контейнер для label(информация обязательная к показу по условиям использования API)
      builderResultBlock, // функция преобразования рез-та в HTML
      widgetInnerHTML = '';//строка - HTML содержимое виджета
      
    widgetInnerHTML = 
    '<div class=\'WorkSpace\'>' +
      '<div class=\'ResultBlock\'>' +
        '<h3 class=\'HelpText\'>Выделите текст мышкой или воспользуйтесь формой</h3>' +
      '</div>' +
      '<form class=\'Controller\'>' +
     
        '<table><tr>' +
            '<td colspan=\'2\'>' +
              'Направление перевода:' +
                '<select class=\'FormSelectLang\'>' +
                  '<option selected=\'\' value=\'en-ru\'>Английский - Русский</option>' +
                  '<option value=\'ru-en\'>Русский - Английский</option>' +
                  '<option selected=\'\' value=\'ru-ru\'>Русский - Русский</option>' +
                '</select>' +
            '</td>' +
          '</tr>' +
          '<tr>' +
          '<td>' +
            '<textarea class=\'FormInput\' placeholder=\'Перевести\'></textarea>' +
          '</td>' +
          '<td>' +
            '<button class=\'FormButton\'>→</button>' +
            '<!--input type=\'button\' class=\'FormButton\' value=\'→\'></input-->' +
          '</td>' +
        '</tr></table>' +
        
      '</form>' +
      '<div class=\'LabelBlock\'>' +
      '</div>' +
    '</div>' +
    '<div class=\'Header\'>' +
      '<div class=\'toggleButton arrowUp\'>' +
      '</div>' +
    '</div>' ;

    function createWidget() {
     // console.log(5)
      widget = document.createElement('div');
      widget.className = 'DivTranslate';
      widget.innerHTML = widgetInnerHTML;
      resultBlock = widget.getElementsByClassName('ResultBlock')[0];
      labelBlock = widget.getElementsByClassName('LabelBlock')[0];
      //console.log(widget)
    }
    
    function reloadResultBlock(/*string HTML*/ result) {
      
      var htmlResult = builderResultBlock(result);
      resultBlock.innerHTML = htmlResult;
       //console.log(htmlResult)
    }
    function reloadLabelBlock(/*string HTML*/ label) {
     
      labelBlock.innerHTML = '<p>' + label + '</p>';
    }
    function result2Table(resultTranslate,pfx) {
      if (!pfx) {
        pfx = prefix;
      }
      var html = tHeadContent = tBodyContent = '';
      (function() {
        for(var i = 0; i < resultTranslate.length; i++) {
          tHeadContent +=   
                '<th>' +
                  resultTranslate[i].formOfWord +
                  '</br>' +
                  '<span class=' +pfx + 'PartOfSpeach>' +
                    resultTranslate[i].partOfSpeach +
                  '</span>' +
                '</th>';
          arr = resultTranslate[i].variants;
          tBodyContent += '<td><ul>';
          for(var j = 0; j < arr.length; j++) {
            tBodyContent += '<li>' +arr[j] + '</li>';
          }
          tBodyContent += '</ul></td>';
        }
      })();
          
      html =
        '<div>' +
          '<table>' +
            '<thead>' +
              '<tr>' + tHeadContent +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              '<tr>' + tBodyContent +
              '</tr>' +
            '</tbody>' +
          '</table>' +
        '</div>';
      return html;
    }
    
    function result2List(resultTranslate) {

      var html = dl = '';
      (function() {
        dl = '<dl>';
        for(var i = 0; i < resultTranslate.length; i++) {
          
          dl += `  
                <dt>
                  ${resultTranslate[i].formOfWord}
                  <span class="${prefix}PartOfSpeach">
                    ${resultTranslate[i].partOfSpeach}
                  </span>
                </dt>`;
          var arr = resultTranslate[i].variants;
          for(var j = 0; j < arr.length; j++) {
            dl += `<dd>${arr[j]}</dd>`;
          }
        }
        dl += '</dl>';
      })();   
      html = dl;
      return html;
    }
    function result2Sentence(result) {
      return '<table><tr><td>' + result + '</td></tr></table>';
    }
    
    /*Добавление префикса к именам классов в HTML*/
    function addPrefixes(prefix) {
      // добавление префикса к классам кореневого элемента
      widget.className = addPrefixes2Classes(prefix, widget.className);
      //console.log(widget.classList);
      // добавление префикса к классам Содержимого кореневого элемента
      var widgetDescendants = widget.getElementsByTagName('*');
      //console.log(widgetDescendants[4].classList);
      for (var i = 0; i < widgetDescendants.length; i++) {
        if (widgetDescendants[i].classList.length > 0) {
          widgetDescendants[i].className =
          addPrefixes2Classes(prefix, widgetDescendants[i].className);
        }
      }
    }
    function addPrefixes2Classes(prefix, className){
      className = className.trim();
      className = prefix + className; // Добавление префикса к первому классу
      className = className.replace(/\s+/g, ' '+prefix);
      return className;
    }
    
    return {
      getWidget: function() {
        if (!widget) {
          createWidget();
        }
        return widget;
      },
      selectTemplate: function(template) {
        switch (template) { 
        case 'table': builderResultBlock = result2Table;
          break;
        case 'string': builderResultBlock = result2Sentence;
          break;
        case 'list': builderResultBlock = result2List;
          break;
        }
      },
      reloadResultBlock: reloadResultBlock,
      reloadLabelBlock: reloadLabelBlock,
      addPrefixes: addPrefixes,
      createWidget: createWidget,
    }
  })();
  CSS = (function() {
    var styleTag, styleTagContent= 
   /*Сброс стилей страницы внутри виджета букмарклета*/
      '.DivTranslate{\
        all: initial;\
      }\
      .DivTranslate{\
        \
        font-family: sans-serif;\
        -webkit-font-smoothing: antialiased;\
        /*font: status-bar;*/\
        box-shadow:1px 1px 10px 1px rgb(238, 238, 238);;\
       /* max-width: 70%;\
        max-height: 70%;*/\
        width : auto;\
        box-sizing : border-box;\
        /*overflow: auto;*/\
        border: 2px solid;\
       /* border-radius:10px;\
        padding: 20px 15px 1px 15px;*/\
        position: fixed;\
        top : 0px;\
        right : 0px;\
        z-index: 1000;\
        background-color: white;\
      }\
      .Open{\
        display: block;\
      }\
      .Close{\
        display: none;\
      }\
      ::selection{\
        background: #ADFF2F;\
      }\
        \
      .DivTranslate:hover{\
        opacity : 1;\
      }\
      .Header{\
        height: 25px;\
      }\
      .WorkSpace{\
        margin : 20px 15px 1px 15px;\
      }\
     \
      .LabelBlock{\
        margin: 0px;\
        font : caption;\
        text-align : center;\
      }\
      .ResultBlock{\
        max-height: 400px;\
        overflow: auto;\
      }\
      .ResultBlock table {\
        display: block;\
        font-size: 100%;\
        overflow: auto;\
        width: auto;\
        text-align: center;\
        margin : auto;\
        display : inline-block;\
      }\
      .ResultBlock th,.HelpText{\
        background-color: rgb(238, 238, 238);\
        color: rgb(111, 111, 111);\
        font-weight: normal;\
        padding: 5px 10px;\
\
      }\
      .ResultBlock td {\
        padding: 5px 10px;\
        vertical-align : top;\
      }\
      .ResultBlock ul {\
        padding : 0px;\
      }\
      .ResultBlock li {\
        margin : 3px;\
        list-style : none;\
      }\
      .ResultBlock dt {\
        display: inline-block;\
       }\
      .ResultBlock dd {\
       \
       }\
      \
      .PartOfSpeach{\
        font-style: oblique;\
      }\
      .PartOfSpeach::before{\
        content : "(";\
      }\
      .PartOfSpeach::after{\
        content : ")";\
      }\
      .Controller fieldset{\
        border: 1px solid grey;\
      }\
      .Controller{\
        margin : auto;\
        width: auto;\
        height: auto;\
        margin-top: 15px;\
       \
      }\
      .Controller table{\
        /*display : inline-block;\
        margin: 0px;\
        padding: 0px;\
        box-sizing : border-box;*/\
        border-spacing: 8px;\
        width : 100%;\
       \
\
      }\
      .Controller td{\
        text-align : center;\
      }\
      .Controller textarea{\
        width : 100%;\
        margin : auto;\
        position : relative;\
        top : 2px;\
        box-sizing : border-box;\
      }\
      \
      .Controller button{\
        width : 100%;\
        height : 100%;\
      }\
      .Controller select{\
       font-size : 100%;\
      }\
      .ResultBlock{\
        text-align : center;\
        /*box-sizing : border-box;*/\
        width : auto;\
      }\
       /*кнопки-стрелки*/\
      .arrowDown, .arrowUp {\
        height: 6px;\
        width: 64px;\
      }\
   \
      .arrowDown, .arrowUp {\
          background-color: #e5e5e5;\
         \
          position: relative;\
      }\
      .arrowUp {\
          bottom: -18px;\
          margin-left: auto;\
          margin-right: auto;\
          margin-down: 2px;\
         /* transform: rotate(45deg);*/\
      }\
      .arrowDown {\
          top: 2px;\
          margin: 2px;\
      }\
      .arrowUp:before {\
          border-bottom: 16px solid #e5e5e5;\
          bottom: 6px;\
      }\
      .arrowDown:before {\
          border-top: 16px solid #e5e5e5;\
          top: 6px;\
      }\
      .arrowDown:after, .arrowDown:before, .arrowUp:after, .arrowUp:before {\
          border-left: 32px solid rgba(229,229,229,0);\
          border-right: 32px solid rgba(229,229,229,0);\
      }\
      .arrowDown:after, .arrowDown:before, .arrowUp:after, .arrowUp:before {\
          content: " ";\
          height: 0;\
          left: 0;\
          position: absolute;\
          width: 0;\
      }\
\
      .arrowUp:after {\
          border-bottom: 16px solid #fff;\
      }\
      .arrowUp:after {\
          bottom: 0;\
      }\
      .arrowDown:after {\
          border-top: 16px solid #fff;\
      }\
      .arrowDown:after {\
          top: 0;\
      }\
      .arrowDown:after, .arrowDown:before, .arrowUp:after, .arrowUp:before {\
          border-left: 32px solid rgba(229,229,229,0);\
          border-right: 32px solid rgba(229,229,229,0);\
      }\
      .arrowDown:after, .arrowDown:before, .arrowUp:after, .arrowUp:before {\
          content: " ";\
          height: 0;\
          left: 0;\
          position: absolute;\
          width: 0;\
      }';
    function createStyleTag() {
      if (styleTag instanceof Node) {
        mediator.errorDetected(new Error('styleTag уже существует') );
        return;
      }
      styleTag = document.createElement('style');
      //styleTagContent = styleTagContent.replace(/;/g, ' !important;');
      //styleTagContent = styleTagContent.replace(/{/g, '{'+resetCSS);
     
      // console.dir(styleTagContent);
      styleTag.textContent = styleTagContent;
    }
    function getStyleTag() {
       if (!styleTag) {
        createStyleTag();
      }
      return styleTag
    }
    function addPrefixes(prefix) {
    /*Добавление префикса к именам классов в CSS*/
     
      getStyleTag().textContent = getStyleTag().textContent.replace(/\s*\./g, '.' + prefix);
      // styleTagContent = styleTagContent.replace(/\s*\./g, `.${prefix}`);/////////////////////////
    }
    return {
      addPrefixes: addPrefixes,
      createStyleTag: createStyleTag,
      getStyleTag: getStyleTag
    }
  })();
  eventHandler = (function() {
    var widget = HTML.getWidget(),
    listeners = [];
    
    
    
    /*Здесь хранятся данные о событиях, 
    некоторые данные генерируются динамически,
    поэтому приходится хранить события в функции и вызывать только когда виджет создан*/
    function createListenersDescription() {
      listeners = [
      /*Функции обратного вызова будут оперировать уже готовы виджетом,
      так что если при создании виджета были добавлены префиксы к именам классов
      - это нужно учитывать и в Функциях обратного вызова,
      функция getByClassWithPrefix поможет получить нужный элемент с учетом префиксов*/
        { /* Получение выделенного текста*/
          DOMElement: document.body, 
          eventType: 'mouseup',
          callback: function(e){
            /*событие не распространяется на содержимое самого виджета
            (выделенный текст не будет автоматически переведен)*/
            //console.log(widget);
            //console.log(e.target);
            //console.log(widget.contains(e.target));
            if (widget.contains(e.target)) {
              return;
            }
            var selectedText = window.getSelection().toString();
            if(selectedText){ //если какой-то текст выделен пользователем
              mediator.gotAssign( selectedText );
            }
          }
        },
        {
          DOMElement: document.body,
          eventType: 'mousedown',
          callback: function(event){
            if( window.getSelection().toString() && (event.which === 1) ){ //
              window.getSelection().removeAllRanges();
            }
          }
        },
        {
          DOMElement: getByClassWithPrefix('toggleButton', prefix),
          eventType: 'click',
          callback: toggleWidget
        },
        {
          DOMElement: getByClassWithPrefix('FormButton', prefix),
          eventType: 'click',
          callback: function(e){
            e.preventDefault();
            var text = getByClassWithPrefix('FormInput', prefix).value;
            //console.log(text);
            mediator.gotAssign(text);
          }
        },
        {
          DOMElement: getByClassWithPrefix('FormSelectLang', prefix),
          eventType: 'click',
          callback: function(event){
            //////////////////////////////////////
            assign.setLang(event.target.value);
          }
        }
      ];
    }
    
    
    ///////функции изменяющие состояние виджета
    function removeWidget() {
      widget.parentNode.removeChild(widget);
    }
    function showWidget() {
      widget.classList.remove(prefix + 'Close');
      widget.classList.add(prefix + 'Open');
      getByClassWithPrefix('WorkSpace', prefix).classList.add(prefix + 'Open');
    }
    function toggleWidget() {
      var workSpace = getByClassWithPrefix('WorkSpace', prefix);
      var toggleButton = getByClassWithPrefix('toggleButton', prefix);
      if (workSpace.classList.contains(prefix + 'Open') ) {
        workSpace.classList.remove(prefix + 'Open');
        workSpace.classList.add(prefix + 'Close');
        toggleButton.classList.remove(prefix + 'arrowUp');
        toggleButton.classList.add(prefix + 'arrowDown');
      } else {
        workSpace.classList.remove(prefix + 'Close');
        workSpace.classList.add(prefix + 'Open');
        toggleButton.classList.remove(prefix + 'arrowDown');
        toggleButton.classList.add(prefix + 'arrowUp');
      }
    }
    function hideWidget() {
      widget.classList.remove(prefix + 'Open');
      widget.classList.add(prefix + 'Close');
      //getByClassWithPrefix(prefix, 'WorkSpace').style.display = 'none';
      //getByClassWithPrefix(prefix, 'toggleButton').className = `${prefix}toggleButton ${prefix}arrowDown`;
      
    }
    ///////////
    
    function addListener(DOMElement, eventType, callback) {
      if (!(DOMElement instanceof Node) ) {
        var err = new Error(DOMElement + 'не DOM-элемент');
        mediator.errorDetected(err);
      }
      DOMElement.addEventListener(eventType, callback);
    }
    function removeListener(DOMElement, eventType, callback) {
      if (!(DOMElement instanceof Node) ) {
        var err = new Error(DOMElement + 'не DOM-элемент');
        mediator.errorDetected(err);
      }
      DOMElement.removeEventListener(eventType, callback);
    }
    
    function addListeners() {
      //console.log(listeners);
      listeners.forEach( function(listener) {
          addListener(listener.DOMElement, listener.eventType, listener.callback);
        }
      );
    }
    function removeListeners() {
      listeners.forEach( function(listener) {
          removeListener(listener.DOMElement, listener.eventType, listener.callback);
        }
      );
    }
    return {
      run: function() {
        createListenersDescription();
        addListeners();
      },
      stop: removeListeners
    }
  })()
  
  
  
  function init() {
    HTML.createWidget();
    CSS.createStyleTag();
    HTML.addPrefixes(prefix);
    CSS.addPrefixes(prefix);
    append(HTML.getWidget());
    append(CSS.getStyleTag());
    eventHandler.run();
  }
  function stop() {
    eventHandler.stop();
    remove(HTML.getWidget());
  }
  return {
    init: init,
    stop: stop,
    selectTemplate: HTML.selectTemplate,
    reloadResultBlock: HTML.reloadResultBlock,
    reloadLabelBlock: HTML.reloadLabelBlock
  }
})();

mediator.start();