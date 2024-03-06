export const hasBodyClass = (className) => {
  return document.body.classList.contains(className)
}

export default {
  /**
   * Emit a custom event
   * @param  {String} type   The event type
   * @param  {Object} detail Any details to pass along with the event
   * @param  {Node}   elem   The element to attach the event to
   */
  emitEvent(type, detail = {}, elem = document) {
    if (!type) return

    let event = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail: detail
    })

    return elem.dispatchEvent(event)
  },
  randomNumber(min = 0, max = 1000) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  },
  debounce(fn, wait) {
    let t
    return (...args) => {
      clearTimeout(t)
      t = setTimeout(() => fn.apply(this, args), wait)
    }
  },
  truncateLongTitle(input) {
    return input.length > 5 ? `${input.substring(0, 18)}...` : input
  },
  arraysAreEqual(arr1, arr2) {
    return (
      arr1.length === arr2.length &&
      arr1.reduce((acc, currentValue, index) => acc && currentValue === arr2[index], true)
    )
  },
  async fetchHTML(endpoint) {
    return await fetch(endpoint)
      .then((response) => response.text())
      .then((responseText) => {
        return new DOMParser().parseFromString(responseText, 'text/html')
      })
  },
  formatCurrency(currency) {
    return (amount) => `${currency}${amount.toLocaleString('en-UK')}`
  },
  sanitizeAndTrim(str) {
    return str.trim().replace(/,/g, '.')
  },
  parseShopifyPrice(amount) {
    return Number((amount / 100).toFixed(2))
  },
  parseMoneyString(moneyString) {
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
}
