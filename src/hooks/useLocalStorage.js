import { useCallback, useEffect, useId, useRef, useState } from 'react'

const SYNC_EVENT = 'verifyit-storage'

function readValue(key, initialValue) {
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? initialValue : JSON.parse(stored)
  } catch {
    // Storage can be blocked (private mode) or contain broken JSON.
    return initialValue
  }
}

/**
 * Works like useState, but the value is saved in the browser's localStorage
 * so it survives page refreshes. Every component using the same key stays in sync.
 *
 * const [value, setValue, resetValue] = useLocalStorage('my-key', defaultValue)
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readValue(key, initialValue))
  const valueRef = useRef(value)
  const initialRef = useRef(initialValue)
  const instanceId = useId()

  const save = useCallback(
    (resolved, remove = false) => {
      valueRef.current = resolved
      setValue(resolved)
      try {
        if (remove) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, JSON.stringify(resolved))
        // Tell other components using the same key that the value changed.
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key, source: instanceId } }))
      } catch {
        // If storage is unavailable the app still works for this visit.
      }
    },
    [key, instanceId],
  )

  // Accepts a new value or a function of the previous value, like useState.
  const updateValue = useCallback(
    (next) => save(typeof next === 'function' ? next(valueRef.current) : next),
    [save],
  )

  const resetValue = useCallback(() => save(initialRef.current, true), [save])

  useEffect(() => {
    function handleChange(event) {
      const changedKey = event.type === 'storage' ? event.key : event.detail?.key
      if (event.detail?.source === instanceId) return
      if (changedKey === key || changedKey === null) {
        const fresh = readValue(key, initialRef.current)
        valueRef.current = fresh
        setValue(fresh)
      }
    }
    window.addEventListener(SYNC_EVENT, handleChange)
    window.addEventListener('storage', handleChange)
    return () => {
      window.removeEventListener(SYNC_EVENT, handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [key, instanceId])

  return [value, updateValue, resetValue]
}
