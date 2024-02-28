export default {
  name: 'crossProducts',
  store() {
    return {
      isCustomiserVisible: false,
      current: {},
      updateCrossProduct(crossProductId, crossProductVariant) {
        Object.assign(this.current, { [crossProductId]: crossProductVariant })
      },
      resetCurrent() {
        const currentCrossProductIds = Object.keys(this.current)
        if (currentCrossProductIds?.length) {
          this.current = {}
        }
      }
    }
  }
}
