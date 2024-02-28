export default {
  name: 'crossProducts',
  store() {
    return {
      isCustomiserVisible: false,
      current: {},
      updateCrossProduct(crossProductId, crossProductVariant) {
        Object.assign(this.current, { [crossProductId]: crossProductVariant })
      }
    }
  }
}
