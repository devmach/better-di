var betterDi = require('./better-di.js')([ ['version', '0.0.1'] ], {extendFn: true});

module.exports = {
  registerObject: function(test) {
    betterDi.register('object1', 'object1');

    test.equal(betterDi.get('object1'), 'object1');
    test.done();
  },

  registerFunction: function(test) {
    betterDi.register('fn1', function(){
      return true;
    });

    test.ok(betterDi.get('fn1')());
    test.done();
  },

  resolve: function(test) {
    betterDi.register('dep0', true);

    var testFunction = function(dep0){
      return function(){
        return dep0;
      }
    };

    test.ok(betterDi.resolve(testFunction)());
    test.done()
  },

  resolveAndRegister: function(test){
    betterDi.register('dep1', true);
    betterDi.resolveAndRegister('fn2', function(dep1){
      return function() {
        return dep1;
      }
    });

    test.ok(betterDi.get('fn2')());
    test.done();
  },

  depNotFound: function(test){
    test.throws(
      function() {
        betterDi.resolveAndRegister('fn3', function(depNotExists){
          return function() {
            return depNotExists;
          }
        });        
      },
      /Dependency `depNotExists` is not registered/
    );

    test.done();
  },

  cyclicError: function(test) {
    test.throws(
      function() {
        betterDi.resolveAndRegister([
          ['cyclic1', function(cyclic2) {return function() { return false; }}],
          ['cyclic2', function(cyclic1) {return function() { return false; }}],
        ]);

      },
      /Cyclic dependency/
    );
    test.done();
  }
};