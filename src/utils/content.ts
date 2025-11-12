import { parse as parseYaml } from "@std/yaml";

export interface StyleConfig {
  brand?: string;
  image?: string;
}

export interface YamlFrontMatter {
  prompt?: string;
  style?: StyleConfig | StyleConfig[];
  [key: string]: unknown;
}

export interface ParsedContent {
  frontMatter: YamlFrontMatter | null;
  content: string;
}

/**
 * Parse YAML front matter from markdown content
 * Returns the front matter object and the content without the front matter
 */
export function parseYamlFrontMatter(markdown: string): ParsedContent {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);
  
  if (!match) {
    return { frontMatter: null, content: markdown };
  }
  
  try {
    const yamlContent = match[1];
    const contentWithoutFrontMatter = match[2];
    const frontMatter = parseYaml(yamlContent) as YamlFrontMatter;
    
    return {
      frontMatter,
      content: contentWithoutFrontMatter,
    };
  } catch (error) {
    console.error("Error parsing YAML front matter:", error);
    return { frontMatter: null, content: markdown };
  }
}
