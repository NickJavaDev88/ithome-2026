import rss from '@astrojs/rss';
import { getPublishedPosts, dayPath } from '../lib/posts';
import { loadProjectConfigSync } from '../../scripts/ithome/config.mjs';

export async function GET(context) {
  const posts = await getPublishedPosts();
  const project = loadProjectConfigSync();
  return rss({
    title: project.seriesTitle,
    description: `${project.seriesTitle}：30 天系列文章`,
    site: context.site,
    customData: '<language>zh-TW</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? post.data.title,
      pubDate: post.data.publishDate,
      link: `${import.meta.env.BASE_URL}${dayPath(post.data.day).slice(1)}`,
    })),
  });
}
