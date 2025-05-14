
// 同步
let sync = require('./sync.js')
console.log('同步的 sync是--', sync);


// 懒加载
import( /* webpackChunkName: "title" */ "./title").then(res => {
  console.log('懒加载的 title是--', res.default);
})

import( /* webpackChunkName: "sum" */ "./sum").then(res => {
  console.log('懒加载的 sum是--', res.default);
})