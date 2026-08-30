import { defineConfig } from 'astro/config';
import { loadProjectConfigSync } from './scripts/ithome/config.mjs';

const project = loadProjectConfigSync();

export default defineConfig({
  site: project.githubPages.site,
  base: project.githubPages.base,
  trailingSlash: 'always',
});
