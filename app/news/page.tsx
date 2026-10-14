import { redirect } from 'next/navigation';

export default function NewsIndexPage() {
  redirect('/category/news');
}
