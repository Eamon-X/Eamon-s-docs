import path from "path";
import fs from "fs";

/**
 * 侧边栏菜单项结构
 */
export interface SidebarItem {
  text: string;
  collapsible?: boolean;
  items?: SidebarItem[];
  link?: string;
  order?: number;
}

/**
 * 文档根目录路径，指向 docs 文件夹
 */
const DOCS_ROOT = path.resolve(__dirname, '../docs');

/**
 * 检查路径是否为目录
 */
const isDirectory = (filePath: string): boolean => {
  try {
    return fs.lstatSync(filePath).isDirectory();
  } catch {
    return false;
  }
};

/**
 * 检查项目是否在黑名单中
 */
const isBlacklisted = (item: string, blacklist: string[]): boolean => {
  return blacklist.includes(item);
};

/**
 * 从Markdown文件中提取frontmatter中的信息
 */
const extractFrontmatterInfo = (filePath: string): { title: string | null; order: number | null } => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---[\s\S]*?---/);
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[0];
      const titleMatch = frontmatter.match(/title:\s*(.+)/);
      const orderMatch = frontmatter.match(/order:\s*(\d+)/);
      
      const title = titleMatch ? titleMatch[1].trim().replace(/['"]/g, '') : null;
      const order = orderMatch ? parseInt(orderMatch[1], 10) : null;
      
      return { title, order };
    }
    return { title: null, order: null };
  } catch {
    return { title: null, order: null };
  }
};

/**
 * 排序侧边栏项目
 */
const sortSidebarItems = (items: SidebarItem[]): SidebarItem[] => {
  return items.sort((a, b) => {
    // 先按order字段排序
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) {
      return -1;
    }
    if (b.order !== undefined) {
      return 1;
    }
    // 如果没有order字段，按文本排序
    return a.text.localeCompare(b.text);
  });
};

/**
 * 递归生成侧边栏配置
 * @param currentPath 当前目录的绝对路径
 * @param routePath 当前目录的路由路径
 * @param blacklist 黑名单列表
 */
const generateSidebar = (currentPath: string, routePath: string, blacklist: string[]): SidebarItem[] => {
  const sidebarItems: SidebarItem[] = [];

  try {
    // 读取当前目录下的所有项目
    const items = fs.readdirSync(currentPath);

    // 遍历所有项目
    for (const item of items) {
      // 检查是否在黑名单中
      if (isBlacklisted(item, blacklist)) {
        continue;
      }

      const itemPath = path.join(currentPath, item);
      const itemRoute = `${routePath}/${item}`;

      if (isDirectory(itemPath)) {
        // 处理目录：递归生成子菜单
        const subItems = generateSidebar(itemPath, itemRoute, blacklist);
        if (subItems.length > 0) {
          sidebarItems.push({
            text: item,
            collapsible: true,
            items: subItems
          });
        }
      } else {
        // 处理文件：只处理 .md 文件
        if (path.extname(item) === '.md') {
          // 提取frontmatter信息
          const { title, order } = extractFrontmatterInfo(itemPath);
          
          // 确定显示文本
          let displayText = item.replace(/\.md$/, '');
          if (title) {
            displayText = title;
          }

          sidebarItems.push({
            text: displayText,
            link: itemRoute,
            order: order ?? undefined
          });
        }
      }
    }
    
    // 排序侧边栏项目
    return sortSidebarItems(sidebarItems);
  } catch (error) {
    console.warn(`无法读取目录 ${currentPath}:`, error);
    return [];
  }
};

/**
 * 生成指定路径的侧边栏配置
 * @param routePath 相对于 docs 目录的路由路径
 * @param blacklist 可选的黑名单列表
 */
export const generateSidebarConfig = (routePath: string, blacklist: string[] = []): SidebarItem[] => {
  // 构建完整的文件系统路径
  const absolutePath = path.join(DOCS_ROOT, routePath);
  
  // 验证路径是否存在
  if (!fs.existsSync(absolutePath)) {
    console.warn(`路径不存在: ${absolutePath}`);
    return [];
  }

  // 生成侧边栏配置
  return generateSidebar(absolutePath, routePath, blacklist);
};

export default generateSidebarConfig;