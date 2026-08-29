import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export function isPublished(post: Post, now = new Date()) {
  return !post.data.draft && !!post.data.publishDate && post.data.publishDate <= now;
}

export async function getPublishedPosts(now = new Date()) {
  const posts = await getCollection('posts');
  return posts.filter((post) => isPublished(post, now)).sort((a, b) => a.data.day - b.data.day);
}

export async function getAllPosts() {
  const posts = await getCollection('posts');
  return posts.sort((a, b) => a.data.day - b.data.day);
}

export function dayPath(day: number) {
  return `/day/${String(day).padStart(2, '0')}/`;
}
