// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const c1 = fs.readFileSync('D:\\\\project-management-portal\\\\components\\\\auth\\\\SignedInCard.tsx', 'utf8');
const patterns = ['sign out', 'Sign out', 'SIGNOUT', 'signout', 'Logout', 'logout'];
for (const p of patterns) {
  if (c1.includes(p)) {
    console.log('Found \"' + p + '\" in SignedInCard.tsx at index', c1.indexOf(p));
  }
}
const signOutMatch = c1.match(/signOut\(\)/g);
console.log('signOut() calls:', signOutMatch ? signOutMatch.length : 0);

const c2 = fs.readFileSync('D:\\\\project-management-portal\\\\components\\\\dashboard\\\\SidebarUser.tsx', 'utf8');
for (const p of patterns) {
  if (c2.includes(p)) {
    console.log('Found \"' + p + '\" in SidebarUser.tsx at index', c2.indexOf(p));
  }
}
const signOutMatch2 = c2.match(/signOut\(\)/g);
console.log('signOut() calls in SidebarUser:', signOutMatch2 ? signOutMatch2.length : 0);