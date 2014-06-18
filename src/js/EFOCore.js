(function (exports) {
  'use strict';

  function EFOResult(ruleName) {
    this.ruleName = ruleName;
  }
  EFOResult.OK = true;
  EFOResult.NG = false;
  EFOResult.prototype = {
    ruleName: null,
    warnObj : null,
    errorObj: null
  };
  EFOResult.prototype.isOK = function () {
    return !this.errorObj;
  };
  EFOResult.prototype.warn = function (warnObj) {
    this.warnObj = warnObj;
  };
  EFOResult.prototype.error = function (errorObj) {
    this.errorObj = errorObj;
  };

  /*
  * execute(values:Array, result:EFOResult):Error;
  */

  var rules = {};
  function EFORule(name, execute, options) {
    this.name = name;
    this.execute = execute;
    this.options = options || {};
  }
  EFORule.prototype.execute = function (values) {
    var returnObj = new EFOResult();
    var error;

    if('pre' in this.options && typeof this.options.pre === 'function') {
      values = this.options.pre(values);
    }

    try {
      error = this.execute.apply(this, [values]);

      if(error) {
        returnObj.error(error);
      }
    }
    catch(err) {
      returnObj.error(err);
    }

    return returnObj;
  };
  EFORule.execute = function (name, values) {
    if(this.hasRule(name)) { return; }

    var rule = this.getRule(name);
    return rule.execute(values);
  };

  EFORule.getRule = function (name) {
    if(this.hasRule(name)) { return null; }

    return rules[name];
  };
  EFORule.setRule = function (name, rule) {
    if(this.hasRule(name)) { return null; }

    return rules[name] = rule;
  };
  EFORule.addRule = function (name, rule, options) {
    if(this.hasRule(name)) { return; }

    return this.setRule(name, new EFORule(name, rule, options));
  };
  EFORule.hasRule = function (name) {
    return name in rules;
  };

  var filters = {
  };
  function EFOFilter(func) {
    this.func = func;
  }
  EFOFilter.prototype.get = function(elements) {
    if(elements instanceof Array) {
      return elements.map(this.func);
    }
    else {
      return this.func(elements);
    }
  };
  EFOFilter.hasFilter = function(name) {
    return name in filters;
  };
  EFOFilter.addFilter = function(name, func, forceOverride) {
    if(this.hasFilter(name)) { return; }

    return this.setFilter(name, new EFOFilter(func), forceOverride);
  };
  EFOFilter.getFilter = function(name) {
    return this.hasFilter(name) ? filters[name] : null;
  };
  EFOFilter.setFilter = function(name, filter, forceOverride) {
    if(this.hasFilter(name) && !forceOverride) { return; }

    return filters[name] = filter;
  };

  /*
  * Filter for Basic elements.
  */
  EFOFilter.addFilter('input', function (element) {
    var type = element.type;
    if (type.match(/file|submit|image|reset|button/)) {
      return null;
    }
    else if (type.match(/radio|checkbox/)) {
      return !!element.checked;
    }
    else {
      return element.value;
    }
  });
  EFOFilter.addFilter('textarea', function (element) {
    return element.innerHTML;
  });
  EFOFilter.addFilter('select', function (element) {
    var selections = element.options.filter(function(option) {
      return option.selected;
    });
    return selections.map(function (option) {
      return option.value;
    });
  });

  exports.efo = exports.efo || {};
  exports.efo.rules = exports.efo.rules || {};
  exports.efo.rules.EFORule = EFORule;

  exports.efo.filters = exports.efo.filters || {};
  exports.efo.filters.EFOFilter = EFOFilter;
})(this);

(function (exports, undefined) {
  'use strict';

  var BasicRule = {
    isArray: function(value) { return value instanceof Array; },
    isString: function(value) { return typeof value === 'string'; },
    isInteger: function(value) { return value.match(/[0-9]+/); },
    isNumber: function(value) { return value.match(/[0-9\.]+/); },
    isFunction: function(value) { return typeof value !== 'function'; }
  };

  var EFORule = exports.efo.rules.EFORule;
  EFORule.RegExp = {
    PASSWORD:/[^0-9A-Za-z@_\-]+/,
    EMAIL:/^[\.a-zA-Z0-9_\-]+@([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9][a-zA-Z0-9\-][a-zA-Z0-9]*$/
  };
  EFORule.addRule('text', function(value) {
    if (!BasicRule.isString(value)) return new Error('Invalid String');
  });
  EFORule.addRule('int', function(value){
    if(!BasicRule.isInteger(value)) return new Error('Invalid Integer');
  });
  EFORule.addRule('number', function(value){
    if(!BasicRule.isNumber(value)) return new Error('Invalid Number');
  });
  EFORule.addRule('email',function (value, value2) {
    if(arguments.length >= 2) {
      value = [value, value2].join('@');
    }

    if(arguments.length === 3) {
      var args = Array.prototype.slice.apply(arguments, [2, arguments.length-1]);
      args.unshift(value);
      value = args.join('.');
    }

    if(!value) {
      return new Error('Email is empty');
    }

    if (EFORule.RegExp.EMAIL.search(value) === -1) {
      return new Error('InValid Email');
    }
  });
  EFORule.addRule('password',function (value) {
    if(!EFORule.RegExp.PASSWORD.match(value)) return new Error('Invalid Password');
  });
  EFORule.addRule('birthday',function (year, month, date) {
    var birthday = new Date(year, month-1, date);

    if(isNaN(birthday.valueOf()) || parseInt(date) !== birthday.getDate()) {
      return new Error('Invalid Date');
    }
  });
  EFORule.addRule('zipCode',function (value1, value2) {
    var value = value2 ? value1 + value2 : value1;
    if(!BasicRule.isInteger(value)) return new Error('Invalid ZipCode');
    if(value === 7) return new Error('Invalid ZipCode');
  });

  EFORule.addRule('phoneNumber',function (value1, value2, value3) {
    var phoneNumber = value1;
    if(arguments.length === 3) {
      phoneNumber = [value1, value2, value3].join('');
    }

    if(!BasicRule.isInteger(phoneNumber)) return new Error('Invalid PhoneNumber');
    if(phoneNumber.length < 10 || phoneNumber.length > 11) return new Error('Invalid PhoneNumber');
  });

  EFORule.addRule('mobilePhoneNumber',function (value1, value2, value3) {
    var phoneNumber = value1;
    if(arguments.length === 3) {
      phoneNumber = [value1, value2, value3].join('');
    }

    if(!BasicRule.isInteger(phoneNumber)) return new Error('Invalid MobilePhoneNumber');
    if(phoneNumber.length !== 11) return new Error('Invalid MobilePhoneNumber');
  });

  //isKiyaku
  //isHankakuEisu
  //isHankakuEisuKigou


  EFORule.addRule('compire',function (valueA, valueB) {
    if(valueA !== valueB) {
      return new Error('Different Values');
    }
  });
  EFORule.addRule('range',function (count, min, max) {
    if(!isNaN(min) && count < min) {
      return new Error('Range Error');
    }
    if(!isNaN(max) && count > max) {
      return new Error('Range Error');
    }
  }, {
    pre: function (value) {
      if(BasicRule.isNumber(value)) {
        return value;
      }
      else if(BasicRule.isString(value)) {
        return value.length;
      }
      else if(BasicRule.isArray(value)) {
        return value.filter(function(a) { return !!a; }).length;
      }
      return NaN;
    }
  });

  //toHankakuEisu
  //toZenkakuKK

})(this);