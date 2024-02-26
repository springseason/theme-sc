class Prodify {
  constructor(settings) {
    this.helpers = window.sourcherry.helpers
    this.settings = { ...settings }
    this.initializeElements()
    this.bindEventListeners()
  }

  initializeElements() {
    this.el = document.querySelector('[data-prodify]')
    if (!this.el) {
      console.error('Prodify element not found.')
      return
    }
    this.pickerType = this.el.dataset.prodify
    this.currentVariant = null
    this.currentCrossProducts = {}
    this.variantData = null

    this.selectors = {
      priceContainer: '[data-prodify-price-container]',
      mediaContainer: '[data-prodify-media-container]',
      variantsJson: '[data-prodify-variants-json]',
      crossProductJson: '[data-prodify-cross-product]',
      optionContainer: '[data-prodify-option-container]',
      crossOptionContainer: '[data-prodify-cross-option-container]',
      productForm: '[data-prodify-product-form]',
      quantityIncrement: '[data-prodify-quantity-increment]',
      quantityDecrement: '[data-prodify-quantity-decrement]',
      quantityPresentation: '[data-prodify-quantity-presentation]',
      crossProductRulesetJson: '[data-prodify-cross-product-availability]',
      crossProductId: 'data-prodify-cross-product-id',
      crossProductInput: 'data-prodify-cross-product-radio',
      crossProductOptionPosition: 'data-prodify-cross-product-radio-position'
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

    // this.initCrossProducts(this.el)
  }

  bindEventListeners() {
    this.el.addEventListener('change', this.onOptionChange)
    if (this.quantityIncrementButton && this.quantityDecrementButton && this.quantityPresentationInput) {
      this.quantityIncrementButton.addEventListener('click', () => this.updateQuantity('up'))
      this.quantityDecrementButton.addEventListener('click', () => this.updateQuantity('down'))
    }
  }
  initCrossProducts = (el) => {
    const data = Array.from(el.querySelectorAll(this.selectors.crossProductJson)).map(
      (crossProductDataEl) => JSON.parse(crossProductDataEl.textContent) || null
    )

    for (const crossProduct of data) {
      const currentOptions = this.getActiveCPOptions(crossProduct.id)
      this.updateCrossProductState(crossProduct, currentOptions)

      // default SET state
      this.currentCrossProducts = {
        ...this.currentCrossProducts,
        [crossProduct.id]: {
          updateVariant: (_currentOptions, positionIdx) =>
            this.updateCrossProductState(crossProduct, _currentOptions, positionIdx)
        }
      }
    }
  }
  updateCrossProductState = (crossProduct, currentOptions, positionIdx) => {
    const activeVariant = this.findActiveCPVariant(crossProduct, currentOptions)
    if (activeVariant) {
      this.currentCrossProducts[crossProduct.id] = { ...this.currentCrossProducts[crossProduct.id], activeVariant }
    } else {
      console.error('cross product variant not found')
    }

    this.currentCrossProducts[crossProduct.id].availableOptions = this.getAvailableCPOptions(
      crossProduct,
      currentOptions,
      positionIdx
    )
  }
  filterAvailableCrossVariants(crossProduct, currentOptions, positionIdx) {
    const currentPosition = parseInt(positionIdx) + 1 // add 1 as it's null based ATM
    if (currentPosition < 1 || currentPosition > 3) {
      console.error('invalid option position')
      return
    }
    if (!Object.keys(currentOptions).length) {
      console.error('invalid current options')
      return
    }

    if (currentOptions.length === 1) {
      return crossProduct.variants.filter(
        (vari) => vari[`option${currentPosition}`] === currentOptions[`option${currentPosition}`]
      )
    }

    switch (currentPosition) {
      case 1:
        return crossProduct.variants.filter((vari) => vari.option1 === currentOptions.option1)
      case 2:
        return crossProduct.variants.filter((vari) => vari.option2 === currentOptions.option2)
      case 3:
        return crossProduct.variants.filter((vari) => vari.option3 === currentOptions.option3)
    }
  }
  getUniqueOptionsFromVariants(variants) {
    return variants.reduce(
      (acc, vari) =>
        vari.options.map((option, idx) =>
          acc[idx] ? (acc[idx].includes(option) ? acc[idx] : [...acc[idx], option]) : [option]
        ),
      []
    )
  }
  getAvailableCPOptions = (crossProduct, currentOptions, positionIdx = 0) =>
    this.getUniqueOptionsFromVariants(this.filterAvailableCrossVariants(crossProduct, currentOptions, positionIdx))

  findActiveCPVariant = (crossProduct, options) =>
    crossProduct.variants.find((vari) =>
      this.helpers.arraysAreEqual(
        vari.options,
        Object.entries(options).map(([key, value]) => value)
      )
    )

  getActiveCPOptions(crossProductId) {
    const sel = `input[${this.selectors.crossProductInput}][${this.selectors.crossProductId}="${crossProductId}"]:checked`
    const activeOptions = Array.from(this.el.querySelectorAll(sel)).map((itemEl) => {
      const posi = parseInt(itemEl.dataset.prodifyCrossProductRadioPosition) + 1
      return { [`option${posi}`]: itemEl.value }
    })

    return Object.assign({}, ...activeOptions)
  }
  updateCrossProductAvailability(crossProductId, currentPosiIdx) {
    const inputEls = this.el.querySelectorAll(
      `input[${this.selectors.crossProductInput}][${this.selectors.crossProductId}="${crossProductId}"]`
    )
    const currentPosition = parseInt(currentPosiIdx)
    if (typeof currentPosition !== 'number') {
      return
    }

    Array.from(inputEls).forEach((el) => {
      const elPosi = parseInt(el.dataset.prodifyCrossProductRadioPosition)
      if (
        currentPosition === elPosi ||
        (elPosi === 0 && currentPosition === elPosi) ||
        this.currentCrossProducts[crossProductId].availableOptions[elPosi].includes(el.value)
      ) {
        el.disabled = false
      } else {
        el.disabled = true
      }
    })
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
      const prevValue = input.value
      input.value = this.currentVariant.id

      // update related cross products
      const relatedEls = productForm.querySelectorAll(`input[id^="cp-"][value="${prevValue}"]`)
      relatedEls.forEach((el) => (el.value = this.currentVariant.id))
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
          input.disabled = true
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

    const selectorString = `${this.selectors.crossProductJson}[${this.selectors.crossProductId}="${id}"]`
    const crossProductDataEl = this.el.querySelector(selectorString)

    if (!crossProductDataEl || !crossProductDataEl?.textContent?.length) {
      return console.error(`Cross product: ${id} data is missing.`)
    }

    return JSON.parse(crossProductDataEl.textContent)
  }
  getCrossProductVariant(crossProductId, options) {
    if (typeof options !== 'object') {
      console.error('invalid options')
      return
    }
    const cpData = this.getCrossProductData(crossProductId)
    const optionsData = JSON.parse(JSON.stringify(options))

    const variant = cpData.variants.find((cpVariant) =>
      window.sourcherry.helpers.arraysAreEqual(cpVariant.options, optionsData)
    )

    return variant
  }
  getRulesetData = (id) => {
    const selectorString = `${this.selectors.crossProductRulesetJson}`
    if (typeof id !== 'string') {
      console.info('Getting ruleset without cross product id.')
    } else {
      selectorString.concat(`[${this.selectors.crossProductId}="${id}"]`)
    }

    const rulesetEls = this.el.querySelectorAll(selectorString)

    if (!Array.from(rulesetEls).length) {
      return console.error(`Cross product: ${id} ruleset is missing.`)
    }
    const rulesets = Array.from(rulesetEls).map((rulesetEl) => JSON.parse(rulesetEl.textContent))

    return rulesets
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

    const regularPrice = this.helpers.parseMoneyString(regularPriceEl.textContent)
    const totalCrossPrice = Object.values(priceByProductId).reduce((acc, val) => acc + val, 0)

    totalPriceEl.textContent = this.helpers.formatCurrency(regularPrice.currency)(regularPrice.amount + totalCrossPrice)
  }
  getCurrentCrossProductVariant(event) {
    const crossProductId = event.target.getAttribute(this.selectors.crossProductId)
    const crossProduct = this.getCrossProductData(crossProductId)

    const currentCrossProductOptionEls = Array.from(
      this.el.querySelectorAll(`input[${this.selectors.crossProductId}="${crossProductId}"]:checked`)
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

  compareCrossInputValues(crossProductId, currentOptionPosition) {
    const crossProduct = this.getCrossProductData(crossProductId)
    if (!crossProduct) {
      console.error('CP not found')
      return
    }

    const checkedValue = this.el.querySelector(
      `input[${this.selectors.crossProductId}="${crossProductId}"]:checked`
    ).value

    const variantsMatchingOptionOneSelected = crossProduct.variants.filter(
      (variant) => variant.option1 === checkedValue
    )

    const filteredInputs = Array.from(
      this.el.querySelectorAll(`input[${this.selectors.crossProductId}="${crossProductId}"]`)
    ).filter(
      (inputEl) =>
        inputEl.dataset.prodifyCrossProductRadioPosition !== currentOptionPosition &&
        parseInt(inputEl.dataset.prodifyCrossProductRadioPosition) !== 0
    )

    filteredInputs.forEach((input) => {
      const optionValue = input.value
      const posi = parseInt(input.dataset.prodifyCrossProductRadioPosition)
      const foundVariant = variantsMatchingOptionOneSelected.some((vari) => vari[`option${posi + 1}`] === optionValue)

      input.disabled = !foundVariant
      input.classList.toggle('disabled', !foundVariant)
    })
  }

  onOptionChange = (event) => {
    if (event.target.dataset.x) {
      // if (
      //   event.target.hasAttribute(this.selectors.crossProductId) &&
      //   event.target.hasAttribute(this.selectors.crossProductInput) &&
      //   event.target.hasAttribute(this.selectors.crossProductOptionPosition)
      // ) {
      // const crossProductId = event.target.getAttribute(this.selectors.crossProductId)
      // const optionPosiIdx = event.target.getAttribute(this.selectors.crossProductOptionPosition)

      // const currentOptions = this.getActiveCPOptions(crossProductId)
      // this.currentCrossProducts[crossProductId].updateVariant(currentOptions, optionPosiIdx)

      // console.log(this.currentCrossProducts[crossProductId].activeVariant)
      // this.updateCrossProductAvailability(crossProductId, optionPosiIdx)

      // this.updateTotalPrice()
      // // this.compareCrossInputValues(crossProductId, optionPosition)
      // // this.updateCrossProductVariantIdInput(event)
      // // return
      return
    }

    this.updateCurrentOptions()
    this.updateCurrentVariant()

    // const crossInputEls = this.el.querySelectorAll(`[${this.selectors.crossProductInput}]`)
    // const crossProductIds = Array.from(crossInputEls).map((el) => el.getAttribute(`${this.selectors.crossProductId}`))
    // const uniqueCrossProductIds = [...new Set(crossProductIds)]

    // const availableCrossLabels = uniqueCrossProductIds.map((crossProductId) => {
    //   const sel = `${this.selectors.crossProductRulesetJson}[${this.selectors.crossProductId}="${crossProductId}"]`
    //   const rulesetEl = this.el.querySelector(sel)

    //   const response = { [crossProductId]: null }

    //   if (!rulesetEl) {
    //     return response
    //   }
    //   const ruleset = JSON.parse(rulesetEl.textContent)
    //   if (!ruleset.length) {
    //     return response
    //   }

    //   const availableOptions = []
    //   for (let rule of ruleset) {
    //     const main_variant_ids = rule[0]
    //     if (!main_variant_ids.includes(this.currentVariant.id)) {
    //       continue
    //     }

    //     availableOptions.push(...rule[1])
    //     break
    //   }

    //   response[crossProductId] = availableOptions

    //   // 💡 when no ruleset found it will return NULL
    //   return response
    // })

    // for (let cp of availableCrossLabels) {
    //   const sell = `[${this.selectors.crossProductInput}][${this.selectors.crossProductId}="${Object.keys(cp)[0]}"]`

    //   Array.from(this.el.querySelectorAll(sell)).forEach((inputEl) => {
    //     const labels = Object.values(cp)[0]

    //     if (labels) {
    //       const isAvailable = labels.includes(inputEl.value)
    //       if (isAvailable) {
    //         if (labels.length === 1) {
    //           inputEl.checked = true
    //         }

    //         inputEl.disabled = false
    //         inputEl.classList.remove('disabled')
    //       } else {
    //         inputEl.disabled = true
    //         inputEl.classList.add('disabled')
    //       }
    //     } else {
    //       inputEl.disabled = false
    //       inputEl.classList.remove('disabled')
    //     }
    //   })
    // }

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
}

window.prodify = new Prodify()
