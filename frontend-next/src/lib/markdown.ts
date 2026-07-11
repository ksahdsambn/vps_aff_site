import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Options as ReactMarkdownOptions } from "react-markdown";

/**
 * 共享的 ReactMarkdown 安全配置。
 *
 * 公告内容来自管理员输入并展示给所有访客。纵深防御：限制链接协议、
 * 剥离事件处理器与 style 属性。
 */
const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto", "tel"],
    src: ["http", "https"],
    cite: ["http", "https"],
  },
  tagNames: undefined,
  attributes: {
    ...defaultSchema.attributes,
  },
};

export const markdownOptions: ReactMarkdownOptions = {
  rehypePlugins: [[rehypeSanitize, sanitizeSchema]],
};
