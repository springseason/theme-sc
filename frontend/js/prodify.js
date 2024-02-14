class Prodify {
  constructor(settings) {
    this.helpers = window.sourcherry.helpers
    this.settings = { ...settings }
    this.initializeElements()
    this.bindEventListeners()
  }

  initializeElements() {
    this.el = document.querySelector('[data-prodify]')
    this.pickerType = this.el.dataset.prodify

    this.selectors = {
      priceContainer: '[data-prodify-price-container]',
      mediaContainer: '[data-prodify-media-container]',
      variantsJson: '[data-prodify-variants-json]',
      crossProductVariantsJson: '[data-prodify-cross-product-json]',
      optionContainer: '[data-prodify-option-container]',
      productForm: '[data-prodify-product-form]',
      quantityIncrement: '[data-prodify-quantity-increment]',
      quantityDecrement: '[data-prodify-quantity-decrement]',
      quantityPresentation: '[data-prodify-quantity-presentation]',
      crossProductId: 'data-prodify-cross-product-id', // ! no brackets
      crossProductInput: 'data-prodify-cross-product-radio', // ! no brackets
      upsellOptionInput: 'data-prodify-upsell-option-radio' // ! no brackets
    }

    this.textStrings = {
      addToCart: window.variantStrings.addToCart,
      unavailableVariantValueLabel: window.variantStrings.unavailable_with_option,
      soldOutVariantValueLabel: window.variantStrings.soldout_with_option,
      addButtonTextUnavailable: window.variantStrings.unavailable
    }

    this.quantityIncrementButton = this.el.querySelector(this.selectors.quantityIncrement)
    this.quantityDecrementButton = this.el.querySelector(this.selectors.quantityDecrement)
    this.quantityPresentationInput = this.el.querySelector(this.selectors.quantityPresentation)
    this.quantityHiddenInput = this.el.querySelector('input[name="quantity"]')

    this.upsellOptionEls = Array.from(this.el.querySelectorAll('.upsell-options > fieldset'))
    this.upsellOptions = this.upsellOptionEls.map((el) => el.name)

    this.currUOs = this.upsellOptionEls.reduce((acc, fieldset) => {
      const optionName = fieldset.name
      const checkedInput = fieldset.querySelector('input:checked')
      if (checkedInput) {
        return { ...acc, [optionName]: this.getUpsellOptionData(checkedInput.value) }
      }
      return acc
    }, {})

    this.updateTotalPrice()
  }
  getUpsellOptionData(optionValue) {
    const sel = `script[data-prodify-upsell-option="${optionValue}"]`
    const dataEls = this.el.querySelector(sel)
    return JSON.parse(dataEls.textContent)
  }
  bindEventListeners() {
    this.el.addEventListener('change', this.onOptionChange)
    if (this.quantityIncrementButton && this.quantityDecrementButton && this.quantityPresentationInput) {
      this.quantityIncrementButton.addEventListener('click', () => this.updateQuantity('up'))
      this.quantityDecrementButton.addEventListener('click', () => this.updateQuantity('down'))
    }
  }
  updateQuantity(stepDirection) {
    const adjustQuantity = (direction) => (quantity) => Math.max(1, quantity + direction)
    const previousQuantity = parseInt(this.quantityPresentationInput.value)
    const newQuantity = adjustQuantity(stepDirection === 'up' ? 1 : -1)(previousQuantity)
    this.quantityHiddenInput.value = this.quantityPresentationInput.value = newQuantity
  }
  updateCurrentVariant() {
    const variants = this.getVariantData()
    const matchingVariant = variants.find((variant) => {
      return variant.options.every((option, index) => {
        return this.options[index] === option
      })
    })
    this.currentVariant = matchingVariant
  }
  updateCurrentOptions() {
    if (this.pickerType == 'select') {
      this.options = Array.from(this.el.querySelectorAll('select'), (select) => select.value)
      return
    }
    this.optionContainers = Array.from(this.el.querySelectorAll(this.selectors.optionContainer))
    this.options = this.optionContainers.map((optionContainer) => {
      return Array.from(optionContainer.querySelectorAll('input')).find((radio) => radio.checked).value
    })
  }
  updateVariantIdInput() {
    const productForms = document.querySelectorAll(this.selectors.productForm)
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]')
      input.value = this.currentVariant.id
    })
  }
  updateURL() {
    if (!this.currentVariant || this.el.dataset.updateUrl === 'false') return
    window.history.replaceState({}, '', `${this.el.dataset.url}?variant=${this.currentVariant.id}`)
  }
  updateAddButtonDom(disable = true, text, modifyClass = true) {
    const productForm = document.querySelector(this.selectors.productForm)
    if (!productForm) return
    const addButton = productForm.querySelector('[name="add"]')
    const addButtonText = productForm.querySelector('[name="add"] > span')
    if (!addButton) return

    if (disable) {
      addButton.setAttribute('disabled', 'disabled')
      if (text) addButtonText.textContent = text
    } else {
      addButton.removeAttribute('disabled')
      addButtonText.textContent = this.textStrings.addToCart
    }

    if (!modifyClass) return

    if (disable) {
      addButton.classList.add('disabled')
    } else {
      addButton.classList.remove('disabled')
    }
  }
  setOptionSelected(select) {
    if (this.pickerType == 'select') {
      const options = Array.from(select.querySelectorAll('option'))
      const currentValue = select.value

      options.forEach((option) => {
        if (option.value === currentValue) {
          option.setAttribute('selected', 'selected')
        } else {
          option.removeAttribute('selected')
        }
      })
    }
  }
  compareInputValues() {
    const variantsMatchingOptionOneSelected = this.variantData.filter(
      // Grab the first checked input and compare it to the variant option1
      // return an array of variants where the option1 matches the checked input
      (variant) => this.el.querySelector(':checked').value === variant.option1
    )

    const inputWrappers = [...this.el.querySelectorAll(this.selectors.optionContainer)]
    inputWrappers.forEach((option, index) => {
      if (index === 0) return
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')]
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value
      const availableOptionInputsValues = variantsMatchingOptionOneSelected
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`])

      const existingOptionInputsValues = variantsMatchingOptionOneSelected
        .filter((variant) => variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`])

      this.setInputAvailability(optionInputs, availableOptionInputsValues, existingOptionInputsValues)
    })
  }
  setInputAvailability(optionInputs, availableOptionInputValues, existingOptionInputsValues) {
    optionInputs.forEach((input) => {
      if (availableOptionInputValues.includes(input.getAttribute('value'))) {
        if (this.pickerType == 'select') {
          input.innerText = input.getAttribute('value')
          return
        }
        input.classList.remove('out-of-stock')
      } else {
        if (existingOptionInputsValues.includes(input.getAttribute('value'))) {
          if (this.pickerType == 'select') {
            input.innerText = this.textStrings.soldOutVariantValueLabel.replace('[value]', input.getAttribute('value'))
            return
          }
          input.classList.add('out-of-stock')
        } else {
          if (this.pickerType == 'select') {
            input.innerText = this.textStrings.unavailableVariantValueLabel.replace(
              '[value]',
              input.getAttribute('value')
            )
            return
          }
          input.classList.add('disabled')
        }
      }
    })
  }
  swapProductInfo = (callback) => {
    window.sourcherry.helpers
      .fetchHTML(`${this.el.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.el.dataset.section}`)
      .then((responseHTML) => {
        const priceSource = responseHTML.querySelector(this.selectors.priceContainer)
        const priceTarget = this.el.querySelector(this.selectors.priceContainer)
        const mediaSource = responseHTML.querySelector(this.selectors.mediaContainer)
        const mediaTarget = this.el.querySelector(this.selectors.mediaContainer)
        const addButtonSource = responseHTML.querySelector(`${this.selectors.productForm} [name="add"]`)
        const addButtonTarget = this.el.querySelector(`${this.selectors.productForm} [name="add"]`)

        if (priceSource && priceTarget) {
          priceTarget.replaceWith(priceSource)
        }

        if (mediaSource && mediaTarget) {
          mediaTarget.replaceWith(mediaSource)
        }

        if (addButtonSource && addButtonTarget) {
          addButtonTarget.replaceWith(addButtonSource)
        }
      })
      .then(() => callback())
  }
  getVariantData = () => {
    this.variantData = this.variantData || JSON.parse(this.el.querySelector(this.selectors.variantsJson).textContent)
    return this.variantData
  }
  getCrossProductData = (id) => {
    if (typeof id !== 'string') return console.error('Cross product ID is missing')

    const selectorString = `${this.selectors.crossProductVariantsJson}[${this.selectors.crossProductId}="${id}"]`
    const crossProductDataEl = this.el.querySelector(selectorString)

    if (!crossProductDataEl || !crossProductDataEl?.textContent?.length) {
      return console.error(`Cross product: ${id} data is missing.`)
    }

    return JSON.parse(crossProductDataEl.textContent)
  }
  updateTotalPrice = () => {
    const totalPriceEl = this.el.querySelector('#total-price')
    if (!totalPriceEl || !totalPriceEl.textContent) {
      return console.error('total price el not found')
    }
    const regularPriceEl = this.el.querySelector('#regular-price')
    if (!regularPriceEl || !regularPriceEl.textContent) {
      return console.error('regular price el not found')
    }
    const regularPrice = this.helpers.parseMoneyString(regularPriceEl.textContent)

    const currentCrossProductOptionEls = Array.from(
      this.el.querySelectorAll(`input[${this.selectors.crossProductInput}]:checked`)
    )
    if (!currentCrossProductOptionEls.length) {
      return console.error('No cross product options selected.')
    }

    // [{ productId: variantTitle }, ...]
    const groupedData = currentCrossProductOptionEls.reduce((acc, node) => {
      const cpId = node.getAttribute(this.selectors.crossProductId)
      const variantOption = node.getAttribute('value')
      acc[cpId] = acc[cpId] ? `${acc[cpId]} / ${variantOption}` : variantOption
      return acc
    }, {})

    // { variantTitle: { price, ... other FE data }}
    const priceByProductId = Object.entries(groupedData).reduce((acc, [cpId, variantTitle]) => {
      const product = this.getCrossProductData(cpId)
      const currentVariant = product.variants.find((v) => v.title === variantTitle)

      if (!currentVariant || !currentVariant.id) {
        console.error('Current variant id not found.')
        return
      }
      return {
        ...acc,
        [variantTitle]: this.helpers.parseShopifyPrice(currentVariant.price)
      }
    }, {})

    const totalCrossPrice = Object.values(priceByProductId).reduce((acc, val) => acc + val, 0)

    const totalUpsellPrice = Object.values(this.currUOs).reduce((acc, val) => {
      const priceAmount = val?.price?.amount
      if (typeof priceAmount === 'string' || typeof priceAmount === 'number') {
        return acc + (typeof priceAmount === 'string' ? parseInt(priceAmount) : priceAmount)
      }
      return acc
    }, 0)

    totalPriceEl.textContent = this.helpers.formatCurrency(regularPrice.currency)(
      regularPrice.amount + totalCrossPrice + totalUpsellPrice
    )
  }
  getCurrentCrossProductVariant(event) {
    const crossProductId = event.target.getAttribute(this.selectors.crossProductId)
    const crossProduct = this.getCrossProductData(crossProductId)

    const currentCrossProductOptionEls = Array.from(
      this.el.querySelectorAll(`input[data-prodify-cross-product-id="${crossProductId}"]:checked`)
    )
    const currentCrossProductOptionLabels = currentCrossProductOptionEls?.map((el) => el.value)

    const currentCrossProductVariant = crossProduct.variants?.find((variant) =>
      this.helpers.arraysAreEqual(variant.options, currentCrossProductOptionLabels)
    )

    return currentCrossProductVariant
  }

  updateCrossProductVariantIdInput(event) {
    const crossProductId = event.target.getAttribute(this.selectors.crossProductId)
    const currentVariant = this.getCurrentCrossProductVariant(event)

    if (!currentVariant || !currentVariant.id) {
      console.error('Current variant id not found')
      return
    }

    const productForm = document.querySelector(this.selectors.productForm)
    if (!productForm) return

    const formInput = productForm.querySelector(`input[id="cp-${crossProductId}"]`)

    if (formInput) {
      formInput.value = currentVariant.id
    }
  }
  updateCrossProductAvailability(event) {
    const crossProductId = event?.target?.getAttribute(this.selectors.crossProductId)
    const optionId = event?.target?.id

    if (!crossProductId) {
      console.error('Cross product ID is missing')
      return
    }
    if (!optionId) {
      console.error('Option ID is missing')
      return
    }

    const currentOptionPosition = this.getOptionPosi(optionId)
    if (!(currentOptionPosition >= 1 && currentOptionPosition <= 3)) {
      console.error('Invalid option position')
      return
    }

    const crossProduct = this.getCrossProductData(crossProductId)
    if (!crossProduct) {
      console.error(`Cross product data for ID ${crossProductId} is missing`)
      return
    }

    const selector = `input[${this.selectors.crossProductId}="${crossProductId}"]`
    const checkedInputEls = Array.from(this.el.querySelectorAll(selector + ':checked'))
    const currentValues = checkedInputEls.map((el) => el.value)
    const inputEls = Array.from(this.el.querySelectorAll(selector))

    const baseUnav = crossProduct.variants.filter(
      (vari) => vari[`option${currentOptionPosition}`] === event.target.value && !vari.available
    )
    inputEls.forEach((el) => {
      const inputPosition = this.getOptionPosi(el.id)
      el.classList.remove('disabled')

      if (inputPosition === currentOptionPosition) {
        return
      }

      // switch (currentOptionPosition) {
      //   case 1:
      //     const unv = baseUnav.filter((vari) => vari.option2 === el.value)
      //     if (unv.length) {
      //       el.classList.add('disabled')
      //     }
      //     return
      //   case 2:
      //     console.log(baseUnav)
      //     return
      //   case 3:
      //     console.log(baseUnav)
      //     return
      // }

      console.log('base', baseUnav)
      console.log('ext', unav)
    })
  }

  onOptionChange = (event) => {
    if (
      event.target.hasAttribute(this.selectors.crossProductId) &&
      event.target.hasAttribute(this.selectors.crossProductInput)
    ) {
      // this.updateCrossProductAvailability(event)
      this.updateCrossProductVariantIdInput(event)
      this.updateTotalPrice()
      return
    }

    if (event.target.hasAttribute(this.selectors.upsellOptionInput)) {
      this.currUOs[event.target.name] = this.getUpsellOptionData(event.target.value)
      this.updateTotalPrice()
      return
    }

    this.updateCurrentOptions()
    this.updateCurrentVariant()
    this.updateAddButtonDom(true, '', false)
    this.compareInputValues()
    this.setOptionSelected(event.target)
    if (!this.currentVariant) {
      this.updateAddButtonDom(true, this.textStrings.addButtonTextUnavailable, true)
    } else {
      this.updateURL()
      this.updateVariantIdInput()
      this.swapProductInfo(this.updateTotalPrice)
    }
  }

  getOptionPosi(optionId) {
    return parseInt(optionId.slice(-3).split('-')[0]) + 1
  }
}

window.prodify = new Prodify()
