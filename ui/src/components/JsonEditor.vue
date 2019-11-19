<template>
  <div
    id="jsoneditor"
    ref="jsoneditor"
  />
</template>

<script>
import JSONEditor from 'jsoneditor/dist/jsoneditor.js'
import 'jsoneditor/dist/jsoneditor.min.css'
import _ from 'lodash'

export default {
  name: 'JsonEditor',
  data () {
    return {
      editor: null
    }
  },
  props: {
    type: {
      required: false,
      type: String,
      default: () => {
        return ''
      }
    },
    json: {
      required: true,
      type: [Object, Array],
      default: () => {
        return {}
      }
    },
    options: {
      type: Object,
      default: () => {
        return {}
      }
    },
    onChangeState: {
      type: Function
    },
    onChange: {
      type: Function
    }
  },
  watch: {
    json: {
      handler (newJson) {
        if (this.editor) {
          this.editor.set(newJson)
        }
      },
      deep: true
    }
  },
  methods: {
    _onChange (e) {
      if (this.onChangeState && this.editor) {
        this.onChangeState(true, this.type)
      }
    },
    editorJsonGet () {
      try {
        this.onChange(true, this.editor.get())
      } catch (error) {
        this.onChange(false)
      }
    },
    editorJsonRetrun () {
      return this.editor.get()
    }
  },
  mounted () {
    const container = this.$refs.jsoneditor
    const options = _.extend({
      onChange: this._onChange
    }, this.options)
    this.editor = new JSONEditor(container, options)
    this.editor.set(this.json)
    this.editor.aceEditor.setOptions({ maxLines: Infinity })
  },
  beforeDestroy () {
    if (this.editor) {
      this.editor.destroy()
      this.editor = null
    }
  }
}
</script>

<style>

</style>
