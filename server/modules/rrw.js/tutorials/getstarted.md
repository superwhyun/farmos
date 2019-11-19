Get Started
===========
## 파모스의 최근 센서 측정값을 확인
<pre><code>
var farmos = require('./farmos');

farmos.initialize ("../conf/farmos-server.ini")
.then (function () {
    return farmos.getlastobservations ([111,112,113,114]);
})
.then (function (obs) {
    console.log ("observations: ");
    console.log (obs);
    farmos.finalize ();
})
.catch (function (err) {
    console.log (err);
    farmos.finalize ();
});
</code></pre>

## 파모스의 특정 장비의 속성을 확인
<pre><code>
var farmos = require('./farmos');

farmos.initialize ("../conf/farmos-server.ini")
.then (function () {
    return farmos.getdeviceproperties (161);
})
.then (function (properties) {
    console.log ("properties");
    console.log (properties);
    farmos.finalize ();
})
.catch (function (err) {
    console.log (err);
    farmos.finalize ();
});
</code></pre>
