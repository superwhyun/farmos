<template>
  <b-card>
    <div v-if="weatherForecast" class="mb-4 ta-r">{{getFarm.info.address}}</div>
    <transition name="slide-fade">
      <b-row v-if="weatherForecast">
        <b-col v-for="item in weatherForecast.list" :key="item.id" style="text-align: center;">
          <img :src="getIcon(item.weather[0].icon)" style="width:80px"/>
          <div>{{$date().format(item.dt*1000, 'DD일 a h시',{locale: $date().ko})}}</div>
          <div class="mt-1">온도: {{item.main.temp}}°c</div>
          <div>습도: {{item.main.humidity}}°c</div>
          <div class="mt-1">{{item.weather[0].description}}</div>
        </b-col>
      </b-row>
    </transition>
  </b-card>
</template>

<script>
import day from '@/assets/img/weather/day.svg'
import night from '@/assets/img/weather/night.svg'
import cloudyDay from '@/assets/img/weather/cloudy-day-1.svg'
import cloudyNight from '@/assets/img/weather/cloudy-night-1.svg'
import cloudyDay3 from '@/assets/img/weather/cloudy-day-3.svg'
import cloudyNight3 from '@/assets/img/weather/cloudy-night-3.svg'
import cloudy from '@/assets/img/weather/cloudy.svg'
import rainy3 from '@/assets/img/weather/rainy-3.svg'
import rainy4 from '@/assets/img/weather/rainy-4.svg'
import snowy5 from '@/assets/img/weather/snowy-5.svg'
import thunder from '@/assets/img/weather/thunder.svg'

import { openweathermapKey } from '@/constants/config'
import { mapGetters } from 'vuex'
export default {
  name: 'Weather',
  data () {
    return {
      weatherForecast: null,
      iconMap: {
        '01d': day,
        '01n': night,
        '02d': cloudyDay,
        '02n': cloudyNight,
        '03d': cloudy,
        '03n': cloudy,
        '04d': cloudyDay3,
        '04n': cloudyNight3,
        '09d': rainy3,
        '09n': rainy3,
        '10d': rainy4,
        '10n': rainy4,
        '11d': thunder,
        '11n': thunder,
        '13d': snowy5,
        '13n': snowy5,
        '50d': cloudy,
        '50n': cloudy
      }
    }
  },
  computed: {
    ...mapGetters({
      getFarm: 'farm/getFarm'
    })
  },
  watch: {
    'getFarm.info.gps' (newValue, oldValue) {
      this.getWeather(this.getFarm.info.gps)
    }
  },
  mounted () {
    if (this.getFarm.info) {
      this.getWeather(this.getFarm.info.gps)
    }
  },
  methods: {
    getIcon (icon) {
      return this.iconMap[icon]
    },
    async getWeather (payload) {
      try {
        const { data } = await this.axios.get(
          `https://api.openweathermap.org/data/2.5/forecast`,
          {
            params: {
              lang: 'kr',
              lat: payload.split(',')[0],
              lon: payload.split(',')[1],
              cnt: 6,
              units: 'metric',
              appid: openweathermapKey
            }
          }
        )
        this.weatherForecast = data
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.currentWeatherIcon {
  width: 10%;
  height: 10%;
}
</style>
