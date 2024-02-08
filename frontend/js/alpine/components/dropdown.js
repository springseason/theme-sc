export default {
  name: 'dropdown',
  component() {
    return {
      open: false,
      init() {},
      toggle() {
        this.open = !this.open
      },
      close() {
        this.open = false
      },
      open() {
        this.open = true
      }
    }
  }
}
