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
        window.liquidAjaxCart.conf('mutations', [testMutation])
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

function testMutation() {
  if (window.liquidAjaxCart?.cart?.items?.length) {
    console.info('Applying test mutation.')

    return {
      requests: [
        {
          type: 'change',
          body: {
            line: 1,
            quantity: 0
          }
        }
      ]
    }
  }
}
