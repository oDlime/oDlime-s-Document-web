import Vue from "vue";
import App from "./App.vue";
// element
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
Vue.use(ElementUI);
// mdtheme
import "./assets/mdtheme/redefine/redefine-light.css"

// v-md-editor
import VueMarkdownEditor from '@kangc/v-md-editor';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';
import '@kangc/v-md-editor/lib/theme/style/vuepress.css';
import Prism from 'prismjs';
VueMarkdownEditor.use(vuepressTheme, {
  Prism,
});
Vue.use(VueMarkdownEditor);


Vue.config.productionTip = false;
new Vue({
  render: (h) => h(App),
}).$mount("#app");
document.oncontextmenu = function(){
  return false;
}