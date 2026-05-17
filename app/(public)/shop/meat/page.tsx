import { redirect } from 'next/navigation';

export default function MeatPage() {
  // Redirect visitors looking for the removed meat shop page back to the homepage
  redirect('/');
}
