/*
禁止打开控制台查看源码，
如果是先打开控制台再打开网页，则debuggerOpen将起作用
prohibitOpenConsole.js
*/

!(function () {
  function ProhibitOpenConsole() {}

  ProhibitOpenConsole.prototype.keyF12 = function () {
    document.addEventListener('keydown', function (e) {
      var ev = e || window.event;
      if (ev.keyCode == 123) {
        ev.preventDefault() || (ev.returnValue = false);
      }
    });
  };

  ProhibitOpenConsole.prototype.contextmenu = function () {
    document.addEventListener('contextmenu', function (e) {
      var ev = e || window.event;
      ev.preventDefault() || (ev.returnValue = false);
    });
  };

  ProhibitOpenConsole.prototype.debuggerOpen = function () {
    var timer = setInterval(() => {
      var before = new Date().getTime();
      // eslint-disable-next-line no-debugger
      debugger;
      var after = new Date().getTime();
      if (Math.abs(after - before) > 100) {
        clearInterval(timer); //如果同时调keyF12和contextmenu右键函数，则清不清除定时器都可以，但是如果只调用debuggerOpen，则不能清除定时器，避免关闭控制台再打开后debugger失效
      }
    }, 50);
  };

  ProhibitOpenConsole.prototype.otherDebugger = function () {
    function check() {
      function doCheck(a) {
        if (('' + a / a)['length'] !== 1 || a % 20 === 0) {
          console.log('请尊重别人成果!')(function () {}['constructor']('debugger')());
        } else {
          console.log('请尊重别人成果!')(function () {}['constructor']('debugger')());
        }
        doCheck(++a);
      }
      try {
        doCheck(0);
      } catch (err) {
        console.log();
      }
    }
    setInterval(function () {
      check();
    }, 50);
  };

  ProhibitOpenConsole.prototype.init = function () {
    this.keyF12();
    this.contextmenu();
    this.debuggerOpen();
    this.otherDebugger();
  };

  var check = new ProhibitOpenConsole();
  check.init();
})();
