// Lets TypeScript import .vue files.
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}

// Lets TypeScript import the stylesheet.
declare module "*.css";
