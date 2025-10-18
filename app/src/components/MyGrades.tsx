import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

const subjects = [
  { id: 0, name: 'Language', icon: '📚' },
  { id: 1, name: 'Mathematics', icon: '🔢' },
  { id: 2, name: 'Science', icon: '🔬' },
  { id: 3, name: 'History', icon: '📜' },
  { id: 4, name: 'Physical', icon: '⚽' },
];

export function MyGrades() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [selected, setSelected] = useState(1);
  const [grade, setGrade] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: handle } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEncryptedGrade',
    args: address ? [address, selected] : undefined,
    query: { enabled: !!address },
  });

  const decrypt = async () => {
    setGrade(null);
    setError(null);
    if (!instance || !address || !handle) return;
    setBusy(true);
    try {
      const signer = await signerPromise;
      if (!signer) throw new Error('Wallet not connected');

      const keypair = instance.generateKeypair();
      const start = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const eip712 = instance.createEIP712(keypair.publicKey, [CONTRACT_ADDRESS], start, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );
      const res = await instance.userDecrypt([
        { handle, contractAddress: CONTRACT_ADDRESS },
      ], keypair.privateKey, keypair.publicKey, signature.replace('0x',''), [CONTRACT_ADDRESS], address, start, durationDays);
      const v = res[handle as string];
      setGrade(String(v));
    } catch (e: any) {
      setError(e?.message || 'Failed to decrypt grade');
    } finally {
      setBusy(false);
    }
  };

  if (!address) {
    return (
      <div>
        <h2>My Grades</h2>
        <div className="message message-info">
          Please connect your wallet to view your grades.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>My Grades</h2>
      <p>Select a subject and decrypt your grade. All grades are encrypted on-chain.</p>

      <div className="form-group">
        <label className="form-label">Select Subject</label>
        <div className="subject-grid">
          {subjects.map(s => (
            <div
              key={s.id}
              className={`subject-card ${selected === s.id ? 'selected' : ''}`}
              onClick={() => setSelected(s.id)}
            >
              <div className="subject-icon">{s.icon}</div>
              <div className="subject-name">{s.name}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={decrypt}
        disabled={busy || !handle}
        className="btn btn-primary"
      >
        {busy ? (
          <>
            <span className="spinner"></span>
            Decrypting...
          </>
        ) : (
          '🔓 Decrypt Grade'
        )}
      </button>

      {handle && (
        <div className="info-box">
          <div className="info-box-label">Encrypted Handle</div>
          <div className="info-box-value">{String(handle).slice(0, 66)}</div>
        </div>
      )}

      {grade && !error && (
        <div className="grade-display">
          <div style={{ marginBottom: '0.5rem', fontSize: '1rem', opacity: 0.9 }}>
            {subjects.find(s => s.id === selected)?.icon} {subjects.find(s => s.id === selected)?.name}
          </div>
          <strong>{grade}</strong>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
            / 100
          </div>
        </div>
      )}

      {error && (
        <div className="message message-error">
          {error}
        </div>
      )}
    </div>
  );
}

