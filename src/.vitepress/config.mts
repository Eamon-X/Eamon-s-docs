import { defineConfig } from "vitepress";
import genSidebar from "../scripts/sidebarByDir";
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Eamon's docs",
  description: "A VitePress Site",
  srcDir: "./docs",
  base: "/Eamon-s-docs/", // 设置base路径以适配GitHub Pages
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "前端", link: "/" },
      { text: "后端", items: [{ text: "Node.js", link: "backEnd/NodeJs" }] },
    ],

    // sidebar: [
    //   {
    //     text: "Examples",
    //     items: [
    //       { text: "Markdown Examples", link: "/markdown-examples" },
    //       { text: "Runtime API Examples", link: "/api-examples" },
    //     ],
    //   },
    // ],
    sidebar: {
      // 路由
      "/backEnd/NodeJs": genSidebar("/backEnd/NodeJs"),
    },



    // socialLinks: [
    //   { icon: "github", link: "https://github.com/vuejs/vitepress" },
    // ],
  },
});
