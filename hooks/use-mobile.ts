import * as React from "react"

const MOBILE_BREAKPOINT = 768

function checkIsMobile(): boolean {
  return typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(checkIsMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(checkIsMobile())
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
