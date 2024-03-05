export default {
  name: 'crossProductPicker',
  component(crossProductId, defaultOptions) {
    const crossProductStore = window.Alpine.store('crossProducts')
    const helpers = window.sourcherry.helpers

    if (!crossProductStore) {
      throw new Error('Cross store not found.')
    }
    if (!defaultOptions?.length || defaultOptions.length > 3 || typeof defaultOptions[0] !== 'string') {
      console.error('Options not found or empty')
      return
    }
    return {
      options: [],
      init() {
        const currentStoreOptions = crossProductStore.current[crossProductId]?.variant?.options
        if (currentStoreOptions && currentStoreOptions.length < 3) {
          this.options = currentStoreOptions
        } else {
          this.options = defaultOptions
          crossProductStore.registerCrossProduct(this.$el, crossProductId, defaultOptions)
        }
      },
      handleUserInput(ev) {
        const idx = parseInt(ev.target.dataset.idx)
        const value = ev.target.value

        if (!Number.isInteger(idx) || idx < 0 || idx > 2 || !value) {
          console.error('Invalid index or value', idx, value)
          return
        }

        this.options = helpers.mutateArray(this.options, idx, value)
        crossProductStore.updateCrossProductVariant(crossProductId, this.options)
      },
      initWatcher() {
        this.$watch('$store.crossProducts.current', (current) => {
          const productVariantOptions = current[crossProductId]?.variant?.options

          if (productVariantOptions?.length && this.options?.length) {
            // sync all the input instances with the currentVariant options
            const eq = helpers.arraysAreEqual(productVariantOptions, this.options)
            if (!eq) {
              this.options = productVariantOptions
            }
            // on crossProducts reset
          } else {
            this.options = defaultOptions
            crossProductStore.updateCrossProductVariant(crossProductId, defaultOptions)
          }
        })
      }
    }
  }
}
