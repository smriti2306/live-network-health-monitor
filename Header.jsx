export default function ConnectionBar({ status }) {
  return (
    <div className={`connection-bar ${status}`}>
      {status === 'connecting' && (
        <>
          <span>⏳</span>
          Connecting to Stellar Network...
        </>
      )}
      {status === 'disconnected' && (
        <>
          <span>⚠️</span>
          Connection lost — attempting to reconnect...
        </>
      )}
    </div>
  );
}
