import { CreditCard, QrCode, RefreshCcw, Smartphone, Wallet, Wifi } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { otoparkRepository } from '../../data/repository'
import type { Floor, PaymentActivity } from '../../domain/types'

export function PaymentsPage() {
  const [activities, setActivities] = useState<PaymentActivity[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState(getCurrentSyncTime())

  useEffect(() => {
    otoparkRepository.listPaymentActivities().then(setActivities)
    otoparkRepository.listFloors().then(setFloors)
  }, [])

  const summary = useMemo(() => {
    const todayAmount = activities.reduce((sum, item) => sum + item.amount, 0)
    const todayCars = activities.length
    const currentCars = floors.reduce((sum, floor) => sum + floor.occupied, 0)
    const mobilePayments = activities.filter((item) => item.channel === 'mobile-app').length
    const kioskCardPayments = activities.filter((item) => item.channel === 'kiosk-card').length
    const kioskQrPayments = activities.filter((item) => item.channel === 'kiosk-qr').length

    return {
      todayAmount,
      todayCars,
      currentCars,
      mobilePayments,
      kioskCardPayments,
      kioskQrPayments,
    }
  }, [activities, floors])

  const recentActivities = useMemo(() => activities.slice(0, 10), [activities])

  function handleRefresh() {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setLastSync(getCurrentSyncTime())
    }, 700)
  }

  return (
    <section className="payment-page">
      <header className="payment-header">
        <nav className="breadcrumbs">
          <span>Payment</span>
        </nav>
        <div className="payment-header-row">
          <h1>Payment Dashboard</h1>
        </div>
      </header>

      <div className="payment-content">
        <section className="payment-summary-grid">
          <article className="glass-panel payment-card">
            <small>Today’s Payment Amount</small>
            <strong>₺{summary.todayAmount.toLocaleString('tr-TR')}</strong>
          </article>
          <article className="glass-panel payment-card">
            <small>Paid Cars Today</small>
            <strong>{summary.todayCars}</strong>
          </article>
          <article className="glass-panel payment-card">
            <small>Current Cars in Park</small>
            <strong>{summary.currentCars}</strong>
          </article>
          <article className="glass-panel payment-card payment-card--split">
            <header>
              <small>Payment Methods</small>
              <strong>{summary.todayCars} transactions today</strong>
            </header>
            <div>
              <small>Mobile App</small>
              <strong><Smartphone size={16} /> {summary.mobilePayments}</strong>
            </div>
            <div>
              <small>Kiosk Card</small>
              <strong><CreditCard size={16} /> {summary.kioskCardPayments}</strong>
            </div>
            <div>
              <small>Kiosk QR</small>
              <strong><QrCode size={16} /> {summary.kioskQrPayments}</strong>
            </div>
          </article>
        </section>

        <section className="glass-panel payment-activity-section">
          <div className="payment-section-head">
            <div>
              <small>Last 10 Activities</small>
              <h2>Recent Payments</h2>
            </div>
            <span><Wallet size={15} /> Live feed</span>
          </div>

          <div className="payment-table-wrap">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Car Model</th>
                  <th>Licence Plate</th>
                  <th>Transaction</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((item) => (
                  <tr key={item.id}>
                    <td>{item.paidAt}</td>
                    <td>{item.vehicleModel}</td>
                    <td>{item.plate}</td>
                    <td>{item.channel === 'mobile-app' ? 'Mobile app / automatic' : item.channel === 'kiosk-qr' ? 'Kiosk / QR payment' : 'Kiosk / credit-debit card'}</td>
                    <td>₺{item.amount.toLocaleString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer className="payment-footer">
        <button onClick={handleRefresh}><RefreshCcw className={refreshing ? 'spin' : ''} size={15} /> Live Refresh</button>
        <i />
        <span><Wifi size={14} /> Last Sync: {lastSync}</span>
      </footer>
    </section>
  )
}

function getCurrentSyncTime() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
