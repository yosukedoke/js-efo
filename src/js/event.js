(function (window) {
  /**************************************************************************************
   EventDispatcher
   */

  window.EventDispatcher = function EventDispatcher() {
  };
  /**
   EventDispatcher.initialize( obj )
   オブジェクトobjに、W3C DOM3互換のイベント通知機能を追加します。
   これによりobjは、onLoad等のイベントを発行することができます。
   オブジェクトobjはこれにより、以下のプロパティと関数を装備します。
   obj.addEventListener(イベント名, リスナーオブジェ);
   obj.removeEventListener(イベント名, リスナーオブジェクト);
   obj.dispatchEvent(Eventオブジェクト);
   @param obj オブジェクト
   */
  EventDispatcher.initialize = function (obj) {
    //MIX IN following property and function int obj
    //be careful about Name Scape Corrision just for incase
    obj.listeners = {};
    obj.addEventListener = _addEventListener;
    obj.removeEventListener = _removeEventListener;
    obj.dispatchEvent = _dispatchEvent;
  };

  /*
   CAUTION INTERNAL OBJECT do not call it directory from EventDispatcher
   refered from targetObject.addEventListener()
   */
  _addEventListener = function (eventName, object) {
    //CAUTION
    //third param is not implemented yet
    //CAUTION:
    //scope of this object is always "TARGET" OBJECT, not EventDispatcher
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.removeEventListener(eventName, object);
    this.listeners[eventName].push(object); //register object
  };

  /*
   CAUTION INTERNAL OBJECT do not call it directory from EventDispatcher
   refered from targetObject.removeEventListener()
   */
  _removeEventListener = function (eventName, object) {
    //CAUTION:
    //scope of this object is always "TARGET" OBJECT, not EventDispatcher
    var listeners = this.listeners[eventName];
    if (!listeners || !listeners.length) return;

    var i = listeners.indexOf(object);
    if (i === -1) return;

    listeners.splice(i, 1);
  };

  /*
   CAUTION INTERNAL OBJECT do not call it directory from EventDispatcher
   refered from targetObject.dispatchEvent()
   eventObj : {type:イベント名, target:this}
   */
  _dispatchEvent = function (eventObj) {
    //CAUTION:
    //scope of this object is always "TARGET" OBJECT,not EventDispatcher

    var type = eventObj.type;
    var listeners = this.listeners[type];

    eventObj.target = eventObj.target || this;

    if (!listeners || !listeners.length) return;

    for (var i = 0, len = listeners.length; i < len; i++) {
      var listener = listeners[i];
      if (typeof(listener) === 'object') {
        if(listener[type] && typeof(listener[type]) === 'function') {
          listener[type].apply(listener, [eventObj]);
        }
      } else {
        listener(eventObj);
      }
    }
  };

  window.events = function () {
  };
  EventDispatcher.initialize(window.events);
})(this);