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
      { text: "后端", items: [{ text: "Node.js", link: "backEnd/NodeJs" }, { text: "Golang", link: "backEnd/Golang" }] },
      { text: "AI", items: [{ text: "龙虾研习室", link: "AI/ClawLab/index" }] },
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
      "/backEnd/Golang": genSidebar("/backEnd/Golang"),
      "/AI/ClawLab/tutorial": genSidebar("/AI/ClawLab/tutorial"),
    },



    // socialLinks: [
    //   { icon: "github", link: "https://github.com/vuejs/vitepress" },
    // ],
  },
});
