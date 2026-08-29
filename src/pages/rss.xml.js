import rss from '@astrojs/rss';
import { getPublishedPosts, dayPath } from '../lib/posts';

export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'AI 都會寫程式了，我還要學什麼？',
    description: '從「做得出來」到學會開發的 30 天',
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
