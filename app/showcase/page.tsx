import { redirect } from 'next/navigation';

/**
 * @file app/showcase/page.tsx
 * @description Redirects legacy /showcase route to the main page (/) which now hosts the Studio Showcase.
 */
export default function ShowcasePage(): never {
  redirect('/');
}
