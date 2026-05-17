import { redirect } from 'next/navigation';

export default function EggsPage() {
  // Redirect visitors looking for the removed egg shop back to the homepage/shop
  redirect('/');
}
