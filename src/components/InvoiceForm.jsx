import React, { useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Download, Share2, IndianRupee } from 'lucide-react'
import QRCode from 'qrcode'

const UPI_ID = 'lagitsaha@fam'

function formatINR(amount) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0)
  } catch {
    return `₹${amount}`
  }
}

export default function InvoiceForm() {
  const [items, setItems] = useState([{ name: '', qty: 1, price: '' }])
  const [notes, setNotes] = useState('')
  const [payer, setPayer] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const canvasRef = useRef(null)

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const qty = Number(it.qty) || 0
      const price = Number(it.price) || 0
      return sum + qty * price
    }, 0)
  }, [items])

  const amountValid = subtotal > 0 && Number.isFinite(subtotal)

  const upiString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('pa', UPI_ID)
    params.set('pn', payer || 'Payment')
    params.set('cu', 'INR')
    if (amountValid) params.set('am', subtotal.toFixed(2))
    const txnNote = notes?.trim() || 'Invoice Payment'
    params.set('tn', txnNote.slice(0, 80))
    return `upi://pay?${params.toString()}`
  }, [payer, notes, subtotal, amountValid])

  async function generateQR() {
    try {
      const url = await QRCode.toDataURL(upiString, { width: 512, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      setQrDataUrl(url)
    } catch (e) {
      console.error('QR generation failed', e)
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { name: '', qty: 1, price: '' }])
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx, key, value) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }

  function downloadQR() {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `upi-invoice-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function shareQR() {
    if (!qrDataUrl) return
    try {
      if (navigator.share && navigator.canShare) {
        const res = await fetch(qrDataUrl)
        const blob = await res.blob()
        const file = new File([blob], 'upi-invoice-qr.png', { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'UPI Invoice QR',
            text: 'Scan to pay via UPI',
            files: [file]
          })
          return
        }
      }
      // fallback: copy UPI URL
      await navigator.clipboard.writeText(upiString)
      alert('Sharing is not supported. UPI URL copied to clipboard!')
    } catch (e) {
      console.error(e)
      alert('Sharing failed. Try downloading the QR instead.')
    }
  }

  return (
    <section className="relative py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-800">Create Invoice</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payer name (optional)</label>
                <input value={payer} onChange={(e) => setPayer(e.target.value)} className="w-full rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-700 focus:border-slate-700" placeholder="Customer name" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Items</span>
                  <button onClick={addItem} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition">
                    <Plus className="w-4 h-4" /> Add item
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input
                      className="col-span-6 md:col-span-6 rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                      placeholder="Item name"
                      value={it.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    />
                    <input
                      className="col-span-3 md:col-span-2 rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                      placeholder="Qty"
                      type="number"
                      min="1"
                      value={it.qty}
                      onChange={(e) => updateItem(idx, 'qty', e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                    <input
                      className="col-span-3 md:col-span-3 rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                      placeholder="Price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.price}
                      onChange={(e) => updateItem(idx, 'price', e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                    <button
                      onClick={() => removeItem(idx)}
                      className="col-span-12 md:col-span-1 inline-flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-700 focus:border-slate-700" rows={3} placeholder="Message on the payment" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-slate-600">Subtotal</span>
                <span className="text-lg font-semibold text-slate-900">{formatINR(subtotal)}</span>
              </div>

              <button
                onClick={generateQR}
                disabled={!amountValid}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate UPI QR
              </button>

              {!amountValid && (
                <p className="text-xs text-red-600">Enter at least one item with a valid amount greater than 0.</p>
              )}
            </div>
          </div>

          {/* QR Preview */}
          <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment QR</h3>
            <div className="aspect-square w-full max-w-xs mx-auto rounded-xl bg-white border border-slate-200 p-4 flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-slate-500 text-sm">
                  QR will appear here after generation
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={downloadQR} disabled={!qrDataUrl} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={shareQR} disabled={!qrDataUrl} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            <div className="mt-4 text-sm text-slate-600">
              <p>UPI ID: <span className="font-medium text-slate-800">{UPI_ID}</span></p>
              {amountValid && <p>Amount: <span className="font-medium text-slate-800">{formatINR(subtotal)}</span></p>}
              <a href={upiString} className="text-blue-600 hover:underline break-all" target="_blank" rel="noreferrer">Open in UPI app</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
