import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';

const subjects = [
  { id: 0, name: 'Language', icon: '📚' },
  { id: 1, name: 'Mathematics', icon: '🔢' },
  { id: 2, name: 'Science', icon: '🔬' },
  { id: 3, name: 'History', icon: '📜' },
  { id: 4, name: 'Physical', icon: '⚽' },
];

export function ShareGrade() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [subject, setSubject] = useState(1);
  const [viewer, setViewer] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const onShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!address) {
      setMessage({ type: 'error', text: 'Please connect your wallet' });
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(viewer)) {
      setMessage({ type: 'error', text: 'Invalid viewer address' });
      return;
    }

    try {
      setBusy(true);
      const signer = await signerPromise;
      if (!signer) {
        setMessage({ type: 'error', text: 'Wallet not connected' });
        setBusy(false);
        return;
      }
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.allowViewer(subject, viewer);
      await tx.wait();
      setMessage({ type: 'success', text: '✅ Viewer successfully granted access!' });
      setViewer('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Failed to grant access' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Share My Grade</h2>
      <p>Grant permission for a specific address to decrypt one of your grades.</p>

      <form onSubmit={onShare} className="form-container">
        <div className="form-group">
          <label className="form-label">Select Subject to Share</label>
          <div className="subject-grid">
            {subjects.map(s => (
              <div
                key={s.id}
                className={`subject-card ${subject === s.id ? 'selected' : ''}`}
                onClick={() => setSubject(s.id)}
              >
                <div className="subject-icon">{s.icon}</div>
                <div className="subject-name">{s.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Viewer Wallet Address</label>
          <input
            className="form-input"
            placeholder="0x..."
            value={viewer}
            onChange={e => setViewer(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
        >
          {busy ? (
            <>
              <span className="spinner"></span>
              Granting Access...
            </>
          ) : (
            '🔗 Allow Viewer'
          )}
        </button>
      </form>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="info-box">
        <div className="info-box-label">ℹ️ Important</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Once you grant access, the viewer will be able to decrypt this specific grade.
          Make sure you trust the address you're sharing with.
        </p>
      </div>
    </div>
  );
}

