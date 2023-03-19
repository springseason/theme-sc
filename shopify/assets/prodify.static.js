class Prodify {
  constructor() {
    this.el = document.querySelector('[data-prodify]')
    this.el.addEventListener('change', this.onVariantChange)
    this.pickerType = this.el.dataset.prodify

    this.priceContainerSelector = '[data-prodify-price-container]'
    this.mediaContainerSelector = '[data-prodify-media-container]'
    this.variantsJsonSelector = '[data-prodify-variants-json]'
    this.optionContainerSelector = '[data-prodify-option-container]'
    this.productFormSelector = '[data-prodify-product-form]'
    this.addButtonTextUnavailable = 'Unavailable',
    this.unavailableVariantLabel = '[value] - Unavailable'
  }

  onVariantChange = () => {
    this.updateOptions()
    this.updateMasterId()
    this.toggleAddButton(true, '', false)
    this.updateVariantStatuses()

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true)
      this.setUnavailable()
    } else {
      this.updateURL()
      this.updateVariantInput()
      this.swapProductInfo()
    }
  }

  updateURL() {
    if (!this.currentVariant || this.el.dataset.updateUrl === 'false') return
    window.history.replaceState({}, '', `${this.el.dataset.url}?variant=${this.currentVariant.id}`)
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(this.productFormSelector)
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]')
      input.value = this.currentVariant.id
      // input.dispatchEvent(new Event('change', { bubbles: true }));
    })
  }

  setUnavailable() {
    const productForm = document.querySelector(this.productFormSelector)
    const addButton = productForm.querySelector('[name="add"]')
    const addButtonText = productForm.querySelector('[name="add"] > span')
    const price = document.querySelector(this.priceContainerSelector)

    if (!addButton) return
    addButtonText.textContent = this.addButtonTextUnavailable
    if (price) price.classList.add('visibility-hidden')
  }

  updateMasterId = () => {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option
        })
        .includes(false)
    })
  }

  swapProductInfo = () => {
    fetch(
      `${this.el.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.el.dataset.section}`
    )
      .then((response) => response.text())
      .then((responseText) => {
        const responseHTML = new DOMParser().parseFromString(responseText, 'text/html')
        const priceSource = responseHTML.querySelector(this.priceContainerSelector)
        const priceTarget = this.el.querySelector(this.priceContainerSelector)
        const mediaSource = responseHTML.querySelector(this.mediaContainerSelector)
        const mediaTarget = this.el.querySelector(this.mediaContainerSelector)
        const addButtonSource = responseHTML.querySelector(
          `${this.productFormSelector} [name="add"]`
        )
        const addButtonTarget = this.el.querySelector(`${this.productFormSelector} [name="add"]`)

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
  }

  updateVariantStatuses() {
    const variantsMatchingOptionOneSelected = this.variantData.filter(
      (variant) => this.el.querySelector(':checked').value === variant.option1
    )
    const inputWrappers = [...this.el.querySelectorAll(this.optionContainerSelector)]
    inputWrappers.forEach((option, index) => {
      if (index === 0) return
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')]
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value
      const availableOptionInputsValues = variantsMatchingOptionOneSelected
        .filter(
          (variant) => variant.available && variant[`option${index}`] === previousOptionSelected
        )
        .map((variantOption) => variantOption[`option${index + 1}`])

      this.setInputAvailability(optionInputs, availableOptionInputsValues)
    })
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        if (this.pickerType == 'select') {
          input.innerText = input.getAttribute('value');
          return
        }
        input.classList.remove('disabled')
      } else {
        if (this.pickerType == 'select') {
          input.innerText = this.unavailableVariantLabel.replace('[value]', input.getAttribute('value'))
          return
        }
        input.classList.add('disabled')
      }
    })
  }

  getVariantData = () => {
    this.variantData =
      this.variantData || JSON.parse(this.el.querySelector(this.variantsJsonSelector).textContent)
    return this.variantData
  }

  updateOptions = () => {
    if (this.pickerType == 'select') {
      this.options = Array.from(this.el.querySelectorAll('select'), (select) => select.value);
      return
    }

    this.optionContainers = Array.from(this.el.querySelectorAll(this.optionContainerSelector))
    this.options = this.optionContainers.map((optionContainer) => {
      return Array.from(optionContainer.querySelectorAll('input')).find((radio) => radio.checked)
        .value
    })
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.querySelector(this.productFormSelector)
    if (!productForm) return
    const addButton = productForm.querySelector('[name="add"]')
    const addButtonText = productForm.querySelector('[name="add"] > span')
    if (!addButton) return

    if (disable) {
      addButton.setAttribute('disabled', 'disabled')
      if (text) addButtonText.textContent = text
    } else {
      addButton.removeAttribute('disabled')
      addButtonText.textContent = this.addButtonTextUnavailable
    }

    if (!modifyClass) return
  }
}

new Prodify()
