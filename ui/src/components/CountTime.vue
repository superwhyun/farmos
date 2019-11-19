<template>
  <main class="site__content">
    <div class="container">
      <div class="timer">
        <span class="timer__session js-session">스위치 이름 </span>
        <span class="timer__countdown js-countdown">10</span>
      </div>
    </div>
  </main>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
$primary: #d9534f;
$secondary: #3eab45;
$white: #000;
$text: #333;

body {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  color: #fff;
  text-align: center;
  -webkit-font-smoothing: antialiased;
}

// helper
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

// Layout
.site {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background-color: $primary;
  transition: background-color 0.15s ease;
}

// Main
.timer {
  position: relative;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  flex-flow: column wrap;
  max-width: 224px;
  height: 224px;
  border: 4px solid $white;
  border-radius: 50%;

  &::before {
    content: "";
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    border: 1px solid rgba(0, 0, 0, 1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  &::before {
    width: 120%;
    height: 120%;
  }

  &::after {
    width: 80%;
    height: 80%;
  }
}

.timer__session {
  font-weight: 500;
}

.timer__countdown {
  font-size: 2.5rem;
}
</style>
