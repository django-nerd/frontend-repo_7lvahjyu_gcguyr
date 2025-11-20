import React from 'react'
import Hero from './components/Hero'
import InvoiceForm from './components/InvoiceForm'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <div className="relative">
        <Hero />
      </div>
      <main className="relative -mt-16 md:-mt-24">
        <InvoiceForm />
      </main>
      <footer className="py-8 text-center text-xs text-slate-400">
        Secure UPI payments • Works on desktop and mobile
      </footer>
    </div>
  )
}

export default App
