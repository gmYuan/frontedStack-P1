module.exports = {
  sum(a, b) {
    return a + b
  },
  minus(a, b) {
    return a - b
  },
  init({option, flag}) {
    console.log('执行init流程--------')
    console.log('option是', option)
    console.log('flag是', flag)
  }
}