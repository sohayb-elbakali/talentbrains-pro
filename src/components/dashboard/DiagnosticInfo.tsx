import { useEffect, useState } from 'react'

interface DiagnosticInfo {
  userAgent: string
  hasExtensions: boolean
  extensions: string[]
  errors: string[]
  warnings: string[]
}

export default function DiagnosticInfo() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo>({
    userAgent: navigator.userAgent,
    hasExtensions: false,
    extensions: [],
    errors: [],
    warnings: []
  })

  useEffect(() => {
    const checkForExtensions = () => {
      const extensions: string[] = []
      
      // Check for common browser extension patterns
      const extensionPatterns = [
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        'edge-extension://'
      ]
      
      // Check scripts
      document.querySelectorAll('script').forEach(script => {
        const src = script.src
        extensionPatterns.forEach(pattern => {
          if (src.includes(pattern)) {
            extensions.push(src)
          }
        })
      })
      
      // Check links
      document.querySelectorAll('link').forEach(link => {
        const href = link.href
        extensionPatterns.forEach(pattern => {
          if (href.includes(pattern)) {
            extensions.push(href)
          }
        })
      })
      
      // Check for service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          if (registrations.length > 0) {
            extensions.push(`Service Workers: ${registrations.length} registered`)
          }
        })
      }
      
      return extensions
    }

    const extensions = checkForExtensions()
    
    setDiagnosticInfo(prev => ({
      ...prev,
      hasExtensions: extensions.length > 0,
      extensions
    }))

    // Listen for message port errors
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('message port closed')) {
        setDiagnosticInfo(prev => ({
          ...prev,
          errors: [...prev.errors, `Message port error: ${event.error.message}`]
        }))
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('message port closed')) {
        setDiagnosticInfo(prev => ({
          ...prev,
          errors: [...prev.errors, `Message port rejection: ${event.reason.message}`]
        }))
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (!diagnosticInfo.hasExtensions && diagnosticInfo.errors.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md z-50">
      <h3 className="text-sm font-semibold text-yellow-800 mb-2">
        Diagnostic Information
      </h3>
      
      {diagnosticInfo.hasExtensions && (
        <div className="mb-2">
          <p className="text-xs text-yellow-700 mb-1">
            Browser extensions detected: {diagnosticInfo.extensions.length}
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer text-yellow-600">View extensions</summary>
            <ul className="mt-1 space-y-1">
              {diagnosticInfo.extensions.map((ext, index) => (
                <li key={index} className="text-yellow-600 break-all">
                  {ext}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      
      {diagnosticInfo.errors.length > 0 && (
        <div>
          <p className="text-xs text-red-700 mb-1">
            Message port errors: {diagnosticInfo.errors.length}
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer text-red-600">View errors</summary>
            <ul className="mt-1 space-y-1">
              {diagnosticInfo.errors.map((error, index) => (
                <li key={index} className="text-red-600 break-all">
                  {error}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-600">
        <p>These errors are usually harmless and caused by browser extensions.</p>
        <p>Try disabling extensions if they interfere with the app.</p>
      </div>
    </div>
  )
} 
