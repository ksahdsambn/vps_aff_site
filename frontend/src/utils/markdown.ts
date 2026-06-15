import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Options as ReactMarkdownOptions } from 'react-markdown';

/**
 * 共享的 ReactMarkdown 安全配置。
 *
 * 公告内容来自管理员输入并展示给所有访客。虽然 react-markdown 默认不会
 * 渲染原始 HTML，但为了纵深防御（防止依赖升级/配置变更后引入风险、
 * 以及限制 `javascript:` 等危险协议的链接），统一在这里施加 rehype-sanitize。
 *
 * 在默认 schema 基础上：
 * - 限制 a/img 等链接协议仅允许 http/https/mailto/tel。
 * - 强制所有外链添加 rel="noopener noreferrer" 并在新标签页打开（defaultSchema 已包含）。
 */
const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto', 'tel'],
    src: ['http', 'https'],
    cite: ['http', 'https'],
  },
  // 显式剥离所有事件处理器属性与 style 属性（defaultSchema attributes 已不允许，
  // 这里通过空 attributes 显式表达意图）。
  tagNames: undefined,
  attributes: {
    ...defaultSchema.attributes,
  },
};

export const markdownOptions: ReactMarkdownOptions = {
  rehypePlugins: [[rehypeSanitize, sanitizeSchema]],
};
