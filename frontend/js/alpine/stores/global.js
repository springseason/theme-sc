export default {
  name: 'global',
  store() {
    return {
      isMobileMenuVisible: false,
      isMinicartVisible: false,
      isPredictiveSearchVisible: false,
      isWindowScrolled: false,
      cart: null,
      init() {
        window.addEventListener('scroll', this.onWindowScrollHandler.bind(this))
        this.initLiquidAJaxCart()
      },
      get bodyClasses() {
        let classes = []

        if (this.isMobileMenuVisible) {
          classes.push('mobile-menu-visible')
        }

        return classes || ''
      },
      openMobileMenu() {
        this.isMobileMenuVisible = true
      },
      closeMobileMenu() {
        this.isMobileMenuVisible = false
      },
      toggleMobileMenu() {
        this.isMobileMenuVisible = !this.isMobileMenuVisible
      },
      onWindowScrollHandler() {
        const isScrolled = window.scrollY > 0

        this.isWindowScrolled = isScrolled
        document.body.classList[isScrolled ? 'add' : 'remove']('scrolled')
      },

      configAjaxCart() {
        window.liquidAjaxCart.conf('updateOnWindowFocus', false)
        window.liquidAjaxCart.conf('mutations', [removeCrossProductsWithoutMain])
      },
      initLiquidAJaxCart() {
        if (window.liquidAjaxCart?.init) {
          this.configAjaxCart()
        } else {
          document.addEventListener('liquid-ajax-cart:init', this.configAjaxCart)
        }

        document.addEventListener('liquid-ajax-cart:request-end', (event) => {
          const { requestState, cart, previousCart, sections } = event.detail
          if (requestState.requestType === 'add' && requestState.responseData?.ok) {
            this.isMinicartVisible = true
          }
          this.cart = cart
        })
      }
    }
  }
}

const isMainProduct = (item) => item.properties?.is_main_product === 'true'
const extractMainProductIds = (cart) => cart?.items?.filter(isMainProduct)?.map((item) => item.id)

const removeCrossProductsWithoutMain = () => {
  const cart = window?.liquidAjaxCart?.cart

  if (!cart) {
    console.error('Ajax cart mutation error: ', `${cart} - not found.`)
    return null
  }

  const mainProductIds = extractMainProductIds(cart)

  const requests = cart.items.reduce((acc, item) => {
    const hasMainProductId = item.properties?.main_product_id?.length
    const hasMainInCart = mainProductIds?.includes(parseInt(item.properties.main_product_id))

    if (!isMainProduct(item) && hasMainProductId && !hasMainInCart) {
      acc.push({
        type: 'change',
        body: {
          id: item.key,
          quantity: 0
        }
      })
    }

    return acc
  }, [])

  return requests.length ? { requests } : null
}
