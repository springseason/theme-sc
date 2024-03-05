export default {
  name: 'customiser',
  component() {
    return {
      step: 1,
      prevStep() {
        if (this.step > 1) this.step -= 1
      },
      nextStep(stepsCount) {
        if (this.step < parseInt(stepsCount)) this.step += 1
      },
      completeForm() {
        this.step = 'complete'
      },
      reset() {
        this.step = 1
        window.Alpine.store('crossProducts')?.resetCrossProductVariant()
      }
    }
  }
}
