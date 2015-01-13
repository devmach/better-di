var toposort = require('toposort');

var BetterDiException = function (msg) {
  this.name = 'BetterDiException';
  this.message = msg;
};

var injector = {
  dependencies: {},

  getParameterNames: function(fn) {
    var regExp = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var x = arguments[0].
      toString().
      match(regExp)[1].
      replace(/ /g, '').
      replace(/,,/g, '').
      split(',').
      filter(function(i){ return i != '' });
    return x;
  },

  get: function(name) {
    if (!injector.dependencies.hasOwnProperty(name)) {
      throw new BetterDiException("Dependency `" + name + "` is not registered!");
    } else {
      return injector.dependencies[name];
    }
  },

  register: function(name, obj) {
    injector.dependencies[name] = obj;
    return injector;
  },

  resolve: function(deps, fn) {
    var fnDeps = [];
      
    if (typeof deps === 'function') {
      fn = deps;
      deps = injector.getParameterNames(deps);
    };

    if (!deps || !fn) {
      throw new BetterDiException(
        "\nWrong usage of the dependency injector!\n" +
        "Please define both dependency list or function itself"
      );
      return;
    };

    deps.forEach(function(d) {
      fnDeps.push(injector.get(d))
    });

    return fn.apply({}, fnDeps);
  },

  resolveAndRegister: function(name, fn) {
    var edges = [],
      depOrder = [],
      depTree = {};

    if (!name || (!(name instanceof Array) && !fn)) {
      throw new BetterDiException("Wrong usage of the dependency injector!");
      return;      
    };

    if ( name instanceof Array && !fn) {
      name.forEach(function(i){
        if (i.length !== 2) {
          throw new BetterDiException(
            "\n If you are using `resolveAndRegister()` in array notation \n" +
            "each element of array must contain two elements, fist element \n"+
            "is the name of the dependency and the second element is the \n"  +
            "dependency itself.\n\n"+
            i.toString() + " is wrong usage!"
          );
        }

        if (typeof i[1] == 'function') {
          var deps = injector.getParameterNames(i[1]);
          deps.forEach(function(j){
            edges.push([i[0], j]);
          });

          depTree[i[0]] = i[1];
        } else {
          injector.register(i[0], i[1]);
        }        
      });

      try {
        depOrder = toposort(edges).reverse();
      } catch(E) {
        throw new BetterDiException(E.message);
      };

      depOrder.forEach(function(name) {
        if(depTree.hasOwnProperty(name)) {
          injector.register(name, injector.resolve(depTree[name]));
        }
      });
    } else {
      injector.register(name, injector.resolve(fn));
    }

    return injector;
  },

};

module.exports = exports = function(toResolve, options) {
  options = options || {};

  if (options.extendFn) {
    Function.prototype.resolve = function() {
      return injector.resolve(this);
    }
  };

  return toResolve ? injector.resolveAndRegister(toResolve) : injector;
};