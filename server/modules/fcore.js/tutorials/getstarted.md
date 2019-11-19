Get Started
===========
## 작동모드를 확인하는 예시
<pre><code>
var hasg = require('./hasg');

hasg.initialize ("../conf")
.then (function () {
    return hasg.getmode ();
})
.then (function (mode) {
    console.log ("mode : " + mode);
    hasg.finalize ();
})
.catch (function (err) {
    console.log (err);
    hasg.finalize ();
});
</code></pre>

## 다음번 초기화 시간을 가져오는 예시
<pre><code>
var hasg = require('./hasg');

hasg.initialize ("../conf")
.then (function () {
    return hasg.getnextinittime ();
})
.then (function (mode) {
    console.log ("mode : " + mode);
    hasg.finalize ();
})
.catch (function (err) {
    console.log (err);
    hasg.finalize ();
});
</code></pre>
