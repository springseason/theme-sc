export default {
  name: 'crossProductPicker',
  component(crossProductId, defaultOptions) {
    const crossProductStore = window.Alpine.store('crossProducts')
    if (!crossProductStore) {
      throw new Error('Cross store not found.')
    }

    return {
      variants: null,
      currentVariant: null,
      currentOptions: null,
      init() {
        const variantEls = this.$el.querySelector('script[type="application/json"][data-xp-variants]')
        if (!variantEls) {
          console.error('Variant script element not found')
          return
        }

        try {
          const parsedVariants = JSON.parse(variantEls.textContent)
          if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
            this.variants = parsedVariants
          } else {
            console.error('Variants not found or empty')
            this.variants = []
          }
        } catch (error) {
          console.error('Error parsing variants JSON:', error)
          return
        }

        const currentVariantStore = crossProductStore.current[crossProductId]?.variant
        if (currentVariantStore) {
          this.currentOptions = currentVariantStore?.options
          this.currentVariant = currentVariantStore
        } else {
          if (!defaultOptions?.length) {
            console.error('Options not found or empty')
            return
          }
          this.currentOptions = defaultOptions
          this.updateCurrentVariant()
        }
      },
      handleUserInput(ev) {
        const idx = parseInt(this.$el.dataset.idx)
        const value = this.$event.target.value

        if (!Number.isInteger(idx) || idx < 0 || idx > 2 || !value) {
          console.error('Invalid index or value')
          return
        }

        this.currentOptions[idx] = value
        this.updateCurrentVariant()
      },
      updateCurrentVariant() {
        if (!this.currentOptions?.length) {
          console.error('Options not found or empty')
          return
        }
        if (!this.variants || !this.variants.length) {
          console.error('Variants not found or empty')
          return
        }

        if (!crossProductId) {
          console.error('id not found')
        }

        const selectedVariant = this.variants.find((variant) =>
          variant.options.every((option) => this.currentOptions.includes(option))
        )

        this.currentVariant = selectedVariant || null
        crossProductStore.updateCrossProduct(crossProductId, this.currentVariant)
      }
    }
  }
}
