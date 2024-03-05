export default {
  name: 'crossProducts',
  store() {
    const { logError, throwError, parseJson } = window.sourcherry.helpers

    return {
      isCustomiserVisible: false,
      current: {},
      registerCrossProduct(el, crossProductId, options) {
        if (typeof crossProductId !== 'number') {
          throwError('Invalid cross product id')
        }

        const crossProduct = this.parseCrossProductEl(el, crossProductId)

        if (!crossProduct) {
          logError('Cross product not found')
          return
        }

        if (!crossProduct.variants?.length) {
          logError('Cross product variants not found')
          return
        }

        if (!options?.length) {
          logError('Default options not found')
          return
        }

        const selectedVariant = findSelectedVariant(crossProduct.variants, options)
        if (!selectedVariant) {
          logError('No variant matches the selected options')
          return
        }

        this.mutateState(crossProductId, {
          variants: crossProduct.variants,
          variant: selectedVariant
        })
      },
      updateCrossProductVariant(crossProductId, crossProductOptions) {
        if (!crossProductId) {
          logError('ID not found')
          return
        }

        const variants = this.current[crossProductId]?.variants

        if (!crossProductOptions?.length) {
          logError('Options not found or empty')
          return
        }
        if (!variants || !variants.length) {
          logError('Variants not found or empty')
          return
        }
        const selectedVariant = findSelectedVariant(variants, crossProductOptions)
        if (selectedVariant) {
          this.mutateState(crossProductId, { variant: selectedVariant })
        }
      },
      resetCrossProductVariant() {
        for (const id of Object.keys(this.current)) {
          this.mutateState(id, { variant: null })
        }
      },
      mutateState(crossProductId, { variants, variant }) {
        this.current = {
          ...this.current,
          [crossProductId]: {
            ...this.current[crossProductId],
            variants: variants ?? this.current[crossProductId].variants,
            variant
          }
        }
      },
      parseCrossProductEl(el, crossProductId) {
        return parseJson(el, `script[type="application/json"][data-crossproduct-id='${crossProductId}']`)
      }
    }
  }
}

const findSelectedVariant = (variants, options) =>
  variants.find((variant) => variant.options.every((option) => options.includes(option)))
