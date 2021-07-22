import { useEffect, useRef } from 'react'

function useInterval(callback: () => void, delay: number | null) {
  const cb = useRef(callback)
  useEffect(() => {
    cb.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => cb.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export default useInterval
