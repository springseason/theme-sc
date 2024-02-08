class Prodify {
  constructor(settings) {
    this.settings = { ...settings }
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
      crossProductId: 'data-prodify-cross-product-id' // ! no brackets
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

    this.updateTotalPrice()
    this.initEventListeners()
  }

  initEventListeners = () => {
    this.el.addEventListener('change', this.onOptionChange) // todo: separate p.variant change from cross product variant change

    if (this.quantityIncrementButton && this.quantityDecrementButton && this.quantityPresentationInput) {
      this.quantityIncrementButton.addEventListener('click', () => {
        this.updateQuantity('up')
      })

      this.quantityDecrementButton.addEventListener('click', () => {
        this.updateQuantity('down')
      })
    }
  }

  updateQuantity = (stepDirection) => {
    const adjustQuantity = (direction) => (quantity) => Math.max(1, quantity + direction)

    const previousQuantity = parseInt(this.quantityPresentationInput.value)
    const newQuantity = adjustQuantity(stepDirection === 'up' ? 1 : -1)(previousQuantity)

    this.quantityHiddenInput.value = this.quantityPresentationInput.value = newQuantity
  }

  updateCurrentVariant = () => {
    const variants = this.getVariantData()
    const matchingVariant = variants.find((variant) => {
      return variant.options.every((option, index) => {
        return this.options[index] === option
      })
    })
    this.currentVariant = matchingVariant
  }

  updateCurrentOptions = () => {
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
      addButtonText.textContent = this.textStrings.addButtonTextUnavailable
    }

    if (!modifyClass) return

    if (disable) {
      addButton.classList.add('disabled')
    } else {
      addButton.classList.remove('disabled')
    }
  }

  onOptionChange = (event) => {
    if (
      event.target.hasAttribute('data-prodify-cross-product-radio') &&
      event.target.hasAttribute(this.selectors.crossProductId)
    ) {
      return this.updateTotalPrice()
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
        input.classList.remove('disabled')
      } else {
        if (existingOptionInputsValues.includes(input.getAttribute('value'))) {
          if (this.pickerType == 'select') {
            input.innerText = this.textStrings.soldOutVariantValueLabel.replace('[value]', input.getAttribute('value'))
            return
          }
          input.classList.add('disabled')
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

  updateTotalPrice = () => {
    const totalPriceEl = this.el.querySelector('#total-price')
    if (!totalPriceEl) {
      return
    } else if (!totalPriceEl.textContent) {
      return console.error('total price el not found')
    }

    const regularPriceEl = this.el.querySelector('#regular-price')
    if (!regularPriceEl || !regularPriceEl.textContent) {
      return console.error('regular price el not found')
    }

    const currentCrossProductOptionEls = Array.from(
      this.el.querySelectorAll(`input[data-prodify-cross-product-radio]:checked`)
    )

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
      const currentVariantData = product.variants.find((v) => v.title === variantTitle)

      return {
        ...acc,
        [variantTitle]: {
          price: this.parseShopifyPrice(currentVariantData.price),
          available: currentVariantData.available
        }
      }
    }, {})

    const regularPrice = this.parseMoneyString(regularPriceEl.textContent)
    const totalCrossPrice = Object.values(priceByProductId).reduce((acc, val) => acc + val.price, 0)
    totalPriceEl.textContent = this.formatCurrency(regularPrice.currency)(regularPrice.amount + totalCrossPrice)
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

  // Money handling
  splitStringAtPosition = (position) => (str) => {
    // Check if the first character is not a number
    if (!/^\d/.test(str.charAt(0))) {
      return [str.slice(0, position), str.slice(position)]
    } else {
      // If the first character is a number, do not split
      return [str]
    }
  }
  formatCurrency = (currency) => (amount) => `${currency}${amount.toLocaleString('en-UK')}`
  sanitizeAndTrim = (str) => str.trim().replace(/,/g, '.')
  parseShopifyPrice = (amount) => Number((amount / 100).toFixed(2))
  parseMoneyString = (moneyString) => {
    if (typeof moneyString !== 'string') {
      return {}
    }

    const trimmedString = this.sanitizeAndTrim(moneyString)

    // Check if the string is not empty after trimming
    if (!trimmedString) {
      return {}
    }

    // Use a regular expression to match currency symbols and split the string
    const match = trimmedString.match(/([^\d]*)(\d+\.?\d*)/)

    if (match) {
      const currency = match[1]
      const amount = parseFloat(match[2])

      return {
        currency,
        amount: isNaN(amount) ? 0 : amount // Ensure amount is a valid number
      }
    }

    return {}
  }

  compose =
    (...fns) =>
    (arg) =>
      fns.reduceRight((acc, fn) => fn(acc), arg)

  pipe =
    (...fns) =>
    (arg) =>
      fns.reduce((acc, fn) => fn(acc), arg)

  // ... (rest of the helper methods)
}

window.prodify = new Prodify()
