import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import MetricsGrid from './components/MetricsGrid';
import TPSChart from './components/TPSChart';
import FeeChart from './components/FeeChart';
import LedgerChart from './components/LedgerChart';
import LiveLog from './components/LiveLog';
import AlertsPanel from './components/AlertsPanel';
import FeeDetails from './components/FeeDetails';
import ConnectionBar from './components/ConnectionBar';

function App() {
  const connect = useStore((s) => s.connect);
  const disconnect = useStore((s) => s.disconnect);
  const connectionStatus = useStore((s) => s.connectionStatus);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return (
    <div className="app-container">
      {connectionStatus !== 'connected' && <ConnectionBar status={connectionStatus} />}

      <Header />

      <main className="main-content">
        <MetricsGrid />

        <div className="charts-grid">
          <TPSChart />
          <FeeChart />
          <LedgerChart />
          <FeeDetails />
        </div>

        <div className="bottom-grid">
          <LiveLog />
          <AlertsPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
