'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}

function isModifiedClickEvent(e: React.MouseEvent): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

function isPlainLeftClick(e: React.MouseEvent): boolean {
  return e.button === 0 && !isModifiedClickEvent(e);
}

function isExternalOrProtocolHref(href: string): boolean {
  return /^(https?:|\/\/|mailto:|tel:)/i.test(href);
}

function shouldBypassClientRouting(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  target?: string,
  download?: boolean | string
): boolean {
  if (e.defaultPrevented || !isPlainLeftClick(e)) return true;
  if (target === '_blank' || Boolean(download)) return true;
  return isExternalOrProtocolHref(href);
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, replace = false, scroll = true, onClick, prefetch: _prefetch, children, ...rest }, ref) => {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (shouldBypassClientRouting(e, href, rest.target, rest.download)) {
        if (onClick) onClick(e);
        return;
      }

      e.preventDefault();
      if (onClick) onClick(e);

      if (replace) {
        router.replace(href, { scroll });
      } else {
        router.push(href, { scroll });
      }
    };

    return (
      <a ref={ref} href={href} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }
);

NavLink.displayName = 'NavLink';
export default NavLink;
